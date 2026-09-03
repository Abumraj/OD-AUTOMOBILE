<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('autosales', function (Blueprint $table) {
            $table->enum('shipping_type', ['container', 'roro'])->nullable()->after('sale_type');
        });
    }

    public function down(): void
    {
        Schema::table('autosales', function (Blueprint $table) {
            $table->dropColumn('shipping_type');
        });
    }
};
