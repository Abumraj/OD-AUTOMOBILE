<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class DockReceiptController extends Controller
{
    public function generateReceipt(Request $request, $shipmentId)
    {
        return $this->generateServiceReceipt($request, 'shipments', $shipmentId);
    }

    public function generateProcurementReceipt(Request $request, $recordId)
    {
        return $this->generateServiceReceipt($request, 'procurements', $recordId);
    }

    public function generateTruckingReceipt(Request $request, $recordId)
    {
        return $this->generateServiceReceipt($request, 'truckings', $recordId);
    }

    public function generateClearanceReceipt(Request $request, $recordId)
    {
        return $this->generateServiceReceipt($request, 'clearances', $recordId);
    }

    public function generateServiceReceipt(Request $request, $service, $recordId)
    {
        $validated = $request->validate([
            'stage' => 'required|string|in:pending,auction_won,documentation,shipping,in_transit,customs,delivered',
            'date_received' => 'nullable|date',
            'location_received' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'send_email' => 'nullable|boolean',
            'send_whatsapp' => 'nullable|boolean'
        ]);

        try {
            $serviceTable = $this->resolveServiceTable($service);
            if (!$serviceTable) {
                return response()->json(['error' => 'Unsupported service type'], 422);
            }

            $record = DB::table($serviceTable)
                ->where('id', $recordId)
                ->first();

            if (!$record) {
                return response()->json(['error' => ucfirst($service) . ' record not found'], 404);
            }

            $referenceNumber = $record->reference_number ?? $record->tracking_number ?? ($service . '-' . $record->id);
            $customerName = $record->customer_name ?? $record->client_name ?? 'Customer';
            $customerEmail = $record->customer_email ?? $record->client_email ?? null;
            $customerPhone = $record->customer_phone ?? null;
            $vehicleDescription = $this->getVehicleDescription($record);
            $location = $validated['location_received'] ?? ($record->origin_port ?? $record->location ?? 'N/A');

            if (!empty($record->origin_port) && !empty($record->origin_country)) {
                $location = $record->origin_port . ', ' . $record->origin_country;
            }
            if (empty($location) && !empty($record->destination_port) && !empty($record->destination_country)) {
                $location = $record->destination_port . ', ' . $record->destination_country;
            }

            $receiptNumber = 'ODR-' . date('Y') . '-' . str_pad(DB::table('dock_receipts')->count() + 1, 6, '0', STR_PAD_LEFT);

            $receiptId = DB::table('dock_receipts')->insertGetId([
                'receipt_number' => $receiptNumber,
                'shipment_id' => $service === 'shipments' ? $recordId : null,
                'record_type' => $serviceTable,
                'record_id' => $recordId,
                'stage' => $validated['stage'],
                'customer_name' => $customerName,
                'reference_number' => $referenceNumber,
                'vehicle_description' => $vehicleDescription,
                'date_received' => $validated['date_received'] ?? now()->toDateString(),
                'location_received' => $location,
                'notes' => $validated['notes'] ?? null,
                'generated_by' => 'Admin',
                'generated_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $receipt = DB::table('dock_receipts')->where('id', $receiptId)->first();
            $pdfOutput = null;
            if (!empty($validated['send_email']) || !empty($validated['send_whatsapp'])) {
                $pdfData = [
                    'receipt' => $receipt,
                    'shipment' => $record,
                    'stage_name' => $this->getStageName($receipt->stage),
                    'generated_date' => date('F d, Y', strtotime($receipt->generated_at))
                ];

                $pdf = Pdf::loadView('receipts.dock-receipt', $pdfData);
                $pdf->setPaper('a4', 'portrait');
                $pdfOutput = $pdf->output();
            }

            $emailSent = false;
            if (!empty($validated['send_email']) && $customerEmail) {
                try {
                    Mail::send('emails.dock-receipt-email', [
                        'customer_name' => $customerName,
                        'receipt_number' => $receiptNumber,
                        'reference_number' => $referenceNumber,
                        'stage_name' => $this->getStageName($receipt->stage),
                        'vehicle_description' => $vehicleDescription
                    ], function ($message) use ($customerEmail, $customerName, $receiptNumber, $pdfOutput) {
                        $message->to($customerEmail, $customerName)
                            ->subject("Dock Receipt - {$receiptNumber}")
                            ->attachData($pdfOutput, "dock-receipt-{$receiptNumber}.pdf", [
                                'mime' => 'application/pdf',
                            ]);
                    });

                    $emailSent = true;

                    DB::table('activity_stream')->insert([
                        'action' => 'Dock Receipt Emailed',
                        'description' => "Receipt {$receiptNumber} sent to {$customerEmail}",
                        'location' => 'Admin Dashboard',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send dock receipt email', [
                        'receipt_id' => $receiptId,
                        'customer_email' => $customerEmail,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $whatsappSent = false;
            if (!empty($validated['send_whatsapp']) && $customerPhone) {
                try {
                    $whatsappResult = (new WhatsAppService())->sendDocument(
                        $customerPhone,
                        $pdfOutput ?? null,
                        "dock-receipt-{$receiptNumber}.pdf",
                        "Dock Receipt - {$receiptNumber}",
                        'application/pdf'
                    );
                    $whatsappSent = $whatsappResult['success'] ?? false;
                } catch (\Exception $e) {
                    Log::error('Failed to send dock receipt WhatsApp document', [
                        'receipt_id' => $receiptId,
                        'customer_phone' => $customerPhone,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            DB::table('activity_stream')->insert([
                'action' => 'Dock Receipt Generated',
                'description' => "Receipt {$receiptNumber} generated for {$serviceTable} {$referenceNumber}",
                'location' => 'Admin Dashboard',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'receipt_id' => $receiptId,
                'receipt_number' => $receiptNumber,
                'email_sent' => $emailSent,
                'whatsapp_sent' => $whatsappSent,
                'message' => $emailSent
                    ? 'Dock receipt generated and sent to customer email'
                    : 'Dock receipt generated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate dock receipt', [
                'service' => $service,
                'record_id' => $recordId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to generate dock receipt'], 500);
        }
    }

    public function previewReceipt(Request $request, $shipmentId)
    {
        return $this->previewServiceReceipt($request, 'shipments', $shipmentId);
    }

    public function previewProcurementReceipt(Request $request, $recordId)
    {
        return $this->previewServiceReceipt($request, 'procurements', $recordId);
    }

    public function previewTruckingReceipt(Request $request, $recordId)
    {
        return $this->previewServiceReceipt($request, 'truckings', $recordId);
    }

    public function previewClearanceReceipt(Request $request, $recordId)
    {
        return $this->previewServiceReceipt($request, 'clearances', $recordId);
    }

    public function previewServiceReceipt(Request $request, $service, $recordId)
    {
        $validated = $request->validate([
            'stage' => 'required|string|in:pending,auction_won,documentation,shipping,in_transit,customs,delivered',
            'date_received' => 'nullable|date',
            'location_received' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        try {
            $serviceTable = $this->resolveServiceTable($service);
            if (!$serviceTable) {
                return response()->json(['error' => 'Unsupported service type'], 422);
            }

            $record = DB::table($serviceTable)->where('id', $recordId)->first();
            if (!$record) {
                return response()->json(['error' => ucfirst($service) . ' record not found'], 404);
            }

            $tempReceipt = (object) [
                'receipt_number' => 'PREVIEW',
                'reference_number' => $record->reference_number ?? $record->tracking_number ?? ($service . '-' . $record->id),
                'customer_name' => $record->customer_name ?? $record->client_name ?? 'Customer',
                'vehicle_description' => $this->getVehicleDescription($record),
                'date_received' => $validated['date_received'] ?? now()->toDateString(),
                'location_received' => $validated['location_received'] ?? ($record->origin_port ?? $record->location ?? 'N/A'),
                'notes' => $validated['notes'] ?? null,
                'stage' => $validated['stage'],
                'generated_at' => now()
            ];

            $data = [
                'receipt' => $tempReceipt,
                'shipment' => $record,
                'stage_name' => $this->getStageName($validated['stage']),
                'generated_date' => date('F d, Y')
            ];

            $pdf = Pdf::loadView('receipts.dock-receipt', $data);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->stream('dock-receipt-preview.pdf');
        } catch (\Exception $e) {
            Log::error('Failed to preview dock receipt', [
                'service' => $service,
                'record_id' => $recordId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to preview receipt'], 500);
        }
    }

    public function downloadReceipt($receiptId)
    {
        try {
            $receipt = DB::table('dock_receipts')->where('id', $receiptId)->first();
            if (!$receipt) {
                return response()->json(['error' => 'Receipt not found'], 404);
            }

            $serviceTable = $receipt->record_type ?: 'shipments';
            $record = DB::table($serviceTable)->where('id', $receipt->record_id ?? $receipt->shipment_id)->first();
            $data = [
                'receipt' => $receipt,
                'shipment' => $record,
                'stage_name' => $this->getStageName($receipt->stage),
                'generated_date' => date('F d, Y', strtotime($receipt->generated_at))
            ];

            $pdf = Pdf::loadView('receipts.dock-receipt', $data);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->download("dock-receipt-{$receipt->receipt_number}.pdf");
        } catch (\Exception $e) {
            Log::error('Failed to download dock receipt', [
                'receipt_id' => $receiptId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to download receipt'], 500);
        }
    }

    public function getShipmentReceipts($shipmentId)
    {
        return $this->getServiceReceipts('shipments', $shipmentId);
    }

    public function getProcurementReceipts($recordId)
    {
        return $this->getServiceReceipts('procurements', $recordId);
    }

    public function getTruckingReceipts($recordId)
    {
        return $this->getServiceReceipts('truckings', $recordId);
    }

    public function getClearanceReceipts($recordId)
    {
        return $this->getServiceReceipts('clearances', $recordId);
    }

    public function getServiceReceipts($service, $recordId)
    {
        $serviceTable = $this->resolveServiceTable($service);
        if (!$serviceTable) {
            return response()->json(['error' => 'Unsupported service type'], 422);
        }

        $receipts = DB::table('dock_receipts')
            ->where(function ($query) use ($serviceTable, $recordId) {
                $query->where('record_type', $serviceTable)
                    ->where('record_id', $recordId);
            })
            ->orWhere(function ($query) use ($serviceTable, $recordId) {
                $query->where('record_type', null)->where('shipment_id', $serviceTable === 'shipments' ? $recordId : null);
            })
            ->orderBy('generated_at', 'desc')
            ->get();

        return response()->json($receipts->map(function ($receipt) {
            return [
                'id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'stage' => $receipt->stage,
                'stage_name' => $this->getStageName($receipt->stage),
                'date_received' => $receipt->date_received,
                'location_received' => $receipt->location_received,
                'generated_at' => $receipt->generated_at,
                'generated_by' => $receipt->generated_by
            ];
        }));
    }

    private function getVehicleDescription($record)
    {
        $parts = array_filter([
            $record->year ?? $record->vehicle_year ?? $record->car_year ?? null,
            $record->car_model ?? $record->vehicle_make ?? $record->car_make ?? null,
            $record->vehicle_model ?? $record->car_model ?? null,
            $record->car_color ?? null,
        ]);

        return !empty($parts) ? implode(' ', $parts) : 'Vehicle/Goods';
    }

    private function getStageName($stage)
    {
        $stages = [
            'pending' => 'Pending Processing',
            'auction_won' => 'Auction Won',
            'documentation' => 'Documentation',
            'shipping' => 'Ready for Shipping',
            'in_transit' => 'In Transit',
            'customs' => 'Customs Clearance',
            'delivered' => 'Delivered'
        ];

        return $stages[$stage] ?? ucfirst(str_replace('_', ' ', $stage));
    }

    private function resolveServiceTable($service)
    {
        $allowed = [
            'shipments' => 'shipments',
            'procurements' => 'procurements',
            'truckings' => 'truckings',
            'clearances' => 'clearances',
        ];

        return $allowed[strtolower((string) $service)] ?? null;
    }
}
