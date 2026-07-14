<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subject');
            $table->text('content');
            $table->string('type'); // shipment, quote, auction, contact, general
            $table->json('variables')->nullable(); // Available template variables
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default email templates
        DB::table('email_templates')->insert([
            [
                'name' => 'Shipment Update',
                'slug' => 'shipment-update',
                'subject' => 'Your Shipment Update - {{tracking_number}}',
                'content' => '<h1>Shipment Update</h1><p>Hello {{customer_name}},</p><p>Your shipment <strong>{{tracking_number}}</strong> has been updated.</p><p><strong>Status:</strong> {{status}}</p><p><strong>Location:</strong> {{current_location}}</p><p>Track your shipment: <a href="{{tracking_url}}">Click here</a></p>',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'status', 'current_location', 'tracking_url', 'vehicle_details', 'estimated_delivery']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Quote Request Received',
                'slug' => 'quote-received',
                'subject' => 'Quote Request Received - {{reference_number}}',
                'content' => '<h1>Quote Request Received</h1><p>Hello {{customer_name}},</p><p>Thank you for your quote request. We have received your inquiry and our team is preparing a detailed quote for you.</p><p><strong>Reference Number:</strong> {{reference_number}}</p><p><strong>Service Type:</strong> {{service_type}}</p><p>We will respond within 24 hours.</p>',
                'type' => 'quote',
                'variables' => json_encode(['customer_name', 'reference_number', 'service_type', 'pickup_location', 'delivery_location', 'vehicle_details']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Quote Ready',
                'slug' => 'quote-ready',
                'subject' => 'Your Quote is Ready - {{reference_number}}',
                'content' => '<h1>Your Quote is Ready</h1><p>Hello {{customer_name}},</p><p>Your shipping quote is now ready for review.</p><p><strong>Reference Number:</strong> {{reference_number}}</p><p><strong>Total Cost:</strong> {{total_cost}}</p><p><strong>Estimated Transit Time:</strong> {{transit_time}}</p><p><a href="{{quote_url}}">View Full Quote</a></p>',
                'type' => 'quote',
                'variables' => json_encode(['customer_name', 'reference_number', 'total_cost', 'transit_time', 'quote_url', 'service_details']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Auction Bid Placed',
                'slug' => 'auction-bid-placed',
                'subject' => 'Auction Bid Confirmation - {{auction_reference}}',
                'content' => '<h1>Bid Placed Successfully</h1><p>Hello {{customer_name}},</p><p>Your bid has been placed successfully.</p><p><strong>Auction Reference:</strong> {{auction_reference}}</p><p><strong>Vehicle:</strong> {{vehicle_details}}</p><p><strong>Bid Amount:</strong> {{bid_amount}}</p><p><strong>Auction Date:</strong> {{auction_date}}</p><p>We will notify you of the auction results.</p>',
                'type' => 'auction',
                'variables' => json_encode(['customer_name', 'auction_reference', 'vehicle_details', 'bid_amount', 'auction_date', 'auction_location']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Auction Won',
                'slug' => 'auction-won',
                'subject' => 'Congratulations! You Won the Auction - {{auction_reference}}',
                'content' => '<h1>Congratulations!</h1><p>Hello {{customer_name}},</p><p>You have won the auction!</p><p><strong>Auction Reference:</strong> {{auction_reference}}</p><p><strong>Vehicle:</strong> {{vehicle_details}}</p><p><strong>Winning Bid:</strong> {{winning_bid}}</p><p><strong>Next Steps:</strong> {{next_steps}}</p><p>Our team will contact you shortly to arrange payment and shipping.</p>',
                'type' => 'auction',
                'variables' => json_encode(['customer_name', 'auction_reference', 'vehicle_details', 'winning_bid', 'next_steps', 'payment_deadline']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Contact Form Submission',
                'slug' => 'contact-received',
                'subject' => 'We Received Your Message',
                'content' => '<h1>Message Received</h1><p>Hello {{customer_name}},</p><p>Thank you for contacting OD Automotive & Logistics. We have received your message and will respond within 24 hours.</p><p><strong>Reference Number:</strong> {{reference_number}}</p><p><strong>Subject:</strong> {{subject}}</p><p>If you need immediate assistance, please call us at {{phone_number}}.</p>',
                'type' => 'contact',
                'variables' => json_encode(['customer_name', 'reference_number', 'subject', 'phone_number', 'message']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Shipment Delivered',
                'slug' => 'shipment-delivered',
                'subject' => 'Shipment Delivered - {{tracking_number}}',
                'content' => '<h1>Shipment Delivered</h1><p>Hello {{customer_name}},</p><p>Your shipment has been successfully delivered!</p><p><strong>Tracking Number:</strong> {{tracking_number}}</p><p><strong>Delivery Date:</strong> {{delivery_date}}</p><p><strong>Delivered To:</strong> {{delivery_location}}</p><p>Thank you for choosing OD Automotive & Logistics. We hope to serve you again soon!</p>',
                'type' => 'shipment',
                'variables' => json_encode(['customer_name', 'tracking_number', 'delivery_date', 'delivery_location', 'vehicle_details']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Payment Confirmation',
                'slug' => 'payment-confirmed',
                'subject' => 'Payment Confirmed - {{transaction_id}}',
                'content' => '<h1>Payment Confirmed</h1><p>Hello {{customer_name}},</p><p>Your payment has been successfully processed.</p><p><strong>Transaction ID:</strong> {{transaction_id}}</p><p><strong>Amount:</strong> {{amount}}</p><p><strong>Service:</strong> {{service_description}}</p><p>Thank you for your payment. Your service will proceed as scheduled.</p>',
                'type' => 'general',
                'variables' => json_encode(['customer_name', 'transaction_id', 'amount', 'service_description', 'payment_date']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
