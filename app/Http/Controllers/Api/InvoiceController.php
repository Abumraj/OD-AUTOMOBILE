<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    // Invoices cover every service except shipments, which use the dock receipt instead.
    public function generateProcurementInvoice(Request $request, $recordId)
    {
        return $this->generateServiceInvoice($request, 'procurements', $recordId);
    }

    public function generateAutosalesInvoice(Request $request, $recordId)
    {
        return $this->generateServiceInvoice($request, 'autosales', $recordId);
    }

    public function generateTruckingInvoice(Request $request, $recordId)
    {
        return $this->generateServiceInvoice($request, 'truckings', $recordId);
    }

    public function generateClearanceInvoice(Request $request, $recordId)
    {
        return $this->generateServiceInvoice($request, 'clearances', $recordId);
    }

    public function generateServiceInvoice(Request $request, $service, $recordId)
    {
        $validated = $request->validate([
            'date_issued' => 'nullable|date',
            'notes' => 'nullable|string',
            'send_email' => 'nullable|boolean',
        ]);

        try {
            $config = $this->resolveServiceConfig($service);
            if (!$config) {
                return response()->json(['error' => 'Unsupported service type'], 422);
            }

            $record = DB::table($config['table'])->where('id', $recordId)->first();
            if (!$record) {
                return response()->json(['error' => ucfirst($service) . ' record not found'], 404);
            }

            $lineItem = $this->buildLineItem($record, $config);

            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad(DB::table('invoices')->count() + 1, 6, '0', STR_PAD_LEFT);

            $invoiceId = DB::table('invoices')->insertGetId([
                'invoice_number' => $invoiceNumber,
                'record_type' => $config['table'],
                'record_id' => $recordId,
                'service_label' => $config['label'],
                'customer_name' => $lineItem['customer_name'],
                'customer_email' => $lineItem['customer_email'],
                'customer_phone' => $lineItem['customer_phone'],
                'reference_number' => $lineItem['reference_number'],
                'description' => $lineItem['description'],
                'amount' => $lineItem['amount'],
                'currency' => $lineItem['currency'],
                'date_issued' => $validated['date_issued'] ?? now()->toDateString(),
                'notes' => $validated['notes'] ?? null,
                'generated_by' => 'Admin',
                'generated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $invoice = DB::table('invoices')->where('id', $invoiceId)->first();

            $pdfOutput = null;
            $emailSent = false;
            if (!empty($validated['send_email']) && $lineItem['customer_email']) {
                $pdf = Pdf::loadView('invoices.invoice', ['invoice' => $invoice]);
                $pdf->setPaper('a4', 'portrait');
                $pdfOutput = $pdf->output();

                try {
                    Mail::send('emails.invoice-email', [
                        'customer_name' => $lineItem['customer_name'],
                        'invoice_number' => $invoiceNumber,
                        'reference_number' => $lineItem['reference_number'],
                        'description' => $lineItem['description'],
                    ], function ($message) use ($lineItem, $invoiceNumber, $pdfOutput) {
                        $message->to($lineItem['customer_email'], $lineItem['customer_name'])
                            ->subject("Invoice - {$invoiceNumber}")
                            ->attachData($pdfOutput, "invoice-{$invoiceNumber}.pdf", [
                                'mime' => 'application/pdf',
                            ]);
                    });

                    $emailSent = true;

                    DB::table('activity_stream')->insert([
                        'action' => 'Invoice Emailed',
                        'description' => "Invoice {$invoiceNumber} sent to {$lineItem['customer_email']}",
                        'location' => 'Admin Dashboard',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send invoice email', [
                        'invoice_id' => $invoiceId,
                        'customer_email' => $lineItem['customer_email'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::table('activity_stream')->insert([
                'action' => 'Invoice Generated',
                'description' => "Invoice {$invoiceNumber} generated for {$config['label']} {$lineItem['reference_number']}",
                'location' => 'Admin Dashboard',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'email_sent' => $emailSent,
                'message' => $emailSent
                    ? 'Invoice generated and sent to customer email'
                    : 'Invoice generated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate invoice', [
                'service' => $service,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to generate invoice'], 500);
        }
    }

    public function previewProcurementInvoice(Request $request, $recordId)
    {
        return $this->previewServiceInvoice($request, 'procurements', $recordId);
    }

    public function previewAutosalesInvoice(Request $request, $recordId)
    {
        return $this->previewServiceInvoice($request, 'autosales', $recordId);
    }

    public function previewTruckingInvoice(Request $request, $recordId)
    {
        return $this->previewServiceInvoice($request, 'truckings', $recordId);
    }

    public function previewClearanceInvoice(Request $request, $recordId)
    {
        return $this->previewServiceInvoice($request, 'clearances', $recordId);
    }

    public function previewServiceInvoice(Request $request, $service, $recordId)
    {
        $validated = $request->validate([
            'date_issued' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        try {
            $config = $this->resolveServiceConfig($service);
            if (!$config) {
                return response()->json(['error' => 'Unsupported service type'], 422);
            }

            $record = DB::table($config['table'])->where('id', $recordId)->first();
            if (!$record) {
                return response()->json(['error' => ucfirst($service) . ' record not found'], 404);
            }

            $lineItem = $this->buildLineItem($record, $config);

            $invoice = (object) array_merge($lineItem, [
                'invoice_number' => 'PREVIEW',
                'date_issued' => $validated['date_issued'] ?? now()->toDateString(),
                'notes' => $validated['notes'] ?? null,
                'generated_at' => now(),
            ]);

            $pdf = Pdf::loadView('invoices.invoice', ['invoice' => $invoice]);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->stream('invoice-preview.pdf');
        } catch (\Exception $e) {
            Log::error('Failed to preview invoice', [
                'service' => $service,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to preview invoice'], 500);
        }
    }

    public function downloadInvoice($invoiceId)
    {
        try {
            $invoice = DB::table('invoices')->where('id', $invoiceId)->first();
            if (!$invoice) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            $pdf = Pdf::loadView('invoices.invoice', ['invoice' => $invoice]);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
        } catch (\Exception $e) {
            Log::error('Failed to download invoice', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to download invoice'], 500);
        }
    }

    public function getProcurementInvoices($recordId)
    {
        return $this->getServiceInvoices('procurements', $recordId);
    }

    public function getAutosalesInvoices($recordId)
    {
        return $this->getServiceInvoices('autosales', $recordId);
    }

    public function getTruckingInvoices($recordId)
    {
        return $this->getServiceInvoices('truckings', $recordId);
    }

    public function getClearanceInvoices($recordId)
    {
        return $this->getServiceInvoices('clearances', $recordId);
    }

    public function getServiceInvoices($service, $recordId)
    {
        $config = $this->resolveServiceConfig($service);
        if (!$config) {
            return response()->json(['error' => 'Unsupported service type'], 422);
        }

        $invoices = DB::table('invoices')
            ->where('record_type', $config['table'])
            ->where('record_id', $recordId)
            ->orderBy('generated_at', 'desc')
            ->get();

        return response()->json($invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'amount' => (float) $invoice->amount,
                'currency' => $invoice->currency,
                'date_issued' => $invoice->date_issued,
                'generated_at' => $invoice->generated_at,
                'generated_by' => $invoice->generated_by,
            ];
        }));
    }

    // Note: profit columns are intentionally never read here — invoices show what the
    // customer is billed, not the margin on the deal.
    private function buildLineItem($record, $config)
    {
        $amount = (float) ($record->{$config['amount']} ?? 0);

        return [
            'customer_name' => $record->customer_name ?? $record->client_name ?? 'Customer',
            'customer_email' => $record->customer_email ?? $record->client_email ?? null,
            'customer_phone' => $record->customer_phone ?? null,
            'reference_number' => $record->reference_number ?? $record->vin ?? ($config['table'] . '-' . $record->id),
            'description' => $this->getDescription($record, $config),
            'amount' => $amount,
            'currency' => $config['currency'],
        ];
    }

    private function getDescription($record, $config)
    {
        $parts = array_filter([
            $record->vehicle_year ?? $record->car_year ?? null,
            $record->vehicle_make ?? $record->car_make ?? null,
            $record->vehicle_model ?? $record->car_model ?? null,
        ]);

        if (!empty($parts)) {
            return $config['label'] . ' — ' . implode(' ', $parts);
        }

        if (!empty($record->item)) {
            return $config['label'] . ' — ' . $record->item;
        }

        return $config['label'] . ' Service';
    }

    private function resolveServiceConfig($service)
    {
        $allowed = [
            'procurements' => ['table' => 'procurements', 'label' => 'Procurement', 'amount' => 'price_usd', 'currency' => 'USD'],
            'autosales' => ['table' => 'autosales', 'label' => 'Autosales', 'amount' => 'amount', 'currency' => 'NGN'],
            'truckings' => ['table' => 'truckings', 'label' => 'Trucking', 'amount' => 'amount', 'currency' => 'USD'],
            'clearances' => ['table' => 'clearances', 'label' => 'Clearance', 'amount' => 'total_paid', 'currency' => 'NGN'],
        ];

        return $allowed[strtolower((string) $service)] ?? null;
    }
}
