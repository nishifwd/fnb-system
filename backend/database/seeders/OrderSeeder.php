<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use App\Models\Order;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $table = DiningTable::query()->first();

        if ($table === null || Order::query()->exists()) {
            return;
        }

        Order::factory()->create(['dining_table_id' => $table->id, 'created_by' => null, 'total' => '0.00']);
        $this->call(OrderItemSeeder::class);
    }
}
