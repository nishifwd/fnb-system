<?php

namespace App\Models;

use Database\Factories\FloorLayoutFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FloorLayout extends Model
{
    /** @use HasFactory<FloorLayoutFactory> */
    use HasFactory;

    protected $fillable = ['entrance_side', 'entrance_offset'];

    protected function casts(): array
    {
        return ['entrance_offset' => 'decimal:2'];
    }
}
