<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->decimal('shipping_fee', 10, 2)->nullable()->after('total_cost');
            $table->enum('shipping_fee_status', ['PAID', 'UNPAID'])->default('UNPAID')->after('shipping_fee');
            $table->string('c_number')->nullable()->after('container_number');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['shipping_fee', 'shipping_fee_status', 'c_number']);
        });
    }
};
