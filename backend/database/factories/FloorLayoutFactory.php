<?php

namespace Database\Factories;

use App\Models\FloorLayout;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FloorLayout>
 */
class FloorLayoutFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'entrance_side' => 'bottom',
            'entrance_offset' => 50,
        ];
    }
}
