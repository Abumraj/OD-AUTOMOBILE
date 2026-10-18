<?php

namespace App\Console\Commands;

use App\Services\PortalService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Adds (or removes) clearly-fake demo data for the customer portal.
 *
 * Everything the command creates is reachable through the reserved "@demo.test" email
 * domain or the demo customer's id, so `portal:demo clean` removes exactly that and nothing else.
 */
class PortalDemo extends Command
{
    protected $signature = 'portal:demo {action=seed : seed or clean}';

    protected $description = 'Seed or remove demo data for the customer portal (all rows use @demo.test emails)';

    private const DOMAIN = '@demo.test';
    private const PASSWORD = 'Demo@12345';

    /** table => email column used to find demo rows */
    private const EMAIL_COLUMNS = [
        'quotes' => 'email',
        'shipments' => 'customer_email',
        'procurements' => 'customer_email',
        'autosales' => 'customer_email',
        'truckings' => 'customer_email',
        'clearances' => 'client_email',
        'auction_requests' => 'customer_email',
        'invoices' => 'customer_email',
    ];

    public function handle(): int
    {
        return match ($this->argument('action')) {
            'seed' => $this->seed(),
            'clean' => $this->clean(),
            default => $this->failWith('Use "seed" or "clean".'),
        };
    }

    // ------------------------------------------------------------------- helpers

    private function failWith(string $message): int
    {
        $this->error($message);

        return self::FAILURE;
    }

    /** Insert a row, silently dropping columns this database does not have. */
    private function insert(string $table, array $row): int
    {
        static $columns = [];
        $columns[$table] ??= array_flip(Schema::getColumnListing($table));

        $row = array_intersect_key($row, $columns[$table]);
        if (isset($columns[$table]['created_at'])) {
            $row += ['created_at' => now(), 'updated_at' => now()];
        }

        return (int) DB::table($table)->insertGetId($row);
    }

    private function demoCustomerId(): ?int
    {
        $id = DB::table('customers')->where('email', 'demo.owner' . self::DOMAIN)->value('id');

        return $id ? (int) $id : null;
    }

    // ---------------------------------------------------------------------- seed

