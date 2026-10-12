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
            $table->char('currency', 3)->default('MYR');
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('service_charge_amount', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->nullable();
            $table->decimal('receipt_service_charge_rate', 5, 2)->nullable();
            $table->decimal('receipt_tax_rate', 5, 2)->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('receipt_business_name')->nullable();
            $table->string('receipt_business_phone')->nullable();
            $table->text('receipt_business_address')->nullable();
            $table->char('receipt_currency', 3)->nullable();
            $table->string('receipt_destination')->nullable();
            $table->index(['paid_at', 'created_at']);
        });

        DB::table('orders')->update([
            'currency' => DB::table('business_profiles')->first()?->currency ?? 'MYR',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['paid_at', 'created_at']);
            $table->dropColumn([
                'currency', 'discount_amount', 'service_charge_amount', 'tax_amount', 'grand_total',
                'receipt_service_charge_rate', 'receipt_tax_rate', 'payment_method', 'paid_at',
                'receipt_business_name', 'receipt_business_phone', 'receipt_business_address',
                'receipt_currency', 'receipt_destination',
            ]);
        });
    }
};
