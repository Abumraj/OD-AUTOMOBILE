<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminDashboardController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminDashboardStatsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['shipments', 'shipment_updates', 'procurements', 'truckings', 'autosales', 'clearances'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('shipments', function ($table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->string('reference_number')->unique();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('origin_port');
            $table->string('origin_country');
            $table->string('destination_port');
            $table->string('destination_country');
            $table->string('status')->default('pending');
            $table->integer('progress_percentage')->default(0);
            $table->decimal('total_cost', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shipment_updates', function ($table) {
            $table->id();
            $table->unsignedBigInteger('shipment_id');
            $table->string('status');
            $table->text('description');
            $table->timestamp('update_date');
            $table->timestamps();
        });

        Schema::create('procurements', function ($table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('truckings', function ($table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('autosales', function ($table) {
            $table->id();
            $table->string('car_make')->nullable();
            $table->string('car_model')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('clearances', function ($table) {
            $table->id();
            $table->string('item');
            $table->string('client_name');
            $table->decimal('total_paid', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function test_dashboard_stats_include_service_totals_and_overall_profit(): void
    {
        DB::table('procurements')->insert([
            ['customer_name' => 'Client A', 'customer_email' => 'a@example.com', 'amount' => 1200.00, 'profit' => 300.00, 'is_active' => true],
            ['customer_name' => 'Client B', 'customer_email' => 'b@example.com', 'amount' => 800.00, 'profit' => 150.00, 'is_active' => true],
        ]);

        DB::table('truckings')->insert([
            ['customer_name' => 'Client C', 'customer_email' => 'c@example.com', 'amount' => 1500.00, 'profit' => 500.00, 'is_active' => true],
        ]);

        DB::table('autosales')->insert([
            ['car_make' => 'Toyota', 'car_model' => 'Corolla', 'amount' => 6000.00, 'profit' => 900.00, 'is_active' => true],
            ['car_make' => 'Honda', 'car_model' => 'Civic', 'amount' => 2200.00, 'profit' => 350.00, 'is_active' => true],
            ['car_make' => 'BMW', 'car_model' => 'X5', 'amount' => 1800.00, 'profit' => 200.00, 'is_active' => true],
        ]);

        DB::table('clearances')->insert([
            ['item' => 'Vehicle 1', 'client_name' => 'Client D', 'total_paid' => 450.00, 'profit' => 120.00, 'is_active' => true],
            ['item' => 'Vehicle 2', 'client_name' => 'Client E', 'total_paid' => 630.00, 'profit' => 180.00, 'is_active' => true],
        ]);

        $controller = new AdminDashboardController();
        $response = $controller->getStats();
        $payload = json_decode($response->getContent(), true);

        $this->assertSame(2, $payload['procurement_count']);
        $this->assertSame(1, $payload['trucking_count']);
        $this->assertSame(3, $payload['auto_sales_count']);
        $this->assertSame(2, $payload['clearance_count']);
        $this->assertEquals(2900.00, round((float) $payload['site_overall_profit'], 2));
    }

    public function test_create_shipment_uses_unique_reference_numbers_even_when_existing_numbers_are_non_sequential(): void
    {
        DB::table('shipments')->insert([
            ['tracking_number' => 'TRK-EXIST-001', 'reference_number' => 'OD-2026-0001', 'customer_name' => 'Existing One', 'customer_email' => 'one@example.com', 'origin_port' => 'Lagos', 'origin_country' => 'Nigeria', 'destination_port' => 'Rotterdam', 'destination_country' => 'Netherlands', 'status' => 'pending', 'progress_percentage' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tracking_number' => 'TRK-EXIST-002', 'reference_number' => 'OD-2026-0002', 'customer_name' => 'Existing Two', 'customer_email' => 'two@example.com', 'origin_port' => 'Lagos', 'origin_country' => 'Nigeria', 'destination_port' => 'Rotterdam', 'destination_country' => 'Netherlands', 'status' => 'pending', 'progress_percentage' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tracking_number' => 'TRK-EXIST-003', 'reference_number' => 'OD-2026-0003', 'customer_name' => 'Existing Three', 'customer_email' => 'three@example.com', 'origin_port' => 'Lagos', 'origin_country' => 'Nigeria', 'destination_port' => 'Rotterdam', 'destination_country' => 'Netherlands', 'status' => 'pending', 'progress_percentage' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tracking_number' => 'TRK-EXIST-005', 'reference_number' => 'OD-2026-0005', 'customer_name' => 'Existing Five', 'customer_email' => 'five@example.com', 'origin_port' => 'Lagos', 'origin_country' => 'Nigeria', 'destination_port' => 'Rotterdam', 'destination_country' => 'Netherlands', 'status' => 'pending', 'progress_percentage' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = (new AdminDashboardController())->createShipment(new \Illuminate\Http\Request([
            'customer_name' => 'New Client',
            'customer_email' => 'new@example.com',
            'customer_phone' => '1234567890',
            'origin_port' => 'Lagos',
            'origin_country' => 'Nigeria',
            'destination_port' => 'Rotterdam',
            'destination_country' => 'Netherlands',
            'status' => 'pending',
            'total_cost' => 1500.00,
        ]));

        $this->assertSame(200, $response->status());
        $payload = json_decode($response->getContent(), true);
        $this->assertMatchesRegularExpression('/^OD-2026-\d{4}$/', $payload['reference_number']);
        $this->assertNotSame('OD-2026-0005', $payload['reference_number']);
    }
}
