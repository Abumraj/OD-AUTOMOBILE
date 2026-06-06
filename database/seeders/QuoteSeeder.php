<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuoteSeeder extends Seeder
{
    public function run(): void
    {
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
            ],
            [
                'service' => 'Port Clearance',
                'vehicle_year' => '2021',
                'vehicle_make' => 'Ford',
                'vehicle_model' => 'F-150',
                'origin' => 'Texas, USA',
                'destination' => 'Port Harcourt, Nigeria',
                'customer_name' => 'Marcus Thorne',
                'email' => 'marcus.t@example.com',
                'phone' => '+234-555-111-2222',
                'contact_method' => 'email',
                'status' => 'converted',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(3)
            ],
            [
                'service' => 'Delivery',
                'vehicle_year' => '2024',
                'vehicle_make' => 'Porsche',
                'vehicle_model' => '911',
                'origin' => 'Stuttgart, Germany',
                'destination' => 'Lagos, Nigeria',
                'customer_name' => 'David Chen',
                'email' => 'david.chen@example.com',
                'phone' => '+234-444-333-2222',
                'contact_method' => 'phone',
                'status' => 'pending',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1)
            ],
            [
                'service' => 'Vehicle Shipping',
                'vehicle_year' => '2019',
                'vehicle_make' => 'Toyota',
                'vehicle_model' => 'RAV4',
                'origin' => 'Japan',
                'destination' => 'Abuja, Nigeria',
                'customer_name' => 'Sarah Jenkins',
                'email' => 'sarah.j@example.com',
                'phone' => '+234-777-888-9999',
                'contact_method' => 'email',
                'status' => 'approved',
                'created_at' => now()->subDays(20),
                'updated_at' => now()->subDays(10)
            ],
            [
                'service' => 'Vehicle Procurement',
                'vehicle_year' => '2022',
                'vehicle_make' => 'Audi',
                'vehicle_model' => 'Q7',
                'origin' => 'Germany',
                'destination' => 'Lagos, Nigeria',
                'customer_name' => 'Liam Wilson',
                'email' => 'liam.w@example.com',
                'phone' => '+234-222-333-4444',
                'contact_method' => 'phone',
                'status' => 'pending',
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(8)
            ]
        ];

        foreach ($quotes as $quote) {
            DB::table('quotes')->insert($quote);
        }
    }
}
