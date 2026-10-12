<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MenuItemController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return MenuItemResource::collection(
            MenuItem::query()->orderBy('menu_category_id')->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(Request $request): MenuItemResource
    {
        $item = MenuItem::query()->create($this->validatedData($request));

        return new MenuItemResource($item);
    }

    public function show(MenuItem $menuItem): MenuItemResource
    {
        return new MenuItemResource($menuItem);
    }

    public function update(Request $request, MenuItem $menuItem): MenuItemResource
    {
        $menuItem->update($this->validatedData($request, $menuItem));

        return new MenuItemResource($menuItem);
    }

    public function destroy(MenuItem $menuItem): Response
    {
        $menuItem->delete();

        return response()->noContent();
    }

    /** @return array<string, mixed> */
    private function validatedData(Request $request, ?MenuItem $item = null): array
    {
        $data = $request->validate([
            'menu_category_id' => ['required', 'integer', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'is_available' => ['required', 'boolean'],
            'is_drink' => ['required', 'boolean'],
            'drink_options' => ['nullable', 'array:temperature,sugar,ice,sizes'],
            'drink_options.temperature' => ['boolean'],
            'drink_options.sugar' => ['boolean'],
            'drink_options.ice' => ['boolean'],
            'drink_options.sizes' => ['array', 'max:3'],
            'drink_options.sizes.*' => ['string', Rule::in(['small', 'standard', 'large']), 'distinct'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $data['sort_order'] ??= $item && $item->menu_category_id === (int) $data['menu_category_id']
            ? $item->sort_order
            : ((MenuItem::query()->where('menu_category_id', $data['menu_category_id'])->max('sort_order') ?? -1) + 1);

        $options = $data['drink_options'] ?? [];
        if (! $data['is_drink']) {
            if ($options !== []) {
                throw ValidationException::withMessages(['drink_options' => 'Drink options are only available for drinks.']);
            }
            $data['drink_options'] = null;

            return $data;
        }

        $data['drink_options'] = [
            'temperature' => $options['temperature'] ?? false,
            'sugar' => $options['sugar'] ?? false,
            'ice' => $options['ice'] ?? false,
            'sizes' => array_values(array_unique(['standard', ...($options['sizes'] ?? [])])),
        ];

        return $data;
    }
}
