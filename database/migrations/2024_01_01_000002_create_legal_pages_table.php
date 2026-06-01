<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('content');
            $table->text('meta_description')->nullable();
            $table->boolean('is_published')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Insert default legal pages
        DB::table('legal_pages')->insert([
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'content' => '<h2>Privacy Policy</h2><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide directly to us when using our services.</p><h3>How We Use Your Information</h3><p>We use the information we collect to provide, maintain, and improve our services.</p>',
                'meta_description' => 'Learn about how we collect, use, and protect your personal information.',
                'is_published' => true,
                'display_order' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'terms-of-service',
                'title' => 'Terms of Service',
                'content' => '<h2>Terms of Service</h2><p>Welcome to our service. By using our platform, you agree to these terms.</p><h3>Use of Service</h3><p>You must follow any policies made available to you within the services.</p><h3>Your Content</h3><p>Our services allow you to submit content. You retain ownership of any intellectual property rights.</p>',
                'meta_description' => 'Read our terms of service and understand the rules for using our platform.',
                'is_published' => true,
                'display_order' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'refund-policy',
                'title' => 'Refund Policy',
                'content' => '<h2>Refund Policy</h2><p>We want you to be satisfied with our services. This policy outlines our refund procedures.</p><h3>Eligibility</h3><p>Refunds may be available under certain conditions as outlined below.</p><h3>Process</h3><p>To request a refund, please contact our support team with your order details.</p>',
                'meta_description' => 'Understand our refund policy and how to request a refund for our services.',
                'is_published' => true,
                'display_order' => 3,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'shipping-policy',
                'title' => 'Shipping Policy',
                'content' => '<h2>Shipping Policy</h2><p>Learn about our shipping procedures, timelines, and coverage areas.</p><h3>Shipping Methods</h3><p>We offer multiple shipping options including container and RoRo shipping.</p><h3>Delivery Times</h3><p>Delivery times vary based on origin, destination, and shipping method selected.</p>',
                'meta_description' => 'Information about our shipping methods, timelines, and delivery procedures.',
                'is_published' => true,
                'display_order' => 4,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'about-us',
                'title' => 'About Us',
                'content' => '<h2>About Us</h2><p>We are a leading automotive logistics company specializing in international vehicle procurement and shipping.</p><h3>Our Mission</h3><p>To provide seamless, reliable, and cost-effective vehicle logistics solutions worldwide.</p><h3>Our Team</h3><p>Our experienced team brings decades of expertise in automotive logistics and international trade.</p>',
                'meta_description' => 'Learn about our company, mission, and the team behind our automotive logistics services.',
                'is_published' => true,
                'display_order' => 5,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_pages');
    }
};
