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

    protected $fillable = ['name', 'sort_order'];

    public function tables(): HasMany
    {
        return $this->hasMany(DiningTable::class);
    }
}
