<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->string('auction_number')->unique();
            
            // Vehicle Information
            $table->string('vehicle_make');
            $table->string('vehicle_model');
            $table->string('vehicle_year');
            $table->string('vehicle_vin')->nullable();
            $table->string('vehicle_color')->nullable();
            $table->string('vehicle_type')->nullable();
            $table->integer('vehicle_mileage')->nullable();
            $table->text('vehicle_description')->nullable();
            $table->json('vehicle_images')->nullable();
            
            // Auction Details
            $table->string('auction_platform');
            $table->string('auction_location');
            $table->string('lot_number')->nullable();
            $table->enum('title_status', ['clean', 'salvage', 'rebuilt', 'parts_only'])->default('clean');
            $table->text('damage_description')->nullable();
            
            // Pricing
            $table->decimal('current_bid', 10, 2)->default(0);
            $table->decimal('reserve_price', 10, 2)->nullable();
            $table->decimal('buy_now_price', 10, 2)->nullable();
            $table->decimal('estimated_repair_cost', 10, 2)->nullable();
            $table->decimal('market_value', 10, 2)->nullable();
            
            // Status and Timing
            $table->enum('status', ['upcoming', 'live', 'won', 'lost', 'pending_payment', 'completed', 'cancelled'])->default('upcoming');
            $table->dateTime('auction_start_time')->nullable();
            $table->dateTime('auction_end_time')->nullable();
            $table->integer('time_remaining_minutes')->nullable();
            
            // Customer Information
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('customer_max_bid', 10, 2)->nullable();
            $table->boolean('deposit_paid')->default(false);
            $table->decimal('deposit_amount', 10, 2)->nullable();
            
            // Bidding
            $table->integer('total_bids')->default(0);
            $table->boolean('auto_bid_enabled')->default(false);
            $table->decimal('winning_bid', 10, 2)->nullable();
            $table->dateTime('won_at')->nullable();
            
            // Shipping Integration
            $table->unsignedBigInteger('shipment_id')->nullable();
            $table->boolean('shipping_arranged')->default(false);
            
            // Admin Notes
            $table->text('admin_notes')->nullable();
            $table->boolean('featured')->default(false);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('shipment_id')->references('id')->on('shipments')->onDelete('set null');
        });

        // Auction bids history table
        Schema::create('auction_bids', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('auction_id');
            $table->decimal('bid_amount', 10, 2);
            $table->string('bidder_name')->nullable();
            $table->boolean('is_our_bid')->default(false);
            $table->timestamp('bid_time');
            $table->timestamps();
            
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');
        });

        // Auction requests from customers
        Schema::create('auction_requests', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('vehicle_make');
            $table->string('vehicle_model');
            $table->string('vehicle_year');
            $table->decimal('max_budget', 10, 2);
            $table->text('additional_requirements')->nullable();
            $table->enum('status', ['pending', 'searching', 'found', 'won', 'declined'])->default('pending');
            $table->unsignedBigInteger('auction_id')->nullable();
            $table->timestamps();
            
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auction_requests');
        Schema::dropIfExists('auction_bids');
        Schema::dropIfExists('auctions');
    }
};
