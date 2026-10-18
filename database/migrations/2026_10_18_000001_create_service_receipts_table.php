<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional vehicle sales receipts attached to any service record (shipment, procurement,
     * autosale, trucking, clearance, quote, auction request). Uploaded by OD admins or by the
     * business that owns the record. Stored privately and served through authenticated routes.
     */
    public function up(): void
    {
        if (Schema::hasTable('service_receipts')) {
            return;
        }

        Schema::create('service_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('record_type', 40);
            $table->unsignedBigInteger('record_id');
            $table->enum('uploaded_by_type', ['admin', 'customer']);
            $table->string('uploaded_by_name')->nullable();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();

            $table->index(['record_type', 'record_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_receipts');
    }
};
