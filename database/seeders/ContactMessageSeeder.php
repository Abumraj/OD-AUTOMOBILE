<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContactMessageSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            [
                'name' => 'Olumide Johnson',
                'email' => 'olumide.j@example.com',
                'phone' => '+234-999-888-7777',
                'service' => 'Vehicle Shipping',
                'message' => 'I need to ship a 2023 Range Rover from London to Lagos. Can you provide a quote and timeline?',
                'status' => 'new',
                'admin_notes' => null,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2)
            ],
            [
                'name' => 'Grace Adeleke',
                'email' => 'grace.a@example.com',
                'phone' => '+234-666-555-4444',
                'service' => 'Vehicle Procurement',
                'message' => 'Interested in procuring a 2022 Mercedes G-Wagon from a US auction. What is your commission structure?',
                'status' => 'read',
                'admin_notes' => 'Sent commission details PDF',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1)
            ],
            [
                'name' => 'Emeka Nnamdi',
                'email' => 'emeka.n@example.com',
                'phone' => '+234-222-333-4444',
                'service' => 'Port Clearance',
                'message' => 'My shipment arrived at Lagos port last week but customs has flagged it. Can you help expedite clearance?',
                'status' => 'replied',
                'admin_notes' => 'Escalated to customs agent, waiting for update',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(1)
            ],
            [
                'name' => 'Zainab Abdullahi',
                'email' => 'zainab.a@example.com',
                'phone' => '+234-111-000-9999',
                'service' => 'Delivery',
                'message' => 'I want door-to-door delivery for my shipment (REF-2026-99283) to my residence in Victoria Island.',
                'status' => 'replied',
                'admin_notes' => 'Door delivery arranged, extra $150 fee applied',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(4)
            ],
            [
                'name' => 'Tunde Bakare',
                'email' => 'tunde.b@example.com',
                'phone' => '+234-777-666-5555',
                'service' => 'Vehicle Shipping',
                'message' => 'Do you offer group shipping discounts? I have 3 vehicles to ship from Hamburg to Lagos.',
                'status' => 'new',
                'admin_notes' => null,
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5)
            ],
            [
                'name' => 'Chinwe Okonkwo',
                'email' => 'chinwe.o@example.com',
                'phone' => '+234-444-333-2222',
                'service' => 'Vehicle Procurement',
                'message' => 'Looking for a Toyota Camry 2021-2023 under $18,000. Can you source from Copart or IAAI?',
                'status' => 'read',
                'admin_notes' => 'Forwarded to procurement team',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ],
            [
                'name' => 'Ibrahim Suleiman',
                'email' => 'ibrahim.s@example.com',
                'phone' => '+234-555-444-3333',
                'service' => 'General Inquiry',
                'message' => 'What documents do I need to import a vehicle to Nigeria? Do you handle all paperwork?',
                'status' => 'replied',
                'admin_notes' => 'Sent documentation checklist via email',
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(6)
            ],
            [
                'name' => 'Ngozi Eze',
                'email' => 'ngozi.e@example.com',
                'phone' => '+234-888-777-6666',
                'service' => 'Port Clearance',
                'message' => 'My vehicle has been at the port for 3 weeks. Please help me understand what is causing the delay.',
                'status' => 'archived',
                'admin_notes' => 'Resolved - SONCAP certificate was missing, now cleared',
                'created_at' => now()->subDays(30),
                'updated_at' => now()->subDays(25)
            ]
        ];

        foreach ($messages as $message) {
            DB::table('contact_messages')->insert($message);
        }
    }
}
