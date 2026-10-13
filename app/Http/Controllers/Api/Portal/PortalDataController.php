<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Api\DockReceiptController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Controller;
use App\Services\PortalService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** Read-only views of everything OD has done for the signed-in customer. */
class PortalDataController extends Controller
{
    public function __construct(private PortalService $portal)
    {
    }

    public function dashboard(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $history = $this->portal->history($customer->id);

        $byType = [];
        foreach ($history as $item) {
            $byType[$item['type']] = ($byType[$item['type']] ?? 0) + 1;
        }

        $activeShipments = DB::table('shipments')->where('customer_id', $customer->id)
            ->whereNotIn('status', ['delivered', 'cancelled'])->count();
        $delivered = DB::table('shipments')->where('customer_id', $customer->id)->where('status', 'delivered')->count();

        $openInvoices = DB::table('invoices')->where('customer_id', $customer->id)->whereIn('status', ['unpaid', 'partial'])->count();

        return response()->json([
            'counts' => [
                'total_services' => count($history),
                'active_shipments' => $activeShipments,
                'delivered' => $delivered,
                'open_invoices' => $openInvoices,
                'open_tickets' => DB::table('support_tickets')->where('customer_id', $customer->id)->where('status', '!=', 'closed')->count(),
            ],
            'by_type' => $byType,
            'outstanding_by_currency' => $this->portal->outstandingByCurrency($customer->id),
            'credit_balance' => (float) $customer->credit_balance,
            'recent' => array_slice($history, 0, 8),
            'alerts' => $this->portal->alerts($customer->id),
            'tier' => collect($this->portal->tiers())->firstWhere('key', $customer->pricing_tier),
        ]);
    }

    public function history(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $items = $this->portal->history($customer->id, $request->only(['type', 'status', 'from', 'to', 'search']));

        return response()->json(['count' => count($items), 'items' => $items]);
    }

    public function exportHistory(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $items = $this->portal->history($customer->id, $request->only(['type', 'status', 'from', 'to', 'search']));

        return $this->csv('od-service-history-' . date('Ymd') . '.csv', ['Service', 'Reference', 'Vehicle', 'VIN', 'Status', 'Date', 'Amount'], array_map(fn($item) => [
            $item['label'], $item['reference'], $item['vehicle'], $item['vin'], $item['status'], substr((string) $item['date'], 0, 10), $item['amount'],
        ], $items));
    }

    // ------------------------------------------------------------------ vehicles

    public function vehicles(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        $shipments = DB::table('shipments')->where('customer_id', $customer->id)->orderByDesc('id')->get()
            ->map(fn($shipment) => $this->portal->normalize('shipments', $shipment) + [
                'progress' => (int) ($shipment->progress_percentage ?? 0),
                'eta' => $shipment->estimated_arrival_date ?? $shipment->eta ?? null,
                'route' => trim(($shipment->origin_port ?? '') . ' → ' . ($shipment->destination_port ?? ''), ' →'),
                'delayed' => $this->isDelayed($shipment),
            ]);

        return response()->json(['count' => $shipments->count(), 'items' => $shipments->values()]);
    }

    public function vehicle(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $shipment = DB::table('shipments')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$shipment) {
            return response()->json(['message' => 'Vehicle not found.'], 404);
        }

        $updates = DB::table('shipment_updates')->where('shipment_id', $shipment->id)->orderByDesc('update_date')->get(['status', 'location', 'description', 'update_date']);
        $receipts = DB::table('dock_receipts')->where('shipment_id', $shipment->id)->orderByDesc('id')
            ->get(['id', 'receipt_number', 'stage', 'date_received', 'generated_at']);
        $documents = DB::table('customer_documents')->where('customer_id', $customer->id)
            ->where('record_type', 'shipments')->where('record_id', $shipment->id)->where('visible_to_customer', true)
            ->orderByDesc('id')->get(['id', 'title', 'category', 'mime', 'size', 'created_at']);
        $invoices = DB::table('invoices')->where('customer_id', $customer->id)->where('record_type', 'shipments')->where('record_id', $shipment->id)
            ->orderByDesc('id')->get(['id', 'invoice_number', 'amount', 'amount_paid', 'status', 'date_issued']);
        $tickets = DB::table('support_tickets')->where('customer_id', $customer->id)->where('record_type', 'shipments')->where('record_id', $shipment->id)
            ->orderByDesc('id')->get(['id', 'ticket_number', 'subject', 'status']);

