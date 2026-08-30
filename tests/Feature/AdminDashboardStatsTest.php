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

        foreach (['procurements', 'truckings', 'autosales', 'clearances'] as $table) {
            Schema::dropIfExists($table);
        }

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
}
