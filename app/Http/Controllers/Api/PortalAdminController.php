<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Admin-side control of the customer portal (behind admin.auth). */
class PortalAdminController extends Controller
{
    public function __construct(private PortalService $portal)
    {
    }

    private function adminName(Request $request): string
    {
        return (string) $request->session()->get('admin_name', 'Admin');
    }

    // ------------------------------------------------------------------ settings

    public function settings()
    {
        return response()->json([
            'enabled' => $this->portal->isEnabled(),
            'registration_mode' => $this->portal->registrationMode(),
            'bank_details' => $this->portal->setting('portal_bank_details', ''),
            'currency' => $this->portal->setting('portal_default_currency', 'NGN'),
            'requestable_services' => $this->portal->requestableServices(),
            'tiers' => $this->portal->tiers(),
            'payment_methods' => $this->portal->allPaymentMethods(),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'enabled' => 'sometimes|boolean',
            'registration_mode' => ['sometimes', Rule::in(PortalService::REGISTRATION_MODES)],
            'bank_details' => 'sometimes|nullable|string|max:2000',
            'currency' => 'sometimes|string|size:3',
            'requestable_services' => 'sometimes|array',
            'requestable_services.*' => Rule::in(['quote', 'auction', 'trucking', 'clearance']),
            'tiers' => 'sometimes|array|min:1',
            'tiers.*.key' => 'required_with:tiers|string|max:40',
            'tiers.*.label' => 'required_with:tiers|string|max:60',
            'tiers.*.discount_percent' => 'required_with:tiers|numeric|min:0|max:100',
            'payment_methods' => 'sometimes|array',
            'payment_methods.*.key' => 'required_with:payment_methods|string',
            'payment_methods.*.enabled' => 'required_with:payment_methods|boolean',
            'payment_methods.*.instructions' => 'nullable|string|max:1000',
        ]);

        if (array_key_exists('enabled', $validated)) {
            $this->portal->putSetting('portal_enabled', $validated['enabled'] ? '1' : '0');
        }
        if (isset($validated['registration_mode'])) {
            $this->portal->putSetting('portal_registration_mode', $validated['registration_mode']);
        }
        if (array_key_exists('bank_details', $validated)) {
            $this->portal->putSetting('portal_bank_details', $validated['bank_details'] ?? '');
        }
        if (isset($validated['currency'])) {
            $this->portal->putSetting('portal_default_currency', strtoupper($validated['currency']));
        }
        if (isset($validated['requestable_services'])) {
            $this->portal->putSetting('portal_requestable_services', json_encode(array_values($validated['requestable_services'])));
        }
        if (isset($validated['tiers'])) {
            $this->portal->putSetting('portal_tiers', json_encode(array_values($validated['tiers'])));
        }
        if (isset($validated['payment_methods'])) {
            $incoming = collect($validated['payment_methods'])->keyBy('key');
            $merged = array_map(function ($method) use ($incoming) {
                $patch = $incoming->get($method['key']);
                if ($patch) {
                    // Gateway methods cannot be switched on until their integration exists.
                    $method['enabled'] = $method['kind'] === 'gateway' ? false : (bool) $patch['enabled'];
                    if (array_key_exists('instructions', $patch) && $method['kind'] === 'manual') {
                        $method['instructions'] = $patch['instructions'] ?? '';
                    }
                }

                return $method;
            }, $this->portal->allPaymentMethods());
            $this->portal->putSetting('portal_payment_methods', json_encode($merged));
        }

        return $this->settings();
    }

    // ----------------------------------------------------------------- customers

