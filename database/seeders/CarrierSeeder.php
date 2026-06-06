<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CarrierSeeder extends Seeder
{
    public function run(): void
    {
        $carriers = [
            ['name' => 'Grimaldi Lines', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sallaum Lines', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Maersk Line', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'MSC Mediterranean Shipping', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'CMA CGM', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Hapag-Lloyd', 'status' => 'inactive', 'created_at' => now(), 'updated_at' => now()]
        ];

        foreach ($carriers as $carrier) {
            DB::table('carriers')->insert($carrier);
        }

        $vessels = [
            ['name' => 'Atlantic Mariner V24', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pacific Explorer', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ocean Spirit', 'is_on_time' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mediterranean Star', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nordic Voyager', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'African Express', 'is_on_time' => false, 'created_at' => now(), 'updated_at' => now()]
        ];

        foreach ($vessels as $vessel) {
            DB::table('vessels')->insert($vessel);
        }

        $partners = [
            ['name' => 'Lagos Port Authority', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Abuja Freight Forwarders', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Port Harcourt Logistics', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Hamburg Shipping Agents', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rotterdam Port Services', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Houston Customs Brokers', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'LA Container Yard', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tokyo Export Co', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bremerhaven Terminal', 'is_verified' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mediterranean Hub Ltd', 'is_verified' => false, 'created_at' => now(), 'updated_at' => now()]
        ];

        foreach ($partners as $partner) {
            DB::table('logistics_partners')->insert($partner);
        }
    }
}
