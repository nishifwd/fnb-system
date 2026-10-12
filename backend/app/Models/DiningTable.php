<?php

namespace App\Models;

use Database\Factories\DiningTableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiningTable extends Model
{
    /** @use HasFactory<DiningTableFactory> */
    use HasFactory;

    protected $fillable = ['floor_area_id', 'label', 'capacity', 'shape', 'rotation', 'position_x', 'position_y'];

    protected function casts(): array
    {
        return ['position_x' => 'decimal:2', 'position_y' => 'decimal:2'];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(FloorArea::class, 'floor_area_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
