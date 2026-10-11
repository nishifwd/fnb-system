<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DiningTable::firstOrCreate(
            ['label' => 'T1'],
            ['capacity' => 2, 'shape' => 'round', 'position_x' => 20, 'position_y' => 25],
        );
        DiningTable::firstOrCreate(
            ['label' => 'T2'],
            ['capacity' => 4, 'shape' => 'square', 'position_x' => 60, 'position_y' => 55],
        );
    }
}
