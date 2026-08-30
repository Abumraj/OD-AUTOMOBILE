<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        Schema::table('truckings', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->change();
            $table->date('trucking_date')->nullable();
            $table->string('color')->nullable();
            $table->string('vin')->nullable();
            $table->string('payment_status')->nullable();
            $table->string('shipment_status')->nullable();
            $table->string('location')->nullable();
            $table->string('tracking')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('truckings', function (Blueprint $table) {
            $table->dropColumn([
                'trucking_date',
                'color',
                'vin',
                'payment_status',
                'shipment_status',
                'location',
                'tracking',
            ]);
        });

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
    }
};
