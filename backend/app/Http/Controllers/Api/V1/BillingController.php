<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\BusinessProfile;
use App\Models\Order;
use App\OrderBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BillingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('place-orders');
        $data = $request->validate([
            'filter' => ['sometimes', Rule::in(['all', 'unpaid', 'paid'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $orders = Order::query()->with(['table', 'items'])
            ->when(($data['filter'] ?? 'all') === 'paid', fn ($query) => $query->whereNotNull('paid_at'))
            ->when(($data['filter'] ?? 'all') === 'unpaid', fn ($query) => $query->whereNull('paid_at'))
            ->latest()->paginate(20);

        return response()->json(['data' => [
            'orders' => OrderResource::collection($orders->items())->resolve(),
            'page' => $orders->currentPage(),
            'pages' => $orders->lastPage(),
            'total' => $orders->total(),
        ]]);
    }

    public function show(Request $request, Order $order, OrderBilling $billing): JsonResponse
    {
        Gate::authorize('place-orders');
        $data = $request->validate([
            'discount_amount' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
        ]);
        $order->load(['table', 'items']);
        $discountCents = $this->discountCents($data['discount_amount'] ?? '0', $order);
        $bill = $order->paid_at
            ? $billing->paid($order)
            : $billing->preview($order, BusinessProfile::query()->first(), $discountCents);

        return response()->json(['data' => [
            'order' => (new OrderResource($order))->resolve(),
            'bill' => $bill,
        ]]);
    }

    public function pay(Request $request, Order $order, OrderBilling $billing): JsonResponse
    {
        Gate::authorize('place-orders');
        $data = $request->validate([
            'payment_method' => ['required', Rule::in(['cash', 'card', 'qr'])],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'confirmed_payment' => in_array($request->input('payment_method'), ['card', 'qr'], true)
                ? ['required', 'accepted']
                : ['prohibited'],
            'discount_amount' => ['required', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'expected_grand_total' => ['required', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
        ]);
        $order->load(['table', 'items']);
        $discountCents = $this->discountCents($data['discount_amount'], $order);
        $bill = $billing->preview($order, BusinessProfile::query()->first(), $discountCents);

        if ((int) round((float) $data['expected_grand_total'] * 100) !== (int) round((float) $bill['grand_total'] * 100)) {
            return response()->json(['message' => 'The bill total changed. Review the updated amount before recording payment.'], 409);
        }

        $updated = Order::query()->whereKey($order->id)->whereNull('paid_at')->update([
            'discount_amount' => $bill['discount_amount'],
            'service_charge_amount' => $bill['service_charge_amount'],
            'tax_amount' => $bill['tax_amount'],
            'grand_total' => $bill['grand_total'],
            'receipt_service_charge_rate' => $bill['service_charge_rate'],
            'receipt_tax_rate' => $bill['tax_rate'],
            'payment_method' => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'payment_verified_by' => $request->user()->id,
            'paid_at' => now(),
            'receipt_business_name' => $bill['business']['name'],
            'receipt_business_phone' => $bill['business']['phone'],
            'receipt_business_address' => $bill['business']['address'],
            'receipt_currency' => $bill['currency'],
            'receipt_destination' => $bill['destination'],
        ]);
        if ($updated === 0) {
            return response()->json(['message' => 'Payment has already been recorded for this order. Refresh and try again.'], 409);
        }

        $order->refresh()->load(['table', 'items']);

        return response()->json(['data' => [
            'order' => (new OrderResource($order))->resolve(),
            'bill' => $billing->paid($order),
        ]]);
    }

    private function discountCents(string|int|float $amount, Order $order): int
    {
        $cents = (int) round((float) $amount * 100);
        if ($cents > (int) round((float) $order->total * 100)) {
            throw ValidationException::withMessages(['discount_amount' => 'Discount cannot exceed the order subtotal.']);
        }

        return $cents;
    }
}
