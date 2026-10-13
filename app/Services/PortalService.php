<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Shared behaviour for the customer (business) portal: settings, linking existing
 * service records to a customer, the unified service history, alerts and analytics.
 */
class PortalService
{
    public const REGISTRATION_MODES = ['open', 'approval', 'admin_only'];

    /** Per-service description of how a table maps onto the customer's history. */
    private const SERVICES = [
        'quotes' => [
            'type' => 'quote', 'label' => 'Quote',
            'email' => 'email', 'name' => 'customer_name',
            'fields' => ['id', 'service', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'origin', 'destination', 'customer_name', 'email', 'phone', 'status', 'quoted_amount', 'quote_notes', 'customer_response', 'customer_responded_at', 'created_at'],
        ],
        'shipments' => [
            'type' => 'shipment', 'label' => 'Shipment',
            'email' => 'customer_email', 'name' => 'customer_name',
            'fields' => ['id', 'tracking_number', 'reference_number', 'customer_name', 'customer_email', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_vin', 'vin', 'car_model', 'year', 'car_color', 'image_link', 'origin_port', 'origin_country', 'destination_port', 'destination_country', 'shipping_provider', 'vessel_name', 'container_number', 'booking_number', 'status', 'progress_percentage', 'shipping_date', 'departure_date', 'estimated_arrival_date', 'eta', 'actual_arrival_date', 'delivery_date', 'total_cost', 'shipping_fee', 'shipping_fee_status', 'created_at'],
        ],
        'procurements' => [
            'type' => 'procurement', 'label' => 'Procurement',
            'email' => 'customer_email', 'name' => 'customer_name',
            'fields' => ['id', 'customer_name', 'customer_email', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'car_make', 'car_model', 'car_year', 'year', 'car_color', 'color', 'vin', 'image_link', 'auction_site', 'shipping_type', 'trucking_fee_status', 'status', 'origin_port', 'origin_country', 'destination_port', 'destination_country', 'date_procured', 'arrival_date', 'eta', 'amount', 'price_usd', 'created_at'],
        ],
        'autosales' => [
            'type' => 'autosale', 'label' => 'Autosale',
            'email' => 'customer_email', 'name' => 'customer_name',
            'fields' => ['id', 'customer_name', 'customer_email', 'sale_date', 'car_make', 'car_model', 'car_year', 'color', 'vin', 'sale_type', 'shipping_type', 'amount', 'created_at'],
        ],
        'truckings' => [
            'type' => 'trucking', 'label' => 'Trucking',
            'email' => 'customer_email', 'name' => 'customer_name',
            'fields' => ['id', 'customer_name', 'customer_email', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'car_make', 'car_model', 'car_year', 'color', 'vin', 'auction_site', 'shipping_type', 'trucking_date', 'payment_status', 'shipment_status', 'status', 'location', 'tracking', 'origin_port', 'origin_country', 'destination_port', 'destination_country', 'amount', 'trucking_fee_status', 'created_at'],
        ],
        'clearances' => [
            'type' => 'clearance', 'label' => 'Clearance',
            'email' => 'client_email', 'name' => 'client_name',
            'fields' => ['id', 'item', 'client_name', 'client_email', 'status', 'date_stamp', 'total_paid', 'created_at'],
        ],
        'auction_requests' => [
            'type' => 'auction', 'label' => 'Auction request',
            'email' => 'customer_email', 'name' => 'customer_name',
            'fields' => ['id', 'customer_name', 'customer_email', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'max_budget', 'additional_requirements', 'status', 'created_at'],
        ],
    ];

    public static function services(): array
    {
        return self::SERVICES;
    }

    public static function tableForType(string $type): ?string
    {
        foreach (self::SERVICES as $table => $config) {
            if ($config['type'] === $type) {
                return $table;
            }
        }

        return null;
    }

    // ------------------------------------------------------------------ settings

    public function setting(string $key, $default = null)
    {
        $value = DB::table('settings')->where('key', $key)->value('value');

        return $value === null ? $default : $value;
    }

    public function putSetting(string $key, ?string $value): void
    {
        $exists = DB::table('settings')->where('key', $key)->exists();
        if ($exists) {
            DB::table('settings')->where('key', $key)->update(['value' => $value, 'updated_at' => now()]);
        } else {
            DB::table('settings')->insert(['key' => $key, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function isEnabled(): bool
    {
        return (string) $this->setting('portal_enabled', '1') === '1';
    }

    public function registrationMode(): string
    {
        $mode = $this->setting('portal_registration_mode', 'approval');

        return in_array($mode, self::REGISTRATION_MODES, true) ? $mode : 'approval';
    }

    public function requestableServices(): array
    {
        $decoded = json_decode((string) $this->setting('portal_requestable_services', '[]'), true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    public function tiers(): array
    {
        $decoded = json_decode((string) $this->setting('portal_tiers', '[]'), true);

        return is_array($decoded) ? $decoded : [];
    }

    /** Every payment method known to the portal, enabled or not. */
    public function allPaymentMethods(): array
    {
        $decoded = json_decode((string) $this->setting('portal_payment_methods', '[]'), true);

        return is_array($decoded) ? $decoded : [];
    }

    /** Methods a customer can actually use today. Gateway methods stay hidden until integrated. */
    public function customerPaymentMethods(): array
    {
        return array_values(array_filter($this->allPaymentMethods(), function ($method) {
            return !empty($method['enabled']) && ($method['kind'] ?? '') !== 'gateway';
        }));
    }

    public function branding(): array
    {
        return [
            'registration_mode' => $this->registrationMode(),
            'enabled' => $this->isEnabled(),
            'requestable_services' => $this->requestableServices(),
            'currency' => $this->setting('portal_default_currency', 'NGN'),
        ];
    }

    // ------------------------------------------------------------------- linking

    /**
     * Link unlinked service records to the customer by email. Only trusted customers
     * (created or confirmed by an admin) are linked, so a self-registered account can
     * never claim somebody else's records by typing their email address.
     *
     * @return array<string,int> number of newly linked records per table
     */
    public function syncRecords(int $customerId, bool $force = false): array
    {
        $customer = DB::table('customers')->where('id', $customerId)->first();
        if (!$customer) {
            return [];
        }

        $linked = [];

        // Shipments born from this customer's own quotes are linked explicitly, not by email.
        if (Schema::hasColumn('shipments', 'customer_id')) {
            $count = DB::table('shipments')->whereNull('customer_id')
                ->whereIn('quote_id', fn($query) => $query->select('id')->from('quotes')->where('customer_id', $customerId))
                ->update(['customer_id' => $customerId]);
            if ($count) {
                $linked['shipments'] = $count;
            }
        }

        if (!$customer->link_verified && !$force) {
            return $linked;
        }

        // Emails (never shared/placeholder ones) and the exact client names an admin attached.
        [$emails, $names] = $this->matchTerms($customer);

        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id')) {
                continue;
            }

            $count = $this->unlinkedMatches($table, $config, $emails, $names)->update(['customer_id' => $customerId]);

            if ($count) {
                $linked[$table] = ($linked[$table] ?? 0) + $count;
            }
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'customer_id')) {
            $count = DB::table('invoices')
                ->whereNull('customer_id')
                ->where(function ($query) use ($emails, $names) {
                    $query->whereRaw('1 = 0');
                    if ($emails) {
                        $query->orWhereIn(DB::raw('LOWER(TRIM(customer_email))'), $emails);
                    }
                    if ($names) {
                        $query->orWhereIn(DB::raw('LOWER(TRIM(customer_name))'), $names);
                    }
                })
                ->update(['customer_id' => $customerId]);

            foreach (self::SERVICES as $table => $config) {
                if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id')) {
                    continue;
                }
                $count += DB::table('invoices')
                    ->whereNull('customer_id')
                    ->where('record_type', $table)
                    ->whereIn('record_id', function ($query) use ($table, $customerId) {
                        $query->select('id')->from($table)->where('customer_id', $customerId);
                    })
                    ->update(['customer_id' => $customerId]);
            }

            if ($count) {
                $linked['invoices'] = $count;
            }
        }

        return $linked;
    }

    /** How many unlinked records an email address would match, for the admin's review. */
    public function previewLinkable(string $email): array
    {
        $needle = strtolower(trim($email));
        $matches = [];

        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, $config['email'])) {
                continue;
            }
            $matches[$table] = DB::table($table)
                ->whereRaw('LOWER(' . $config['email'] . ') = ?', [$needle])
                ->when(Schema::hasColumn($table, 'customer_id'), fn($query) => $query->whereNull('customer_id'))
                ->count();
        }

        return $matches;
    }

