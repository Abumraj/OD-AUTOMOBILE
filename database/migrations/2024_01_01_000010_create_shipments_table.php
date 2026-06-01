<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->string('reference_number')->unique();
            $table->unsignedBigInteger('quote_id')->nullable();

            // Customer Information
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();

            // Vehicle Information
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_year')->nullable();
            $table->string('vehicle_vin')->nullable();
            $table->text('vehicle_description')->nullable();

            // Shipping Information
            $table->string('origin_port');
            $table->string('origin_country');
            $table->string('destination_port');
            $table->string('destination_country');
            $table->string('shipping_provider')->nullable(); // grimaldi, sallaum, other
            $table->string('vessel_name')->nullable();
            $table->string('container_number')->nullable();
            $table->string('booking_number')->nullable();

            // Status and Progress
            $table->enum('status', ['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered', 'cancelled'])->default('pending');
            $table->integer('progress_percentage')->default(0);

            // Dates
            $table->dateTime('auction_date')->nullable();
            $table->dateTime('shipping_date')->nullable();
            $table->dateTime('departure_date')->nullable();
            $table->dateTime('estimated_arrival_date')->nullable();
            $table->dateTime('actual_arrival_date')->nullable();
            $table->dateTime('delivery_date')->nullable();

            // Additional Information
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Foreign key
            $table->foreign('quote_id')->references('id')->on('quotes')->onDelete('set null');
        });

        // Create shipment_updates table for tracking history
        Schema::create('shipment_updates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shipment_id');
            $table->string('status');
            $table->string('location')->nullable();
            $table->text('description');
            $table->timestamp('update_date');
            $table->timestamps();

            $table->foreign('shipment_id')->references('id')->on('shipments')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_updates');
        Schema::dropIfExists('shipments');
    }
};
