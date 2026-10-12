<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FloorLayoutResource;
use App\Models\FloorLayout;
use Illuminate\Http\Request;

class FloorLayoutController extends Controller
{
    public function show(): FloorLayoutResource
    {
        return new FloorLayoutResource(FloorLayout::query()->firstOrCreate(['id' => 1]));
    }

    public function update(Request $request): FloorLayoutResource
    {
        $data = $request->validate([
            'entrance_x' => ['required', 'numeric', 'between:0,100'],
            'entrance_y' => ['required', 'numeric', 'between:0,100'],
        ]);
        $layout = FloorLayout::query()->firstOrCreate(['id' => 1]);
        $layout->update($data);

        return new FloorLayoutResource($layout);
    }
}
