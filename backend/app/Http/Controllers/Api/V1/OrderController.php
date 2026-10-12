<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\BusinessProfile;
use App\Models\DiningTable;
use App\Models\FloorArea;
use App\Models\FloorLayout;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function catalog(): JsonResponse
    {
        $business = BusinessProfile::query()->first();
        $tables = DiningTable::query()->with('area')->orderBy('label')->get()->map(fn (DiningTable $table): array => [
            'id' => $table->id,
            'label' => $table->label,
            'area' => $table->area?->name ?? 'Unassigned',
            'floor_area_id' => $table->floor_area_id,
            'shape' => $table->shape,
            'capacity' => $table->capacity,
            'rotation' => $table->rotation,
            'position_x' => $table->position_x,
            'position_y' => $table->position_y,
        ]);
        $menu = MenuItem::query()->with('category')
            ->where('is_available', true)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->orderBy('menu_category_id')->orderBy('sort_order')->get()
            ->map(fn (MenuItem $item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'price' => $item->price,
                'category' => $item->category->name,
            ]);

        return response()->json(['data' => [
            'tables' => $tables,
            'areas' => FloorArea::query()->orderBy('sort_order')->get(['id', 'name', 'sort_order', 'position_x', 'position_y', 'width', 'height']),
            'layout' => FloorLayout::query()->firstOrCreate(['id' => 1])->only(['entrance_side', 'entrance_offset']),
            'menu' => $menu,
            'currency' => $business?->currency ?? 'MYR',
            'service_mode' => $business?->service_mode ?? 'both',
        ]]);
    }

    public function index(): AnonymousResourceCollection
    {
        return OrderResource::collection(
            Order::query()->with(['table', 'items'])->where('status', '!=', Order::SERVED)
                ->latest()->limit(100)->get(),
        );
    }

    public function store(Request $request): OrderResource
    {
        Gate::authorize('place-orders');

        $data = $request->validate([
            'order_type' => ['required', Rule::in([Order::DINE_IN, Order::TAKEAWAY])],
            'dining_table_id' => ['required_if:order_type,dine_in', 'prohibited_if:order_type,takeaway', 'integer', 'exists:dining_tables,id'],
            'pickup_name' => ['nullable', 'string', 'max:100', 'prohibited_if:order_type,dine_in'],
            'note' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.menu_item_id' => ['required', 'integer', 'distinct', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'between:1,20'],
        ]);

        $serviceMode = BusinessProfile::query()->first()?->service_mode ?? 'both';
        if ($serviceMode !== 'both' && $serviceMode !== $data['order_type']) {
            throw ValidationException::withMessages(['order_type' => 'This order type is disabled in business settings.']);
        }

        $menuItems = MenuItem::query()->with('category')
            ->whereIn('id', array_column($data['items'], 'menu_item_id'))->get()->keyBy('id');
        $lines = [];
        $totalCents = 0;

        foreach ($data['items'] as $line) {
            $item = $menuItems->get($line['menu_item_id']);
            if (! $item?->is_available || ! $item->category?->is_active) {
                throw ValidationException::withMessages(['items' => 'One or more menu items are unavailable.']);
            }

            $unitCents = (int) round((float) $item->price * 100);
            $lineCents = $unitCents * $line['quantity'];
            $totalCents += $lineCents;
            $lines[] = [
                'menu_item_id' => $item->id,
                'name' => $item->name,
                'unit_price' => $item->price,
                'quantity' => $line['quantity'],
                'line_total' => number_format($lineCents / 100, 2, '.', ''),
            ];
        }

        if ($totalCents > 9999999999) {
            throw ValidationException::withMessages(['items' => 'The order total is too large.']);
        }

        $order = DB::transaction(function () use ($data, $lines, $request, $totalCents): Order {
            $order = Order::query()->create([
                'dining_table_id' => $data['dining_table_id'] ?? null,
                'created_by' => $request->user()->id,
                'status' => Order::PLACED,
                'order_type' => $data['order_type'],
                'pickup_name' => $data['pickup_name'] ?? null,
                'total' => number_format($totalCents / 100, 2, '.', ''),
                'note' => $data['note'] ?? null,
            ]);
            $order->items()->createMany($lines);

            return $order;
        });

        return new OrderResource($order->load(['table', 'items']));
    }

    public function updateStatus(Request $request, Order $order): OrderResource|JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in([Order::PREPARING, Order::READY, Order::SERVED])]]);
        $expected = match ($data['status']) {
            Order::PREPARING => Order::PLACED,
            Order::READY => Order::PREPARING,
            Order::SERVED => Order::READY,
        };

        Gate::authorize($data['status'] === Order::SERVED ? 'place-orders' : 'work-kitchen');

        $updated = Order::query()->whereKey($order->id)->where('status', $expected)
            ->update(['status' => $data['status']]);
        if ($updated === 0) {
            return response()->json(['message' => 'The order status has changed. Refresh and try again.'], 409);
        }

        return new OrderResource($order->fresh()->load(['table', 'items']));
    }
}
