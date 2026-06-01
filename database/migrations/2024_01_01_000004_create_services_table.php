<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('icon');
            $table->text('description');
            $table->string('youtube_video_id')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('service_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->string('feature_text');
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Insert default services
        $procurementId = DB::table('services')->insertGetId([
            'title' => 'Procurement',
            'slug' => 'procurement',
            'icon' => 'shopping_cart_checkout',
            'description' => 'Expert sourcing and acquisition of vehicles across international auction markets with verified reporting.',
            'youtube_video_id' => null,
            'display_order' => 1,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('service_features')->insert([
            ['service_id' => $procurementId, 'feature_text' => 'Access to major US auction houses', 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $procurementId, 'feature_text' => 'Detailed vehicle inspection reports', 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $procurementId, 'feature_text' => 'Competitive bidding strategies', 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $procurementId, 'feature_text' => 'Purchase verification and documentation', 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $shippingId = DB::table('services')->insertGetId([
            'title' => 'Shipping',
            'slug' => 'shipping',
            'icon' => 'directions_boat',
            'description' => 'Global multi-modal transport solutions focusing on security, speed, and cost-effective routing.',
            'youtube_video_id' => null,
            'display_order' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('service_features')->insert([
            ['service_id' => $shippingId, 'feature_text' => 'Container and RoRo shipping options', 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $shippingId, 'feature_text' => 'Insurance coverage included', 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $shippingId, 'feature_text' => 'Real-time tracking systems', 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $shippingId, 'feature_text' => 'Multiple departure ports', 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $clearanceId = DB::table('services')->insertGetId([
            'title' => 'Port Clearance',
            'slug' => 'port-clearance',
            'icon' => 'assignment_turned_in',
            'description' => 'Navigating complex customs documentation and regulatory requirements with precision and authority.',
            'youtube_video_id' => null,
            'display_order' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('service_features')->insert([
            ['service_id' => $clearanceId, 'feature_text' => 'Complete customs documentation', 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $clearanceId, 'feature_text' => 'Import duty calculations', 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $clearanceId, 'feature_text' => 'Regulatory compliance assistance', 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $clearanceId, 'feature_text' => 'Fast-track clearance options', 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $deliveryId = DB::table('services')->insertGetId([
            'title' => 'Delivery',
            'slug' => 'delivery',
            'icon' => 'local_shipping',
            'description' => 'Last-mile carrier solutions ensuring your asset arrives safely at your doorstep or specified terminal.',
            'youtube_video_id' => null,
            'display_order' => 4,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('service_features')->insert([
            ['service_id' => $deliveryId, 'feature_text' => 'Door-to-door delivery service', 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $deliveryId, 'feature_text' => 'Terminal pickup options', 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $deliveryId, 'feature_text' => 'Vehicle condition verification', 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['service_id' => $deliveryId, 'feature_text' => 'Final inspection reports', 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('service_features');
        Schema::dropIfExists('services');
    }
};
