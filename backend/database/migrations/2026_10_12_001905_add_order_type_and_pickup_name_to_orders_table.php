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
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('dining_table_id')->nullable()->change();
            $table->string('order_type')->default('dine_in');
            $table->string('pickup_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('orders')->whereNull('dining_table_id')->exists()) {
            throw new RuntimeException('Remove takeaway orders before rolling back this migration.');
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'pickup_name']);
            $table->foreignId('dining_table_id')->nullable(false)->change();
        });
    }
};
