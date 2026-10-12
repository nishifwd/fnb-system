<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_waiter_and_kitchen_can_complete_an_order(): void
    {
        $table = DiningTable::factory()->create();
        $item = MenuItem::factory()->create(['name' => 'Flat White', 'price' => '12.50']);
        $waiter = User::factory()->create(['role' => User::ROLE_WAITER]);
        $kitchen = User::factory()->create(['role' => User::ROLE_KITCHEN]);

        $this->getJson('/api/v1/orders')->assertUnauthorized();
        $this->actingAs($waiter)->getJson('/api/v1/service/catalog')
            ->assertOk()->assertJsonPath('data.tables.0.label', $table->label)
            ->assertJsonPath('data.menu.0.name', 'Flat White');

        $order = $this->actingAs($waiter)->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'dining_table_id' => $table->id,
            'note' => 'No sugar',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
        ])->assertCreated()->assertJsonPath('data.status', Order::PLACED)
            ->assertJsonPath('data.total', '25.00')->json('data');

        $item->update(['name' => 'New name', 'price' => '15.00']);
        $this->actingAs($kitchen)->getJson('/api/v1/orders')
            ->assertOk()->assertJsonPath('data.0.items.0.name', 'Flat White')
            ->assertJsonPath('data.0.items.0.unit_price', '12.50');

        $this->actingAs($waiter)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::PREPARING])->assertForbidden();
        $this->actingAs($kitchen)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::READY])->assertStatus(409);
        $this->actingAs($kitchen)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::PREPARING])
            ->assertOk()->assertJsonPath('data.status', Order::PREPARING);
        $this->actingAs($kitchen)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::READY])
            ->assertOk()->assertJsonPath('data.status', Order::READY);
        $this->actingAs($kitchen)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::SERVED])->assertForbidden();
        $this->actingAs($waiter)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::SERVED])
            ->assertOk()->assertJsonPath('data.status', Order::SERVED);
        $this->actingAs($waiter)->getJson('/api/v1/orders')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($waiter)->deleteJson('/api/v1/tables/'.$table->id)->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => User::ROLE_OWNER]))
            ->deleteJson('/api/v1/tables/'.$table->id)->assertStatus(409);
    }

    public function test_unavailable_items_and_invalid_quantities_are_rejected(): void
    {
        $table = DiningTable::factory()->create();
        $item = MenuItem::factory()->create(['is_available' => false]);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'dining_table_id' => $table->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'dining_table_id' => $table->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 0]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0.quantity');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_kitchen_cannot_place_orders_and_waiter_cannot_manage_menu(): void
    {
        $table = DiningTable::factory()->create();
        $item = MenuItem::factory()->create();
        $this->actingAs(User::factory()->create(['role' => User::ROLE_KITCHEN]));

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'dining_table_id' => $table->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]))
            ->putJson('/api/v1/items/'.$item->id, [])->assertForbidden();
    }
}
