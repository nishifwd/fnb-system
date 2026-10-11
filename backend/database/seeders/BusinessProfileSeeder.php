<?php

namespace Database\Seeders;

use App\Models\BusinessProfile;
use Illuminate\Database\Seeder;

class BusinessProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        BusinessProfile::firstOrCreate(['id' => 1], [
            'name' => 'Demo Café',
            'phone' => '03-0000 0000',
            'address' => 'Kuala Lumpur, Malaysia',
            'currency' => 'MYR',
        ]);
    }
}
