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
    private function parseSpreadsheetAmount($value): float
    {
        $normalized = preg_replace('/[^0-9.\-]/', '', (string) $value);

        return is_numeric($normalized) ? (float) $normalized : 0.0;
    }

    private function parseSpreadsheetDate($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
            }

            $dateValue = trim((string) $value);
            if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $dateValue)) {
                $date = \DateTime::createFromFormat('!d/m/Y', $dateValue);

                return $date ? $date->format('Y-m-d') : null;
            }

            $timestamp = strtotime($dateValue);

            return $timestamp === false ? null : date('Y-m-d', $timestamp);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function spreadsheetRowValue(array $row, array $headerMap, string ...$headers)
    {
        foreach ($headers as $header) {
            if (array_key_exists($header, $headerMap)) {
                return $row[$headerMap[$header]] ?? null;
            }
        }

        return null;
    }

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

    public function importAutosales(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()->all()], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
            $headers = array_shift($rows);
            $headerMap = [];
            foreach ($headers as $column => $header) {
                $headerMap[preg_replace('/[^a-z0-9]/', '', strtolower((string) $header))] = $column;
            }

            $imported = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    $saleDate = $this->parseSpreadsheetDate($this->spreadsheetRowValue($row, $headerMap, 'date', 'saledate'));
                    $carMake = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmake', 'carmaker'));
                    $carModel = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmodel'));
                    $carYear = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'year', 'caryear'));
                    $saleType = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'saletype', 'saletype') ?? 'outright')));
                    $color = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'color'));
                    $vin = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'vin'));
                    $amount = $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'amount', 'priceusd', 'price'));
                    $profit = $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'profit', 'profitngn'));

                    if ($carMake === '' || $carModel === '') {
                        $errors[] = 'Row ' . ($index + 2) . ': car make and model are required';
                        continue;
                    }

                    if (!in_array($saleType, ['outright', 'swap'], true)) {
                        $saleType = 'outright';
                    }

                    DB::table('autosales')->insert([
                        'sale_date' => $saleDate,
                        'car_make' => $carMake,
                        'car_model' => $carModel,
                        'car_year' => $carYear ?: null,
                        'sale_type' => $saleType,
                        'color' => $color ?: null,
                        'vin' => $vin ?: null,
                        'amount' => $amount,
                        'profit' => $profit,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = 'Row ' . ($index + 2) . ': ' . $e->getMessage();
                }
            }

            return response()->json([
                'message' => 'Autosales import completed.',
                'imported' => $imported,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing file: ' . $e->getMessage(),
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function exportAutosales(Request $request)
    {
        try {
            $records = DB::table('autosales')
                ->select(
                    'sale_date',
                    'car_make',
                    'car_model',
                    'car_year',
                    'sale_type',
                    'color',
                    'vin',
                    'amount',
                    'profit',
                    'created_at'
                )
                ->orderBy('created_at', 'desc')
                ->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $headers = ['DATE', 'CAR MAKE', 'CAR MODEL', 'YEAR', 'SALE TYPE', 'COLOR', 'VIN', 'AMOUNT', 'PROFIT', 'CREATED AT'];
            $sheet->fromArray($headers, null, 'A1');
            $sheet->getStyle('A1:J1')->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);

            $row = 2;
            foreach ($records as $record) {
                $sheet->fromArray([
                    $record->sale_date,
                    $record->car_make,
                    $record->car_model,
                    $record->car_year,
                    $record->sale_type,
                    $record->color,
                    $record->vin,
                    $record->amount,
                    $record->profit,
                    $record->created_at,
                ], null, 'A' . $row);
                $row++;
            }

            $writer = new Xlsx($spreadsheet);
            $filename = 'autosales_export_' . date('Y-m-d_His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'autosales_');
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error exporting file: ' . $e->getMessage()], 500);
        }
    }

    public function importProcurements(Request $request)
    {
        $validator = Validator::make($request->all(), ['file' => 'required|file|mimes:xlsx,xls|max:10240']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()->all()], 422);

        try {
            $rows = IOFactory::load($request->file('file')->getPathname())->getActiveSheet()->toArray();
            $headers = array_shift($rows);
            $headerMap = [];
            foreach ($headers as $column => $header) {
                $headerMap[preg_replace('/[^a-z0-9]/', '', strtolower((string) $header))] = $column;
            }
            $imported = 0;
            $errors = [];
            foreach ($rows as $index => $row) {
                if (empty(array_filter($row))) continue;
                $dateProcured = $this->parseSpreadsheetDate($this->spreadsheetRowValue($row, $headerMap, 'dateprocured'));
                $carMake = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmaker'));
                $carModel = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmodel'));
                $carYear = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'year'));
                $auctionSite = strtolower(trim((string) $this->spreadsheetRowValue($row, $headerMap, 'auctionsite')));
                $status = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'status') ?? 'pending')));

                if ($carMake === '' || $carModel === '') {
                    $errors[] = 'Row ' . ($index + 2) . ': car maker and car model are required';
                    continue;
                }

                if (!in_array($auctionSite, ['copart', 'iaai', 'manheim', 'avc', 'dealership'], true)) {
                    $auctionSite = 'copart';
                }

                if (!in_array($status, ['pending', 'purchased', 'cancelled', 'on_vessel', 'arrived'], true)) {
                    $status = 'pending';
                }

                DB::table('procurements')->insert([
                    'date_procured' => $dateProcured,
                    'car_make' => $carMake,
                    'car_model' => $carModel,
                    'car_year' => $carYear ?: null,
                    'price_usd' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'priceusd')),
                    'auction_charge_usd' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'auctionchargeusd')),
                    'auction_site' => $auctionSite,
                    'state' => trim((string) $this->spreadsheetRowValue($row, $headerMap, 'state')) ?: null,
                    'trucking' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'trucking')),
                    'shipping' => strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'shipping') ?? 'container'))),
                    'arrival_date' => $this->parseSpreadsheetDate($this->spreadsheetRowValue($row, $headerMap, 'arrivaldate')),
                    'profit_ngn' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'profitngn')),
                    'trucking_fee' => strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'truckingfee') ?? 'unpaid'))),
                    'status' => $status,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $imported++;
            }
            return response()->json(['message' => 'Procurement import completed.', 'imported' => $imported, 'errors' => $errors]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error processing file: ' . $e->getMessage()], 500);
        }
    }

    public function exportProcurements(Request $request)
    {
        try {
            $records = DB::table('procurements')->orderBy('created_at', 'desc')->get();
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $headers = ['DATE PROCURED', 'CAR MAKER', 'CAR MODEL', '#', 'YEAR', 'PRICE(USD)', 'AUCTION CHARGE(USD)', 'AUCTION SITE', 'STATE', 'TRUCKING', 'SHIPPING', 'ARRIVAL DATE', 'PROFIT(NGN)', 'TRUCKING FEE', 'STATUS'];
            $sheet->fromArray($headers, null, 'A1');
            $row = 2;
            foreach ($records as $index => $record) {
                $sheet->fromArray([$record->date_procured, $record->car_make, $record->car_model, $index + 1, $record->car_year, $record->price_usd, $record->auction_charge_usd, $record->auction_site, $record->state, $record->trucking, $record->shipping, $record->arrival_date, $record->profit_ngn, $record->trucking_fee, $record->status], null, 'A' . $row++);
            }
            $tempFile = tempnam(sys_get_temp_dir(), 'procurements_');
            (new Xlsx($spreadsheet))->save($tempFile);
            return response()->download($tempFile, 'procurements_export_' . date('Y-m-d_His') . '.xlsx')->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error exporting file: ' . $e->getMessage()], 500);
        }
    }

    public function importClearances(Request $request)
    {
        $validator = Validator::make($request->all(), ['file' => 'required|file|mimes:xlsx,xls|max:10240']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()->all()], 422);

        try {
            $rows = IOFactory::load($request->file('file')->getPathname())->getActiveSheet()->toArray();
            $headers = array_shift($rows);
            $headerMap = [];
            foreach ($headers as $column => $header) {
                $headerMap[preg_replace('/[^a-z0-9]/', '', strtolower((string) $header))] = $column;
            }
            $types = DB::table('shipping_types')->get()->flatMap(fn($type) => [strtoupper($type->code) => $type->id, strtoupper($type->name) => $type->id])->all();
            $lines = DB::table('shipping_lines')->get()->flatMap(fn($line) => [strtoupper($line->code) => $line->id, strtoupper($line->name) => $line->id])->all();
            $imported = 0;
            $errors = [];
            foreach ($rows as $index => $row) {
                if (empty(array_filter($row))) continue;
                $item = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'item'));
                $clientName = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'clientname'));
                if ($item === '' || $clientName === '') {
                    $errors[] = 'Row ' . ($index + 2) . ': item and client name are required';
                    continue;
                }
                $shippingType = strtoupper(trim((string) $this->spreadsheetRowValue($row, $headerMap, 'shipmenttype', 'shippingtype')));
                $shippingLine = strtoupper(trim((string) $this->spreadsheetRowValue($row, $headerMap, 'shippingline', 'shipping')));
                $status = str_replace(' ', '_', strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'status') ?? 'not_cleared'))));
                DB::table('clearances')->insert([
                    'item' => $item,
                    'client_name' => $clientName,
                    'shipping_type_id' => $types[$shippingType] ?? null,
                    'shipping_line_id' => $lines[$shippingLine] ?? null,
                    'status' => in_array($status, ['cleared', 'not_cleared'], true) ? $status : 'not_cleared',
                    'date_stamp' => $this->parseSpreadsheetDate($this->spreadsheetRowValue($row, $headerMap, 'datestamp', 'date')),
                    'total_paid' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'totalpaid', 'amount')),
                    'profit' => $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'profit')),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $imported++;
            }
            return response()->json(['message' => 'Clearance import completed.', 'imported' => $imported, 'errors' => $errors]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error processing file: ' . $e->getMessage()], 500);
        }
    }

    public function exportClearances(Request $request)
    {
        try {
            $records = DB::table('clearances')->leftJoin('shipping_types', 'clearances.shipping_type_id', '=', 'shipping_types.id')->leftJoin('shipping_lines', 'clearances.shipping_line_id', '=', 'shipping_lines.id')->select('clearances.*', 'shipping_types.code as shipping_type_code', 'shipping_lines.code as shipping_line_code')->orderByDesc('clearances.date_stamp')->get();
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->fromArray(['ITEM', 'CLIENT NAME', 'SHIPMENT TYPE', 'SHIPPING LINE', 'STATUS', 'DATE STAMP', 'TOTAL PAID', 'PROFIT'], null, 'A1');
            $row = 2;
            foreach ($records as $record) $sheet->fromArray([$record->item, $record->client_name, $record->shipping_type_code, $record->shipping_line_code, $record->status, $record->date_stamp, $record->total_paid, $record->profit], null, 'A' . $row++);
            $tempFile = tempnam(sys_get_temp_dir(), 'clearances_');
            (new Xlsx($spreadsheet))->save($tempFile);
            return response()->download($tempFile, 'clearances_export_' . date('Y-m-d_His') . '.xlsx')->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error exporting file: ' . $e->getMessage()], 500);
        }
    }

    public function importTruckings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()->all()], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
            $headers = array_shift($rows);
            $headerMap = [];
            foreach ($headers as $column => $header) {
                $headerMap[preg_replace('/[^a-z0-9]/', '', strtolower((string) $header))] = $column;
            }
            $shippingLines = DB::table('shipping_lines')->get()->flatMap(fn($line) => [strtoupper($line->code) => $line->id, strtoupper($line->name) => $line->id])->all();

            $imported = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    $customerName = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'clientname', 'customername'));
                    $customerEmail = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'email', 'customeremail'));
                    $customerPhone = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'phone', 'customerphone'));
                    $vehicleMake = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmaker', 'carmake', 'vehiclemake'));
                    $vehicleModel = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'carmodel', 'vehiclemodel'));
                    $vehicleYear = trim((string) $this->spreadsheetRowValue($row, $headerMap, 'year', 'vehicleyear'));
                    $auctionSite = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'auctionsite') ?? 'copart')));
                    $shippingType = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'shippingtype') ?? 'container')));
                    $shippingLine = strtoupper(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'shippingline', 'shipping') ?? '')));
                    $paymentStatus = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'paymentstatus') ?? 'unpaid')));
                    $shipmentStatus = strtolower(trim((string) ($this->spreadsheetRowValue($row, $headerMap, 'shipmentstatus') ?? 'pending')));
                    $amount = $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'amount'));
                    $profit = $this->parseSpreadsheetAmount($this->spreadsheetRowValue($row, $headerMap, 'profit'));

                    if ($customerName === '') {
                        $errors[] = 'Row ' . ($index + 2) . ': client name is required';
                        continue;
                    }

                    if (!in_array($auctionSite, ['copart', 'iaai', 'manheim', 'avc', 'dealership'], true)) {
                        $auctionSite = 'copart';
                    }
                    if (!in_array($shippingType, ['container', 'roro'], true)) {
                        $shippingType = 'container';
                    }
                    if (!in_array($paymentStatus, ['paid', 'unpaid'], true)) {
                        $paymentStatus = 'unpaid';
                    }
                    if (!in_array($shipmentStatus, ['pending', 'arrived', 'on_vessel'], true)) {
                        $shipmentStatus = 'pending';
                    }

                    DB::table('truckings')->insert([
                        'customer_name' => $customerName,
                        'customer_email' => $customerEmail ?: null,
                        'customer_phone' => $customerPhone ?: null,
                        'vehicle_make' => $vehicleMake ?: null,
                        'vehicle_model' => $vehicleModel ?: null,
                        'vehicle_year' => $vehicleYear ?: null,
                        'auction_site' => $auctionSite,
                        'shipping_type' => $shippingType,
                        'shipping_line_id' => $shippingLines[$shippingLine] ?? null,
                        'trucking_fee_status' => $paymentStatus,
                        'status' => $shipmentStatus,
                        'amount' => $amount,
                        'profit' => $profit,
                        'trucking_date' => $this->parseSpreadsheetDate($this->spreadsheetRowValue($row, $headerMap, 'date')),
                        'color' => trim((string) $this->spreadsheetRowValue($row, $headerMap, 'color')) ?: null,
                        'vin' => trim((string) $this->spreadsheetRowValue($row, $headerMap, 'vin')) ?: null,
                        'payment_status' => $paymentStatus,
                        'shipment_status' => $shipmentStatus,
                        'location' => trim((string) $this->spreadsheetRowValue($row, $headerMap, 'location')) ?: null,
                        'tracking' => trim((string) $this->spreadsheetRowValue($row, $headerMap, 'tracking')) ?: null,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = 'Row ' . ($index + 2) . ': ' . $e->getMessage();
                }
            }

            return response()->json([
                'message' => 'Trucking import completed.',
                'imported' => $imported,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing file: ' . $e->getMessage(),
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function exportTruckings(Request $request)
    {
        try {
            $records = DB::table('truckings')
                ->leftJoin('shipping_lines', 'truckings.shipping_line_id', '=', 'shipping_lines.id')
                ->select(
                    'truckings.customer_name',
                    'truckings.customer_email',
                    'truckings.customer_phone',
                    'truckings.vehicle_make',
                    'truckings.vehicle_model',
                    'truckings.vehicle_year',
                    'truckings.auction_site',
                    'truckings.shipping_type',
                    'shipping_lines.name as shipping_line_name',
                    'truckings.trucking_date',
                    'truckings.color',
                    'truckings.vin',
                    'truckings.payment_status',
                    'truckings.shipment_status',
                    'truckings.location',
                    'truckings.tracking',
                    'truckings.trucking_fee_status',
                    'truckings.status',
                    'truckings.amount',
                    'truckings.profit',
                    'truckings.created_at'
                )
                ->orderBy('truckings.created_at', 'desc')
                ->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $headers = ['DATE', 'CAR MAKER', 'CAR MODEL', 'YEAR', 'SHIPPING TYPE', 'COLOR', 'CLIENT NAME', 'VIN', 'AMOUNT', 'PROFIT', 'PAYMENT STATUS', 'SHIPMENT STATUS', 'LOCATION', 'TRACKING', 'SHIPPING'];
            $sheet->fromArray($headers, null, 'A1');
            $sheet->getStyle('A1:M1')->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);

            $row = 2;
            foreach ($records as $record) {
                $sheet->fromArray([
                    $record->trucking_date,
                    $record->vehicle_make,
                    $record->vehicle_model,
                    $record->vehicle_year,
                    $record->shipping_type,
                    $record->color,
                    $record->customer_name,
                    $record->vin,
                    $record->amount,
                    $record->profit,
                    $record->payment_status,
                    $record->shipment_status,
                    $record->location,
                    $record->tracking,
                    $record->shipping_line_name,
                ], null, 'A' . $row);
                $row++;
            }

            $writer = new Xlsx($spreadsheet);
            $filename = 'truckings_export_' . date('Y-m-d_His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'truckings_');
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error exporting file: ' . $e->getMessage()], 500);
        }
    }
}