    private function seed(): int
    {
        if (!Schema::hasTable('customers')) {
            return $this->failWith('Run "php artisan migrate" first; the portal tables are missing.');
        }
        if ($this->demoCustomerId()) {
            return $this->failWith('Demo data already exists. Run "php artisan portal:demo clean" first to reset it.');
        }

        $portal = new PortalService();
        $email = 'demo.owner' . self::DOMAIN;
        $company = 'Demo Motors Ltd';
        $day = fn(int $offset) => now()->addDays($offset);

        DB::beginTransaction();
        try {
            $customerId = $this->insert('customers', [
                'company_name' => $company,
                'contact_name' => 'Ada Demo',
                'email' => $email,
                'phone' => '+2348000000000',
                'address' => '12 Demo Street, Lagos',
                'status' => 'active',
                'registered_via' => 'admin',
                'link_verified' => true,
                'credit_terms_days' => 14,
                'pricing_tier' => 'gold',
                'discount_percent' => 5,
                'approval_threshold' => 20000,
                'admin_notes' => 'DEMO ACCOUNT. Remove with: php artisan portal:demo clean',
            ]);

            $users = [];
            foreach ([['owner', 'Ada Demo', 'demo.owner'], ['finance', 'Femi Finance', 'demo.finance'], ['operations', 'Ola Operations', 'demo.ops']] as [$role, $name, $local]) {
                $users[$role] = $this->insert('customer_users', [
                    'customer_id' => $customerId,
                    'name' => $name,
                    'email' => $local . self::DOMAIN,
                    'phone' => '+2348000000000',
                    'password' => Hash::make(self::PASSWORD),
                    'role' => $role,
                    'is_active' => true,
                ]);
            }

            $common = ['customer_id' => $customerId, 'customer_name' => $company, 'customer_email' => $email, 'customer_phone' => '+2348000000000'];

            // --- shipments (one delayed, one in transit, one delivered) ---
            $shipments = [];
            $shipmentRows = [
                ['DEMO-10001-AUTO', 'DEMO-REF-1', 'Toyota', 'Camry', '2021', 'shipping', 55, $day(-5), null, 'UNPAID', 'Grimaldi', 'GRANDE ANVERSA', 'DEMOVIN0001TOYOTA1'],
                ['DEMO-10002-AUTO', 'DEMO-REF-2', 'Honda', 'Accord', '2020', 'in_transit', 80, $day(12), null, 'PAID', 'MSC', 'MSC ALBANY', 'DEMOVIN0002HONDA02'],
                ['DEMO-10003-AUTO', 'DEMO-REF-3', 'Lexus', 'RX 350', '2019', 'delivered', 100, $day(-20), $day(-18), 'PAID', 'Maersk', 'MAERSK LAGOS', 'DEMOVIN0003LEXUS03'],
            ];
            foreach ($shipmentRows as [$tracking, $reference, $make, $model, $year, $status, $progress, $eta, $arrived, $feeStatus, $line, $vessel, $vin]) {
                $shipments[$tracking] = $this->insert('shipments', $common + [
                    'tracking_number' => $tracking,
                    'reference_number' => $reference,
                    'vehicle_make' => $make,
                    'vehicle_model' => $model,
                    'vehicle_year' => $year,
                    'vehicle_vin' => $vin,
                    'vin' => $vin,
                    'origin_port' => 'Houston',
                    'origin_country' => 'USA',
                    'destination_port' => 'Lagos (Apapa)',
                    'destination_country' => 'Nigeria',
                    'shipping_provider' => $line,
                    'vessel_name' => $vessel,
                    'container_number' => 'DEMU' . random_int(1000000, 9999999),
                    'booking_number' => 'BK' . random_int(100000, 999999),
                    'status' => $status,
                    'progress_percentage' => $progress,
                    'shipping_date' => $day(-40),
                    'departure_date' => $day(-30),
                    'estimated_arrival_date' => $eta,
                    'actual_arrival_date' => $arrived,
                    'delivery_date' => $arrived,
                    'total_cost' => 2400,
                    'shipping_fee' => 1850,
                    'shipping_fee_status' => $feeStatus,
                    'admin_notes' => 'DEMO: never shown to customers',
                    'is_active' => true,
                ]);
            }

            $updates = [
                'DEMO-10001-AUTO' => [['auction_won', 'Copart Houston', 'Vehicle won at auction', -45], ['documentation', 'Houston', 'Title and export documents processed', -38], ['shipping', 'Houston Port', 'Loaded onto vessel GRANDE ANVERSA', -30]],
                'DEMO-10002-AUTO' => [['auction_won', 'IAAI Dallas', 'Vehicle won at auction', -35], ['shipping', 'Houston Port', 'Loaded onto vessel MSC ALBANY', -20], ['in_transit', 'Atlantic Ocean', 'Vessel departed, on schedule', -10]],
                'DEMO-10003-AUTO' => [['shipping', 'Houston Port', 'Loaded onto vessel', -60], ['customs', 'Lagos (Apapa)', 'Customs clearance in progress', -22], ['delivered', 'Lagos', 'Delivered to customer', -18]],
            ];
            foreach ($updates as $tracking => $list) {
                foreach ($list as [$status, $location, $description, $offset]) {
                    $this->insert('shipment_updates', [
                        'shipment_id' => $shipments[$tracking],
                        'status' => $status,
                        'location' => $location,
                        'description' => $description,
                        'update_date' => $day($offset),
                    ]);
                }
            }

            $this->insert('dock_receipts', [
                'receipt_number' => 'DEMO-DR-0001',
                'shipment_id' => $shipments['DEMO-10003-AUTO'],
                'record_type' => 'shipments',
                'record_id' => $shipments['DEMO-10003-AUTO'],
                'stage' => 'delivered',
                'customer_name' => $company,
                'reference_number' => 'DEMO-REF-3',
                'vehicle_description' => '2019 Lexus RX 350',
                'date_received' => $day(-60)->toDateString(),
                'location_received' => 'Houston',
                'generated_by' => 'Demo',
                'generated_at' => now(),
            ]);

            // --- other services ---
            $procurementId = $this->insert('procurements', $common + [
                'vehicle_make' => 'Ford', 'vehicle_model' => 'F-150', 'vehicle_year' => '2021',
                'car_make' => 'Ford', 'car_model' => 'F-150', 'car_year' => '2021',
                'vin' => 'DEMOVIN0004FORD004', 'auction_site' => 'copart', 'shipping_type' => 'container',
                'trucking_fee_status' => 'unpaid', 'status' => 'purchased',
                'origin_port' => 'Houston', 'destination_port' => 'Lagos (Apapa)',
                'amount' => 18500, 'price_usd' => 18500, 'profit' => 1200, 'date_procured' => $day(-35)->toDateString(),
                'admin_notes' => 'DEMO: never shown to customers', 'is_active' => true,
            ]);

            $truckingId = $this->insert('truckings', $common + [
                'vehicle_make' => 'Honda', 'vehicle_model' => 'CR-V', 'vehicle_year' => '2020',
                'vin' => 'DEMOVIN0005HONDA05', 'auction_site' => 'iaai', 'shipping_type' => 'container',
                'trucking_fee_status' => 'unpaid', 'payment_status' => 'Unpaid', 'status' => 'arrived',
                'origin_port' => 'Dallas', 'destination_port' => 'Houston Port',
                'amount' => 450, 'profit' => 90, 'trucking_date' => $day(-12)->toDateString(),
                'location' => 'Houston Port', 'is_active' => true,
            ]);

            $clearanceId = $this->insert('clearances', [
                'customer_id' => $customerId, 'item' => '2019 Lexus RX 350', 'client_name' => $company, 'client_email' => $email,
                'status' => 'cleared', 'date_stamp' => $day(-21)->toDateString(), 'total_paid' => 1200000, 'profit' => 150000, 'is_active' => true,
            ]);

            $autosaleId = $this->insert('autosales', [
                'customer_id' => $customerId, 'customer_name' => $company, 'customer_email' => $email,
                'car_make' => 'Mercedes-Benz', 'car_model' => 'C300', 'car_year' => '2018', 'color' => 'Black',
                'vin' => 'DEMOVIN0006MERC006', 'sale_type' => 'outright', 'shipping_type' => 'container',
                'amount' => 4500000, 'profit' => 300000, 'sale_date' => $day(-8)->toDateString(), 'is_active' => true,
            ]);

            $this->insert('auction_requests', $common + [
                'vehicle_make' => 'BMW', 'vehicle_model' => 'X5', 'vehicle_year' => '2022',
                'max_budget' => 25000, 'additional_requirements' => 'Low mileage, no flood damage', 'status' => 'searching',
            ]);

            $pricedQuote = $this->insert('quotes', [
                'customer_id' => $customerId, 'service' => 'Vehicle shipping', 'vehicle_year' => '2022', 'vehicle_make' => 'Hyundai', 'vehicle_model' => 'Tucson',
                'origin' => 'Houston, TX', 'destination' => 'Lagos', 'customer_name' => $company, 'email' => $email, 'phone' => '+2348000000000',
                'contact_method' => 'portal', 'status' => 'pending', 'quoted_amount' => 3200, 'quote_notes' => 'Container shipping, port-to-port, insurance included.',
            ]);
            $this->insert('quotes', [
                'customer_id' => $customerId, 'service' => 'Trucking', 'vehicle_year' => '2019', 'vehicle_make' => 'Nissan', 'vehicle_model' => 'Rogue',
                'origin' => 'Atlanta, GA', 'destination' => 'Houston, TX', 'customer_name' => $company, 'email' => $email, 'phone' => '+2348000000000',
                'contact_method' => 'portal', 'status' => 'pending',
            ]);

            // --- invoices and payments ---
            $invoices = [];
            $invoiceRows = [
                ['procurements', $procurementId, 'Procurement', 'DEMO-VIN-4', '2021 Ford F-150', 18500, 'USD', -30],
                ['truckings', $truckingId, 'Trucking', 'DEMOVIN0005HONDA05', '2020 Honda CR-V', 450, 'USD', -10],
                ['clearances', $clearanceId, 'Clearance', '2019 Lexus RX 350', '2019 Lexus RX 350', 1200000, 'NGN', -40],
                ['autosales', $autosaleId, 'Autosales', 'DEMOVIN0006MERC006', '2018 Mercedes-Benz C300', 4500000, 'NGN', -3],
            ];
            foreach ($invoiceRows as $index => [$type, $recordId, $label, $reference, $description, $amount, $currency, $issuedOffset]) {
                $invoices[$index] = $this->insert('invoices', [
                    'invoice_number' => 'INV-DEMO-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'record_type' => $type,
                    'record_id' => $recordId,
                    'service_label' => $label,
                    'customer_id' => $customerId,
                    'customer_name' => $company,
                    'customer_email' => $email,
                    'reference_number' => $reference,
                    'description' => "{$label} - {$description}",
                    'amount' => $amount,
                    'currency' => $currency,
                    'date_issued' => $day($issuedOffset)->toDateString(),
                    'due_date' => $day($issuedOffset + 14)->toDateString(),
                    'generated_by' => 'Demo',
                    'generated_at' => now(),
                ]);
            }

            $payment = fn(int $invoice, string $method, float $amount, string $status, string $reference, ?string $note = null) => $this->insert('payments', [
                'receipt_number' => 'PAY-DEMO-' . str_pad((string) (DB::table('payments')->count() + 1), 4, '0', STR_PAD_LEFT),
                'invoice_id' => $invoice,
                'customer_id' => $customerId,
                'submitted_by' => $users['finance'],
                'method' => $method,
                'amount' => $amount,
                'currency' => DB::table('invoices')->where('id', $invoice)->value('currency'),
                'reference' => $reference,
                'note' => $note,
                'status' => $status,
                'reviewed_by' => $status === 'pending' ? null : 'Demo',
                'reviewed_at' => $status === 'pending' ? null : now(),
            ]);

            $payment($invoices[0], 'bank_transfer', 18500, 'confirmed', 'TRF-DEMO-0001');
            $payment($invoices[1], 'bank_transfer', 200, 'confirmed', 'TRF-DEMO-0002');
            $payment($invoices[3], 'bank_transfer', 1000000, 'pending', 'TRF-DEMO-0003', 'Part payment, proof to follow');

            foreach ($invoices as $invoiceId) {
                $portal->recalculateInvoice($invoiceId);
            }

            $this->insert('customer_credit_entries', [
                'customer_id' => $customerId, 'amount' => 150000, 'type' => 'deposit',
                'description' => 'Demo deposit received', 'created_by' => 'Demo',
            ]);
            $portal->refreshCreditBalance($customerId);

            // --- requests, support, documents ---
            $this->insert('portal_requests', [
                'customer_id' => $customerId, 'requested_by' => $users['operations'], 'type' => 'auction',
                'payload' => json_encode(['type' => 'auction', 'vehicle_year' => '2023', 'vehicle_make' => 'Audi', 'vehicle_model' => 'Q7', 'max_budget' => 30000, 'notes' => 'Demo request above the approval threshold']),
                'estimated_value' => 30000, 'status' => 'awaiting_approval',
            ]);

            $ticketId = $this->insert('support_tickets', [
                'ticket_number' => 'TKT-DEMO0001',
                'customer_id' => $customerId, 'opened_by' => $users['operations'],
                'record_type' => 'shipments', 'record_id' => $shipments['DEMO-10001-AUTO'],
                'subject' => 'When will the Camry arrive?', 'status' => 'open', 'last_message_at' => now(),
            ]);
            $this->insert('support_ticket_messages', [
                'ticket_id' => $ticketId, 'sender_type' => 'customer', 'sender_name' => 'Ola Operations',
                'body' => 'The ETA has passed. Can you confirm the new arrival date?',
            ]);

            $path = "portal/documents/{$customerId}/demo-bill-of-lading.pdf";
            Storage::disk('local')->put($path, "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
            $this->insert('customer_documents', [
                'customer_id' => $customerId, 'uploaded_by_admin' => 'Demo', 'record_type' => 'shipments',
                'record_id' => $shipments['DEMO-10002-AUTO'], 'category' => 'bill_of_lading', 'title' => 'Bill of lading (demo)',
                'path' => $path, 'mime' => 'application/pdf', 'size' => Storage::disk('local')->size($path), 'visible_to_customer' => true,
            ]);

            if (Schema::hasTable('service_receipts')) {
                $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
                foreach ([
                    ['shipments', $shipments['DEMO-10003-AUTO'], 'admin', 'Demo', 'sales-receipt-lexus-rx350.pdf'],
                    ['procurements', $procurementId, 'customer', 'Ada Demo', 'sales-receipt-ford-f150.pdf'],
                ] as [$table, $recordId, $byType, $byName, $name]) {
                    $receiptPath = "receipts/{$table}/{$recordId}/{$name}";
                    Storage::disk('local')->put($receiptPath, $pdf);
                    $this->insert('service_receipts', [
                        'record_type' => $table, 'record_id' => $recordId, 'uploaded_by_type' => $byType, 'uploaded_by_name' => $byName,
                        'original_name' => $name, 'path' => $receiptPath, 'mime' => 'application/pdf', 'size' => strlen($pdf),
                    ]);
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->failWith('Seeding failed and was rolled back: ' . $e->getMessage());
        }

        $this->info('Demo data created.');
        $this->table(['Role', 'Email', 'Password'], [
            ['owner', 'demo.owner' . self::DOMAIN, self::PASSWORD],
            ['finance', 'demo.finance' . self::DOMAIN, self::PASSWORD],
            ['operations', 'demo.ops' . self::DOMAIN, self::PASSWORD],
        ]);
        $this->line('Sign in at /portal/login. Remove everything with: php artisan portal:demo clean');

        return self::SUCCESS;
    }

    // --------------------------------------------------------------------- clean

    private function clean(): int
    {
        $customerId = $this->demoCustomerId();
        $removed = [];

        DB::beginTransaction();
        try {
            $invoiceIds = DB::table('invoices')
                ->where(function ($query) use ($customerId) {
                    $query->where('customer_email', 'like', '%' . self::DOMAIN);
                    if ($customerId) {
                        $query->orWhere('customer_id', $customerId);
                    }
                })->pluck('id')->all();

            $shipmentIds = DB::table('shipments')
                ->where(function ($query) use ($customerId) {
                    $query->where('customer_email', 'like', '%' . self::DOMAIN);
                    if ($customerId) {
                        $query->orWhere('customer_id', $customerId);
                    }
                })->pluck('id')->all();

            if ($invoiceIds) {
                $removed['payments'] = DB::table('payments')->whereIn('invoice_id', $invoiceIds)->delete();
            }
            if ($shipmentIds) {
                $removed['shipment_updates'] = DB::table('shipment_updates')->whereIn('shipment_id', $shipmentIds)->delete();
                $removed['dock_receipts'] = DB::table('dock_receipts')->whereIn('shipment_id', $shipmentIds)->delete();
            }

            if (Schema::hasTable('service_receipts')) {
                $receipts = app(\App\Services\ReceiptService::class);
                foreach (self::EMAIL_COLUMNS as $table => $column) {
                    if ($table === 'invoices' || !Schema::hasTable($table)) {
                        continue;
                    }
                    $ids = DB::table($table)->where(function ($query) use ($column, $customerId, $table) {
                        $query->where($column, 'like', '%' . self::DOMAIN);
                        if ($customerId && Schema::hasColumn($table, 'customer_id')) {
                            $query->orWhere('customer_id', $customerId);
                        }
                    })->pluck('id');
                    foreach ($ids as $recordId) {
                        $receipts->deleteForRecord($table, (int) $recordId);
                    }
                }
            }

            foreach (self::EMAIL_COLUMNS as $table => $column) {
                if (!Schema::hasTable($table)) {
                    continue;
                }
                $count = DB::table($table)->where(function ($query) use ($column, $customerId, $table) {
                    $query->where($column, 'like', '%' . self::DOMAIN);
                    if ($customerId && Schema::hasColumn($table, 'customer_id')) {
                        $query->orWhere('customer_id', $customerId);
                    }
                })->delete();
                if ($count) {
                    $removed[$table] = $count;
                }
            }

            if ($customerId) {
                $files = DB::table('customer_documents')->where('customer_id', $customerId)->pluck('path')->all();
                $paymentProofs = [];
                Storage::disk('local')->delete(array_merge($files, $paymentProofs));
                Storage::disk('local')->deleteDirectory("portal/documents/{$customerId}");
                Storage::disk('local')->deleteDirectory("portal/payments/{$customerId}");

                // Child tables cascade from customers; this also removes team members, tickets, documents.
                DB::table('payments')->where('customer_id', $customerId)->delete();
                $removed['customers'] = DB::table('customers')->where('id', $customerId)->delete();
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return $this->failWith('Cleanup failed and was rolled back: ' . $e->getMessage());
        }

        if (!$removed) {
            $this->info('No demo data found.');
        } else {
            $this->info('Demo data removed:');
            foreach ($removed as $table => $count) {
                $this->line("  {$table}: {$count}");
            }
        }

        return self::SUCCESS;
    }
}
