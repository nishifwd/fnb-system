<?php

namespace App\Models;

use Database\Factories\FloorLayoutFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FloorLayout extends Model
{
    /** @use HasFactory<FloorLayoutFactory> */
    use HasFactory;

    protected $fillable = ['entrance_x', 'entrance_y'];

    protected function casts(): array
    {
        return ['entrance_x' => 'decimal:2', 'entrance_y' => 'decimal:2'];
    }
}
