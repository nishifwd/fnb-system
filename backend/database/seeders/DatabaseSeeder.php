<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BusinessProfileSeeder::class,
            MenuCategorySeeder::class,
            MenuItemSeeder::class,
            DiningTableSeeder::class,
        ]);
    }
}
