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

    protected $fillable = [
        'dining_table_id', 'created_by', 'status', 'total', 'note', 'order_type', 'pickup_name', 'currency',
        'discount_amount', 'service_charge_amount', 'tax_amount', 'grand_total',
        'receipt_service_charge_rate', 'receipt_tax_rate', 'payment_method', 'payment_reference', 'payment_verified_by', 'paid_at',
        'receipt_business_name', 'receipt_business_phone', 'receipt_business_address',
        'receipt_currency', 'receipt_destination',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'service_charge_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'receipt_service_charge_rate' => 'decimal:2',
            'receipt_tax_rate' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
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