    // ------------------------------------------------------- legacy clients/aliases

    /** Titles that precede a name on legacy records ("MR SAHEED" and "SAHEED" are one person). */
    private const NAME_TITLES = ['mr', 'mrs', 'ms', 'miss', 'dr', 'eng', 'engr', 'capt', 'captain', 'chief', 'alhaji', 'alh', 'hajia', 'prince'];

    /** Names that stand for "some customer", never for one business. */
    private const GENERIC_NAME_KEYS = ['walkin', 'walkincustomer', 'walkinclient', 'walkincustomers', 'customer', 'customers', 'client', 'unknown', 'na', 'none', 'cash', 'cashcustomer', 'test', 'noname'];

    /** Trading suffixes dropped when looking for names that probably belong to one business. */
    private const BUSINESS_SUFFIXES = ['auto', 'autos', 'automobile', 'automobiles', 'automotive', 'motors', 'motor', 'ltd', 'limited', 'enterprise', 'enterprises', 'ventures', 'global', 'nig', 'nigeria', 'trading', 'trade', 'company', 'co', 'int', 'intl', 'international', 'concept', 'concepts', 'services', 'logistics'];

    /** An email used on records of this many different clients is a shared/placeholder mailbox. */
    private const SHARED_EMAIL_NAME_THRESHOLD = 3;