        return response()->json([
            'vehicle' => $this->portal->normalize('shipments', $shipment) + [
                'progress' => (int) ($shipment->progress_percentage ?? 0),
                'delayed' => $this->isDelayed($shipment),
            ],
            'updates' => $updates,
            'dock_receipts' => $receipts,
            'documents' => $documents,
            'invoices' => $invoices,
            'tickets' => $tickets,
        ]);
    }

    private function isDelayed(object $shipment): bool
    {
        $eta = $shipment->estimated_arrival_date ?? $shipment->eta ?? null;

        return $eta
            && !in_array($shipment->status, ['delivered', 'cancelled'], true)
            && empty($shipment->actual_arrival_date)
            && substr((string) $eta, 0, 10) < now()->toDateString();
    }

    // ----------------------------------------------------------------- documents

    public function documents(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        $uploaded = DB::table('customer_documents')->where('customer_id', $customer->id)->where('visible_to_customer', true)
            ->orderByDesc('id')->get()->map(fn($doc) => [
                'kind' => 'file',
                'id' => $doc->id,
                'title' => $doc->title,
                'category' => $doc->category,
                'source' => $doc->uploaded_by_admin ? 'OD Automotive' : 'You',
                'record_type' => $doc->record_type,
                'record_id' => $doc->record_id,
                'size' => $doc->size,
                'date' => $doc->created_at,
            ]);

        $invoices = DB::table('invoices')->where('customer_id', $customer->id)->where('status', '!=', 'void')->orderByDesc('id')->get()
            ->map(fn($invoice) => [
                'kind' => 'invoice',
                'id' => $invoice->id,
                'title' => $invoice->invoice_number,
                'category' => 'invoice',
                'source' => 'OD Automotive',
                'record_type' => $invoice->record_type,
                'record_id' => $invoice->record_id,
                'size' => null,
                'date' => $invoice->date_issued ?? $invoice->created_at,
            ]);

        $receipts = $this->customerReceipts($customer->id)->map(fn($receipt) => [
            'kind' => 'dock_receipt',
            'id' => $receipt->id,
            'title' => $receipt->receipt_number,
            'category' => 'dock_receipt',
            'source' => 'OD Automotive',
            'record_type' => $receipt->record_type,
            'record_id' => $receipt->record_id,
            'size' => null,
            'date' => $receipt->generated_at,
        ]);

        $all = collect()->concat($uploaded)->concat($invoices)->concat($receipts)
            ->sortByDesc('date')->values();

        return response()->json(['count' => $all->count(), 'items' => $all]);
    }

    /** Dock receipts belonging to any record the customer owns. */
    private function customerReceipts(int $customerId)
    {
        $tables = ['shipments', 'procurements', 'truckings', 'clearances', 'autosales'];
        $receipts = collect();

        foreach ($tables as $table) {
            $rows = DB::table('dock_receipts')
                ->where(function ($query) use ($table) {
                    $query->where('record_type', $table);
                    if ($table === 'shipments') {
                        $query->orWhere(function ($inner) {
                            $inner->whereNull('record_type')->whereNotNull('shipment_id');
                        });
                    }
                })
                ->whereIn(DB::raw('COALESCE(record_id, shipment_id)'), function ($query) use ($table, $customerId) {
                    $query->select('id')->from($table)->where('customer_id', $customerId);
                })
                ->orderByDesc('id')->get();

            foreach ($rows as $row) {
                $row->record_type = $row->record_type ?: 'shipments';
                $row->record_id = $row->record_id ?: $row->shipment_id;
                $receipts->push($row);
            }
        }

        return $receipts->unique('id')->values();
    }

    public function downloadDocument(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $doc = DB::table('customer_documents')->where('id', $id)->where('customer_id', $customer->id)->where('visible_to_customer', true)->first();
        if (!$doc || !Storage::disk('local')->exists($doc->path)) {
            return response()->json(['message' => 'Document not found.'], 404);
        }

        return Storage::disk('local')->download($doc->path, $doc->title . '.' . pathinfo($doc->path, PATHINFO_EXTENSION));
    }

    public function downloadInvoice(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $invoice = DB::table('invoices')->where('id', $id)->where('customer_id', $customer->id)->where('status', '!=', 'void')->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        return app(InvoiceController::class)->downloadInvoice($invoice->id);
    }

    public function downloadDockReceipt(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $owned = $this->customerReceipts($customer->id)->firstWhere('id', (int) $id);
        if (!$owned) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }

        return app(DockReceiptController::class)->downloadReceipt($owned->id);
    }

    // ------------------------------------------------------------------ invoices

    public function invoices(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $today = now()->toDateString();

        $invoices = DB::table('invoices')->where('customer_id', $customer->id)->where('status', '!=', 'void')
            ->when($request->query('status'), fn($query, $status) => $query->where('status', $status))
            ->orderByDesc('id')->get();

        $payments = DB::table('payments')->whereIn('invoice_id', $invoices->pluck('id'))->orderByDesc('id')->get()->groupBy('invoice_id');

        $items = $invoices->map(function ($invoice) use ($payments, $today) {
            $balance = round((float) $invoice->amount - (float) $invoice->amount_paid, 2);

            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'service' => $invoice->service_label,
                'reference' => $invoice->reference_number,
                'description' => $invoice->description,
                'amount' => (float) $invoice->amount,
                'amount_paid' => (float) $invoice->amount_paid,
                'balance' => max($balance, 0),
                'currency' => $invoice->currency,
                'status' => $invoice->status,
                'date_issued' => $invoice->date_issued,
                'due_date' => $invoice->due_date,
                'overdue' => in_array($invoice->status, ['unpaid', 'partial'], true) && $invoice->due_date && $invoice->due_date < $today,
                'payments' => ($payments[$invoice->id] ?? collect())->map(fn($payment) => [
                    'id' => $payment->id,
                    'receipt_number' => $payment->receipt_number,
                    'method' => $payment->method,
                    'amount' => (float) $payment->amount,
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'review_note' => $payment->review_note,
                    'created_at' => $payment->created_at,
                    'has_proof' => !empty($payment->proof_path),
                ])->values(),
            ];
        });

        return response()->json([
            'items' => $items->values(),
            'totals' => $items->groupBy('currency')->map(fn($group, $currency) => [
                'currency' => $currency,
                'invoiced' => round((float) $group->sum('amount'), 2),
                'paid' => round((float) $group->sum('amount_paid'), 2),
                'outstanding' => round((float) $group->sum('balance'), 2),
            ])->values(),
            'bank_details' => $this->portal->setting('portal_bank_details', ''),
            'credit_balance' => (float) $customer->credit_balance,
        ]);
    }

    public function exportInvoices(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $rows = DB::table('invoices')->where('customer_id', $customer->id)->orderBy('id')->get();

        return $this->csv('od-invoices-' . date('Ymd') . '.csv',
            ['Invoice', 'Date', 'Due date', 'Service', 'Reference', 'Description', 'Currency', 'Amount', 'Paid', 'Balance', 'Status'],
            $rows->map(fn($invoice) => [
                $invoice->invoice_number, $invoice->date_issued, $invoice->due_date, $invoice->service_label, $invoice->reference_number,
                $invoice->description, $invoice->currency, $invoice->amount, $invoice->amount_paid,
                round((float) $invoice->amount - (float) $invoice->amount_paid, 2), $invoice->status,
            ])->all()
        );
    }

    public function statement(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        return response()->json($this->portal->statementFor($customer->id, $request->query('from'), $request->query('to'), $request->query('currency')));
    }

    public function statementPdf(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $statement = $this->portal->statementFor($customer->id, $request->query('from'), $request->query('to'), $request->query('currency'));

        $pdf = Pdf::loadView('invoices.statement', [
            'customer' => $customer,
            'statement' => $statement,
            'from' => $request->query('from'),
            'to' => $request->query('to'),
        ]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('statement-' . date('Ymd') . '.pdf');
    }

    public function paymentProof(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $payment = DB::table('payments')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$payment || !$payment->proof_path || !Storage::disk('local')->exists($payment->proof_path)) {
            return response()->json(['message' => 'Proof not found.'], 404);
        }

        return Storage::disk('local')->download($payment->proof_path);
    }

    // ------------------------------------------------------------ analytics etc.

    public function analytics(Request $request)
    {
        return response()->json($this->portal->analytics($request->attributes->get('portal_customer')->id));
    }

    public function alerts(Request $request)
    {
        return response()->json($this->portal->alerts($request->attributes->get('portal_customer')->id));
    }

    public function quotes(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $quotes = DB::table('quotes')->where('customer_id', $customer->id)->orderByDesc('id')->get()
            ->map(fn($quote) => $this->portal->visibleRecord('quotes', $quote));

        return response()->json(['items' => $quotes->values()]);
    }

    public function reorder(Request $request, $type, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $table = PortalService::tableForType($type);
        if (!$table) {
            return response()->json(['message' => 'Unknown service type.'], 404);
        }

        $record = DB::table($table)->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$record) {
            return response()->json(['message' => 'Record not found.'], 404);
        }

        $row = (array) $record;

        return response()->json([
            'type' => in_array($type, ['quote', 'shipment', 'procurement'], true) ? 'quote' : $type,
            'prefill' => array_filter([
                'service' => $row['service'] ?? null,
                'vehicle_year' => $row['vehicle_year'] ?? $row['car_year'] ?? $row['year'] ?? null,
                'vehicle_make' => $row['vehicle_make'] ?? $row['car_make'] ?? null,
                'vehicle_model' => $row['vehicle_model'] ?? $row['car_model'] ?? null,
                'origin' => $row['origin'] ?? $row['origin_port'] ?? null,
                'destination' => $row['destination'] ?? $row['destination_port'] ?? null,
                'max_budget' => $row['max_budget'] ?? null,
                'description' => $row['item'] ?? null,
            ], fn($value) => $value !== null && $value !== ''),
        ]);
    }

    private function csv(string $filename, array $header, array $rows)
    {
        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($rows as $row) {
                fputcsv($out, array_map(fn($cell) => is_string($cell) && preg_match('/^[=+\-@]/', $cell) ? "'" . $cell : $cell, $row));
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
