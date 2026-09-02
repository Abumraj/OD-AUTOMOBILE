<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->string('tracking_number')->nullable()->change();
            $table->string('reference_number')->nullable()->change();
            $table->string('customer_name')->nullable()->change();
            $table->string('customer_email')->nullable()->change();
            $table->string('origin_port')->nullable()->change();
            $table->string('origin_country')->nullable()->change();
            $table->string('destination_port')->nullable()->change();
            $table->string('destination_country')->nullable()->change();
            $table->enum('status', ['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered', 'cancelled'])->nullable()->default('pending')->change();
            $table->integer('progress_percentage')->nullable()->default(0)->change();
            $table->boolean('is_active')->nullable()->default(true)->change();
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->string('tracking_number')->nullable(false)->change();
            $table->string('reference_number')->nullable(false)->change();
            $table->string('customer_name')->nullable(false)->change();
            $table->string('customer_email')->nullable(false)->change();
            $table->string('origin_port')->nullable(false)->change();
            $table->string('origin_country')->nullable(false)->change();
            $table->string('destination_port')->nullable(false)->change();
            $table->string('destination_country')->nullable(false)->change();
            $table->enum('status', ['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered', 'cancelled'])->nullable(false)->default('pending')->change();
            $table->integer('progress_percentage')->nullable(false)->default(0)->change();
            $table->boolean('is_active')->nullable(false)->default(true)->change();
        });
    }
};
