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
            $table->string('tracking_id')->unique();
            $table->foreignId('quote_id')->nullable()->constrained()->onDelete('set null');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('vehicle_year');
            $table->string('vehicle_make');
            $table->string('vehicle_model');
            $table->string('origin');
            $table->string('destination');
            $table->enum('status', ['procurement', 'shipping', 'at_port', 'clearing', 'delivery', 'delivered'])->default('procurement');
            $table->string('vessel_name')->nullable();
            $table->boolean('is_delayed')->default(false);
            $table->boolean('is_starred')->default(false);
            $table->integer('clearance_progress')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
