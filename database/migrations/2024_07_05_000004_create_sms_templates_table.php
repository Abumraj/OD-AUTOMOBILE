<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('message');
            $table->string('type'); // shipment, quote, auction, contact, general
            $table->json('variables')->nullable(); // Available template variables
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default SMS templates
        DB::table('sms_templates')->insert([
            [
                'name' => 'Shipment Update',
                'slug' => 'shipment-update',
                'message' => 'Hi {{customer_name}}, your shipment {{tracking_number}} status: {{status}}. Current location: {{current_location}}. Track: {{tracking_url}}',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'status', 'current_location', 'tracking_url', 'estimated_delivery']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Shipment Delivered',
                'slug' => 'shipment-delivered',
                'message' => 'Great news {{customer_name}}! Your shipment {{tracking_number}} has been delivered successfully. Thank you for choosing OD Automotive & Logistics.',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'delivery_date', 'delivery_location']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Quote Request Received',
                'slug' => 'quote-received',
                'message' => 'Hi {{customer_name}}, we received your quote request (Ref: {{reference_number}}). Our team will respond within 24 hours. - OD Automotive',
                'type' => 'quote',
                'variables' => json_encode(['customer_name', 'reference_number', 'service_type']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Quote Ready',
                'slug' => 'quote-ready',
                'message' => 'Hi {{customer_name}}, your shipping quote is ready! Ref: {{reference_number}}, Cost: {{total_cost}}. View details: {{quote_url}} - OD Automotive',
                'type' => 'quote',
                'variables' => json_encode(['customer_name', 'reference_number', 'total_cost', 'transit_time', 'quote_url']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Auction Bid Placed',
                'slug' => 'auction-bid-placed',
                'message' => 'Hi {{customer_name}}, your bid of {{bid_amount}} for {{vehicle_details}} (Ref: {{auction_reference}}) has been placed successfully. Good luck! - OD Automotive',
                'type' => 'auction',
                'variables' => json_encode(['customer_name', 'auction_reference', 'vehicle_details', 'bid_amount', 'auction_date']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Auction Won',
                'slug' => 'auction-won',
                'message' => 'Congratulations {{customer_name}}! You won the auction for {{vehicle_details}} with a bid of {{winning_bid}}. Our team will contact you shortly. - OD Automotive',
                'type' => 'auction',
                'variables' => json_encode(['customer_name', 'auction_reference', 'vehicle_details', 'winning_bid', 'payment_deadline']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Contact Form Received',
                'slug' => 'contact-received',
                'message' => 'Hi {{customer_name}}, we received your message (Ref: {{reference_number}}). Our team will respond within 24 hours. Thank you! - OD Automotive',
                'type' => 'contact',
                'variables' => json_encode(['customer_name', 'reference_number', 'subject']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Payment Confirmation',
                'slug' => 'payment-confirmed',
                'message' => 'Hi {{customer_name}}, your payment of {{amount}} has been confirmed. Transaction ID: {{transaction_id}}. Thank you! - OD Automotive',
                'type' => 'general',
                'variables' => json_encode(['customer_name', 'transaction_id', 'amount', 'service_description']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Shipment Pickup Scheduled',
                'slug' => 'pickup-scheduled',
                'message' => 'Hi {{customer_name}}, your vehicle pickup is scheduled for {{pickup_date}} at {{pickup_location}}. Tracking: {{tracking_number}} - OD Automotive',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'pickup_date', 'pickup_location', 'pickup_time']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Delivery Scheduled',
                'slug' => 'delivery-scheduled',
                'message' => 'Hi {{customer_name}}, your shipment {{tracking_number}} is scheduled for delivery on {{delivery_date}}. Please be available. - OD Automotive',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'delivery_date', 'delivery_location', 'delivery_time']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Add Termii settings to settings table
        $termiiSettings = [
            ['key' => 'termii_api_key', 'value' => '', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'termii_sender_id', 'value' => 'OD Auto', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'termii_channel', 'value' => 'generic', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'termii_enabled', 'value' => 'false', 'created_at' => now(), 'updated_at' => now()],
        ];

        foreach ($termiiSettings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_templates');
        
        DB::table('settings')->whereIn('key', [
            'termii_api_key',
            'termii_sender_id',
            'termii_channel',
            'termii_enabled'
        ])->delete();
    }
};
