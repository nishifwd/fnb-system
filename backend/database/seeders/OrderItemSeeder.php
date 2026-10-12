<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Database\Seeder;

class OrderItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $order = Order::query()->first();
        $menuItem = MenuItem::query()->first();

        if ($order === null || $menuItem === null || $order->items()->exists()) {
            return;
        }

        $order->items()->create([
            'menu_item_id' => $menuItem->id,
            'name' => $menuItem->name,
            'unit_price' => $menuItem->price,
            'quantity' => 1,
            'line_total' => $menuItem->price,
        ]);
        $order->update(['total' => $menuItem->price]);
    }
}
