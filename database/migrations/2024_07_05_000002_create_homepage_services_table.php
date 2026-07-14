<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homepage_services', function (Blueprint $table) {
            $table->id();
            $table->string('icon');
            $table->string('title');
            $table->text('description');
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default services
        DB::table('homepage_services')->insert([
            [
                'icon' => 'shopping_cart_checkout',
                'title' => 'Procurement',
                'description' => 'Expert sourcing and acquisition of vehicles across international auction markets with verified reporting.',
                'display_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'icon' => 'directions_boat',
                'title' => 'Shipping',
                'description' => 'Global multi-modal transport solutions focusing on security, speed, and cost-effective routing.',
                'display_order' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'icon' => 'assignment_turned_in',
                'title' => 'Port Clearance',
                'description' => 'Navigating complex customs documentation and regulatory requirements with precision and authority.',
                'display_order' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'icon' => 'local_shipping',
                'title' => 'Delivery',
                'description' => 'Last-mile carrier solutions ensuring your asset arrives safely at your doorstep or specified terminal.',
                'display_order' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Add homepage services section settings
        DB::table('settings')->insert([
            [
                'key' => 'homepage_services_title',
                'value' => 'Full-Spectrum Logistics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'homepage_services_subtitle',
                'value' => 'Our Expertise',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'key' => 'homepage_services_description',
                'value' => 'Systematic approach to information density and modern efficiency for every stage of the automotive lifecycle.',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('homepage_services');
        DB::table('settings')->whereIn('key', [
            'homepage_services_title',
            'homepage_services_subtitle',
            'homepage_services_description'
        ])->delete();
    }
};
