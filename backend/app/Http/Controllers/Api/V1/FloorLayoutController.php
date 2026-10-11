<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FloorLayoutResource;
use App\Models\FloorLayout;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FloorLayoutController extends Controller
{
    public function show(): FloorLayoutResource
    {
        return new FloorLayoutResource(FloorLayout::query()->firstOrCreate(['id' => 1]));
    }

    public function update(Request $request): FloorLayoutResource
    {
        $data = $request->validate([
            'entrance_side' => ['required', Rule::in(['top', 'right', 'bottom', 'left'])],
            'entrance_offset' => ['required', 'numeric', 'between:10,90'],
        ]);
        $layout = FloorLayout::query()->firstOrCreate(['id' => 1]);
        $layout->update($data);

        return new FloorLayoutResource($layout);
    }
}
