<?php

namespace Database\Factories;

use App\Models\DiningTable;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dining_table_id' => DiningTable::factory(),
            'created_by' => User::factory(),
            'status' => Order::PLACED,
            'order_type' => Order::DINE_IN,
            'pickup_name' => null,
            'total' => '0.00',
            'note' => null,
        ];
    }
}
