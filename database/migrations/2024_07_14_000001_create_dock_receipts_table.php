<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dock_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');
            $table->string('stage'); // pending, auction_won, documentation, shipping, in_transit, customs, delivered
            $table->string('customer_name');
            $table->string('reference_number');
            $table->text('vehicle_description')->nullable();
            $table->date('date_received')->nullable();
            $table->string('location_received')->nullable();
            $table->text('notes')->nullable();
            $table->string('generated_by')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dock_receipts');
    }
};
