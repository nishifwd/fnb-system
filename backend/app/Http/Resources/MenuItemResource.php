<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
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
            'menu_category_id' => $this->menu_category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'is_available' => $this->is_available,
            'is_drink' => $this->is_drink,
            'drink_options' => $this->drink_options,
            'sort_order' => $this->sort_order,
        ];
    }
}