    /** Grouping key that treats spelling, spacing and title variants of one name as the same. */
    public static function nameKey(string $name): string
    {
        $words = preg_split('/[^a-z0-9]+/', strtolower(trim($name)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        while ($words && in_array($words[0], self::NAME_TITLES, true)) {
            array_shift($words);
        }

        return implode('', $words);
    }

    /** Like nameKey() but also ignores trailing trading words, to suggest related spellings. */
    public static function familyKey(string $name): string
    {
        $words = preg_split('/[^a-z0-9]+/', strtolower(trim($name)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        while ($words && in_array($words[0], self::NAME_TITLES, true)) {
            array_shift($words);
        }
        while (count($words) > 1 && in_array(end($words), self::BUSINESS_SUFFIXES, true)) {
            array_pop($words);
        }

        return implode('', $words);
    }

    public static function isGenericName(string $name): bool
    {
        $key = self::nameKey($name);

        return $key === '' || in_array($key, self::GENERIC_NAME_KEYS, true);
    }

    /** Alias values are matched case-insensitively against trimmed record values. */
    public static function aliasValue(string $value): string
    {
        return strtolower(trim($value));
    }

    /**
     * Emails that appear on records of several unrelated clients (for example the
     * address OD's own system uses when a client has none). They must never link records.
     *
     * @return array<string,int> email => number of distinct clients using it
     */
    public function sharedEmails(bool $fresh = false): array
    {
        if (!$fresh) {
            return Cache::remember('portal.shared_emails', 300, fn() => $this->sharedEmails(true));
        }

        $names = [];
        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, $config['email'])) {
                continue;
            }
            $rows = DB::table($table)->whereNotNull($config['email'])->where($config['email'], '!=', '')
                ->get([$config['email'] . ' as e', $config['name'] . ' as n']);
            foreach ($rows as $row) {
                $key = self::nameKey((string) $row->n);
                if ($key !== '') {
                    $names[strtolower(trim((string) $row->e))][$key] = true;
                }
            }
        }

        $shared = [];
        foreach ($names as $email => $keys) {
            if (count($keys) >= self::SHARED_EMAIL_NAME_THRESHOLD) {
                $shared[$email] = count($keys);
            }
        }

        // OD's own mailboxes can never belong to a client.
        foreach (['office_email', 'contact_email'] as $key) {
            $own = strtolower(trim((string) $this->setting($key, '')));
            if ($own !== '') {
                $shared[$own] = max($shared[$own] ?? 0, 1);
            }
        }
        $from = strtolower(trim((string) config('mail.from.address', '')));
        if ($from !== '') {
            $shared[$from] = max($shared[$from] ?? 0, 1);
        }

        return $shared;
    }

    public function isSharedEmail(string $email): bool
    {
        return array_key_exists(strtolower(trim($email)), $this->sharedEmails(true));
    }

    /**
     * Clients found in legacy records that are not yet linked to a portal account,
     * grouped by name so spelling variants appear together.
     */
    public function legacyClients(?string $search = null): array
    {
        $shared = $this->sharedEmails(true);
        $groups = [];

        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id') || !Schema::hasColumn($table, $config['email'])) {
                continue;
            }

            $rows = DB::table($table)->whereNull('customer_id')->get([$config['name'] . ' as n', $config['email'] . ' as e']);
            foreach ($rows as $row) {
                $name = trim((string) $row->n);
                $email = strtolower(trim((string) $row->e));
                if ($name === '' && $email === '') {
                    continue;
                }

                $key = $name !== '' ? self::nameKey($name) : '';
                $key = $key !== '' ? $key : ($email !== '' ? 'email:' . $email : 'raw:' . strtolower($name));

                $group = &$groups[$key];
                $group['key'] = $key;
                $group['generic'] = $name !== '' && self::isGenericName($name);
                if ($name !== '') {
                    $label = $name;
                    $group['variants'][$label]['name'] = $label;
                    $group['variants'][$label]['value'] = self::aliasValue($label);
                    $group['variants'][$label]['count'] = ($group['variants'][$label]['count'] ?? 0) + 1;
                }
                if ($email !== '') {
                    $group['emails'][$email]['email'] = $email;
                    $group['emails'][$email]['count'] = ($group['emails'][$email]['count'] ?? 0) + 1;
                    $group['emails'][$email]['shared'] = array_key_exists($email, $shared);
                }
                $group['tables'][$table] = ($group['tables'][$table] ?? 0) + 1;
                $group['total'] = ($group['total'] ?? 0) + 1;
                unset($group);
            }
        }

        $taken = DB::table('customer_aliases')->get(['type', 'value'])->groupBy('type')->map(fn($rows) => $rows->pluck('value')->all());
        $takenNames = $taken->get('name', []);

