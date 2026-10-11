<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use App\Models\FloorArea;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $indoor = FloorArea::query()->where('name', 'Indoor')->firstOrFail();
        $outdoor = FloorArea::query()->where('name', 'Outdoor')->firstOrFail();

        DiningTable::firstOrCreate(
            ['label' => 'T1'],
            ['floor_area_id' => $indoor->id, 'capacity' => 2, 'shape' => 'round', 'rotation' => 0, 'position_x' => 20, 'position_y' => 25],
        );
        DiningTable::firstOrCreate(
            ['label' => 'T2'],
            ['floor_area_id' => $indoor->id, 'capacity' => 4, 'shape' => 'square', 'rotation' => 0, 'position_x' => 60, 'position_y' => 55],
        );
        DiningTable::firstOrCreate(
            ['label' => 'T3'],
            ['floor_area_id' => $outdoor->id, 'capacity' => 6, 'shape' => 'rectangle', 'rotation' => 90, 'position_x' => 45, 'position_y' => 40],
        );
    }
}
