<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AuctionSeeder extends Seeder
{
    public function run(): void
    {
        $auctions = [
            [
                'auction_number' => 'AUC-2026-001',
                'vehicle_make' => 'BMW', 'vehicle_model' => 'X5', 'vehicle_year' => '2022',
                'vehicle_vin' => 'WBAJA5C50LWX12345', 'vehicle_color' => 'Black', 'vehicle_type' => 'SUV', 'vehicle_mileage' => 24500,
                'vehicle_description' => 'Premium SUV with M Sport package and panoramic sunroof.',
                'vehicle_images' => json_encode(['https://example.com/bmw1.jpg']),
                'auction_platform' => 'Copart', 'auction_location' => 'Los Angeles, CA', 'lot_number' => 'LOT-88421',
                'title_status' => 'clean', 'damage_description' => 'Minor bumper scuff - cosmetic only',
                'current_bid' => 28500, 'reserve_price' => 30000, 'buy_now_price' => 35000,
                'estimated_repair_cost' => 500, 'market_value' => 42000,
                'status' => 'completed',
                'auction_start_time' => now()->subDays(10), 'auction_end_time' => now()->subDays(8),
                'customer_name' => 'John Smith', 'customer_email' => 'john.smith@example.com',
                'customer_phone' => '+234-123-456-7890', 'customer_max_bid' => 32000,
                'deposit_paid' => true, 'deposit_amount' => 5000,
                'total_bids' => 12, 'winning_bid' => 28500, 'won_at' => now()->subDays(8),
                'shipping_arranged' => true,
                'admin_notes' => 'Customer approved, shipment OD-99283',
                'featured' => true, 'is_active' => true,
                'created_at' => now()->subDays(12), 'updated_at' => now()->subDays(8)
            ],
            [
                'auction_number' => 'AUC-2026-002',
                'vehicle_make' => 'Tesla', 'vehicle_model' => 'Model Y', 'vehicle_year' => '2023',
                'vehicle_vin' => '5YJ3E1EA8PF987654', 'vehicle_color' => 'White', 'vehicle_type' => 'SUV', 'vehicle_mileage' => 8500,
                'vehicle_description' => 'Long Range AWD, Full Self-Driving. Like new.',
                'vehicle_images' => json_encode(['https://example.com/tesla1.jpg']),
                'auction_platform' => 'IAAI', 'auction_location' => 'San Diego, CA', 'lot_number' => 'LOT-99201',
                'title_status' => 'clean', 'damage_description' => 'No damage reported',
                'current_bid' => 42000, 'reserve_price' => 40000, 'buy_now_price' => 45000,
                'estimated_repair_cost' => 0, 'market_value' => 48000,
                'status' => 'completed',
                'auction_start_time' => now()->subDays(20), 'auction_end_time' => now()->subDays(18),
                'customer_name' => 'Elena Rodriguez', 'customer_email' => 'elena.r@example.com',
                'customer_phone' => '+234-987-654-3210', 'customer_max_bid' => 45000,
                'deposit_paid' => true, 'deposit_amount' => 8000,
                'total_bids' => 8, 'winning_bid' => 42000, 'won_at' => now()->subDays(18),
                'shipping_arranged' => true,
                'admin_notes' => 'In transit OD-99401',
                'featured' => true, 'is_active' => true,
                'created_at' => now()->subDays(22), 'updated_at' => now()->subDays(18)
            ],
            [
                'auction_number' => 'AUC-2026-003',
                'vehicle_make' => 'Porsche', 'vehicle_model' => '911', 'vehicle_year' => '2024',
                'vehicle_vin' => 'WP0AA2A90PS123456', 'vehicle_color' => 'Black', 'vehicle_type' => 'Sports', 'vehicle_mileage' => 1200,
                'vehicle_description' => 'Carrera S, PDK, Sport Chrono. Showroom condition.',
                'vehicle_images' => json_encode(['https://example.com/porsche1.jpg']),
                'auction_platform' => 'Copart', 'auction_location' => 'Stuttgart, Germany', 'lot_number' => 'LOT-77321',
                'title_status' => 'clean', 'damage_description' => 'No damage',
                'current_bid' => 95000, 'reserve_price' => 90000, 'buy_now_price' => 105000,
                'estimated_repair_cost' => 0, 'market_value' => 115000,
                'status' => 'completed',
                'auction_start_time' => now()->subDays(55), 'auction_end_time' => now()->subDays(53),
                'customer_name' => 'David Chen', 'customer_email' => 'david.chen@example.com',
                'customer_phone' => '+234-444-333-2222', 'customer_max_bid' => 100000,
                'deposit_paid' => true, 'deposit_amount' => 15000,
                'total_bids' => 22, 'winning_bid' => 95000, 'won_at' => now()->subDays(53),
                'shipping_arranged' => true,
                'admin_notes' => 'Delivered OD-77231',
                'featured' => true, 'is_active' => true,
                'created_at' => now()->subDays(60), 'updated_at' => now()->subDays(53)
            ],
            [
                'auction_number' => 'AUC-2026-004',
                'vehicle_make' => 'Mercedes-Benz', 'vehicle_model' => 'GLE 450', 'vehicle_year' => '2023',
                'vehicle_vin' => 'W1N4M4HB7NW123456', 'vehicle_color' => 'White', 'vehicle_type' => 'SUV', 'vehicle_mileage' => 15000,
                'vehicle_description' => 'AMG Line, panoramic roof, 360 camera.',
                'vehicle_images' => json_encode(['https://example.com/merc1.jpg']),
                'auction_platform' => 'IAAI', 'auction_location' => 'Hamburg, Germany', 'lot_number' => 'LOT-66120',
                'title_status' => 'clean', 'damage_description' => 'No damage',
                'current_bid' => 52000, 'reserve_price' => 50000, 'buy_now_price' => 58000,
                'estimated_repair_cost' => 0, 'market_value' => 62000,
                'status' => 'pending_payment',
                'auction_start_time' => now()->subDays(5), 'auction_end_time' => now()->subDays(3),
                'customer_name' => 'Amara Okafor', 'customer_email' => 'amara.o@example.com',
                'customer_phone' => '+234-333-444-5555', 'customer_max_bid' => 55000,
                'deposit_paid' => true, 'deposit_amount' => 10000,
                'total_bids' => 15, 'winning_bid' => 52000, 'won_at' => now()->subDays(3),
                'shipping_arranged' => false,
                'admin_notes' => 'Payment pending - wire transfer',
                'featured' => false, 'is_active' => true,
                'created_at' => now()->subDays(7), 'updated_at' => now()->subDays(3)
            ],
            [
                'auction_number' => 'AUC-2026-005',
                'vehicle_make' => 'Lexus', 'vehicle_model' => 'RX 350', 'vehicle_year' => '2021',
                'vehicle_vin' => '2T2BZMCA7HC123456', 'vehicle_color' => 'Silver', 'vehicle_type' => 'SUV', 'vehicle_mileage' => 28000,
                'vehicle_description' => 'F Sport package, AWD, premium audio.',
                'vehicle_images' => json_encode(['https://example.com/lexus1.jpg']),
                'auction_platform' => 'Manheim', 'auction_location' => 'Houston, TX', 'lot_number' => 'LOT-44532',
                'title_status' => 'clean', 'damage_description' => 'Minor rear scratches',
                'current_bid' => 0, 'reserve_price' => 25000, 'buy_now_price' => 28000,
                'estimated_repair_cost' => 300, 'market_value' => 32000,
                'status' => 'upcoming',
                'auction_start_time' => now()->addDays(3), 'auction_end_time' => now()->addDays(5),
                'customer_name' => null, 'customer_email' => null,
                'customer_phone' => null, 'customer_max_bid' => null,
                'deposit_paid' => false, 'deposit_amount' => null,
                'total_bids' => 0, 'winning_bid' => null, 'won_at' => null,
                'shipping_arranged' => false,
                'admin_notes' => 'Open auction - no buyer yet',
                'featured' => false, 'is_active' => true,
                'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)
            ]
        ];

        foreach ($auctions as $auction) {
            DB::table('auctions')->insert($auction);
        }

        // Auction Bids
        $bids = [
            ['auction_id' => 1, 'bid_amount' => 25000, 'bidder_name' => 'Competitor A', 'is_our_bid' => false, 'bid_time' => now()->subDays(9)],
            ['auction_id' => 1, 'bid_amount' => 27500, 'bidder_name' => 'Competitor B', 'is_our_bid' => false, 'bid_time' => now()->subDays(8.5)],
            ['auction_id' => 1, 'bid_amount' => 28500, 'bidder_name' => 'OD Logistics', 'is_our_bid' => true, 'bid_time' => now()->subDays(8.2)],
            ['auction_id' => 2, 'bid_amount' => 38000, 'bidder_name' => 'Competitor C', 'is_our_bid' => false, 'bid_time' => now()->subDays(19)],
            ['auction_id' => 2, 'bid_amount' => 42000, 'bidder_name' => 'OD Logistics', 'is_our_bid' => true, 'bid_time' => now()->subDays(18.5)],
            ['auction_id' => 3, 'bid_amount' => 88000, 'bidder_name' => 'Private Buyer', 'is_our_bid' => false, 'bid_time' => now()->subDays(54)],
            ['auction_id' => 3, 'bid_amount' => 95000, 'bidder_name' => 'OD Logistics', 'is_our_bid' => true, 'bid_time' => now()->subDays(53.5)],
            ['auction_id' => 4, 'bid_amount' => 48000, 'bidder_name' => 'Dealer X', 'is_our_bid' => false, 'bid_time' => now()->subDays(4)],
            ['auction_id' => 4, 'bid_amount' => 52000, 'bidder_name' => 'OD Logistics', 'is_our_bid' => true, 'bid_time' => now()->subDays(3.5)],
        ];

        foreach ($bids as $bid) {
            DB::table('auction_bids')->insert($bid);
        }

        // Auction Requests
        $requests = [
            [
                'customer_name' => 'Michael Adebayo',
                'customer_email' => 'michael.a@example.com',
                'customer_phone' => '+234-111-222-3333',
                'vehicle_make' => 'Toyota',
                'vehicle_model' => 'Land Cruiser',
                'vehicle_year' => '2022',
                'max_budget' => 60000.00,
                'additional_requirements' => 'Must be VXR trim, low mileage preferred.',
                'status' => 'pending',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ],
            [
                'customer_name' => 'Fatima Ibrahim',
                'customer_email' => 'fatima.i@example.com',
                'customer_phone' => '+234-444-555-6666',
                'vehicle_make' => 'Honda',
                'vehicle_model' => 'Accord',
                'vehicle_year' => '2023',
                'max_budget' => 25000.00,
                'additional_requirements' => 'Touring trim, any color except red.',
                'status' => 'searching',
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(3)
            ],
            [
                'customer_name' => 'Oluwaseun Balogun',
                'customer_email' => 'seun.b@example.com',
                'customer_phone' => '+234-777-888-9990',
                'vehicle_make' => 'Range Rover',
                'vehicle_model' => 'Sport',
                'vehicle_year' => '2022',
                'max_budget' => 55000.00,
                'additional_requirements' => 'HSE Dynamic, black exterior.',
                'status' => 'found',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(7)
            ]
        ];

        foreach ($requests as $request) {
            DB::table('auction_requests')->insert($request);
        }
    }
}
