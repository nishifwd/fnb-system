<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_profile_can_be_saved_and_read(): void
    {
        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data', null);

        $this->putJson('/api/v1/business', [
            'name' => 'Kopi Corner',
            'phone' => '03-1234 5678',
            'address' => 'Kuala Lumpur',
            'currency' => 'MYR',
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
            'sort_order' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('price');

        $item = $this->postJson('/api/v1/items', [
            'menu_category_id' => $category['id'],
            'name' => 'Flat White',
            'description' => 'Espresso and milk',
            'price' => 12.50,
            'is_available' => true,
            'sort_order' => 0,
        ])->assertCreated()->assertJsonPath('data.price', '12.50')->json('data');

        $this->getJson('/api/v1/items')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/categories/'.$category['id'])->assertStatus(409);

        $this->putJson('/api/v1/items/'.$item['id'], [
            'menu_category_id' => $category['id'],
            'name' => 'Iced Flat White',
            'description' => null,
            'price' => 13,
            'is_available' => false,
            'sort_order' => 1,
        ])->assertOk()->assertJsonPath('data.is_available', false);

        $this->deleteJson('/api/v1/items/'.$item['id'])->assertNoContent();
        $this->deleteJson('/api/v1/categories/'.$category['id'])->assertNoContent();
        $this->assertDatabaseCount(MenuItem::class, 0);
        $this->assertDatabaseCount(MenuCategory::class, 0);
    }

    public function test_tables_can_be_arranged_and_validated(): void
    {
        $table = $this->postJson('/api/v1/tables', [
            'label' => 'T1',
            'capacity' => 4,
            'shape' => 'round',
            'position_x' => 20,
            'position_y' => 30,
        ])->assertCreated()->json('data');

        $this->postJson('/api/v1/tables', [
            'label' => 'T1',
            'capacity' => 40,
            'shape' => 'triangle',
            'position_x' => 120,
            'position_y' => 30,
        ])->assertUnprocessable()->assertJsonValidationErrors(['label', 'capacity', 'shape', 'position_x']);

        $this->putJson('/api/v1/tables/'.$table['id'], [
            'label' => 'T1',
            'capacity' => 4,
            'shape' => 'square',
            'position_x' => 65.5,
            'position_y' => 40,
        ])->assertOk()->assertJsonPath('data.position_x', '65.50');

        $this->getJson('/api/v1/tables')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson('/api/v1/tables/'.$table['id'])->assertNoContent();
        $this->assertDatabaseCount(DiningTable::class, 0);
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
        $this->seed();

        $this->assertDatabaseCount(MenuCategory::class, 2);
        $this->assertDatabaseCount(MenuItem::class, 2);
        $this->assertDatabaseCount(DiningTable::class, 2);
    }
}
