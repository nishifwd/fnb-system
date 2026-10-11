<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FloorAreaResource;
use App\Models\FloorArea;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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
        $data = $this->validatedData($request);
        $data += ['position_x' => 65, 'position_y' => 0, 'width' => 35, 'height' => 100];
        if (FloorArea::query()->count() === 1) {
            $existing = FloorArea::query()->first();
            if ((float) $existing->width === 100.0 && (float) ($data['position_x'] ?? 65) === 65.0 && (float) ($data['width'] ?? 35) === 35.0) {
                $existing->update(['width' => 65]);
            }
        }

        return new FloorAreaResource(FloorArea::query()->create($data));
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

    /** @return array<string, mixed> */
    private function validatedData(Request $request, ?FloorArea $area = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('floor_areas', 'name')->ignore($area?->id)],
            'sort_order' => ['required', 'integer', 'min:0'],
            'position_x' => ['sometimes', 'numeric', 'between:0,90'],
            'position_y' => ['sometimes', 'numeric', 'between:0,90'],
            'width' => ['sometimes', 'numeric', 'between:10,100'],
            'height' => ['sometimes', 'numeric', 'between:10,100'],
        ]);

        $x = (float) ($data['position_x'] ?? $area?->position_x ?? 65);
        $y = (float) ($data['position_y'] ?? $area?->position_y ?? 0);
        $width = (float) ($data['width'] ?? $area?->width ?? 35);
        $height = (float) ($data['height'] ?? $area?->height ?? 100);
        if ($x + $width > 100 || $y + $height > 100) {
            throw ValidationException::withMessages(['position_x' => 'The area must fit inside the floor plan.']);
        }

        return $data;
    }
}
