<?php

namespace Database\Seeders;

use App\Models\FloorLayout;
use Illuminate\Database\Seeder;

class FloorLayoutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        FloorLayout::query()->firstOrCreate(['id' => 1], ['entrance_x' => 50, 'entrance_y' => 100]);
    }
}
