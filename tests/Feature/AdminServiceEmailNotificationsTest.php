<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use App\Http\Controllers\Api\AdminDashboardController;

class AdminServiceEmailNotificationsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('email_templates');
        Schema::create('email_templates', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('subject');
            $table->text('content');
            $table->string('type');
            $table->json('variables')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('email_templates')->insert([
            [
                'name' => 'Procurement Update',
                'slug' => 'procurement-update',
                'subject' => 'Procurement Update - {{service_name}}',
                'content' => '<p>Hello {{customer_name}}</p>',
                'type' => 'general',
                'variables' => json_encode(['customer_name', 'service_name', 'status']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Trucking Update',
                'slug' => 'trucking-update',
                'subject' => 'Trucking Update - {{service_name}}',
                'content' => '<p>Hello {{customer_name}}</p>',
                'type' => 'general',
                'variables' => json_encode(['customer_name', 'service_name', 'status']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        Schema::dropIfExists('procurements');
        Schema::create('procurements', function ($table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_year')->nullable();
            $table->enum('auction_site', ['copart', 'iaai', 'manheim', 'avc', 'dealership'])->default('copart');
            $table->enum('status', ['pending', 'purchased', 'cancelled', 'on_vessel', 'arrived'])->default('pending');
            $table->string('origin_port')->nullable();
            $table->string('origin_country')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('destination_country')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::dropIfExists('truckings');
        Schema::create('truckings', function ($table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_year')->nullable();
            $table->string('auction_site')->nullable();
            $table->string('shipping_type')->nullable();
            $table->string('trucking_fee_status')->nullable();
            $table->string('status')->nullable();
            $table->string('origin_port')->nullable();
            $table->string('origin_country')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('destination_country')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->decimal('profit', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function test_procurement_creation_sends_email_when_customer_email_is_provided(): void
    {
        Mail::fake();

        $controller = new AdminDashboardController();

        $request = Request::create('/api/admin/procurements', 'POST', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '123456789',
            'vehicle_make' => 'Toyota',
            'vehicle_model' => 'Corolla',
            'vehicle_year' => '2022',
            'auction_site' => 'copart',
            'status' => 'pending',
            'origin_port' => 'Houston',
            'origin_country' => 'USA',
            'destination_port' => 'Lagos',
            'destination_country' => 'Nigeria',
            'amount' => 15000,
            'profit' => 2000,
            'notes' => 'Initial record',
            'admin_notes' => 'Review pricing',
            'is_active' => true,
        ]);

        $controller->createProcurement($request);

        Mail::assertSent(function ($mail) {
            return $mail->hasTo('jane@example.com');
        });
    }

    public function test_trucking_status_update_sends_email_when_customer_email_is_provided(): void
    {
        Mail::fake();

        DB::table('truckings')->insert([
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '987654321',
            'vehicle_make' => 'Honda',
            'vehicle_model' => 'Civic',
            'vehicle_year' => '2023',
            'auction_site' => 'copart',
            'shipping_type' => 'container',
            'trucking_fee_status' => 'unpaid',
            'status' => 'pending',
            'origin_port' => 'Houston',
            'origin_country' => 'USA',
            'destination_port' => 'Lagos',
            'destination_country' => 'Nigeria',
            'amount' => 12000,
            'profit' => 1800,
            'notes' => 'Initial trucking',
            'admin_notes' => 'Pending review',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $id = DB::table('truckings')->first()->id;
        $controller = new AdminDashboardController();

        $request = Request::create('/api/admin/truckings/' . $id, 'PUT', [
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '987654321',
            'vehicle_make' => 'Honda',
            'vehicle_model' => 'Civic',
            'vehicle_year' => '2023',
            'auction_site' => 'copart',
            'shipping_type' => 'container',
            'trucking_fee_status' => 'paid',
            'status' => 'arrived',
            'origin_port' => 'Houston',
            'origin_country' => 'USA',
            'destination_port' => 'Lagos',
            'destination_country' => 'Nigeria',
            'amount' => 12000,
            'profit' => 1800,
            'notes' => 'Updated trucking',
            'admin_notes' => 'Review complete',
            'is_active' => true,
        ]);

        $controller->updateTrucking($request, $id);

        Mail::assertSent(function ($mail) {
            return $mail->hasTo('john@example.com');
        });
    }
}
