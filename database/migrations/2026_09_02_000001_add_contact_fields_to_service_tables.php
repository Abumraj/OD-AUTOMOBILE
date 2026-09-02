<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clearances', function (Blueprint $table) {
            if (!Schema::hasColumn('clearances', 'client_email')) {
                $table->string('client_email')->nullable()->after('client_name');
            }
        });

        Schema::table('autosales', function (Blueprint $table) {
            if (!Schema::hasColumn('autosales', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('autosales', 'customer_email')) {
                $table->string('customer_email')->nullable()->after('customer_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('clearances', function (Blueprint $table) {
            if (Schema::hasColumn('clearances', 'client_email')) {
                $table->dropColumn('client_email');
            }
        });

        Schema::table('autosales', function (Blueprint $table) {
            if (Schema::hasColumn('autosales', 'customer_name')) {
                $table->dropColumn('customer_name');
            }
            if (Schema::hasColumn('autosales', 'customer_email')) {
                $table->dropColumn('customer_email');
            }
        });
    }
};
