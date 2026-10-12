<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'dining_table_id' => $this->dining_table_id,
            'table_label' => $this->whenLoaded('table', fn (): ?string => $this->table?->label),
            'order_type' => $this->order_type,
            'pickup_name' => $this->pickup_name,
            'created_by' => $this->created_by,
            'status' => $this->status,
            'total' => $this->total,
            'note' => $this->note,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn (): array => $this->items->map(fn ($item): array => [
                'id' => $item->id,
                'menu_item_id' => $item->menu_item_id,
                'name' => $item->name,
                'unit_price' => $item->unit_price,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ])->all()),
        ];
    }
}
