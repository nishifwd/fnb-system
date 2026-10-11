<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class MenuCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return MenuCategoryResource::collection(
            MenuCategory::query()->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(Request $request): MenuCategoryResource
    {
        $category = MenuCategory::query()->create($this->validatedData($request));

        return new MenuCategoryResource($category);
    }

    public function show(MenuCategory $menuCategory): MenuCategoryResource
    {
        return new MenuCategoryResource($menuCategory);
    }

    public function update(Request $request, MenuCategory $menuCategory): MenuCategoryResource
    {
        $menuCategory->update($this->validatedData($request, $menuCategory));

        return new MenuCategoryResource($menuCategory);
    }

    public function destroy(MenuCategory $menuCategory): Response
    {
        abort_if($menuCategory->items()->exists(), 409, 'Remove the category items first.');
        $menuCategory->delete();

        return response()->noContent();
    }

    /** @return array{name: string, sort_order: int, is_active: bool} */
    private function validatedData(Request $request, ?MenuCategory $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('menu_categories', 'name')->ignore($category?->id)],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
