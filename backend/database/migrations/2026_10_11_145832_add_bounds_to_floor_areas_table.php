<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('floor_areas', function (Blueprint $table) {
            $table->decimal('position_x', 5, 2)->default(0);
            $table->decimal('position_y', 5, 2)->default(0);
            $table->decimal('width', 5, 2)->default(65);
            $table->decimal('height', 5, 2)->default(100);
        });

        $indoor = DB::table('floor_areas')->where('name', 'Indoor')->first();
        $outdoor = DB::table('floor_areas')->where('name', 'Outdoor')->first();
        if ($outdoor) {
            DB::table('floor_areas')->where('id', $outdoor->id)->update([
                'position_x' => 65, 'position_y' => 0, 'width' => 35, 'height' => 100,
            ]);
        } elseif ($indoor) {
            DB::table('floor_areas')->where('id', $indoor->id)->update(['width' => 100]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('floor_areas', function (Blueprint $table) {
            $table->dropColumn(['position_x', 'position_y', 'width', 'height']);
        });
    }
};