        $clients = [];
        foreach ($groups as $group) {
            $variants = collect($group['variants'] ?? [])->sortByDesc('count')->values()->map(function ($variant) use ($takenNames) {
                $variant['taken'] = in_array($variant['value'], $takenNames, true);

                return $variant;
            });
            $emails = collect($group['emails'] ?? [])->sortByDesc('count')->values();
            $usable = $emails->where('shared', false);

            $client = [
                'key' => $group['key'],
                'display' => $variants->first()['name'] ?? ($emails->first()['email'] ?? 'Unknown'),
                'variants' => $variants->all(),
                'emails' => $emails->all(),
                'suggested_email' => $usable->count() === 1 ? $usable->first()['email'] : null,
                'tables' => $group['tables'],
                'total' => $group['total'],
                'generic' => (bool) $group['generic'],
                'shared_email_only' => $emails->count() > 0 && $usable->isEmpty(),
            ];

            if ($search) {
                $haystack = strtolower($client['display'] . ' ' . $variants->pluck('name')->implode(' ') . ' ' . $emails->pluck('email')->implode(' '));
                if (!str_contains($haystack, strtolower($search))) {
                    continue;
                }
            }

            $clients[] = $client;
        }

        // Suggest groups that probably belong to the same business ("BILLION TREND" / "BILLION TREND AUTOS").
        $families = [];
        foreach ($clients as $index => $client) {
            $family = self::familyKey($client['display']);
            if ($family !== '' && !$client['generic']) {
                $families[$family][] = $index;
            }
        }
        foreach ($families as $indexes) {
            if (count($indexes) < 2) {
                continue;
            }
            foreach ($indexes as $index) {
                $clients[$index]['related'] = collect($indexes)->reject(fn($other) => $other === $index)->map(fn($other) => [
                    'display' => $clients[$other]['display'],
                    'variants' => $clients[$other]['variants'],
                    'total' => $clients[$other]['total'],
                ])->values()->all();
            }
        }
        foreach ($clients as &$client) {
            $client['related'] ??= [];
        }
        unset($client);

        usort($clients, fn($a, $b) => [$a['generic'], $b['total']] <=> [$b['generic'], $a['total']]);

