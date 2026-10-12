<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    protected $fillable = ['menu_item_id', 'name', 'unit_price', 'quantity', 'line_total', 'preparation', 'remark'];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'line_total' => 'decimal:2', 'preparation' => 'array'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
