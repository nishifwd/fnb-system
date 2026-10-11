<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiningTableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'floor_area_id' => $this->floor_area_id,
            'label' => $this->label,
            'capacity' => $this->capacity,
            'shape' => $this->shape,
            'rotation' => $this->rotation,
            'position_x' => $this->position_x,
            'position_y' => $this->position_y,
        ];
    }
}
