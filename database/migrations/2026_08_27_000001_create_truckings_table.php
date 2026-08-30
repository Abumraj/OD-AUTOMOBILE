<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('truckings', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_year')->nullable();
            $table->enum('auction_site', ['copart', 'iaai', 'manheim', 'avc', 'dealership'])->default('copart');
            $table->enum('shipping_type', ['container', 'roro'])->default('container');
            $table->enum('trucking_fee_status', ['paid', 'unpaid'])->default('unpaid');
            $table->enum('status', ['pending', 'arrived', 'on_vessel'])->default('pending');
            $table->string('origin_port')->nullable();
            $table->string('origin_country')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('destination_country')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('truckings');
    }
};
