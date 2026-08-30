<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminDashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminProcurementCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

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
            $table->enum('shipping_type', ['container', 'roro'])->default('container');
            $table->enum('trucking_fee_status', ['paid', 'unpaid'])->default('unpaid');
            $table->enum('status', ['pending', 'arrived', 'on_vessel'])->default('pending');
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

    public function test_procurement_crud_flow_is_available(): void
    {
        $controller = new AdminDashboardController();

        $createRequest = Request::create('/api/admin/procurements', 'POST', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '123456789',
            'vehicle_make' => 'Toyota',
            'vehicle_model' => 'Corolla',
            'vehicle_year' => '2022',
            'auction_site' => 'copart',
            'shipping_type' => 'container',
            'trucking_fee_status' => 'unpaid',
            'status' => 'pending',
            'origin_port' => 'Houston',
            'destination_port' => 'Port of Antwerp',
            'amount' => 15000,
            'profit' => 2000,
            'notes' => 'Initial record',
            'admin_notes' => 'Review pricing',
            'is_active' => true,
        ]);

        $createResponse = $controller->createProcurement($createRequest);

        $this->assertSame(200, $createResponse->getStatusCode());
        $this->assertDatabaseHas('procurements', ['customer_name' => 'Jane Doe']);

        $listResponse = $controller->getProcurements(new Request([
            'sort_by' => 'created_at',
            'sort_order' => 'desc',
        ]));

        $records = json_decode($listResponse->getContent(), true);
        $this->assertIsArray($records);
        $this->assertNotEmpty($records);

        $id = DB::table('procurements')->first()->id;

        $updateRequest = Request::create('/api/admin/procurements/' . $id, 'PUT', [
            'customer_name' => 'Jane Updated',
            'customer_email' => 'jane.updated@example.com',
            'customer_phone' => '987654321',
            'vehicle_make' => 'Honda',
            'vehicle_model' => 'Civic',
            'vehicle_year' => '2023',
            'auction_site' => 'iaai',
            'shipping_type' => 'roro',
            'trucking_fee_status' => 'paid',
            'status' => 'arrived',
            'origin_port' => 'Savannah',
            'destination_port' => 'Rotterdam',
            'amount' => 17000,
            'profit' => 2500,
            'notes' => 'Updated',
            'admin_notes' => 'Reviewed',
            'is_active' => true,
        ]);

        $updateResponse = $controller->updateProcurement($updateRequest, $id);
        $this->assertSame(200, $updateResponse->getStatusCode());
        $this->assertDatabaseHas('procurements', ['id' => $id, 'customer_name' => 'Jane Updated']);

        $deleteResponse = $controller->deleteProcurement($id);
        $this->assertSame(200, $deleteResponse->getStatusCode());
        $this->assertDatabaseMissing('procurements', ['id' => $id]);
    }
}
