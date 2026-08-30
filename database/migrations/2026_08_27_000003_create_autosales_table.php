<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('procurements') && Schema::hasColumn('procurements', 'sale_date') && !Schema::hasTable('autosales')) {
            Schema::rename('procurements', 'autosales');
        }

        if (!Schema::hasTable('procurements')) {
            Schema::create('procurements', function (Blueprint $table) {
                $table->id();
                $table->string('customer_name');
                $table->string('customer_email');
                $table->string('customer_phone')->nullable();
                $table->string('vehicle_make')->nullable();
                $table->string('vehicle_model')->nullable();
                $table->string('vehicle_year')->nullable();
                $table->enum('auction_site', ['copart', 'iaai', 'manheim', 'avc', 'dealership'])->default('copart');
                $table->enum('status', ['pending', 'purchased', 'cancelled'])->default('pending');
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

        if (!Schema::hasTable('autosales')) {
            Schema::create('autosales', function (Blueprint $table) {
                $table->id();
                $table->date('sale_date')->nullable();
                $table->string('car_make')->nullable();
                $table->string('car_model')->nullable();
                $table->string('car_year')->nullable();
                $table->enum('sale_type', ['outright', 'swap'])->default('outright');
                $table->string('color')->nullable();
                $table->string('vin')->nullable();
                $table->decimal('amount', 12, 2)->nullable();
                $table->decimal('profit', 12, 2)->nullable();
                $table->text('notes')->nullable();
                $table->text('admin_notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('autosales');
    }
};
