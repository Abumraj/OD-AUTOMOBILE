<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carriers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('vessels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_on_time')->default(true);
            $table->timestamps();
        });

        Schema::create('logistics_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carriers');
        Schema::dropIfExists('vessels');
        Schema::dropIfExists('logistics_partners');
    }
};
