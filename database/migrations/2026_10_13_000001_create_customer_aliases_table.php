<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Legacy records identify a client by name (and often have no email at all), so a portal
     * account can carry extra "aliases": exact client names and extra email addresses that
     * should be linked to it. An alias can belong to one customer only.
     */
    public function up(): void
    {
        if (Schema::hasTable('customer_aliases')) {
            return;
        }

        Schema::create('customer_aliases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('type', ['name', 'email']);
            $table->string('value'); // lower-cased, trimmed: what records are matched against
            $table->string('label');  // as it appears on the records, for display
            $table->timestamps();

            $table->unique(['type', 'value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_aliases');
    }
};
