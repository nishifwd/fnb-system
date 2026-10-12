<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderItemCustomizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_separate_drink_variants_and_food_remarks_reach_the_kitchen(): void
    {
        $drink = MenuItem::factory()->create([
            'name' => 'Latte', 'price' => '12.00', 'is_drink' => true,
            'drink_options' => ['temperature' => true, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']],
        ]);
        $food = MenuItem::factory()->create(['name' => 'Toast', 'price' => '8.00']);
        $waiter = User::factory()->create(['role' => User::ROLE_WAITER]);
        $kitchen = User::factory()->create(['role' => User::ROLE_KITCHEN]);

        $this->actingAs($waiter)->getJson('/api/v1/service/catalog')
            ->assertOk()->assertJsonPath('data.menu.0.is_drink', true);

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'items' => [
                ['menu_item_id' => $drink->id, 'quantity' => 1, 'temperature' => 'hot', 'sugar' => 'less'],
                ['menu_item_id' => $drink->id, 'quantity' => 2, 'temperature' => 'iced', 'sugar' => 'more', 'ice' => 'less', 'size' => 'large'],
                ['menu_item_id' => $food->id, 'quantity' => 1, 'remark' => 'No butter'],
            ],
        ])->assertCreated()->assertJsonPath('data.total', '44.00')
            ->assertJsonPath('data.items.0.preparation.temperature', 'hot')
            ->assertJsonPath('data.items.0.preparation.ice', null)
            ->assertJsonPath('data.items.0.preparation.size', 'standard')
            ->assertJsonPath('data.items.1.preparation.ice', 'less')
            ->assertJsonPath('data.items.1.preparation.size', 'large')
            ->assertJsonPath('data.items.2.remark', 'No butter');

        $drink->update(['name' => 'New latte', 'is_drink' => false]);
        $this->actingAs($kitchen)->getJson('/api/v1/orders')->assertOk()
            ->assertJsonPath('data.0.items.0.name', 'Latte')
            ->assertJsonPath('data.0.items.0.remark', null)
            ->assertJsonPath('data.0.items.1.preparation.sugar', 'more')
            ->assertJsonPath('data.0.items.2.preparation', null);
    }

    public function test_invalid_drink_choices_are_rejected_without_creating_an_order(): void
    {
        $drink = MenuItem::factory()->create([
            'is_drink' => true,
            'drink_options' => ['temperature' => true, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']],
        ]);
        $plainDrink = MenuItem::factory()->create(['is_drink' => true]);
        $food = MenuItem::factory()->create();
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        foreach ([
            [['menu_item_id' => $drink->id, 'quantity' => 1], 'items.0.temperature'],
            [['menu_item_id' => $drink->id, 'quantity' => 1, 'temperature' => 'iced', 'sugar' => 'standard'], 'items.0.ice'],
            [['menu_item_id' => $drink->id, 'quantity' => 1, 'temperature' => 'hot', 'sugar' => 'standard', 'ice' => 'normal'], 'items.0.ice'],
            [['menu_item_id' => $drink->id, 'quantity' => 1, 'temperature' => 'hot', 'sugar' => 'standard', 'size' => 'small'], 'items.0.size'],
            [['menu_item_id' => $drink->id, 'quantity' => 1, 'temperature' => 'hot', 'sugar' => 'standard', 'remark' => 'Oat milk'], 'items.0.remark'],
            [['menu_item_id' => $plainDrink->id, 'quantity' => 1, 'sugar' => 'less'], 'items.0.sugar'],
            [['menu_item_id' => $food->id, 'quantity' => 1, 'temperature' => 'hot'], 'items.0'],
            [['menu_item_id' => $food->id, 'quantity' => 1, 'remark' => str_repeat('a', 501)], 'items.0.remark'],
        ] as [$line, $field]) {
            $this->postJson('/api/v1/orders', ['order_type' => Order::TAKEAWAY, 'items' => [$line]])
                ->assertUnprocessable()->assertJsonValidationErrors($field);
        }

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_unconfigured_drink_uses_standard_size_without_extra_choices(): void
    {
        $drink = MenuItem::factory()->create(['is_drink' => true]);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_WAITER]));

        $this->postJson('/api/v1/orders', [
            'order_type' => Order::TAKEAWAY,
            'items' => [['menu_item_id' => $drink->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.preparation.size', 'standard')
            ->assertJsonPath('data.items.0.preparation.sugar', null)
            ->assertJsonPath('data.items.0.preparation.ice', null);
    }

    public function test_existing_drink_orders_without_size_display_as_standard(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->for($order)->create([
            'preparation' => ['temperature' => 'iced', 'sugar' => 'less', 'ice' => 'normal'],
        ]);
        $this->actingAs(User::factory()->create(['role' => User::ROLE_KITCHEN]));

        $this->getJson('/api/v1/orders')->assertOk()
            ->assertJsonPath('data.0.items.0.preparation.size', 'standard')
            ->assertJsonPath('data.0.items.0.preparation.sugar', 'less');
    }
}
