<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dock_receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('dock_receipts', 'eta')) {
                $table->date('eta')->nullable()->after('location_received');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dock_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('dock_receipts', 'eta')) {
                $table->dropColumn('eta');
            }
        });
    }
};
