<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed Quotes
        $quotes = [
            [
                'service' => 'Vehicle Shipping',
                'vehicle_year' => '2022',
                'vehicle_make' => 'BMW',
                'vehicle_model' => 'X5',
                'origin' => 'Germany',
                'destination' => 'Lagos, Nigeria',
                'customer_name' => 'John Smith',
                'email' => 'john.smith@example.com',
                'phone' => '+234-123-456-7890',
                'contact_method' => 'email',
                'status' => 'approved',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ],
            [
                'service' => 'Vehicle Procurement',
                'vehicle_year' => '2023',
                'vehicle_make' => 'Tesla',
                'vehicle_model' => 'Model Y',
                'origin' => 'USA',
                'destination' => 'Abuja, Nigeria',
                'customer_name' => 'Elena Rodriguez',
                'email' => 'elena.r@example.com',
                'phone' => '+234-987-654-3210',
                'contact_method' => 'phone',
                'status' => 'pending',
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5)
            ]
        ];

        foreach ($quotes as $quote) {
            DB::table('quotes')->insert($quote);
        }

        // Seed Shipments
        $shipments = [
            [
                'tracking_id' => 'OD-99283-AUTO',
                'customer_name' => 'John Smith',
                'customer_email' => 'john.smith@example.com',
                'customer_phone' => '+234-123-456-7890',
                'vehicle_year' => '2022',
                'vehicle_make' => 'BMW',
                'vehicle_model' => 'X5',
                'origin' => 'Munich, Germany',
                'destination' => 'Lagos, Nigeria',
                'status' => 'procurement',
                'is_starred' => true,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ],
            [
                'tracking_id' => 'OD-99401-AUTO',
                'customer_name' => 'Elena Rodriguez',
                'customer_email' => 'elena.r@example.com',
                'customer_phone' => '+234-987-654-3210',
                'vehicle_year' => '2023',
                'vehicle_make' => 'Tesla',
                'vehicle_model' => 'Model Y',
                'origin' => 'California, USA',
                'destination' => 'Abuja, Nigeria',
                'status' => 'procurement',
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5)
            ],
            [
                'tracking_id' => 'OD-88120-AUTO',
                'customer_name' => 'Marcus Thorne',
                'customer_email' => 'marcus.t@example.com',
                'customer_phone' => '+234-555-111-2222',
                'vehicle_year' => '2021',
                'vehicle_make' => 'Ford',
                'vehicle_model' => 'F-150',
                'origin' => 'Texas, USA',
                'destination' => 'Port Harcourt, Nigeria',
                'status' => 'shipping',
                'vessel_name' => 'Atlantic Mariner V24',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(3)
            ],
            [
                'tracking_id' => 'OD-77231-AUTO',
                'customer_name' => 'David Chen',
                'customer_email' => 'david.chen@example.com',
                'customer_phone' => '+234-444-333-2222',
                'vehicle_year' => '2024',
                'vehicle_make' => 'Porsche',
                'vehicle_model' => '911',
                'origin' => 'Stuttgart, Germany',
                'destination' => 'Lagos, Nigeria',
                'status' => 'at_port',
                'is_delayed' => true,
                'created_at' => now()->subDays(30),
                'updated_at' => now()->subDays(1)
            ],
            [
                'tracking_id' => 'OD-12399-AUTO',
                'customer_name' => 'Sarah Jenkins',
                'customer_email' => 'sarah.j@example.com',
                'customer_phone' => '+234-777-888-9999',
                'vehicle_year' => '2019',
                'vehicle_make' => 'Toyota',
                'vehicle_model' => 'RAV4',
                'origin' => 'Japan',
                'destination' => 'Abuja, Nigeria',
                'status' => 'clearing',
                'clearance_progress' => 75,
                'created_at' => now()->subDays(25),
                'updated_at' => now()->subHours(12)
            ],
            [
                'tracking_id' => 'OD-00212-AUTO',
                'customer_name' => 'Liam Wilson',
                'customer_email' => 'liam.w@example.com',
                'customer_phone' => '+234-222-333-4444',
                'vehicle_year' => '2022',
                'vehicle_make' => 'Audi',
                'vehicle_model' => 'Q7',
                'origin' => 'Germany',
                'destination' => 'Lagos, Nigeria',
                'status' => 'delivered',
                'delivered_at' => now()->subDays(1),
                'created_at' => now()->subDays(45),
                'updated_at' => now()->subDays(1)
            ]
        ];

        foreach ($shipments as $shipment) {
            DB::table('shipments')->insert($shipment);
        }

        // Seed Activity Logs
        $activities = [
            [
                'icon' => 'request_quote',
                'user_name' => 'Elena Rodriguez',
                'action' => 'submitted a quote request for 2023 Tesla Model Y',
                'location' => 'Website',
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5)
            ],
            [
                'icon' => 'bid_landscape',
                'user_name' => 'System',
                'action' => 'automatically outbid on Shipment #OD-2201',
                'location' => 'Region: North America',
                'created_at' => now()->subMinutes(14),
                'updated_at' => now()->subMinutes(14)
            ],
            [
                'icon' => 'file_upload',
                'user_name' => 'Admin Sarah',
                'action' => 'uploaded customs clearance for #OD-99283',
                'location' => 'Port: Lagos Tincan',
                'created_at' => now()->subMinutes(42),
                'updated_at' => now()->subMinutes(42)
            ],
            [
                'icon' => 'local_shipping',
                'user_name' => 'Carrier X-Press',
                'action' => 'confirmed pickup of 4 units',
                'location' => 'Location: Munich Hub',
                'created_at' => now()->subHour(),
                'updated_at' => now()->subHour()
            ]
        ];

        foreach ($activities as $activity) {
            DB::table('activity_logs')->insert($activity);
        }

        // Seed Carriers
        $carriers = [
            ['name' => 'Atlantic Shipping Co.', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Global Freight Express', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ocean Transport Ltd', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pacific Logistics', 'status' => 'inactive', 'created_at' => now(), 'updated_at' => now()]
        ];

        foreach ($carriers as $carrier) {
            DB::table('carriers')->insert($carrier);
        }

        // Seed Vessels
        $vessels = [
            ['name' => 'Atlantic Mariner V24', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pacific Explorer', 'is_on_time' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ocean Spirit', 'is_on_time' => false, 'created_at' => now(), 'updated_at' => now()]
        ];

        foreach ($vessels as $vessel) {
            DB::table('vessels')->insert($vessel);
        }

        // Seed Logistics Partners
        for ($i = 1; $i <= 324; $i++) {
            DB::table('logistics_partners')->insert([
                'name' => 'Partner Company ' . $i,
                'is_verified' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}
