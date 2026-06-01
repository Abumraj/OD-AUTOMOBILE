<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add tracking provider settings
        DB::table('settings')->insert([
            [
                'key' => 'tracking_grimaldi_enabled',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_grimaldi_url',
                'value' => 'https://www.gnet.grimaldi-eservice.com/GNET/Pages_RoroTracking/WFRoroTracking',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_grimaldi_name',
                'value' => 'Grimaldi Lines',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_sallaum_enabled',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_sallaum_url',
                'value' => 'https://sallaumlines.com/track-shipment/',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_sallaum_name',
                'value' => 'Sallaum Lines',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'tracking_internal_enabled',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Add tracking_provider column to quotes table if it exists
        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                if (!Schema::hasColumn('quotes', 'tracking_provider')) {
                    $table->string('tracking_provider')->nullable()->after('status');
                }
                if (!Schema::hasColumn('quotes', 'tracking_number')) {
                    $table->string('tracking_number')->nullable()->after('tracking_provider');
                }
            });
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'tracking_grimaldi_enabled',
            'tracking_grimaldi_url',
            'tracking_grimaldi_name',
            'tracking_sallaum_enabled',
            'tracking_sallaum_url',
            'tracking_sallaum_name',
            'tracking_internal_enabled'
        ])->delete();

        if (Schema::hasTable('quotes')) {
            Schema::table('quotes', function (Blueprint $table) {
                if (Schema::hasColumn('quotes', 'tracking_provider')) {
                    $table->dropColumn('tracking_provider');
                }
                if (Schema::hasColumn('quotes', 'tracking_number')) {
                    $table->dropColumn('tracking_number');
                }
            });
        }
    }
};
