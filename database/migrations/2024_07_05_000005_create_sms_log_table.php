<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_log', function (Blueprint $table) {
            $table->id();
            $table->string('template_slug')->nullable();
            $table->string('phone_number');
            $table->text('message');
            $table->string('status')->default('pending'); // pending, sent, failed
            $table->text('response')->nullable();
            $table->timestamps();
            
            $table->index('template_slug');
            $table->index('phone_number');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_log');
    }
};