    public function customers(Request $request)
    {
        $query = DB::table('customers');
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(fn($inner) => $inner->where('company_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")->orWhere('contact_name', 'like', "%{$search}%"));
        }

        $customers = $query->orderByRaw("CASE status WHEN 'pending' THEN 0 ELSE 1 END")->orderByDesc('id')->get();

        $counts = [];
        foreach (['quotes', 'shipments', 'procurements', 'autosales', 'truckings', 'clearances'] as $table) {
            $counts[$table] = DB::table($table)->whereNotNull('customer_id')->selectRaw('customer_id, COUNT(*) as c')->groupBy('customer_id')->pluck('c', 'customer_id');
        }

        return response()->json($customers->map(function ($customer) use ($counts) {
            $records = 0;
            foreach ($counts as $perCustomer) {
                $records += (int) ($perCustomer[$customer->id] ?? 0);
            }

            return $this->presentCustomer($customer) + ['linked_records' => $records];
        })->values());
    }

    public function customer($id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $linked = [];
        foreach (array_keys(PortalService::services()) as $table) {
            $linked[$table] = DB::table($table)->where('customer_id', $customer->id)->count();
        }

        return response()->json($this->presentCustomer($customer) + [
            'users' => DB::table('customer_users')->where('customer_id', $customer->id)
                ->get(['id', 'name', 'email', 'phone', 'role', 'is_active', 'last_login_at']),
            'linked' => $linked,
            'linkable' => $this->portal->previewForCustomer($customer->id),
            'aliases' => $this->portal->aliasesFor($customer->id),
            'credit_entries' => DB::table('customer_credit_entries')->where('customer_id', $customer->id)->orderByDesc('id')->limit(50)->get(),
            'documents' => DB::table('customer_documents')->where('customer_id', $customer->id)->orderByDesc('id')
                ->get(['id', 'title', 'category', 'record_type', 'record_id', 'uploaded_by_admin', 'visible_to_customer', 'created_at']),
        ]);
    }

    private function presentCustomer(object $customer): array
    {
        $row = (array) $customer;
        unset($row['api_token_hash']);
        $row['has_api_token'] = !empty($customer->api_token_hash);
        $row['notification_prefs'] = $this->portal->notificationPrefs($customer);

        return $row;
    }

    public function createCustomer(Request $request)
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('customers', 'email'), Rule::unique('customer_users', 'email')],
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'password' => 'nullable|string|min:8',
            'credit_terms_days' => 'nullable|integer|min:0|max:365',
            'pricing_tier' => 'nullable|string|max:40',
            'send_welcome' => 'nullable|boolean',
            'alias_names' => 'nullable|array',
            'alias_names.*' => 'string|max:255',
            'alias_emails' => 'nullable|array',
            'alias_emails.*' => 'string|max:255',
            'write_back_email' => 'nullable|boolean',
        ]);

        $password = $validated['password'] ?? Str::password(12, true, true, false);
        $email = strtolower($validated['email']);

        if ($this->portal->isSharedEmail($email)) {
            return response()->json([
                'message' => "{$email} is a shared mailbox used on records of several clients. Use the business's own email address.",
            ], 422);
        }

        $customerId = DB::transaction(function () use ($validated, $password, $email) {
            $customerId = DB::table('customers')->insertGetId([
                'company_name' => $validated['company_name'],
                'contact_name' => $validated['contact_name'],
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'status' => 'active',
                'registered_via' => 'admin',
                'link_verified' => true,
                'credit_terms_days' => $validated['credit_terms_days'] ?? 0,
                'pricing_tier' => $validated['pricing_tier'] ?? 'standard',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('customer_users')->insert([
                'customer_id' => $customerId,
                'name' => $validated['contact_name'],
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($password),
                'role' => 'owner',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $customerId;
        });

        $aliasResult = $this->portal->addAliases($customerId, $validated['alias_names'] ?? [], $validated['alias_emails'] ?? []);
        $linked = $this->portal->syncRecords($customerId);
        $written = !empty($validated['write_back_email']) ? $this->portal->writeBackEmail($customerId, $email) : [];

        if (!empty($validated['send_welcome'])) {
            $customer = DB::table('customers')->where('id', $customerId)->first();
            $this->portal->notify($customer, 'Your OD Automotive portal account', "An account has been created for {$customer->company_name}. Sign in at " . url('/portal') . " with {$email} and the temporary password {$password}. Please change it after signing in.", 'ticket_updates');
        }

        return response()->json([
            'success' => true,
            'id' => $customerId,
            'temporary_password' => empty($validated['password']) ? $password : null,
            'linked' => $linked,
            'email_saved_on' => $written,
            'skipped' => $aliasResult['skipped'],
        ], 201);
    }

    public function updateCustomer(Request $request, $id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'contact_name' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:50',
            'address' => 'sometimes|nullable|string|max:500',
            'credit_terms_days' => 'sometimes|integer|min:0|max:365',
            'pricing_tier' => 'sometimes|string|max:40',
            'discount_percent' => 'sometimes|numeric|min:0|max:100',
            'approval_threshold' => 'sometimes|nullable|numeric|min:0',
            'admin_notes' => 'sometimes|nullable|string|max:2000',
        ]);

        DB::table('customers')->where('id', $customer->id)->update($validated + ['updated_at' => now()]);

        return $this->customer($customer->id);
    }

    public function setCustomerStatus(Request $request, $id)
    {
        $validated = $request->validate(['status' => ['required', Rule::in(['active', 'suspended', 'pending'])]]);

        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $update = ['status' => $validated['status'], 'updated_at' => now()];
        // An admin activating an account is the confirmation that its email may be linked to records.
        if ($validated['status'] === 'active') {
            $update['link_verified'] = true;
        }
        DB::table('customers')->where('id', $customer->id)->update($update);

        $linked = [];
        if ($validated['status'] === 'active') {
            $linked = $this->portal->syncRecords($customer->id);
            if ($customer->status === 'pending') {
                $fresh = DB::table('customers')->where('id', $customer->id)->first();
                $this->portal->notify($fresh, 'Your portal account is active', 'Your OD Automotive portal account has been approved. You can sign in now to see your services, invoices and documents.', 'ticket_updates');
            }
        }

        $this->portal->logActivity('manage_accounts', $this->adminName($request), "set portal account {$customer->company_name} to {$validated['status']}", 'Admin Dashboard');

        return response()->json(['success' => true, 'status' => $validated['status'], 'linked' => $linked]);
    }

    /** Unlinked clients found in legacy records, grouped by name, ready to become portal accounts. */
    public function legacyClients(Request $request)
    {
        $clients = $this->portal->legacyClients(trim((string) $request->query('search', '')) ?: null);

        return response()->json([
            'count' => count($clients),
            'unlinked_records' => array_sum(array_column($clients, 'total')),
            'clients' => $clients,
        ]);
    }

    /** Attach more names / emails to an account, then link what they match. */
    public function addAliases(Request $request, $id)
    {
        $validated = $request->validate([
            'names' => 'nullable|array',
            'names.*' => 'string|max:255',
            'emails' => 'nullable|array',
            'emails.*' => 'string|max:255',
            'write_back_email' => 'nullable|boolean',
        ]);

        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $result = $this->portal->addAliases($customer->id, $validated['names'] ?? [], $validated['emails'] ?? []);

        // Adding an alias is the admin's confirmation, so it also marks the account as link-verified.
        DB::table('customers')->where('id', $customer->id)->update(['link_verified' => true, 'updated_at' => now()]);
        $linked = $this->portal->syncRecords($customer->id);
        $written = !empty($validated['write_back_email']) ? $this->portal->writeBackEmail($customer->id, $customer->email) : [];

        return response()->json([
            'success' => true,
            'added' => $result['added'],
            'skipped' => $result['skipped'],
            'linked' => $linked,
            'email_saved_on' => $written,
        ]);
    }

    public function removeAlias($id, $aliasId)
    {
        // Records already linked stay linked; the alias just stops matching new ones.
        DB::table('customer_aliases')->where('id', $aliasId)->where('customer_id', $id)->delete();

        return response()->json(['success' => true]);
    }

    public function linkRecords($id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        DB::table('customers')->where('id', $customer->id)->update(['link_verified' => true, 'updated_at' => now()]);

        return response()->json(['success' => true, 'linked' => $this->portal->syncRecords($customer->id, true)]);
    }

    /** Link or unlink one specific record, for the cases email matching cannot cover. */
    public function assignRecord(Request $request, $id)
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(array_column(PortalService::services(), 'type'))],
            'record_id' => 'required|integer',
            'unlink' => 'nullable|boolean',
        ]);

        $customer = DB::table('customers')->where('id', $id)->first();
        $table = PortalService::tableForType($validated['type']);
        if (!$customer || !$table || !DB::table($table)->where('id', $validated['record_id'])->exists()) {
            return response()->json(['message' => 'Customer or record not found.'], 404);
        }

        DB::table($table)->where('id', $validated['record_id'])
            ->update(['customer_id' => !empty($validated['unlink']) ? null : $customer->id]);

        return response()->json(['success' => true]);
    }

    public function resetCustomerPassword(Request $request, $id)
    {
        $validated = $request->validate(['user_id' => 'nullable|integer', 'password' => 'nullable|string|min:8']);
        $user = DB::table('customer_users')->where('customer_id', $id)
            ->when($validated['user_id'] ?? null, fn($query, $userId) => $query->where('id', $userId))
            ->orderBy('id')->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $password = $validated['password'] ?? Str::password(12, true, true, false);
        DB::table('customer_users')->where('id', $user->id)->update(['password' => Hash::make($password), 'updated_at' => now()]);

        return response()->json(['success' => true, 'email' => $user->email, 'temporary_password' => $password]);
    }

    public function deleteCustomer(Request $request, $id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        // Service records stay; they simply stop being linked to this account.
        foreach (array_merge(array_keys(PortalService::services()), ['invoices']) as $table) {
            DB::table($table)->where('customer_id', $customer->id)->update(['customer_id' => null]);
        }

        $paths = DB::table('customer_documents')->where('customer_id', $customer->id)->pluck('path')->all();
        Storage::disk('local')->delete($paths);
        DB::table('customers')->where('id', $customer->id)->delete();

        $this->portal->logActivity('person_remove', $this->adminName($request), "deleted portal account {$customer->company_name}", 'Admin Dashboard');

        return response()->json(['success' => true]);
    }

    // -------------------------------------------------------------- credit ledger

    public function addCredit(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|not_in:0',
            'description' => 'nullable|string|max:255',
        ]);

        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $current = $this->portal->creditBalance($customer->id);
        if ($current + (float) $validated['amount'] < -0.009) {
            return response()->json(['message' => 'That would take the credit balance below zero.'], 422);
        }

        DB::table('customer_credit_entries')->insert([
            'customer_id' => $customer->id,
            'amount' => $validated['amount'],
            'type' => $validated['amount'] > 0 ? 'deposit' : 'adjustment',
            'description' => $validated['description'] ?? null,
            'created_by' => $this->adminName($request),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $balance = $this->portal->refreshCreditBalance($customer->id);

        if ($validated['amount'] > 0) {
            $this->portal->notify(DB::table('customers')->where('id', $customer->id)->first(), 'Account credit added', 'A credit of ' . number_format((float) $validated['amount'], 2) . ' was added to your OD Automotive account. New balance: ' . number_format($balance, 2) . '.', 'payment_updates');
        }

        return response()->json(['success' => true, 'credit_balance' => $balance]);
    }

    // ------------------------------------------------------------------ payments

    public function payments(Request $request)
    {
        $payments = DB::table('payments')
            ->leftJoin('invoices', 'invoices.id', '=', 'payments.invoice_id')
            ->leftJoin('customers', 'customers.id', '=', 'payments.customer_id')
            ->when($request->query('status'), fn($query, $status) => $query->where('payments.status', $status))
            ->orderByRaw("CASE payments.status WHEN 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('payments.id')
            ->limit(300)
            ->get([
                'payments.*', 'invoices.invoice_number', 'invoices.amount as invoice_amount', 'invoices.amount_paid as invoice_paid',
                'customers.company_name',
            ]);

        return response()->json($payments->map(function ($payment) {
            $row = (array) $payment;
            $row['has_proof'] = !empty($payment->proof_path);
            unset($row['proof_path']);

            return $row;
        })->values());
    }

    public function reviewPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['confirm', 'reject'])],
            'note' => 'nullable|string|max:500',
        ]);

        $payment = DB::table('payments')->where('id', $id)->first();
        if (!$payment || $payment->status !== 'pending') {
            return response()->json(['message' => 'This payment has already been reviewed.'], 422);
        }

        $confirm = $validated['decision'] === 'confirm';

        DB::transaction(function () use ($payment, $validated, $confirm, $request) {
            DB::table('payments')->where('id', $payment->id)->update([
                'status' => $confirm ? 'confirmed' : 'rejected',
                'reviewed_by' => $this->adminName($request),
                'reviewed_at' => now(),
                'review_note' => $validated['note'] ?? null,
                'updated_at' => now(),
            ]);
            $this->portal->recalculateInvoice($payment->invoice_id);
        });

        $customer = $payment->customer_id ? DB::table('customers')->where('id', $payment->customer_id)->first() : null;
        $invoice = DB::table('invoices')->where('id', $payment->invoice_id)->first();
        $this->portal->notify(
            $customer,
            $confirm ? 'Payment confirmed' : 'Payment could not be confirmed',
            $confirm
                ? 'Your payment of ' . number_format((float) $payment->amount, 2) . " for invoice {$invoice->invoice_number} has been confirmed. Receipt {$payment->receipt_number}."
                : 'We could not confirm your payment of ' . number_format((float) $payment->amount, 2) . " for invoice {$invoice->invoice_number}." . (!empty($validated['note']) ? ' Reason: ' . $validated['note'] : ''),
            'payment_updates'
        );

        return response()->json(['success' => true, 'status' => $confirm ? 'confirmed' : 'rejected']);
    }

    /** Record money received offline (cash/POS at the office, wire seen in the bank statement). */
    public function recordPayment(Request $request, $invoiceId)
    {
        $validated = $request->validate([
            'method' => ['required', Rule::in(['bank_transfer', 'swift_wire', 'usdt', 'cash_pos'])],
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
        ]);

        $invoice = DB::table('invoices')->where('id', $invoiceId)->first();
        if (!$invoice || $invoice->status === 'void') {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        $balance = round((float) $invoice->amount - (float) $invoice->amount_paid, 2);
        if ((float) $validated['amount'] - $balance > 0.009) {
            return response()->json(['message' => 'The amount is more than the outstanding balance of ' . number_format($balance, 2) . '.'], 422);
        }

        DB::table('payments')->insert([
            'receipt_number' => 'PAY-' . date('Y') . '-' . str_pad((string) ((int) DB::table('payments')->max('id') + 1), 6, '0', STR_PAD_LEFT),
            'invoice_id' => $invoice->id,
            'customer_id' => $invoice->customer_id,
            'method' => $validated['method'],
            'amount' => $validated['amount'],
            'currency' => $invoice->currency ?: 'NGN',
            'reference' => $validated['reference'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => 'confirmed',
            'reviewed_by' => $this->adminName($request),
            'reviewed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->portal->recalculateInvoice($invoice->id);

        return response()->json(['success' => true]);
    }

    public function paymentProof($id)
    {
        $payment = DB::table('payments')->where('id', $id)->first();
        if (!$payment || !$payment->proof_path || !Storage::disk('local')->exists($payment->proof_path)) {
            return response()->json(['message' => 'Proof not found.'], 404);
        }

        return Storage::disk('local')->download($payment->proof_path);
    }

    public function invoices(Request $request)
    {
        $rows = DB::table('invoices')
            ->leftJoin('customers', 'customers.id', '=', 'invoices.customer_id')
            ->when($request->query('status'), fn($query, $status) => $query->where('invoices.status', $status))
            ->when($request->query('customer_id'), fn($query, $customerId) => $query->where('invoices.customer_id', $customerId))
            ->orderByDesc('invoices.id')->limit(300)
            ->get(['invoices.id', 'invoices.invoice_number', 'invoices.customer_name', 'invoices.customer_id', 'invoices.service_label', 'invoices.amount', 'invoices.amount_paid', 'invoices.currency', 'invoices.status', 'invoices.date_issued', 'invoices.due_date', 'customers.company_name']);

        return response()->json($rows);
    }

    public function updateInvoice(Request $request, $id)
    {
        $validated = $request->validate([
            'due_date' => 'sometimes|nullable|date',
            'status' => ['sometimes', Rule::in(['unpaid', 'void'])],
            'customer_id' => 'sometimes|nullable|integer|exists:customers,id',
        ]);

        $invoice = DB::table('invoices')->where('id', $id)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        DB::table('invoices')->where('id', $invoice->id)->update($validated + ['updated_at' => now()]);
        if (isset($validated['status']) && $validated['status'] === 'unpaid') {
            $this->portal->recalculateInvoice($invoice->id);
        }

        return response()->json(['success' => true]);
    }

    // -------------------------------------------------------- requests and quotes

    public function requests()
    {
        $requests = DB::table('portal_requests')
            ->join('customers', 'customers.id', '=', 'portal_requests.customer_id')
            ->orderByDesc('portal_requests.id')->limit(200)
            ->get(['portal_requests.*', 'customers.company_name'])
            ->map(function ($row) {
                $row->payload = json_decode($row->payload, true);

                return $row;
            });

        $quotes = DB::table('quotes')->whereNotNull('customer_id')->orderByDesc('id')->limit(200)->get()
            ->map(fn($quote) => (array) $quote + [
                'company_name' => DB::table('customers')->where('id', $quote->customer_id)->value('company_name'),
            ]);

        return response()->json(['requests' => $requests, 'quotes' => $quotes]);
    }

    public function priceQuote(Request $request, $id)
    {
        $validated = $request->validate([
            'quoted_amount' => 'required|numeric|min:0',
            'quote_notes' => 'nullable|string|max:2000',
        ]);

        $quote = DB::table('quotes')->where('id', $id)->first();
        if (!$quote || $quote->status !== 'pending') {
            return response()->json(['message' => 'Only pending quotes can be priced.'], 422);
        }

        DB::table('quotes')->where('id', $quote->id)->update($validated + [
            'customer_response' => null,
            'customer_responded_at' => null,
            'updated_at' => now(),
        ]);

        $customer = $quote->customer_id ? DB::table('customers')->where('id', $quote->customer_id)->first() : null;
        $this->portal->notify(
            $customer,
            'Your quote is ready',
            'Your quote for ' . trim("{$quote->vehicle_year} {$quote->vehicle_make} {$quote->vehicle_model}") . ' is ' . number_format((float) $validated['quoted_amount'], 2) . '. Sign in to your portal to accept or decline it.',
            'shipment_updates'
        );

        return response()->json(['success' => true]);
    }

    // ------------------------------------------------------------------- tickets

    public function tickets(Request $request)
    {
        $tickets = DB::table('support_tickets')
            ->join('customers', 'customers.id', '=', 'support_tickets.customer_id')
            ->when($request->query('status'), fn($query, $status) => $query->where('support_tickets.status', $status))
            ->orderByRaw("CASE support_tickets.status WHEN 'open' THEN 0 WHEN 'answered' THEN 1 ELSE 2 END")
            ->orderByDesc('support_tickets.last_message_at')
            ->limit(200)->get(['support_tickets.*', 'customers.company_name']);

        return response()->json($tickets);
    }

    public function ticket($id)
    {
        $ticket = DB::table('support_tickets')->where('id', $id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        return response()->json([
            'ticket' => $ticket,
            'company_name' => DB::table('customers')->where('id', $ticket->customer_id)->value('company_name'),
            'messages' => DB::table('support_ticket_messages')->where('ticket_id', $ticket->id)->orderBy('id')->get(),
        ]);
    }

    public function replyTicket(Request $request, $id)
    {
        $validated = $request->validate(['body' => 'required|string|max:5000', 'close' => 'nullable|boolean']);
        $ticket = DB::table('support_tickets')->where('id', $id)->first();
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        DB::table('support_ticket_messages')->insert([
            'ticket_id' => $ticket->id,
            'sender_type' => 'admin',
            'sender_name' => $this->adminName($request),
            'body' => $validated['body'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('support_tickets')->where('id', $ticket->id)->update([
            'status' => !empty($validated['close']) ? 'closed' : 'answered',
            'last_message_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = DB::table('customers')->where('id', $ticket->customer_id)->first();
        $this->portal->notify($customer, "Reply on {$ticket->ticket_number}", "OD Automotive replied to your ticket \"{$ticket->subject}\". Sign in to read it.", 'ticket_updates');

        return response()->json(['success' => true]);
    }

    public function setTicketStatus(Request $request, $id)
    {
        $validated = $request->validate(['status' => ['required', Rule::in(['open', 'answered', 'closed'])]]);
        DB::table('support_tickets')->where('id', $id)->update(['status' => $validated['status'], 'updated_at' => now()]);

        return response()->json(['success' => true]);
    }

    // ----------------------------------------------------------------- documents

    public function uploadDocument(Request $request, $id)
    {
        $customer = DB::table('customers')->where('id', $id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx',
            'title' => 'nullable|string|max:255',
            'category' => ['nullable', Rule::in(['bill_of_lading', 'customs', 'photos', 'invoice', 'other'])],
            'record_type' => ['nullable', Rule::in(['shipments', 'procurements', 'autosales', 'truckings', 'clearances', 'quotes', 'auction_requests'])],
            'record_id' => 'nullable|integer',
            'visible_to_customer' => 'nullable|boolean',
        ]);

        $file = $request->file('file');
        $path = $file->store('portal/documents/' . $customer->id, 'local');

        $documentId = DB::table('customer_documents')->insertGetId([
            'customer_id' => $customer->id,
            'uploaded_by_admin' => $this->adminName($request),
            'record_type' => $validated['record_type'] ?? null,
            'record_id' => $validated['record_id'] ?? null,
            'category' => $validated['category'] ?? 'other',
            'title' => $validated['title'] ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'visible_to_customer' => $validated['visible_to_customer'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'id' => $documentId], 201);
    }

    public function downloadDocument($documentId)
    {
        $doc = DB::table('customer_documents')->where('id', $documentId)->first();
        if (!$doc || !Storage::disk('local')->exists($doc->path)) {
            return response()->json(['message' => 'Document not found.'], 404);
        }

        return Storage::disk('local')->download($doc->path, $doc->title . '.' . pathinfo($doc->path, PATHINFO_EXTENSION));
    }

    public function deleteDocument($documentId)
    {
        $doc = DB::table('customer_documents')->where('id', $documentId)->first();
        if ($doc) {
            Storage::disk('local')->delete($doc->path);
            DB::table('customer_documents')->where('id', $doc->id)->delete();
        }

        return response()->json(['success' => true]);
    }

    public function summary()
    {
        return response()->json([
            'pending_accounts' => DB::table('customers')->where('status', 'pending')->count(),
            'pending_payments' => DB::table('payments')->where('status', 'pending')->count(),
            'open_tickets' => DB::table('support_tickets')->where('status', 'open')->count(),
            'quotes_to_price' => DB::table('quotes')->whereNotNull('customer_id')->where('status', 'pending')->whereNull('quoted_amount')->count(),
            'awaiting_customer' => DB::table('portal_requests')->where('status', 'awaiting_approval')->count(),
        ]);
    }
}
