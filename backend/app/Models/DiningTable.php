<?php

namespace App\Models;

use Database\Factories\DiningTableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiningTable extends Model
{
    /** @use HasFactory<DiningTableFactory> */
    use HasFactory;

    protected $fillable = ['label', 'capacity', 'shape', 'position_x', 'position_y'];

    protected function casts(): array
    {
        return ['position_x' => 'decimal:2', 'position_y' => 'decimal:2'];
    }
}
