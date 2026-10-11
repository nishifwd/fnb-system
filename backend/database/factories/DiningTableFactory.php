<?php

namespace Database\Factories;

use App\Models\DiningTable;
use App\Models\FloorArea;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiningTable>
 */
class DiningTableFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'floor_area_id' => FloorArea::factory(),
            'label' => 'T'.fake()->unique()->numberBetween(1, 999),
            'capacity' => fake()->numberBetween(2, 8),
            'shape' => 'round',
            'rotation' => 0,
            'position_x' => fake()->randomFloat(2, 0, 80),
            'position_y' => fake()->randomFloat(2, 0, 80),
        ];
    }
}
