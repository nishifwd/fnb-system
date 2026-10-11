<?php

namespace Database\Seeders;

use App\Models\FloorArea;
use Illuminate\Database\Seeder;

class FloorAreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        FloorArea::firstOrCreate(['name' => 'Indoor'], ['sort_order' => 0]);
        FloorArea::firstOrCreate(['name' => 'Outdoor'], ['sort_order' => 1]);
    }
}
