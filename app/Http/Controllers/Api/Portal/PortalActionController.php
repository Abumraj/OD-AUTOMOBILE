<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Controller;
use App\Services\PortalService;
use App\Services\ReceiptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/** Things a customer can do (as opposed to just see) in the portal. */
class PortalActionController extends Controller
{
    private const DOCUMENT_TABLES = ['shipments', 'procurements', 'autosales', 'truckings', 'clearances', 'quotes', 'auction_requests'];
    private const MANUAL_METHODS = ['bank_transfer', 'swift_wire', 'usdt', 'cash_pos'];

    public function __construct(private PortalService $portal, private ReceiptService $receipts)
    {
    }

    private function deny(string $message = 'Your role does not allow this action.')
    {
        return response()->json(['message' => $message], 403);
    }

    // ------------------------------------------------------------------ requests

    public function requests(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');

        $query = DB::table('portal_requests')->where('customer_id', $customer->id);
        if (!PortalAuthController::can($user, 'approve')) {
            $query->where('requested_by', $user->id);
        }

        $names = DB::table('customer_users')->where('customer_id', $customer->id)->pluck('name', 'id');

        $items = $query->orderByDesc('id')->get()->map(function ($row) use ($names) {
            $linked = null;
            if ($row->linked_table && $row->linked_id) {
                $record = DB::table($row->linked_table)->where('id', $row->linked_id)->first();
                $linked = $record ? ($record->status ?? null) : null;
            }

            return [
                'id' => $row->id,
                'type' => $row->type,
                'payload' => json_decode($row->payload, true),
                'estimated_value' => $row->estimated_value !== null ? (float) $row->estimated_value : null,
                'status' => $row->status,
                'requested_by' => $names[$row->requested_by] ?? 'Unknown',
                'decision_note' => $row->decision_note,
                'linked_status' => $linked,
                'created_at' => $row->created_at,
            ];
        });

        return response()->json(['items' => $items->values()]);
    }

