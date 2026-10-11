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
        $coffee = MenuCategory::query()->where('name', 'Coffee')->firstOrFail();
        $pastries = MenuCategory::query()->where('name', 'Pastries')->firstOrFail();

        MenuItem::firstOrCreate(
            ['menu_category_id' => $coffee->id, 'name' => 'Flat White'],
            ['description' => 'Double espresso with steamed milk', 'price' => 12.00, 'is_available' => true],
        );
        MenuItem::firstOrCreate(
            ['menu_category_id' => $pastries->id, 'name' => 'Butter Croissant'],
            ['description' => 'Baked fresh each morning', 'price' => 9.00, 'is_available' => true],
        );
    }
}
