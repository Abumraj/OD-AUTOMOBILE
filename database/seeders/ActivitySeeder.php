<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        // Activity Stream
        $stream = [
            [
                'action' => 'Quote Approved',
                'description' => 'John Smith quote for BMW X5 approved, shipment REF-2026-99283 created.',
                'location' => 'Admin Dashboard',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ],
            [
                'action' => 'New Quote Received',
                'description' => 'Elena Rodriguez submitted a new quote request for 2023 Tesla Model Y.',
                'location' => 'Website Quote Form',
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5)
            ],
            [
                'action' => 'Shipment Departed',
                'description' => 'Ford F-150 (REF-2026-88120) departed Houston on Atlantic Mariner V24.',
                'location' => 'Houston Port, USA',
                'created_at' => now()->subDays(25),
                'updated_at' => now()->subDays(25)
            ],
            [
                'action' => 'Auction Won',
                'description' => 'Porsche 911 won at Stuttgart auction for $95,000 on behalf of David Chen.',
                'location' => 'Stuttgart, Germany',
                'created_at' => now()->subDays(53),
                'updated_at' => now()->subDays(53)
            ],
            [
                'action' => 'Customs Cleared',
                'description' => 'Porsche 911 (REF-2026-77231) cleared Lagos customs, ready for delivery.',
                'location' => 'Lagos Port, Nigeria',
                'created_at' => now()->subDays(12),
                'updated_at' => now()->subDays(12)
            ],
            [
                'action' => 'Contact Message',
                'description' => 'Olumide Johnson inquired about shipping Range Rover from London.',
                'location' => 'Website Contact Form',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2)
            ],
            [
                'action' => 'New Auction Listed',
                'description' => 'Lexus RX 350 upcoming auction at Manheim Houston listed for bidding.',
                'location' => 'Auction Manager',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]
        ];

        foreach ($stream as $item) {
            DB::table('activity_stream')->insert($item);
        }

        // Activity Logs (legacy format used by admin dashboard)
        $logs = [
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
                'action' => 'automatically outbid on Auction AUC-2026-005',
                'location' => 'Region: North America',
                'created_at' => now()->subMinutes(14),
                'updated_at' => now()->subMinutes(14)
            ],
            [
                'icon' => 'file_upload',
                'user_name' => 'Admin Sarah',
                'action' => 'uploaded customs clearance docs for REF-2026-99283',
                'location' => 'Port: Lagos Tincan',
                'created_at' => now()->subMinutes(42),
                'updated_at' => now()->subMinutes(42)
            ],
            [
                'icon' => 'local_shipping',
                'user_name' => 'Atlantic Mariner V24',
                'action' => 'confirmed departure with 4 containers',
                'location' => 'Location: Hamburg Hub',
                'created_at' => now()->subHour(),
                'updated_at' => now()->subHour()
            ],
            [
                'icon' => 'check_circle',
                'user_name' => 'David Chen',
                'action' => 'marked Porsche 911 delivery as received and satisfactory',
                'location' => 'Lagos, Nigeria',
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10)
            ],
            [
                'icon' => 'warning',
                'user_name' => 'Customs Officer',
                'action' => 'flagged REF-2026-12399 for additional SONCAP inspection',
                'location' => 'Port: Abuja',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]
        ];

        foreach ($logs as $log) {
            DB::table('activity_logs')->insert($log);
        }
    }
}
