<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\FloorArea;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create(['role' => User::ROLE_OWNER]));
    }

    public function test_business_profile_can_be_saved_and_read(): void
    {
        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data', null);

        $this->putJson('/api/v1/business', [
            'name' => 'Kopi Corner',
            'phone' => '03-1234 5678',
            'address' => 'Kuala Lumpur',
            'currency' => 'MYR',
            'service_mode' => 'both',
        ])->assertCreated()->assertJsonPath('data.name', 'Kopi Corner');

        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data.currency', 'MYR');
        $this->putJson('/api/v1/business', ['name' => '', 'currency' => 'invalid'])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'currency']);
    }

    public function test_menu_categories_and_items_can_be_managed(): void
    {
        $category = $this->postJson('/api/v1/categories', [
            'name' => 'Coffee', 'sort_order' => 0, 'is_active' => true,
        ])->assertCreated()->json('data');

        $this->postJson('/api/v1/items', [
            'menu_category_id' => $category['id'],
            'name' => 'Flat White',
            'price' => -1,
            'is_available' => true,
            'is_drink' => true,
            'sort_order' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('price');

        $item = $this->postJson('/api/v1/items', [
            'menu_category_id' => $category['id'],
            'name' => 'Flat White',
            'description' => 'Espresso and milk',
            'price' => 12.50,
            'is_available' => true,
            'is_drink' => true,
            'drink_options' => ['temperature' => true, 'sugar' => true, 'ice' => false, 'sizes' => ['large']],
            'sort_order' => 0,
        ])->assertCreated()->assertJsonPath('data.price', '12.50')
            ->assertJsonPath('data.drink_options.sizes.0', 'standard')
            ->assertJsonPath('data.drink_options.sizes.1', 'large')->json('data');

        $this->getJson('/api/v1/items')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/categories/'.$category['id'])->assertStatus(409);

        $this->putJson('/api/v1/items/'.$item['id'], [
            'menu_category_id' => $category['id'],
            'name' => 'Iced Flat White',
            'description' => null,
            'price' => 13,
            'is_available' => false,
            'is_drink' => true,
            'drink_options' => ['temperature' => true, 'sugar' => false, 'ice' => true, 'sizes' => ['small']],
            'sort_order' => 1,
        ])->assertOk()->assertJsonPath('data.is_available', false)
            ->assertJsonPath('data.drink_options.sizes.1', 'small');

        $this->putJson('/api/v1/items/'.$item['id'], [
            'menu_category_id' => $category['id'], 'name' => 'Iced Flat White', 'price' => 13,
            'is_available' => true, 'is_drink' => false,
            'drink_options' => ['ice' => true], 'sort_order' => 1,
        ])->assertUnprocessable()->assertJsonValidationErrors('drink_options');

        $this->deleteJson('/api/v1/items/'.$item['id'])->assertNoContent();
        $this->deleteJson('/api/v1/categories/'.$category['id'])->assertNoContent();
        $this->assertDatabaseCount(MenuItem::class, 0);
        $this->assertDatabaseCount(MenuCategory::class, 0);
    }

    public function test_drink_without_configured_choices_has_standard_size(): void
    {
        $category = MenuCategory::factory()->create();

        $this->postJson('/api/v1/items', [
            'menu_category_id' => $category->id,
            'name' => 'Black Coffee',
            'price' => 8,
            'is_available' => true,
            'is_drink' => true,
            'sort_order' => 0,
        ])->assertCreated()
            ->assertJsonPath('data.drink_options.temperature', false)
            ->assertJsonPath('data.drink_options.sizes.0', 'standard');
    }

    public function test_new_categories_and_items_receive_an_order_without_a_number_in_the_form(): void
    {
        $firstCategory = $this->postJson('/api/v1/categories', [
            'name' => 'Coffee', 'is_active' => true,
        ])->assertCreated()->assertJsonPath('data.sort_order', 0)->json('data');
        $foodCategory = $this->postJson('/api/v1/categories', [
            'name' => 'Food', 'is_active' => true,
        ])->assertCreated()->assertJsonPath('data.sort_order', 1)->json('data');

        $firstItem = $this->postJson('/api/v1/items', [
            'menu_category_id' => $firstCategory['id'], 'name' => 'Espresso',
            'price' => 7, 'is_available' => true, 'is_drink' => true,
        ])->assertCreated()->assertJsonPath('data.sort_order', 0)->json('data');
        $this->postJson('/api/v1/items', [
            'menu_category_id' => $firstCategory['id'], 'name' => 'Latte',
            'price' => 12, 'is_available' => true, 'is_drink' => true,
        ])->assertCreated()->assertJsonPath('data.sort_order', 1);

        $this->putJson('/api/v1/items/'.$firstItem['id'], [
            'menu_category_id' => (string) $firstCategory['id'], 'name' => 'Espresso',
            'price' => 8, 'is_available' => true, 'is_drink' => true,
        ])->assertOk()->assertJsonPath('data.sort_order', 0);

        $this->putJson('/api/v1/items/'.$firstItem['id'], [
            'menu_category_id' => $foodCategory['id'], 'name' => 'Espresso',
            'price' => 8, 'is_available' => true, 'is_drink' => true,
        ])->assertOk()->assertJsonPath('data.menu_category_id', $foodCategory['id'])
            ->assertJsonPath('data.sort_order', 0);
    }

    public function test_tables_can_be_arranged_and_validated(): void
    {
        $indoor = $this->getJson('/api/v1/areas')->assertOk()->assertJsonPath('data.0.name', 'Indoor')->json('data.0');
        $outdoor = $this->postJson('/api/v1/areas', [
            'name' => 'Outdoor', 'sort_order' => 1,
        ])->assertCreated()->json('data');
        $this->assertDatabaseHas('floor_areas', ['id' => $indoor['id'], 'width' => 65]);

        $table = $this->postJson('/api/v1/tables', [
            'floor_area_id' => $outdoor['id'],
            'label' => 'T1',
            'capacity' => 4,
            'shape' => 'rectangle',
            'rotation' => 90,
            'position_x' => 20,
            'position_y' => 30,
        ])->assertCreated()->assertJsonPath('data.rotation', 90)->json('data');

        $this->deleteJson('/api/v1/areas/'.$outdoor['id'])->assertStatus(409);

        $this->postJson('/api/v1/tables', [
            'floor_area_id' => 9999,
            'label' => 'T1',
            'capacity' => 40,
            'shape' => 'triangle',
            'rotation' => 45,
            'position_x' => 120,
            'position_y' => 30,
        ])->assertUnprocessable()->assertJsonValidationErrors(['floor_area_id', 'label', 'capacity', 'shape', 'rotation', 'position_x']);

        $this->putJson('/api/v1/tables/'.$table['id'], [
            'floor_area_id' => $indoor['id'],
            'label' => 'T1',
            'capacity' => 4,
            'shape' => 'square',
            'rotation' => 180,
            'position_x' => 65.5,
            'position_y' => 40,
        ])->assertOk()->assertJsonPath('data.position_x', '65.50')->assertJsonPath('data.rotation', 180);

        $this->getJson('/api/v1/tables')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/areas/'.$outdoor['id'])->assertNoContent();
        $this->deleteJson('/api/v1/tables/'.$table['id'])->assertNoContent();
        $this->assertDatabaseCount(DiningTable::class, 0);
    }

    public function test_floor_areas_can_be_renamed_and_validated(): void
    {
        $this->deleteJson('/api/v1/areas/1')->assertStatus(409);

        $area = $this->postJson('/api/v1/areas', [
            'name' => 'Patio', 'sort_order' => 2,
        ])->assertCreated()->json('data');

        $this->putJson('/api/v1/areas/'.$area['id'], [
            'name' => 'Outdoor', 'sort_order' => 1,
        ])->assertOk()->assertJsonPath('data.name', 'Outdoor');

        $this->postJson('/api/v1/areas', [
            'name' => 'Outdoor', 'sort_order' => 3,
        ])->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->deleteJson('/api/v1/areas/'.$area['id'])->assertNoContent();
    }

    public function test_shared_floor_area_bounds_and_entrance_can_be_saved(): void
    {
        $indoor = FloorArea::query()->where('name', 'Indoor')->firstOrFail();
        $outdoor = $this->postJson('/api/v1/areas', [
            'name' => 'Outdoor', 'sort_order' => 1,
            'position_x' => 0, 'position_y' => 70, 'width' => 100, 'height' => 30,
        ])->assertCreated()->assertJsonPath('data.height', '30.00')->json('data');

        $this->putJson('/api/v1/areas/'.$indoor->id, [
            'name' => 'Indoor', 'sort_order' => 0,
            'position_x' => 0, 'position_y' => 0, 'width' => 100, 'height' => 70,
        ])->assertOk()->assertJsonPath('data.width', '100.00');

        $this->putJson('/api/v1/areas/'.$outdoor['id'], [
            'name' => 'Outdoor', 'sort_order' => 1,
            'position_x' => 80, 'position_y' => 0, 'width' => 30, 'height' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors('position_x');

        $this->getJson('/api/v1/layout')->assertOk()->assertJsonPath('data.entrance_x', '50.00')->assertJsonPath('data.entrance_y', '100.00');
        $this->putJson('/api/v1/layout', [
            'entrance_x' => 50, 'entrance_y' => 50,
        ])->assertOk()->assertJsonPath('data.entrance_x', '50.00')->assertJsonPath('data.entrance_y', '50.00');
        $this->getJson('/api/v1/layout')->assertOk()->assertJsonPath('data.entrance_y', '50.00');
        $this->getJson('/api/v1/service/catalog')->assertOk()
            ->assertJsonPath('data.layout.entrance_x', '50.00')
            ->assertJsonPath('data.layout.entrance_y', '50.00');
        $this->putJson('/api/v1/layout', [
            'entrance_x' => -1, 'entrance_y' => 120,
        ])->assertUnprocessable()->assertJsonValidationErrors(['entrance_x', 'entrance_y']);
    }

    public function test_factory_records_can_be_read_from_the_api(): void
    {
        $category = MenuCategory::factory()->create();
        MenuItem::factory()->for($category, 'category')->create();
        DiningTable::factory()->create();

        $this->getJson('/api/v1/categories')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/items')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/tables')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_demo_seeding_is_repeatable(): void
    {
        $this->seed();
        MenuItem::query()->where('name', 'Americano')->update(['price' => '10.50']);
        $this->seed();

        $this->assertDatabaseCount(MenuCategory::class, 4);
        $this->assertDatabaseCount(MenuItem::class, 11);
        $this->assertDatabaseCount(FloorArea::class, 2);
        $this->assertDatabaseCount(DiningTable::class, 3);
        $this->assertSame('10.50', MenuItem::query()->where('name', 'Americano')->firstOrFail()->price);

        $matcha = MenuItem::query()->where('name', 'Iced Matcha Latte')->firstOrFail();
        $this->assertTrue($matcha->is_drink);
        $this->assertSame(['temperature' => false, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']], $matcha->drink_options);

        $water = MenuItem::query()->where('name', 'Bottled Water')->firstOrFail();
        $this->assertTrue($water->is_drink);
        $this->assertSame(['standard'], $water->drink_options['sizes']);

        $sandwich = MenuItem::query()->where('name', 'Chicken Sandwich')->firstOrFail();
        $this->assertFalse($sandwich->is_drink);
        $this->assertNull($sandwich->drink_options);
    }
}
