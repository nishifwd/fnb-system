<?php

namespace Database\Factories;

use App\Models\FloorArea;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FloorArea>
 */
class FloorAreaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'sort_order' => 0,
        ];
    }
}
