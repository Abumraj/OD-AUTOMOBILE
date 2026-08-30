<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clearances', function (Blueprint $table) {
            $table->string('car_make')->nullable();
            $table->string('car_model')->nullable();
            $table->string('car_year', 10)->nullable();
            $table->string('color')->nullable();
            $table->string('vin')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('payment_status')->nullable();
            $table->string('shipment_status')->nullable();
            $table->string('location')->nullable();
            $table->string('tracking')->nullable();
        });

        Schema::table('truckings', function (Blueprint $table) {
            $table->foreignId('shipping_line_id')->nullable()->after('shipping_type')->constrained('shipping_lines')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('truckings', function (Blueprint $table) {
            $table->dropForeign(['shipping_line_id']);
            $table->dropColumn('shipping_line_id');
        });

        Schema::table('clearances', function (Blueprint $table) {
            $table->dropColumn([
                'car_make',
                'car_model',
                'car_year',
                'color',
                'vin',
                'amount',
                'payment_status',
                'shipment_status',
                'location',
                'tracking',
            ]);
        });
    }
};
