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
        $indoor = FloorArea::firstOrCreate(['name' => 'Indoor'], [
            'sort_order' => 0, 'position_x' => 0, 'position_y' => 0, 'width' => 65, 'height' => 100,
        ]);
        if (! FloorArea::query()->where('name', 'Outdoor')->exists() && (float) $indoor->width === 100.0) {
            $indoor->update(['width' => 65]);
        }
        FloorArea::firstOrCreate(['name' => 'Outdoor'], [
            'sort_order' => 1, 'position_x' => 65, 'position_y' => 0, 'width' => 35, 'height' => 100,
        ]);
    }
}
