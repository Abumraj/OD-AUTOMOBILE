<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->text('quote');
            $table->string('customer_name');
            $table->string('location');
            $table->string('company')->nullable();
            $table->integer('rating')->default(5);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_approved')->default(false);
            $table->foreignId('shipment_id')->nullable()->constrained('shipments')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
