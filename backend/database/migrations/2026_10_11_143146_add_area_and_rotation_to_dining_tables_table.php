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
        Schema::table('dining_tables', function (Blueprint $table) {
            $table->foreignId('floor_area_id')->nullable()->constrained('floor_areas')->restrictOnDelete();
            $table->unsignedSmallInteger('rotation')->default(0);
        });

        $indoorId = DB::table('floor_areas')->where('name', 'Indoor')->value('id');
        DB::table('dining_tables')->update(['floor_area_id' => $indoorId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dining_tables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('floor_area_id');
            $table->dropColumn('rotation');
        });
    }
};
