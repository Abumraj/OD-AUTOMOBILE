<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('record_type', 50);
            $table->unsignedBigInteger('record_id');
            $table->string('service_label')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('description')->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('currency', 3)->default('NGN');
            $table->date('date_issued')->nullable();
            $table->text('notes')->nullable();
            $table->string('generated_by')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['record_type', 'record_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
