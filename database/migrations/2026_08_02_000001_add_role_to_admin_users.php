<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'superadmin'])->default('admin')->after('email');
        });

        // Update the default admin to superadmin
        DB::table('admin_users')
            ->where('email', 'admin@odlogistics.com')
            ->update(['role' => 'superadmin']);
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
