<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->insert([
            [
                'key' => 'contact_email',
                'value' => 'info@odautomotive.com',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'contact_phone',
                'value' => '+234 XXX XXX XXXX',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'contact_location',
                'value' => 'Serving clients across Africa',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'business_hours_weekday',
                'value' => '9:00 AM - 6:00 PM',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'business_hours_saturday',
                'value' => '10:00 AM - 4:00 PM',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'business_hours_sunday',
                'value' => 'Closed',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'contact_page_title',
                'value' => 'Contact Us',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'contact_page_subtitle',
                'value' => 'Have questions about our services? Ready to start your automotive import journey? We\'re here to help.',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'contact_email',
            'contact_phone',
            'contact_location',
            'business_hours_weekday',
            'business_hours_saturday',
            'business_hours_sunday',
            'contact_page_title',
            'contact_page_subtitle'
        ])->delete();
    }
};
