<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const PLACED = 'placed';

    public const PREPARING = 'preparing';

    public const READY = 'ready';

    public const SERVED = 'served';

    public const DINE_IN = 'dine_in';

    public const TAKEAWAY = 'takeaway';

    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = ['dining_table_id', 'created_by', 'status', 'total', 'note', 'order_type', 'pickup_name'];

    protected function casts(): array
    {
        return ['total' => 'decimal:2'];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'dining_table_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
