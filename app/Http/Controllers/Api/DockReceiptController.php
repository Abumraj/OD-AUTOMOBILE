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
        $validated = $request->validate([
            'stage' => 'required|string|in:pending,auction_won,documentation,shipping,in_transit,customs,delivered',
            'date_received' => 'nullable|date',
            'location_received' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'send_email' => 'nullable|boolean',
            'send_whatsapp' => 'nullable|boolean'
        ]);

        try {
            // Get shipment details with related data
            $shipment = DB::table('shipments')
                ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
                ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
                ->select('shipments.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name')
                ->where('shipments.id', $shipmentId)
                ->first();

            if (!$shipment) {
                return response()->json(['error' => 'Shipment not found'], 404);
            }

            // Generate unique receipt number
            $receiptNumber = 'ODR-' . date('Y') . '-' . str_pad(DB::table('dock_receipts')->count() + 1, 6, '0', STR_PAD_LEFT);

            // Create dock receipt record
            $receiptId = DB::table('dock_receipts')->insertGetId([
                'receipt_number' => $receiptNumber,
                'shipment_id' => $shipmentId,
                'stage' => $validated['stage'],
                'customer_name' => $shipment->customer_name,
                'reference_number' => $shipment->reference_number,
                'vehicle_description' => $this->getVehicleDescription($shipment),
                'date_received' => $validated['date_received'] ?? now()->toDateString(),
                'location_received' => $validated['location_received'] ?? ($shipment->origin_port . ', ' . $shipment->origin_country),
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
                    'shipment' => $shipment,
                    'stage_name' => $this->getStageName($receipt->stage),
                    'generated_date' => date('F d, Y', strtotime($receipt->generated_at))
                ];

                $pdf = Pdf::loadView('receipts.dock-receipt', $pdfData);
                $pdf->setPaper('a4', 'portrait');
                $pdfOutput = $pdf->output();
            }

            // Send email if requested
            $emailSent = false;
            if (!empty($validated['send_email']) && $shipment->customer_email) {
                try {
                    // Send email with PDF attachment
                    Mail::send('emails.dock-receipt-email', [
                        'customer_name' => $shipment->customer_name,
                        'receipt_number' => $receiptNumber,
                        'reference_number' => $shipment->reference_number,
                        'stage_name' => $this->getStageName($receipt->stage),
                        'vehicle_description' => $this->getVehicleDescription($shipment)
                    ], function ($message) use ($shipment, $receiptNumber, $pdfOutput) {
                        $message->to($shipment->customer_email, $shipment->customer_name)
                            ->subject("Dock Receipt - {$receiptNumber}")
                            ->attachData($pdfOutput, "dock-receipt-{$receiptNumber}.pdf", [
                                'mime' => 'application/pdf',
                            ]);
                    });

                    $emailSent = true;

                    // Log email activity
                    DB::table('activity_stream')->insert([
                        'action' => 'Dock Receipt Emailed',
                        'description' => "Receipt {$receiptNumber} sent to {$shipment->customer_email}",
                        'location' => 'Admin Dashboard',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send dock receipt email', [
                        'receipt_id' => $receiptId,
                        'customer_email' => $shipment->customer_email,
                        'error' => $e->getMessage()
                    ]);
                    // Don't fail the whole operation if email fails
                }
            }

            $whatsappSent = false;
            if (!empty($validated['send_whatsapp']) && $shipment->customer_phone) {
                try {
                    $whatsappResult = (new WhatsAppService())->sendDocument(
                        $shipment->customer_phone,
                        $pdfOutput ?? null,
                        "dock-receipt-{$receiptNumber}.pdf",
                        "Dock Receipt - {$receiptNumber}",
                        'application/pdf'
                    );
                    $whatsappSent = $whatsappResult['success'] ?? false;
                } catch (\Exception $e) {
                    Log::error('Failed to send dock receipt WhatsApp document', [
                        'receipt_id' => $receiptId,
                        'customer_phone' => $shipment->customer_phone,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Log activity
            DB::table('activity_stream')->insert([
                'action' => 'Dock Receipt Generated',
                'description' => "Receipt {$receiptNumber} generated for shipment {$shipment->reference_number}",
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
                'shipment_id' => $shipmentId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to generate dock receipt'], 500);
        }
    }

    public function previewReceipt(Request $request, $shipmentId)
    {
        $validated = $request->validate([
            'stage' => 'required|string|in:pending,auction_won,documentation,shipping,in_transit,customs,delivered',
            'date_received' => 'nullable|date',
            'location_received' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        try {
            // Get shipment details with related data
            $shipment = DB::table('shipments')
                ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
                ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
                ->select('shipments.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name')
                ->where('shipments.id', $shipmentId)
                ->first();

            if (!$shipment) {
                return response()->json(['error' => 'Shipment not found'], 404);
            }

            // Create temporary receipt object for preview
            $tempReceipt = (object) [
                'receipt_number' => 'PREVIEW',
                'reference_number' => $shipment->reference_number,
                'customer_name' => $shipment->customer_name,
                'vehicle_description' => $this->getVehicleDescription($shipment),
                'date_received' => $validated['date_received'] ?? now()->toDateString(),
                'location_received' => $validated['location_received'] ?? ($shipment->origin_port . ', ' . $shipment->origin_country),
                'notes' => $validated['notes'] ?? null,
                'stage' => $validated['stage'],
                'generated_at' => now()
            ];

            // Prepare data for PDF
            $data = [
                'receipt' => $tempReceipt,
                'shipment' => $shipment,
                'stage_name' => $this->getStageName($validated['stage']),
                'generated_date' => date('F d, Y')
            ];

            // Generate PDF and return as inline view
            $pdf = Pdf::loadView('receipts.dock-receipt', $data);
            $pdf->setPaper('a4', 'portrait');

            return $pdf->stream('dock-receipt-preview.pdf');
        } catch (\Exception $e) {
            Log::error('Failed to preview dock receipt', [
                'shipment_id' => $shipmentId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to preview receipt'], 500);
        }
    }

    public function downloadReceipt($receiptId)
    {
        try {
            // Get receipt with shipment details
            $receipt = DB::table('dock_receipts')
                ->where('id', $receiptId)
                ->first();

            if (!$receipt) {
                return response()->json(['error' => 'Receipt not found'], 404);
            }

            $shipment = DB::table('shipments')
                ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
                ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
                ->select('shipments.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name')
                ->where('shipments.id', $receipt->shipment_id)
                ->first();

            // Prepare data for PDF
            $data = [
                'receipt' => $receipt,
                'shipment' => $shipment,
                'stage_name' => $this->getStageName($receipt->stage),
                'generated_date' => date('F d, Y', strtotime($receipt->generated_at))
            ];

            // Generate PDF
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
        $receipts = DB::table('dock_receipts')
            ->where('shipment_id', $shipmentId)
            ->orderBy('generated_at', 'desc')
            ->get()
            ->map(function ($receipt) {
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
            });

        return response()->json($receipts);
    }

    private function getVehicleDescription($shipment)
    {
        $parts = array_filter([
            $shipment->year ?? $shipment->vehicle_year,
            $shipment->car_model ?? $shipment->vehicle_make,
            $shipment->vehicle_model,
            $shipment->car_color ? "({$shipment->car_color})" : null
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
}
