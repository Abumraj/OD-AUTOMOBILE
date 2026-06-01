<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->string('service');
            $table->string('vehicle_year');
            $table->string('vehicle_make');
            $table->string('vehicle_model');
            $table->string('origin');
            $table->string('destination');
            $table->string('customer_name');
            $table->string('email');
            $table->string('phone');
            $table->string('contact_method');
            $table->enum('status', ['pending', 'approved', 'converted'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