    public function createRequest(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'request')) {
            return $this->deny();
        }

        $allowed = $this->portal->requestableServices();
        $validated = $request->validate([
            'type' => ['required', Rule::in(['quote', 'auction', 'trucking', 'clearance'])],
            'vehicle_year' => 'required|string|max:10',
            'vehicle_make' => 'required|string|max:100',
            'vehicle_model' => 'required|string|max:100',
            'origin' => 'required_unless:type,auction|nullable|string|max:255',
            'destination' => 'required_unless:type,auction|nullable|string|max:255',
            'service' => 'nullable|string|max:100',
            'max_budget' => 'required_if:type,auction|nullable|numeric|min:0',
            'estimated_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
            'phone' => 'nullable|string|max:50',
            'receipt' => 'nullable|' . ReceiptService::FILE_RULE,
        ]);
        unset($validated['receipt']);

        if (!in_array($validated['type'], $allowed, true)) {
            return response()->json(['message' => 'This service cannot be requested from the portal right now.'], 422);
        }

        $estimated = $validated['max_budget'] ?? $validated['estimated_value'] ?? null;
        $needsApproval = $customer->approval_threshold !== null
            && $estimated !== null
            && (float) $estimated >= (float) $customer->approval_threshold
            && !in_array($user->role, ['owner', 'finance'], true);

        // The sales receipt is optional. It waits on disk until the record it belongs to exists.
        $payload = $validated;
        if ($file = $request->file('receipt')) {
            $payload['receipt_file'] = [
                'path' => $file->store("receipts/pending/{$customer->id}", 'local'),
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }

        $requestId = DB::table('portal_requests')->insertGetId([
            'customer_id' => $customer->id,
            'requested_by' => $user->id,
            'type' => $validated['type'],
            'payload' => json_encode($payload),
            'estimated_value' => $estimated,
            'status' => $needsApproval ? 'awaiting_approval' : 'submitted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($needsApproval) {
            $this->portal->logActivity('approval', $customer->company_name, "request #{$requestId} ({$validated['type']}) is awaiting approval by the customer");

            return response()->json([
                'success' => true,
                'status' => 'awaiting_approval',
                'id' => $requestId,
                'message' => 'This request is above your approval limit and has been sent to an owner or finance user for sign-off.',
            ], 201);
        }

        $this->submitRequest($requestId);

        return response()->json(['success' => true, 'status' => 'submitted', 'id' => $requestId, 'message' => 'Request sent to OD Automotive.'], 201);
    }

    public function decideRequest(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'approve')) {
            return $this->deny('Only an owner or finance user can approve requests.');
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'decline'])],
            'note' => 'nullable|string|max:500',
        ]);

        $row = DB::table('portal_requests')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$row || $row->status !== 'awaiting_approval') {
            return response()->json(['message' => 'This request is not waiting for approval.'], 422);
        }

        DB::table('portal_requests')->where('id', $row->id)->update([
            'decided_by' => $user->id,
            'decision_note' => $validated['note'] ?? null,
            'updated_at' => now(),
        ]);

        if ($validated['decision'] === 'decline') {
            $pending = json_decode($row->payload, true)['receipt_file']['path'] ?? null;
            if ($pending) {
                Storage::disk('local')->delete($pending);
            }
            DB::table('portal_requests')->where('id', $row->id)->update(['status' => 'declined']);

            return response()->json(['success' => true, 'status' => 'declined']);
        }

        $this->submitRequest($row->id);

        return response()->json(['success' => true, 'status' => 'submitted']);
    }

    /** Turn an approved portal request into the record the OD team already works with. */
    private function submitRequest(int $requestId): void
    {
        $row = DB::table('portal_requests')->where('id', $requestId)->first();
        $customer = DB::table('customers')->where('id', $row->customer_id)->first();
        $requester = DB::table('customer_users')->where('id', $row->requested_by)->first();
        $payload = json_decode($row->payload, true);

        $name = $customer->company_name;
        $email = $customer->email;
        $phone = $payload['phone'] ?? $requester->phone ?? $customer->phone ?? '';

        if ($row->type === 'auction') {
            $linkedId = DB::table('auction_requests')->insertGetId([
                'customer_id' => $customer->id,
                'customer_name' => $name,
                'customer_email' => $email,
                'customer_phone' => $phone,
                'vehicle_make' => $payload['vehicle_make'],
                'vehicle_model' => $payload['vehicle_model'],
                'vehicle_year' => $payload['vehicle_year'],
                'max_budget' => $payload['max_budget'] ?? 0,
                'additional_requirements' => $payload['notes'] ?? null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $table = 'auction_requests';
        } else {
            $service = match ($row->type) {
                'trucking' => 'Trucking',
                'clearance' => 'Clearance',
                default => $payload['service'] ?? 'Vehicle shipping',
            };

            $linkedId = DB::table('quotes')->insertGetId([
                'customer_id' => $customer->id,
                'service' => $service,
                'vehicle_year' => $payload['vehicle_year'],
                'vehicle_make' => $payload['vehicle_make'],
                'vehicle_model' => $payload['vehicle_model'],
                'origin' => $payload['origin'],
                'destination' => $payload['destination'],
                'customer_name' => $name,
                'email' => $email,
                'phone' => $phone,
                'contact_method' => 'portal',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $table = 'quotes';
        }

        if (!empty($payload['receipt_file'])) {
            $this->receipts->attachStored($table, $linkedId, $payload['receipt_file'], 'customer', $requester->name ?? null);
            unset($payload['receipt_file']);
        }

        DB::table('portal_requests')->where('id', $requestId)->update([
            'payload' => json_encode($payload),
            'status' => 'submitted',
            'linked_table' => $table,
            'linked_id' => $linkedId,
            'updated_at' => now(),
        ]);

        $this->portal->logActivity(
            'add_task', $name,
            "requested {$row->type} for {$payload['vehicle_year']} {$payload['vehicle_make']} {$payload['vehicle_model']} via the portal"
        );
    }

    // ----------------------------------------------------------------- quote reply

    public function respondToQuote(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'approve')) {
            return $this->deny('Only an owner or finance user can accept or decline quotes.');
        }

        $validated = $request->validate(['response' => ['required', Rule::in(['accept', 'decline'])]]);

        $quote = DB::table('quotes')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$quote) {
            return response()->json(['message' => 'Quote not found.'], 404);
        }
        if ($quote->quoted_amount === null || $quote->status !== 'pending' || $quote->customer_response) {
            return response()->json(['message' => 'This quote is not waiting for your answer.'], 422);
        }

        $accepted = $validated['response'] === 'accept';
        DB::table('quotes')->where('id', $quote->id)->update([
            'customer_response' => $accepted ? 'accepted' : 'declined',
            'customer_responded_at' => now(),
            'updated_at' => now(),
        ]);

        $result = ['success' => true, 'response' => $accepted ? 'accepted' : 'declined'];

        if ($accepted) {
            // Reuse the existing quote-to-shipment workflow so tracking and activity data are created.
            $converted = app(AdminDashboardController::class)->approveQuote($request, $quote->id)->getData(true);
            if (!empty($converted['shipment_id'])) {
                DB::table('shipments')->where('id', $converted['shipment_id'])->update(['customer_id' => $customer->id]);
                $result['tracking_number'] = $converted['tracking_number'] ?? null;
                $result['shipment_id'] = $converted['shipment_id'];
            }
        }

        $this->portal->logActivity(
            $accepted ? 'task_alt' : 'cancel', $customer->company_name,
            ($accepted ? 'accepted' : 'declined') . " quote #{$quote->id} (" . number_format((float) $quote->quoted_amount, 2) . ') in the portal'
        );

        return response()->json($result);
    }

    // ----------------------------------------------------------------- documents

    public function uploadDocument(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'documents')) {
            return $this->deny();
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx',
            'title' => 'nullable|string|max:255',
            'category' => ['nullable', Rule::in(['id', 'power_of_attorney', 'purchase_papers', 'payment_proof', 'other'])],
            'record_type' => ['nullable', Rule::in(self::DOCUMENT_TABLES)],
            'record_id' => 'nullable|integer',
        ]);

        if (!empty($validated['record_type'])) {
            $owned = DB::table($validated['record_type'])->where('id', $validated['record_id'] ?? 0)->where('customer_id', $customer->id)->exists();
            if (!$owned) {
                return response()->json(['message' => 'That record does not belong to your account.'], 422);
            }
        }

        $file = $request->file('file');
        $path = $file->store('portal/documents/' . $customer->id, 'local');

        $id = DB::table('customer_documents')->insertGetId([
            'customer_id' => $customer->id,
            'uploaded_by_user' => $user->id,
            'record_type' => $validated['record_type'] ?? null,
            'record_id' => $validated['record_id'] ?? null,
            'category' => $validated['category'] ?? 'other',
            'title' => $validated['title'] ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'visible_to_customer' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->portal->logActivity('upload_file', $customer->company_name, 'uploaded a document via the portal');

        return response()->json(['success' => true, 'id' => $id], 201);
    }

    public function uploadReceipt(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'documents')) {
            return $this->deny();
        }

        $validated = $request->validate([
            'record_type' => ['required', Rule::in(ReceiptService::TABLES)],
            'record_id' => 'required|integer',
            'file' => 'required|' . ReceiptService::FILE_RULE,
        ]);

        $owned = DB::table($validated['record_type'])->where('id', $validated['record_id'])->where('customer_id', $customer->id)->exists();
        if (!$owned) {
            return response()->json(['message' => 'That record does not belong to your account.'], 422);
        }

        $id = $this->receipts->store($validated['record_type'], (int) $validated['record_id'], $request->file('file'), 'customer', $user->name);
        $this->portal->logActivity('receipt_long', $customer->company_name, 'uploaded a vehicle sales receipt via the portal');

        return response()->json(['success' => true, 'id' => $id], 201);
    }

    public function deleteReceipt(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'documents')) {
            return $this->deny();
        }

        $receipt = DB::table('service_receipts')->where('id', $id)->first();
        $owned = $receipt && DB::table($receipt->record_type)->where('id', $receipt->record_id)->where('customer_id', $customer->id)->exists();
        if (!$owned) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }
        if ($receipt->uploaded_by_type !== 'customer') {
            return $this->deny('Receipts added by OD Automotive can only be removed by OD.');
        }

        $this->receipts->delete($receipt);

        return response()->json(['success' => true]);
    }

    public function deleteDocument(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');

        $doc = DB::table('customer_documents')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$doc) {
            return response()->json(['message' => 'Document not found.'], 404);
        }
        if ($doc->uploaded_by_admin || (int) $doc->uploaded_by_user !== (int) $user->id && $user->role !== 'owner') {
            return $this->deny('You can only remove documents you uploaded.');
        }

        Storage::disk('local')->delete($doc->path);
        DB::table('customer_documents')->where('id', $doc->id)->delete();

        return response()->json(['success' => true]);
    }

    // ------------------------------------------------------------------- tickets

    public function tickets(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        $items = DB::table('support_tickets')->where('customer_id', $customer->id)
            ->orderByRaw("CASE status WHEN 'closed' THEN 1 ELSE 0 END")->orderByDesc('last_message_at')->get();

        return response()->json(['items' => $items]);
    }

    public function ticket(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $ticket = DB::table('support_tickets')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        return response()->json([
            'ticket' => $ticket,
            'messages' => DB::table('support_ticket_messages')->where('ticket_id', $ticket->id)->orderBy('id')->get(),
        ]);
    }

    public function createTicket(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'tickets')) {
            return $this->deny();
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'record_type' => ['nullable', Rule::in(self::DOCUMENT_TABLES)],
            'record_id' => 'nullable|integer',
        ]);

        if (!empty($validated['record_type'])) {
            $owned = DB::table($validated['record_type'])->where('id', $validated['record_id'] ?? 0)->where('customer_id', $customer->id)->exists();
            if (!$owned) {
                return response()->json(['message' => 'That record does not belong to your account.'], 422);
            }
        }

        $ticketId = DB::transaction(function () use ($customer, $user, $validated) {
            $ticketId = DB::table('support_tickets')->insertGetId([
                'ticket_number' => 'TKT-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)),
                'customer_id' => $customer->id,
                'opened_by' => $user->id,
                'record_type' => $validated['record_type'] ?? null,
                'record_id' => $validated['record_id'] ?? null,
                'subject' => $validated['subject'],
                'status' => 'open',
                'last_message_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('support_ticket_messages')->insert([
                'ticket_id' => $ticketId,
                'sender_type' => 'customer',
                'sender_name' => $user->name,
                'body' => $validated['body'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $ticketId;
        });

        $this->portal->logActivity('support_agent', $customer->company_name, "opened support ticket: {$validated['subject']}");

        return response()->json(['success' => true, 'id' => $ticketId], 201);
    }

    public function replyTicket(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'tickets')) {
            return $this->deny();
        }

        $validated = $request->validate(['body' => 'required|string|max:5000']);
        $ticket = DB::table('support_tickets')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        DB::table('support_ticket_messages')->insert([
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'sender_name' => $user->name,
            'body' => $validated['body'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('support_tickets')->where('id', $ticket->id)->update(['status' => 'open', 'last_message_at' => now(), 'updated_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function closeTicket(Request $request, $id)
    {
        $customer = $request->attributes->get('portal_customer');
        DB::table('support_tickets')->where('id', $id)->where('customer_id', $customer->id)->update(['status' => 'closed', 'updated_at' => now()]);

        return response()->json(['success' => true]);
    }

    // ------------------------------------------------------------------ payments

    public function submitPayment(Request $request, $invoiceId)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'pay')) {
            return $this->deny('Only an owner or finance user can submit payments.');
        }

        $enabled = collect($this->portal->customerPaymentMethods())->where('kind', 'manual')->pluck('key')->all();
        $validated = $request->validate([
            'method' => ['required', Rule::in($enabled ?: ['__none__'])],
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
            'proof' => 'nullable|file|max:8192|mimes:pdf,jpg,jpeg,png',
        ]);

        $invoice = DB::table('invoices')->where('id', $invoiceId)->where('customer_id', $customer->id)->first();
        if (!$invoice || in_array($invoice->status, ['paid', 'void'], true)) {
            return response()->json(['message' => 'This invoice cannot accept payments.'], 422);
        }

        $balance = round((float) $invoice->amount - (float) $invoice->amount_paid, 2);
        if ((float) $validated['amount'] - $balance > 0.009) {
            return response()->json(['message' => 'The amount is more than the outstanding balance of ' . number_format($balance, 2) . '.'], 422);
        }

        $proofPath = $request->hasFile('proof') ? $request->file('proof')->store('portal/payments/' . $customer->id, 'local') : null;

        $id = DB::table('payments')->insertGetId([
            'receipt_number' => $this->nextReceiptNumber(),
            'invoice_id' => $invoice->id,
            'customer_id' => $customer->id,
            'submitted_by' => $user->id,
            'method' => $validated['method'],
            'amount' => $validated['amount'],
            'currency' => $invoice->currency ?: 'NGN',
            'reference' => $validated['reference'] ?? null,
            'note' => $validated['note'] ?? null,
            'proof_path' => $proofPath,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->portal->logActivity('payments', $customer->company_name, "submitted a payment of {$validated['amount']} for {$invoice->invoice_number} (awaiting confirmation)");

        return response()->json([
            'success' => true,
            'id' => $id,
            'message' => 'Payment submitted. OD Automotive will confirm it shortly and your invoice will update.',
        ], 201);
    }

    public function applyCredit(Request $request, $invoiceId)
    {
        $customer = $request->attributes->get('portal_customer');
        $user = $request->attributes->get('portal_user');
        if (!PortalAuthController::can($user, 'pay')) {
            return $this->deny('Only an owner or finance user can apply credit.');
        }

        $enabled = collect($this->portal->customerPaymentMethods())->contains('key', 'account_credit');
        if (!$enabled) {
            return response()->json(['message' => 'Paying from account credit is not available.'], 422);
        }

        $validated = $request->validate(['amount' => 'required|numeric|min:0.01']);

        return DB::transaction(function () use ($customer, $user, $invoiceId, $validated) {
            $invoice = DB::table('invoices')->where('id', $invoiceId)->where('customer_id', $customer->id)->lockForUpdate()->first();
            if (!$invoice || in_array($invoice->status, ['paid', 'void'], true)) {
                return response()->json(['message' => 'This invoice cannot accept payments.'], 422);
            }

            $balance = round((float) $invoice->amount - (float) $invoice->amount_paid, 2);
            $credit = $this->portal->creditBalance($customer->id);
            $amount = round((float) $validated['amount'], 2);

            if ($amount - $balance > 0.009) {
                return response()->json(['message' => 'The amount is more than the outstanding balance.'], 422);
            }
            if ($amount - $credit > 0.009) {
                return response()->json(['message' => 'Your account credit is ' . number_format($credit, 2) . '.'], 422);
            }

            DB::table('payments')->insert([
                'receipt_number' => $this->nextReceiptNumber(),
                'invoice_id' => $invoice->id,
                'customer_id' => $customer->id,
                'submitted_by' => $user->id,
                'method' => 'account_credit',
                'amount' => $amount,
                'currency' => $invoice->currency ?: 'NGN',
                'reference' => 'Account credit',
                'status' => 'confirmed',
                'reviewed_by' => 'system',
                'reviewed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('customer_credit_entries')->insert([
                'customer_id' => $customer->id,
                'amount' => -$amount,
                'type' => 'applied',
                'invoice_id' => $invoice->id,
                'description' => "Applied to {$invoice->invoice_number}",
                'created_by' => $user->name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->portal->recalculateInvoice($invoice->id);
            $balanceAfter = $this->portal->refreshCreditBalance($customer->id);

            return response()->json(['success' => true, 'credit_balance' => $balanceAfter, 'message' => 'Invoice paid from account credit.']);
        });
    }

    public function creditLedger(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        return response()->json([
            'balance' => $this->portal->creditBalance($customer->id),
            'entries' => DB::table('customer_credit_entries')->where('customer_id', $customer->id)->orderByDesc('id')->limit(100)
                ->get(['id', 'amount', 'type', 'description', 'created_at']),
        ]);
    }

    private function nextReceiptNumber(): string
    {
        return 'PAY-' . date('Y') . '-' . str_pad((string) ((int) DB::table('payments')->max('id') + 1), 6, '0', STR_PAD_LEFT);
    }
}
