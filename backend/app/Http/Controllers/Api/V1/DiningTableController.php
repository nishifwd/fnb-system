<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DiningTableResource;
use App\Models\DiningTable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class DiningTableController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DiningTableResource::collection(
            DiningTable::query()->orderBy('label')->get(),
        );
    }

    public function store(Request $request): DiningTableResource
    {
        $table = DiningTable::query()->create($this->validatedData($request));

        return new DiningTableResource($table);
    }

    public function show(DiningTable $diningTable): DiningTableResource
    {
        return new DiningTableResource($diningTable);
    }

    public function update(Request $request, DiningTable $diningTable): DiningTableResource
    {
        $diningTable->update($this->validatedData($request, $diningTable));

        return new DiningTableResource($diningTable);
    }

    public function destroy(DiningTable $diningTable): Response
    {
        $diningTable->delete();

        return response()->noContent();
    }

    /** @return array{floor_area_id: int, label: string, capacity: int, shape: string, rotation: int, position_x: float, position_y: float} */
    private function validatedData(Request $request, ?DiningTable $table = null): array
    {
        return $request->validate([
            'floor_area_id' => ['required', 'integer', 'exists:floor_areas,id'],
            'label' => ['required', 'string', 'max:50', Rule::unique('dining_tables', 'label')->ignore($table?->id)],
            'capacity' => ['required', 'integer', 'between:1,20'],
            'shape' => ['required', Rule::in(['round', 'square', 'rectangle'])],
            'rotation' => ['required', 'integer', Rule::in([0, 90, 180, 270])],
            'position_x' => ['required', 'numeric', 'between:0,90'],
            'position_y' => ['required', 'numeric', 'between:0,90'],
        ]);
    }
}
