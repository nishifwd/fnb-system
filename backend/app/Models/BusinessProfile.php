<?php

namespace App\Models;

use Database\Factories\BusinessProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessProfile extends Model
{
    /** @use HasFactory<BusinessProfileFactory> */
    use HasFactory;

    protected $fillable = ['name', 'phone', 'address', 'currency', 'service_mode', 'service_charge_rate', 'tax_rate'];

    protected function casts(): array
    {
        return ['service_charge_rate' => 'decimal:2', 'tax_rate' => 'decimal:2'];
    }
}
