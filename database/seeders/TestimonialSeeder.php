<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'quote' => 'OD Logistics made importing my BMW X5 completely seamless. From auction to delivery at my Lagos home, everything was professional and transparent.',
                'customer_name' => 'John Smith',
                'location' => 'Lagos, Nigeria',
                'company' => 'J.S. Holdings Ltd',
                'rating' => 5,
                'is_featured' => true,
                'is_approved' => true,
                'shipment_id' => 1,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ],
            [
                'quote' => 'I was nervous about buying a Tesla from overseas, but their team handled all the battery transport paperwork. The car arrived in perfect condition!',
                'customer_name' => 'Elena Rodriguez',
                'location' => 'Abuja, Nigeria',
                'company' => null,
                'rating' => 5,
                'is_featured' => true,
                'is_approved' => true,
                'shipment_id' => 2,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3)
            ],
            [
                'quote' => 'The customs clearance process was the part I dreaded most. They handled everything and kept me updated daily. Highly recommend!',
                'customer_name' => 'Marcus Thorne',
                'location' => 'Port Harcourt, Nigeria',
                'company' => 'Thorne Enterprises',
                'rating' => 5,
                'is_featured' => false,
                'is_approved' => true,
                'shipment_id' => 3,
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(8)
            ],
            [
                'quote' => 'Excellent service from start to finish. My Porsche 911 arrived exactly as described, and the enclosed container kept it pristine.',
                'customer_name' => 'David Chen',
                'location' => 'Lagos, Nigeria',
                'company' => 'Chen Global Trading',
                'rating' => 5,
                'is_featured' => true,
                'is_approved' => true,
                'shipment_id' => 4,
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(15)
            ],
            [
                'quote' => 'Good service overall, but there was a slight delay in customs. The team communicated well though and resolved it quickly.',
                'customer_name' => 'Sarah Jenkins',
                'location' => 'Abuja, Nigeria',
                'company' => null,
                'rating' => 4,
                'is_featured' => false,
                'is_approved' => true,
                'shipment_id' => 5,
                'created_at' => now()->subDays(12),
                'updated_at' => now()->subDays(12)
            ],
            [
                'quote' => 'Still waiting for my Audi Q7 shipment to depart. The quote process was smooth, hoping the rest is too.',
                'customer_name' => 'Liam Wilson',
                'location' => 'Lagos, Nigeria',
                'company' => null,
                'rating' => 4,
                'is_featured' => false,
                'is_approved' => false,
                'shipment_id' => 6,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3)
            ],
            [
                'quote' => 'Fantastic auction procurement service. Got my Mercedes GLE below market value and it arrived sooner than expected.',
                'customer_name' => 'Amara Okafor',
                'location' => 'Lagos, Nigeria',
                'company' => 'Okafor Motors',
                'rating' => 5,
                'is_featured' => true,
                'is_approved' => true,
                'shipment_id' => 7,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]
        ];

        foreach ($testimonials as $testimonial) {
            DB::table('testimonials')->insert($testimonial);
        }
    }
}
