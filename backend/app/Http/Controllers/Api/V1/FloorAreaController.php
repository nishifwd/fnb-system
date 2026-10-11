<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FloorAreaResource;
use App\Models\FloorArea;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class FloorAreaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FloorAreaResource::collection(
            FloorArea::query()->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function store(Request $request): FloorAreaResource
    {
        return new FloorAreaResource(FloorArea::query()->create($this->validatedData($request)));
    }

    public function show(FloorArea $floorArea): FloorAreaResource
    {
        return new FloorAreaResource($floorArea);
    }

    public function update(Request $request, FloorArea $floorArea): FloorAreaResource
    {
        $floorArea->update($this->validatedData($request, $floorArea));

        return new FloorAreaResource($floorArea);
    }

    public function destroy(FloorArea $floorArea): Response
    {
        abort_if(FloorArea::query()->count() === 1, 409, 'Keep at least one floor area.');
        abort_if($floorArea->tables()->exists(), 409, 'Move or remove the area tables first.');
        $floorArea->delete();

        return response()->noContent();
    }

    /** @return array{name: string, sort_order: int} */
    private function validatedData(Request $request, ?FloorArea $area = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('floor_areas', 'name')->ignore($area?->id)],
            'sort_order' => ['required', 'integer', 'min:0'],
        ]);
    }
}
