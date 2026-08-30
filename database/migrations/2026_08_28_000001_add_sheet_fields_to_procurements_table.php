<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            $table->date('date_procured')->nullable();
            $table->string('car_make')->nullable();
            $table->string('car_model')->nullable();
            $table->decimal('price_usd', 12, 2)->nullable();
            $table->decimal('auction_charge_usd', 12, 2)->nullable();
            $table->string('state')->nullable();
            $table->decimal('trucking', 12, 2)->nullable();
            $table->string('shipping')->nullable();
            $table->date('arrival_date')->nullable();
            $table->decimal('profit_ngn', 14, 2)->nullable();
            $table->string('trucking_fee')->nullable();
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            $table->dropColumn([
                'date_procured',
                'car_make',
                'car_model',
                'price_usd',
                'auction_charge_usd',
                'state',
                'trucking',
                'shipping',
                'arrival_date',
                'profit_ngn',
                'trucking_fee',
            ]);
        });
    }
};
