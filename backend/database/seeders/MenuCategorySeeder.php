<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use Illuminate\Database\Seeder;

class MenuCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MenuCategory::firstOrCreate(['name' => 'Coffee'], ['sort_order' => 0, 'is_active' => true]);
        MenuCategory::firstOrCreate(['name' => 'Pastries'], ['sort_order' => 1, 'is_active' => true]);
    }
}
