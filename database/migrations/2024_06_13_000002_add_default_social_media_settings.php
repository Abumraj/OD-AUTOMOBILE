<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $keys = ['social_facebook', 'social_instagram', 'social_twitter', 'social_linkedin', 'social_tiktok'];

        foreach ($keys as $key) {
            DB::table('settings')->insertOrIgnore([
                'key' => $key,
                'value' => '',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')
            ->whereIn('key', ['social_facebook', 'social_instagram', 'social_twitter', 'social_linkedin', 'social_tiktok'])
            ->delete();
    }
};
