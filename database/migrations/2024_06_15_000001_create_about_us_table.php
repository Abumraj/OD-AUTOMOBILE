<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('about_us', function (Blueprint $table) {
            $table->id();
            $table->string('section_key')->unique();
            $table->string('title');
            $table->longText('content');
            $table->integer('display_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        // Insert default sections
        DB::table('about_us')->insert([
            [
                'section_key' => 'hero',
                'title' => 'About OD Automotive & Logistics',
                'content' => '<h1>Your Trusted Partner in Global Automotive Logistics</h1><p>OD Automotive & Logistics specializes in comprehensive vehicle procurement, shipping, and logistics solutions worldwide.</p>',
                'display_order' => 1,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'mission',
                'title' => 'Our Mission',
                'content' => '<p>To provide reliable, efficient, and transparent automotive logistics services that exceed our clients\' expectations. We are committed to delivering vehicles safely and on time, anywhere in the world.</p>',
                'display_order' => 2,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'services',
                'title' => 'What We Do',
                'content' => '<ul><li><strong>Auto Auction Services:</strong> Expert bidding at major auction houses including Copart, IAAI, and Manheim</li><li><strong>Global Shipping:</strong> Worldwide vehicle transportation via RoRo and container shipping</li><li><strong>Customs Clearance:</strong> Full documentation and clearance services</li><li><strong>Door-to-Door Delivery:</strong> Complete logistics from purchase to final destination</li></ul>',
                'display_order' => 3,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'expertise',
                'title' => 'Our Expertise',
                'content' => '<p>With years of experience in the automotive logistics industry, we have developed strong partnerships with major shipping lines including Grimaldi and Sallaum Lines. Our team understands the complexities of international vehicle transportation and customs regulations.</p><p>We handle everything from luxury vehicles to commercial fleets, ensuring each shipment receives the attention and care it deserves.</p>',
                'display_order' => 4,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'section_key' => 'why_choose_us',
                'title' => 'Why Choose Us',
                'content' => '<ul><li><strong>Transparency:</strong> Real-time tracking and regular updates throughout the shipping process</li><li><strong>Reliability:</strong> Proven track record of on-time deliveries</li><li><strong>Expertise:</strong> Deep knowledge of international shipping regulations and customs procedures</li><li><strong>Customer Service:</strong> Dedicated support team available to assist you every step of the way</li><li><strong>Competitive Pricing:</strong> Fair and transparent pricing with no hidden fees</li></ul>',
                'display_order' => 5,
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('about_us');
    }
};
