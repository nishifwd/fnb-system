<?php

namespace Tests\Feature;

use App\Models\BusinessProfile;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TakeawayOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_takeaway_only_cafe_can_order_without_any_tables(): void
    {
        BusinessProfile::factory()->create(['id' => 1, 'service_mode' => 'takeaway']);
        $item = MenuItem::factory()->create(['price' => '8.50']);
        $waiter = User::factory()->create(['role' => User::ROLE_WAITER]);

        $this->assertDatabaseCount(DiningTable::class, 0);
        $this->actingAs($waiter)->getJson('/api/v1/service/catalog')
            ->assertOk()->assertJsonPath('data.service_mode', 'takeaway')
            ->assertJsonCount(0, 'data.tables');

        $order = $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'pickup_name' => 'Amina',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
        ])->assertCreated()->assertJsonPath('data.order_type', Order::TAKEAWAY)
            ->assertJsonPath('data.table_label', null)
            ->assertJsonPath('data.pickup_name', 'Amina')
            ->assertJsonPath('data.total', '17.00')->json('data');

        $kitchen = User::factory()->create(['role' => User::ROLE_KITCHEN]);
        $this->actingAs($kitchen)->getJson('/api/v1/orders')->assertOk()
            ->assertJsonPath('data.0.id', $order['id'])
            ->assertJsonPath('data.0.pickup_name', 'Amina');
        $this->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::PREPARING])
            ->assertOk()->assertJsonPath('data.table_label', null);
        $this->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::READY])
            ->assertOk()->assertJsonPath('data.order_type', Order::TAKEAWAY);
        $this->actingAs($waiter)->patchJson('/api/v1/orders/'.$order['id'].'/status', ['status' => Order::SERVED])
            ->assertOk()->assertJsonPath('data.pickup_name', 'Amina');
    }

    public function test_business_mode_and_order_type_are_enforced(): void
    {
        BusinessProfile::factory()->create(['id' => 1, 'service_mode' => 'takeaway']);
        $table = DiningTable::factory()->create();
        $item = MenuItem::factory()->create();
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'dining_table_id' => $table->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('order_type');

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'dining_table_id' => $table->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('dining_table_id');

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->assertJsonPath('data.pickup_name', null);

        BusinessProfile::query()->firstOrFail()->update(['service_mode' => 'dine_in']);
        $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('order_type');

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::DINE_IN,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('dining_table_id');

        $this->assertDatabaseCount('orders', 1);
    }

    public function test_owner_can_switch_service_mode(): void
    {
        $this->actingAs(User::factory()->create(['role' => User::ROLE_OWNER]));

        $this->putJson('/api/v1/business', [
            'name' => 'Pickup Cafe', 'phone' => null, 'address' => null,
            'currency' => 'MYR', 'service_mode' => 'takeaway',
        ])->assertCreated()->assertJsonPath('data.service_mode', 'takeaway');

        $this->putJson('/api/v1/business', [
            'name' => 'Pickup Cafe', 'currency' => 'MYR', 'service_mode' => 'invalid',
        ])->assertUnprocessable()->assertJsonValidationErrors('service_mode');
    }
}
