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
        Schema::table('floor_layouts', function (Blueprint $table) {
            $table->decimal('entrance_x', 5, 2)->default(50);
            $table->decimal('entrance_y', 5, 2)->default(100);
        });

        foreach (DB::table('floor_layouts')->get(['id', 'entrance_side', 'entrance_offset']) as $layout) {
            $offset = (float) $layout->entrance_offset;
            [$x, $y] = match ($layout->entrance_side) {
                'top' => [$offset, 0],
                'right' => [100, $offset],
                'left' => [0, $offset],
                default => [$offset, 100],
            };

            DB::table('floor_layouts')->where('id', $layout->id)->update([
                'entrance_x' => $x,
                'entrance_y' => $y,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('floor_layouts', function (Blueprint $table) {
            $table->dropColumn(['entrance_x', 'entrance_y']);
        });
    }
};
