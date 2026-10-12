<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = MenuCategory::query()->whereIn('name', ['Coffee', 'Cold Drinks', 'Food', 'Pastries'])
            ->pluck('id', 'name');

        $items = [
            ['category' => 'Coffee', 'name' => 'Flat White', 'description' => 'Double espresso with steamed milk', 'price' => 12.00,
                'drink_options' => ['temperature' => true, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']]],
            ['category' => 'Coffee', 'name' => 'Americano', 'description' => 'Espresso topped with hot water', 'price' => 9.00,
                'drink_options' => ['temperature' => true, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']]],
            ['category' => 'Coffee', 'name' => 'Espresso', 'description' => 'A double shot of espresso', 'price' => 7.00,
                'drink_options' => ['temperature' => false, 'sugar' => false, 'ice' => false, 'sizes' => ['standard']]],
            ['category' => 'Cold Drinks', 'name' => 'Iced Matcha Latte', 'description' => 'Matcha and milk over ice', 'price' => 14.00,
                'drink_options' => ['temperature' => false, 'sugar' => true, 'ice' => true, 'sizes' => ['standard', 'large']]],
            ['category' => 'Cold Drinks', 'name' => 'Lemon Iced Tea', 'description' => 'Black tea with lemon', 'price' => 8.00,
                'drink_options' => ['temperature' => false, 'sugar' => true, 'ice' => true, 'sizes' => ['standard']]],
            ['category' => 'Cold Drinks', 'name' => 'Bottled Water', 'description' => 'Still drinking water', 'price' => 3.00,
                'drink_options' => ['temperature' => false, 'sugar' => false, 'ice' => false, 'sizes' => ['standard']]],
            ['category' => 'Food', 'name' => 'Chicken Sandwich', 'description' => 'Grilled chicken, lettuce, and tomato', 'price' => 16.00],
            ['category' => 'Food', 'name' => 'Nasi Lemak', 'description' => 'Coconut rice with sambal, egg, and cucumber', 'price' => 13.00],
            ['category' => 'Food', 'name' => 'Egg Mayo Toast', 'description' => 'Toasted bread with egg mayonnaise', 'price' => 10.00],
            ['category' => 'Pastries', 'name' => 'Butter Croissant', 'description' => 'Baked fresh each morning', 'price' => 9.00],
            ['category' => 'Pastries', 'name' => 'Banana Bread', 'description' => 'A slice of banana bread', 'price' => 8.00],
        ];

        foreach ($items as $sortOrder => $item) {
            MenuItem::firstOrCreate(
                ['menu_category_id' => $categories[$item['category']], 'name' => $item['name']],
                [
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'is_available' => true,
                    'is_drink' => isset($item['drink_options']),
                    'drink_options' => $item['drink_options'] ?? null,
                    'sort_order' => $sortOrder,
                ],
            );
        }
    }
}
