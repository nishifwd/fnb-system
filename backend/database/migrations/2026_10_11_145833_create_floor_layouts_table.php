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
        Schema::create('floor_layouts', function (Blueprint $table) {
            $table->id();
            $table->string('entrance_side')->default('bottom');
            $table->decimal('entrance_offset', 5, 2)->default(50);
            $table->timestamps();
        });

        DB::table('floor_layouts')->insert([
            'id' => 1, 'entrance_side' => 'bottom', 'entrance_offset' => 50,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('floor_layouts');
    }
};
