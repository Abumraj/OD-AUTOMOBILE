<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class ShipmentImportExportController extends Controller
{
    public function importExcel(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Remove header row
            $headers = array_shift($rows);

            $imported = 0;
            $errors = [];
            $shippingTypes = DB::table('shipping_types')->pluck('id', 'code')->toArray();
            $shippingLines = DB::table('shipping_lines')->pluck('id', 'code')->toArray();

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +2 because we removed header and Excel is 1-indexed

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    // Map Excel columns to database fields
                    $carModel = $row[0] ?? null; // CAR MODEL
                    $year = $row[1] ?? null; // YEAR
                    $carColor = $row[2] ?? null; // CAR COLOR
                    $imageLink = $row[3] ?? null; // IMAGE LINK
                    $vin = $row[4] ?? null; // VIN
                    $shippingTypeCode = strtoupper(trim($row[5] ?? '')); // S/TYPE
                    $shippingLineCode = strtoupper(trim($row[6] ?? '')); // SHIPPING LINE
                    $eta = $row[7] ?? null; // ETA
                    $clientName = $row[8] ?? null; // CLIENT NAME
                    $status = strtolower(trim($row[9] ?? 'pending')); // STATUS
                    $shipmentNumber = $row[10] ?? null; // SHIPMENT #

                    // Validate required fields
                    if (empty($carModel) || empty($vin)) {
                        $errors[] = "Row {$rowNumber}: Car Model and VIN are required";
                        continue;
                    }

                    // Get shipping type ID
                    $shippingTypeId = null;
                    if (!empty($shippingTypeCode)) {
                        $shippingTypeId = $shippingTypes[$shippingTypeCode] ?? null;
                        if (!$shippingTypeId) {
                            // Create new shipping type if not exists
                            $shippingTypeId = DB::table('shipping_types')->insertGetId([
                                'name' => ucfirst(strtolower($shippingTypeCode)),
                                'code' => $shippingTypeCode,
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $shippingTypes[$shippingTypeCode] = $shippingTypeId;
                        }
                    }

                    // Get shipping line ID
                    $shippingLineId = null;
                    if (!empty($shippingLineCode)) {
                        $shippingLineId = $shippingLines[$shippingLineCode] ?? null;
                        if (!$shippingLineId) {
                            // Create new shipping line if not exists
                            $shippingLineId = DB::table('shipping_lines')->insertGetId([
                                'name' => ucfirst(strtolower($shippingLineCode)),
                                'code' => $shippingLineCode,
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $shippingLines[$shippingLineCode] = $shippingLineId;
                        }
                    }

                    // Parse ETA date
                    $etaDate = null;
                    if (!empty($eta)) {
                        try {
                            if (is_numeric($eta)) {
                                // Excel date serial number
                                $etaDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($eta)->format('Y-m-d');
                            } else {
                                $etaDate = date('Y-m-d', strtotime($eta));
                            }
                        } catch (\Exception $e) {
                            $etaDate = null;
                        }
                    }

                    // Generate tracking and reference numbers if not provided
                    $trackingNumber = 'TRK-' . strtoupper(substr(md5(uniqid()), 0, 10));
                    $referenceNumber = $shipmentNumber ?? ('OD-' . date('Y') . '-' . str_pad(DB::table('shipments')->count() + 1, 4, '0', STR_PAD_LEFT));

                    // Map status to our system
                    $validStatuses = ['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered', 'cancelled'];
                    if (!in_array($status, $validStatuses)) {
                        // Default mapping for common statuses
                        $statusMap = [
                            'on vessel' => 'in_transit',
                            'vessel' => 'in_transit',
                            'shipped' => 'shipping',
                            'complete' => 'delivered',
                            'completed' => 'delivered',
                        ];
                        $status = $statusMap[$status] ?? 'pending';
                    }

                    // Calculate progress percentage
                    $progressMap = [
                        'pending' => 10,
                        'auction_won' => 20,
                        'documentation' => 30,
                        'shipping' => 50,
                        'in_transit' => 70,
                        'customs' => 85,
                        'delivered' => 100,
                        'cancelled' => 0,
                    ];
                    $progressPercentage = $progressMap[$status] ?? 10;

                    // Insert shipment
                    $shipmentId = DB::table('shipments')->insertGetId([
                        'tracking_number' => $trackingNumber,
                        'reference_number' => $referenceNumber,
                        'customer_name' => $clientName ?? 'N/A',
                        'customer_email' => 'noreply@odlogistic.com',
                        'customer_phone' => null,
                        'origin_port' => 'N/A',
                        'origin_country' => 'N/A',
                        'destination_port' => 'N/A',
                        'destination_country' => 'N/A',
                        'vehicle_make' => $carModel,
                        'vehicle_model' => $carModel,
                        'car_model' => $carModel,
                        'year' => $year,
                        'car_color' => $carColor,
                        'image_link' => $imageLink,
                        'vin' => $vin,
                        'shipping_type_id' => $shippingTypeId,
                        'shipping_line_id' => $shippingLineId,
                        'eta' => $etaDate,
                        'client_name' => $clientName,
                        'status' => $status,
                        'progress_percentage' => $progressPercentage,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Create initial shipment update
                    DB::table('shipment_updates')->insert([
                        'shipment_id' => $shipmentId,
                        'status' => $status,
                        'description' => 'Shipment imported from Excel',
                        'update_date' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$rowNumber}: " . $e->getMessage();
                }
            }

            return response()->json([
                'message' => "Import completed. {$imported} shipments imported successfully.",
                'imported' => $imported,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportExcel(Request $request)
    {
        try {
            $query = DB::table('shipments')
                ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
                ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
                ->select(
                    'shipments.car_model',
                    'shipments.year',
                    'shipments.car_color',
                    'shipments.image_link',
                    'shipments.vin',
                    'shipping_types.code as shipping_type',
                    'shipping_lines.code as shipping_line',
                    'shipments.eta',
                    'shipments.client_name',
                    'shipments.status',
                    'shipments.reference_number'
                )
                ->orderBy('shipments.created_at', 'desc');

            // Apply filters if provided
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('shipments.status', $request->status);
            }

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('shipments.tracking_number', 'like', "%{$search}%")
                        ->orWhere('shipments.reference_number', 'like', "%{$search}%")
                        ->orWhere('shipments.vin', 'like', "%{$search}%")
                        ->orWhere('shipments.car_model', 'like', "%{$search}%");
                });
            }

            $shipments = $query->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $headers = ['CAR MODEL', 'YEAR', 'CAR COLOR', 'IMAGE LINK', 'VIN', 'S/TYPE', 'SHIPPING LINE', 'ETA', 'CLIENT NAME', 'STATUS', 'SHIPMENT #'];
            $sheet->fromArray($headers, null, 'A1');

            // Style header row
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ];
            $sheet->getStyle('A1:K1')->applyFromArray($headerStyle);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(20);
            $sheet->getColumnDimension('B')->setWidth(10);
            $sheet->getColumnDimension('C')->setWidth(12);
            $sheet->getColumnDimension('D')->setWidth(40);
            $sheet->getColumnDimension('E')->setWidth(20);
            $sheet->getColumnDimension('F')->setWidth(15);
            $sheet->getColumnDimension('G')->setWidth(18);
            $sheet->getColumnDimension('H')->setWidth(12);
            $sheet->getColumnDimension('I')->setWidth(20);
            $sheet->getColumnDimension('J')->setWidth(15);
            $sheet->getColumnDimension('K')->setWidth(15);

            // Add data
            $row = 2;
            foreach ($shipments as $shipment) {
                $sheet->setCellValue('A' . $row, $shipment->car_model);
                $sheet->setCellValue('B' . $row, $shipment->year);
                $sheet->setCellValue('C' . $row, $shipment->car_color);
                $sheet->setCellValue('D' . $row, $shipment->image_link);
                $sheet->setCellValue('E' . $row, $shipment->vin);
                $sheet->setCellValue('F' . $row, $shipment->shipping_type);
                $sheet->setCellValue('G' . $row, $shipment->shipping_line);
                $sheet->setCellValue('H' . $row, $shipment->eta ? date('d/m/Y', strtotime($shipment->eta)) : '');
                $sheet->setCellValue('I' . $row, $shipment->client_name);
                $sheet->setCellValue('J' . $row, strtoupper($shipment->status));
                $sheet->setCellValue('K' . $row, $shipment->reference_number);

                // Apply borders to data rows
                $sheet->getStyle('A' . $row . ':K' . $row)->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                ]);

                $row++;
            }

            // Create writer and save to temp file
            $writer = new Xlsx($spreadsheet);
            $filename = 'shipments_export_' . date('Y-m-d_His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'shipments_');
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error exporting file: ' . $e->getMessage()
            ], 500);
        }
    }
}