        return $clients;
    }

    public function aliasesFor(int $customerId): array
    {
        return DB::table('customer_aliases')->where('customer_id', $customerId)->orderBy('type')->orderBy('label')
            ->get(['id', 'type', 'value', 'label'])->all();
    }

    /**
     * Attach names and extra emails to a customer so their records are linked.
     *
     * @return array{added:int,skipped:array<int,string>}
     */
    public function addAliases(int $customerId, array $names = [], array $emails = []): array
    {
        $shared = $this->sharedEmails(true);
        $added = 0;
        $skipped = [];

        foreach ($names as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }
            if (self::isGenericName($name)) {
                $skipped[] = "\"{$name}\" is too generic to belong to one business";
                continue;
            }
            $added += $this->insertAlias($customerId, 'name', $name, $skipped);
        }

        foreach ($emails as $email) {
            $email = strtolower(trim((string) $email));
            if ($email === '') {
                continue;
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped[] = "\"{$email}\" is not a valid email";
                continue;
            }
            if (array_key_exists($email, $shared)) {
                $skipped[] = "{$email} is a shared mailbox used by several clients";
                continue;
            }
            $added += $this->insertAlias($customerId, 'email', $email, $skipped);
        }

        return ['added' => $added, 'skipped' => $skipped];
    }

    private function insertAlias(int $customerId, string $type, string $label, array &$skipped): int
    {
        $value = self::aliasValue($label);
        $existing = DB::table('customer_aliases')->where('type', $type)->where('value', $value)->first();

        if ($existing) {
            if ((int) $existing->customer_id !== $customerId) {
                $skipped[] = "\"{$label}\" already belongs to another account";
            }

            return 0;
        }

        DB::table('customer_aliases')->insert([
            'customer_id' => $customerId, 'type' => $type, 'value' => $value, 'label' => $label,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return 1;
    }

    /** Records that would be linked to this customer by its email and aliases, per table. */
    public function previewForCustomer(int $customerId): array
    {
        $customer = DB::table('customers')->where('id', $customerId)->first();
        if (!$customer) {
            return [];
        }

        [$emails, $names] = $this->matchTerms($customer);
        $matches = [];

        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id')) {
                continue;
            }
            $matches[$table] = $this->unlinkedMatches($table, $config, $emails, $names)->count();
        }

        return $matches;
    }

    /** @return array{0:array<int,string>,1:array<int,string>} lower-cased emails and names to match */
    private function matchTerms(object $customer): array
    {
        $shared = $this->sharedEmails();

        $emails = DB::table('customer_users')->where('customer_id', $customer->id)->pluck('email')
            ->push($customer->email)
            ->merge(DB::table('customer_aliases')->where('customer_id', $customer->id)->where('type', 'email')->pluck('value'))
            ->map(fn($email) => strtolower(trim((string) $email)))
            ->filter(fn($email) => $email !== '' && !array_key_exists($email, $shared))
            ->unique()->values()->all();

        $names = DB::table('customer_aliases')->where('customer_id', $customer->id)->where('type', 'name')->pluck('value')
            ->map(fn($name) => strtolower(trim((string) $name)))->filter()->unique()->values()->all();

        return [$emails, $names];
    }

    private function unlinkedMatches(string $table, array $config, array $emails, array $names)
    {
        return DB::table($table)->whereNull('customer_id')->where(function ($query) use ($config, $emails, $names, $table) {
            $any = false;
            if ($emails && Schema::hasColumn($table, $config['email'])) {
                $query->whereIn(DB::raw('LOWER(TRIM(' . $config['email'] . '))'), $emails);
                $any = true;
            }
            if ($names && Schema::hasColumn($table, $config['name'])) {
                $query->orWhereIn(DB::raw('LOWER(TRIM(' . $config['name'] . '))'), $names);
                $any = true;
            }
            if (!$any) {
                $query->whereRaw('1 = 0');
            }
        });
    }

    /**
     * Save the customer's real email on linked records that have none (or only a shared
     * placeholder), so shipment emails and SMS actually reach the business.
     *
     * @return array<string,int> rows updated per table
     */
    public function writeBackEmail(int $customerId, string $email): array
    {
        $email = strtolower(trim($email));
        $shared = array_keys($this->sharedEmails(true));
        $updated = [];

        foreach (self::SERVICES as $table => $config) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id') || !Schema::hasColumn($table, $config['email'])) {
                continue;
            }

            $count = DB::table($table)->where('customer_id', $customerId)->where(function ($query) use ($config, $shared) {
                $query->whereNull($config['email'])->orWhere($config['email'], '');
                if ($shared) {
                    $query->orWhereIn(DB::raw('LOWER(TRIM(' . $config['email'] . '))'), $shared);
                }
            })->update([$config['email'] => $email]);

            if ($count) {
                $updated[$table] = $count;
            }
        }

        return $updated;
    }

    // ----------------------------------------------------------------- customers

    public function newInvoiceNumber(): string
    {
        return 'INV-' . date('Y') . '-' . str_pad(DB::table('invoices')->count() + 1, 6, '0', STR_PAD_LEFT);
    }

    public function creditBalance(int $customerId): float
    {
        return round((float) DB::table('customer_credit_entries')->where('customer_id', $customerId)->sum('amount'), 2);
    }

    public function refreshCreditBalance(int $customerId): float
    {
        $balance = $this->creditBalance($customerId);
        DB::table('customers')->where('id', $customerId)->update(['credit_balance' => $balance, 'updated_at' => now()]);

        return $balance;
    }

    public function notificationPrefs(?object $customer): array
    {
        $defaults = ['email' => true, 'sms' => true, 'whatsapp' => true, 'shipment_updates' => true, 'payment_updates' => true, 'ticket_updates' => true];
        $stored = $customer && $customer->notification_prefs ? json_decode($customer->notification_prefs, true) : [];

        return array_merge($defaults, is_array($stored) ? $stored : []);
    }

    /**
     * Send a portal notice through the customer's preferred channels.
     * Never throws: notifications must not break the action that triggered them.
     */
    public function notify(?object $customer, string $subject, string $message, string $category = 'shipment_updates', array $extraEmails = []): void
    {
        if (!$customer) {
            return;
        }

        try {
            $prefs = $this->notificationPrefs($customer);
            if (isset($prefs[$category]) && !$prefs[$category]) {
                return;
            }

            $notifier = new NotificationService();
            $variables = [
                'customer_name' => $customer->contact_name ?: $customer->company_name,
                'subject' => $subject,
                'message' => $message,
                'portal_url' => url('/portal'),
            ];

            if ($prefs['email']) {
                foreach (array_unique(array_filter(array_merge([$customer->email], $extraEmails))) as $email) {
                    $notifier->sendEmail('portal-notice', $email, $variables);
                }
            }
            if ($prefs['sms'] && $customer->phone) {
                $notifier->sendSMS('portal-notice', $customer->phone, $variables);
            }
            if ($prefs['whatsapp'] && $customer->phone) {
                $notifier->sendWhatsApp('portal-notice', $customer->phone, $variables);
            }
        } catch (\Throwable $e) {
            Log::error('Portal notification failed', ['customer_id' => $customer->id, 'error' => $e->getMessage()]);
        }
    }

    /** Writes to the admin dashboard's activity feed. Never throws. */
    public function logActivity(string $icon, string $user, string $action, string $location = 'Customer Portal'): void
    {
        try {
            DB::table('activity_logs')->insert([
                'icon' => $icon,
                'user_name' => $user,
                'action' => $action,
                'location' => $location,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Portal activity log failed', ['error' => $e->getMessage()]);
        }
    }

    // ------------------------------------------------------------------- history

    /** Whitelisted fields of a service record, safe to show to the customer. */
    public function visibleRecord(string $table, object $record): array
    {
        $fields = self::SERVICES[$table]['fields'] ?? [];

        return array_intersect_key((array) $record, array_flip($fields));
    }

    public function normalize(string $table, object $record): array
    {
        $config = self::SERVICES[$table];
        $row = (array) $record;
        $vehicle = $this->vehicleLabel($row);
        $vin = $row['vin'] ?? $row['vehicle_vin'] ?? null;

        $reference = match ($table) {
            'shipments' => $row['tracking_number'] ?? ('#' . $row['id']),
            'clearances' => $row['item'] ?? ('#' . $row['id']),
            default => '#' . $row['id'],
        };

        $status = $row['status'] ?? $row['shipment_status'] ?? null;
        $date = $row['trucking_date'] ?? $row['sale_date'] ?? $row['date_stamp'] ?? $row['created_at'] ?? null;
        $amount = $row['quoted_amount'] ?? $row['total_cost'] ?? $row['total_paid'] ?? $row['amount'] ?? $row['price_usd'] ?? $row['max_budget'] ?? null;

        return [
            'key' => $config['type'] . '-' . $row['id'],
            'type' => $config['type'],
            'table' => $table,
            'label' => $config['label'],
            'id' => $row['id'],
            'reference' => $reference,
            'vehicle' => $vehicle,
            'vin' => $vin,
            'status' => $status,
            'date' => $date,
            'created_at' => $row['created_at'] ?? null,
            'amount' => $amount !== null ? (float) $amount : null,
            'details' => $this->visibleRecord($table, $record),
        ];
    }

    private function vehicleLabel(array $row): string
    {
        $year = $row['vehicle_year'] ?? $row['car_year'] ?? $row['year'] ?? '';
        $make = $row['vehicle_make'] ?? $row['car_make'] ?? '';
        $model = $row['vehicle_model'] ?? $row['car_model'] ?? '';
        $item = ($make === '' && $model === '') ? ($row['item'] ?? '') : '';

        return trim(implode(' ', array_filter([$year, $make, $model, $item], fn($part) => $part !== null && $part !== '')));
    }

    /**
     * Everything OD has done for this customer, newest first.
     *
     * @param array{type?:string,status?:string,from?:string,to?:string,search?:string} $filters
     */
    public function history(int $customerId, array $filters = []): array
    {
        $items = [];

        foreach (self::SERVICES as $table => $config) {
            if (!empty($filters['type']) && $filters['type'] !== $config['type']) {
                continue;
            }
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'customer_id')) {
                continue;
            }

            $query = DB::table($table)->where('customer_id', $customerId);
            if (!empty($filters['status']) && Schema::hasColumn($table, 'status')) {
                $query->where('status', $filters['status']);
            }

            foreach ($query->orderByDesc('id')->get() as $record) {
                $items[] = $this->normalize($table, $record);
            }
        }

        $items = array_values(array_filter($items, function ($item) use ($filters) {
            $date = substr((string) ($item['date'] ?? ''), 0, 10);
            if (!empty($filters['from']) && $date !== '' && $date < $filters['from']) {
                return false;
            }
            if (!empty($filters['to']) && $date !== '' && $date > $filters['to']) {
                return false;
            }
            if (!empty($filters['search'])) {
                $needle = strtolower($filters['search']);
                $haystack = strtolower(implode(' ', [$item['reference'], $item['vehicle'], $item['vin'], $item['label'], $item['status']]));
                if (!str_contains($haystack, $needle)) {
                    return false;
                }
            }

            return true;
        }));

        usort($items, fn($a, $b) => strcmp((string) $b['date'], (string) $a['date']));

        return $items;
    }

    // -------------------------------------------------------------------- alerts

    public function alerts(int $customerId): array
    {
        $alerts = [];
        $today = now()->toDateString();

        $shipments = DB::table('shipments')->where('customer_id', $customerId)->whereNotIn('status', ['delivered', 'cancelled'])->get();
        foreach ($shipments as $shipment) {
            $eta = $shipment->estimated_arrival_date ?? $shipment->eta ?? null;
            if ($eta && substr((string) $eta, 0, 10) < $today && !$shipment->actual_arrival_date) {
                $alerts[] = [
                    'severity' => 'warning', 'kind' => 'delay',
                    'title' => 'Shipment past its estimated arrival',
                    'message' => "{$shipment->tracking_number} was expected on " . substr((string) $eta, 0, 10) . ' and has not arrived yet.',
                    'link' => '/portal/vehicles/' . $shipment->id,
                ];
            }
            if (($shipment->shipping_fee_status ?? '') === 'UNPAID' && in_array($shipment->status, ['customs', 'in_transit'], true)) {
                $alerts[] = [
                    'severity' => 'critical', 'kind' => 'unpaid_fee',
                    'title' => 'Unpaid shipping fee',
                    'message' => "The shipping fee for {$shipment->tracking_number} is unpaid and may hold up release.",
                    'link' => '/portal/vehicles/' . $shipment->id,
                ];
            }
        }

        foreach (['procurements', 'truckings'] as $table) {
            if (!Schema::hasColumn($table, 'trucking_fee_status') && !Schema::hasColumn($table, 'payment_status')) {
                continue;
            }
            $rows = DB::table($table)->where('customer_id', $customerId)->get();
            foreach ($rows as $row) {
                $unpaid = ($row->trucking_fee_status ?? '') === 'unpaid' || strtolower((string) ($row->payment_status ?? '')) === 'unpaid';
                $active = !in_array(strtolower((string) ($row->status ?? '')), ['cancelled', 'delivered'], true);
                if ($unpaid && $active) {
                    $alerts[] = [
                        'severity' => 'warning', 'kind' => 'unpaid_fee',
                        'title' => 'Unpaid trucking fee',
                        'message' => ucfirst(rtrim($table, 's')) . " #{$row->id} has an unpaid trucking fee.",
                        'link' => '/portal/history',
                    ];
                }
            }
        }

        $overdue = DB::table('invoices')->where('customer_id', $customerId)
            ->whereIn('status', ['unpaid', 'partial'])
            ->whereNotNull('due_date')->where('due_date', '<', $today)->get();
        foreach ($overdue as $invoice) {
            $alerts[] = [
                'severity' => 'critical', 'kind' => 'overdue_invoice',
                'title' => 'Overdue invoice',
                'message' => "{$invoice->invoice_number} was due on {$invoice->due_date}.",
                'link' => '/portal/invoices',
            ];
        }

        $pendingQuotes = DB::table('quotes')->where('customer_id', $customerId)
            ->whereNotNull('quoted_amount')->whereNull('customer_response')->where('status', 'pending')->count();
        if ($pendingQuotes) {
            $alerts[] = [
                'severity' => 'info', 'kind' => 'quote_ready',
                'title' => 'Quotes waiting for your answer',
                'message' => "{$pendingQuotes} quote(s) have a price and need your approval.",
                'link' => '/portal/quotes',
            ];
        }

        $awaiting = DB::table('portal_requests')->where('customer_id', $customerId)->where('status', 'awaiting_approval')->count();
        if ($awaiting) {
            $alerts[] = [
                'severity' => 'info', 'kind' => 'approval',
                'title' => 'Requests awaiting approval',
                'message' => "{$awaiting} request(s) need sign-off from an owner or finance user.",
                'link' => '/portal/requests',
            ];
        }

        $pendingPayments = DB::table('payments')->where('customer_id', $customerId)->where('status', 'pending')->count();
        if ($pendingPayments) {
            $alerts[] = [
                'severity' => 'info', 'kind' => 'payment_review',
                'title' => 'Payments being verified',
                'message' => "{$pendingPayments} payment(s) are waiting for OD to confirm.",
                'link' => '/portal/invoices',
            ];
        }

        return $alerts;
    }

    // ----------------------------------------------------------------- analytics

    /**
     * Spend and delivery figures. Invoices are issued in different currencies, so every
     * money total is broken down per currency and never added across currencies.
     */
    public function analytics(int $customerId): array
    {
        $invoices = DB::table('invoices')->where('customer_id', $customerId)->where('status', '!=', 'void')->get();
        $default = $this->setting('portal_default_currency', 'NGN');

        $byMonth = [];
        $byService = [];
        $byReference = [];
        $byCurrency = [];
        foreach ($invoices as $invoice) {
            $currency = $invoice->currency ?: $default;
            $amount = (float) $invoice->amount;

            $month = substr((string) ($invoice->date_issued ?? $invoice->created_at), 0, 7);
            $byMonth[$currency][$month] = ($byMonth[$currency][$month] ?? 0) + $amount;

            $label = $invoice->service_label ?: 'Other';
            $byService[$currency][$label] = ($byService[$currency][$label] ?? 0) + $amount;

            if ($invoice->reference_number) {
                $byReference[$currency][$invoice->reference_number] = ($byReference[$currency][$invoice->reference_number] ?? 0) + $amount;
            }

            $byCurrency[$currency]['invoiced'] = ($byCurrency[$currency]['invoiced'] ?? 0) + $amount;
            $byCurrency[$currency]['paid'] = ($byCurrency[$currency]['paid'] ?? 0) + (float) $invoice->amount_paid;
            $byCurrency[$currency]['count'] = ($byCurrency[$currency]['count'] ?? 0) + 1;
        }

        $flatten = function (array $grouped, string $keyName) {
            $rows = [];
            foreach ($grouped as $currency => $values) {
                foreach ($values as $key => $amount) {
                    $rows[] = [$keyName => $key, 'currency' => $currency, 'amount' => round($amount, 2)];
                }
            }

            return $rows;
        };

        $months = $flatten($byMonth, 'month');
        usort($months, fn($a, $b) => strcmp($a['month'], $b['month']));
        $references = $flatten($byReference, 'reference');
        usort($references, fn($a, $b) => $b['amount'] <=> $a['amount']);

        $shipments = DB::table('shipments')->where('customer_id', $customerId)->get();
        $transitDays = [];
        foreach ($shipments as $shipment) {
            $start = $shipment->shipping_date ?? $shipment->departure_date ?? null;
            $end = $shipment->actual_arrival_date ?? $shipment->delivery_date ?? null;
            if ($start && $end) {
                $days = (int) round((strtotime((string) $end) - strtotime((string) $start)) / 86400);
                if ($days >= 0) {
                    $transitDays[] = $days;
                }
            }
        }

        return [
            'by_currency' => collect($byCurrency)->map(function ($totals, $currency) {
                $invoiced = round($totals['invoiced'], 2);
                $paid = round($totals['paid'], 2);

                return [
                    'currency' => $currency,
                    'invoiced' => $invoiced,
                    'paid' => $paid,
                    'outstanding' => round(max($invoiced - $paid, 0), 2),
                    'invoice_count' => $totals['count'],
                    'average_invoice' => round($invoiced / max($totals['count'], 1), 2),
                ];
            })->values()->all(),
            'invoice_count' => $invoices->count(),
            'vehicle_count' => $shipments->count(),
            'average_transit_days' => count($transitDays) ? round(array_sum($transitDays) / count($transitDays), 1) : null,
            'spend_by_month' => $months,
            'spend_by_service' => $flatten($byService, 'service'),
            'cost_by_reference' => array_slice($references, 0, 10),
            'status_breakdown' => $shipments->groupBy('status')->map->count()->all(),
        ];
    }

    /** Open invoice balances grouped per currency. */
    public function outstandingByCurrency(int $customerId): array
    {
        $default = $this->setting('portal_default_currency', 'NGN');
        $totals = [];

        foreach (DB::table('invoices')->where('customer_id', $customerId)->whereIn('status', ['unpaid', 'partial'])->get() as $invoice) {
            $currency = $invoice->currency ?: $default;
            $totals[$currency] = ($totals[$currency] ?? 0) + (float) $invoice->amount - (float) $invoice->amount_paid;
        }

        return collect($totals)->map(fn($amount, $currency) => ['currency' => $currency, 'amount' => round($amount, 2)])->values()->all();
    }

    // ------------------------------------------------------------------ invoices

    /** Recalculate an invoice's paid amount and status from its confirmed payments. */
    public function recalculateInvoice(int $invoiceId): void
    {
        $invoice = DB::table('invoices')->where('id', $invoiceId)->first();
        if (!$invoice) {
            return;
        }

        $paid = round((float) DB::table('payments')->where('invoice_id', $invoiceId)->where('status', 'confirmed')->sum('amount'), 2);
        $total = (float) $invoice->amount;

        $status = 'unpaid';
        if ($paid > 0 && $paid + 0.009 < $total) {
            $status = 'partial';
        } elseif ($paid > 0 && $paid + 0.009 >= $total) {
            $status = 'paid';
        }
        if ($invoice->status === 'void') {
            $status = 'void';
        }

        DB::table('invoices')->where('id', $invoiceId)->update([
            'amount_paid' => $paid,
            'status' => $status,
            'updated_at' => now(),
        ]);
    }

    /**
     * Statement of account for one currency (defaults to the customer's most used one).
     * Returns the currencies available so the UI can switch between them.
     */
    public function statementFor(int $customerId, ?string $from = null, ?string $to = null, ?string $currency = null): array
    {
        $default = $this->setting('portal_default_currency', 'NGN');
        $base = DB::table('invoices')->where('customer_id', $customerId)->where('status', '!=', 'void');

        $currencies = (clone $base)->get()->map(fn($invoice) => $invoice->currency ?: $default)->countBy()->sortDesc()->keys()->all();
        $currency = $currency && in_array($currency, $currencies, true) ? $currency : ($currencies[0] ?? $default);

        $query = clone $base;
        $query->where(fn($inner) => $inner->where('currency', $currency)->orWhereNull('currency'));
        if ($from) {
            $query->where('date_issued', '>=', $from);
        }
        if ($to) {
            $query->where('date_issued', '<=', $to);
        }
        $invoices = $query->orderBy('date_issued')->orderBy('id')->get();

        $running = 0.0;
        $lines = [];
        foreach ($invoices as $invoice) {
            $running += (float) $invoice->amount;
            $lines[] = [
                'date' => $invoice->date_issued,
                'type' => 'invoice',
                'reference' => $invoice->invoice_number,
                'description' => $invoice->description,
                'debit' => (float) $invoice->amount,
                'credit' => 0.0,
                'balance' => round($running, 2),
            ];

            $payments = DB::table('payments')->where('invoice_id', $invoice->id)->where('status', 'confirmed')->orderBy('id')->get();
            foreach ($payments as $payment) {
                $running -= (float) $payment->amount;
                $lines[] = [
                    'date' => substr((string) ($payment->reviewed_at ?? $payment->created_at), 0, 10),
                    'type' => 'payment',
                    'reference' => $payment->receipt_number,
                    'description' => 'Payment (' . str_replace('_', ' ', $payment->method) . ') for ' . $invoice->invoice_number,
                    'debit' => 0.0,
                    'credit' => (float) $payment->amount,
                    'balance' => round($running, 2),
                ];
            }
        }

        return [
            'currency' => $currency,
            'currencies' => $currencies ?: [$default],
            'lines' => $lines,
            'total_invoiced' => round((float) $invoices->sum('amount'), 2),
            'total_paid' => round((float) $invoices->sum('amount_paid'), 2),
            'balance_due' => round($running, 2),
        ];
    }
}
