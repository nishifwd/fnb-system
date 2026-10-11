<?php

namespace App\Models;

use Database\Factories\FloorAreaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FloorArea extends Model
{
    /** @use HasFactory<FloorAreaFactory> */
    use HasFactory;

    protected $fillable = ['name', 'sort_order', 'position_x', 'position_y', 'width', 'height'];

    protected function casts(): array
    {
        return ['position_x' => 'decimal:2', 'position_y' => 'decimal:2', 'width' => 'decimal:2', 'height' => 'decimal:2'];
    }

    public function tables(): HasMany
    {
        return $this->hasMany(DiningTable::class);
    }
}
