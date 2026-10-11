<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

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
        $menuItem->update($this->validatedData($request));

        return new MenuItemResource($menuItem);
    }

    public function destroy(MenuItem $menuItem): Response
    {
        $menuItem->delete();

        return response()->noContent();
    }

    /** @return array{menu_category_id: int, name: string, description: ?string, price: numeric-string, is_available: bool, sort_order: int} */
    private function validatedData(Request $request): array
    {
        return $request->validate([
            'menu_category_id' => ['required', 'integer', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'is_available' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
        ]);
    }
}
