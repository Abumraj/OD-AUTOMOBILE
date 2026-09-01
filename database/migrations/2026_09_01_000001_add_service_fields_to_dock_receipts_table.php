<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dock_receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('dock_receipts', 'record_type')) {
                $table->string('record_type')->nullable()->after('shipment_id');
            }

            if (!Schema::hasColumn('dock_receipts', 'record_id')) {
                $table->unsignedBigInteger('record_id')->nullable()->after('record_type');
            }
        });

        DB::table('dock_receipts')
            ->whereNull('record_type')
            ->whereNotNull('shipment_id')
            ->update(['record_type' => 'shipments']);

        DB::table('dock_receipts')
            ->whereNull('record_id')
            ->whereNotNull('shipment_id')
            ->update(['record_id' => DB::raw('shipment_id')]);
    }

    public function down(): void
    {
        Schema::table('dock_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('dock_receipts', 'record_type')) {
                $table->dropColumn('record_type');
            }

            if (Schema::hasColumn('dock_receipts', 'record_id')) {
                $table->dropColumn('record_id');
            }
        });
    }
};
