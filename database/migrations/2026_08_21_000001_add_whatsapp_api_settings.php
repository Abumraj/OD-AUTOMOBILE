<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            ['key' => 'whatsapp_enabled', 'value' => 'false'],
            ['key' => 'whatsapp_access_token', 'value' => ''],
            ['key' => 'whatsapp_phone_number_id', 'value' => ''],
            ['key' => 'whatsapp_api_version', 'value' => 'v20.0'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'whatsapp_enabled',
            'whatsapp_access_token',
            'whatsapp_phone_number_id',
            'whatsapp_api_version'
        ])->delete();
    }
};
