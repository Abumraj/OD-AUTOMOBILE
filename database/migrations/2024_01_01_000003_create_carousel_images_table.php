<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carousel_images', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_url');
            $table->string('button_text')->nullable();
            $table->string('button_link')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default carousel image
        DB::table('carousel_images')->insert([
            [
                'title' => 'Premium Automotive Logistics',
                'description' => 'Global vehicle procurement and shipping solutions with unmatched reliability',
                'image_url' => 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&h=1080&fit=crop',
                'button_text' => 'Get Started',
                'button_link' => '/quote',
                'display_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Worldwide Shipping Network',
                'description' => 'Connect to major ports across continents with our extensive logistics network',
                'image_url' => 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&h=1080&fit=crop',
                'button_text' => 'View Services',
                'button_link' => '/services',
                'display_order' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Auction Expertise',
                'description' => 'Access premium vehicles from top auction houses worldwide',
                'image_url' => 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop',
                'button_text' => 'Explore Auctions',
                'button_link' => '/auctions',
                'display_order' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('carousel_images');
    }
};
