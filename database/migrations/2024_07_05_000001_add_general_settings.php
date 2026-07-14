<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add new settings to existing settings table
        DB::table('settings')->insert([
            [
                'key' => 'minimum_deposit',
                'value' => '1000',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'office_address',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'office_city',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'office_country',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'office_phone',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'office_email',
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'minimum_deposit',
            'office_address',
            'office_city',
            'office_country',
            'office_phone',
            'office_email'
        ])->delete();
    }
};
