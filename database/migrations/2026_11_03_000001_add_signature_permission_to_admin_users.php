<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A super admin decides which admins may manage the signature printed on invoices and
     * dock receipts. Nobody but super admins has it until it is granted.
     */
    public function up(): void
    {
        if (Schema::hasTable('admin_users') && !Schema::hasColumn('admin_users', 'can_manage_signature')) {
            Schema::table('admin_users', function (Blueprint $table) {
                $table->boolean('can_manage_signature')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('admin_users') && Schema::hasColumn('admin_users', 'can_manage_signature')) {
            Schema::table('admin_users', function (Blueprint $table) {
                $table->dropColumn('can_manage_signature');
            });
        }
    }
};
