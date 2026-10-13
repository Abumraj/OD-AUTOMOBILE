<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PortalAuthController extends Controller
{
    public const ROLE_ABILITIES = [
        'owner' => ['*'],
        'finance' => ['view', 'pay', 'invoices', 'approve', 'documents', 'tickets', 'request'],
        'operations' => ['view', 'documents', 'tickets', 'request'],
    ];

    public static function can(object $user, string $ability): bool
    {
        $abilities = self::ROLE_ABILITIES[$user->role] ?? [];

        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }

    public function config(PortalService $portal)
    {
        return response()->json($portal->branding());
    }

    public function register(Request $request, PortalService $portal)
    {
        if (!$portal->isEnabled()) {
            return response()->json(['message' => 'The customer portal is currently switched off.'], 503);
        }

        $mode = $portal->registrationMode();
        if ($mode === 'admin_only') {
            return response()->json([
                'message' => 'Self-registration is closed. Please contact OD Automotive to have an account created for you.',
            ], 403);
        }

        $this->normalizeEmail($request);
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('customers', 'email'), Rule::unique('customer_users', 'email')],
            'phone' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($portal->isSharedEmail($validated['email'])) {
            return response()->json(['message' => 'That email address cannot be used for an account. Please use your own business email.'], 422);
        }

        $status = $mode === 'open' ? 'active' : 'pending';

        $customerId = DB::transaction(function () use ($validated, $status) {
            $customerId = DB::table('customers')->insertGetId([
                'company_name' => $validated['company_name'],
                'contact_name' => $validated['contact_name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'status' => $status,
                'registered_via' => 'self',
                'link_verified' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('customer_users')->insert([
                'customer_id' => $customerId,
                'name' => $validated['contact_name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => 'owner',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $customerId;
        });

        $this->logActivity('Portal Registration', "{$validated['company_name']} registered for the customer portal ({$status}).");

        if ($status === 'active') {
            $user = DB::table('customer_users')->where('customer_id', $customerId)->first();
            $request->session()->regenerate();
            $request->session()->put('customer_user_id', $user->id);

            return response()->json(['success' => true, 'status' => 'active', 'message' => 'Account created.'] + $this->sessionPayload($user->id, $portal), 201);
        }

        return response()->json([
            'success' => true,
            'status' => 'pending',
            'message' => 'Thank you. Your account is waiting for approval by OD Automotive. We will email you once it is active.',
        ], 201);
    }

    public function login(Request $request, PortalService $portal)
    {
        if (!$portal->isEnabled()) {
            return response()->json(['message' => 'The customer portal is currently switched off.'], 503);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = DB::table('customer_users')->where('email', strtolower($validated['email']))->first();

        if (!$user || !$user->is_active || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Email or password is incorrect.'], 401);
        }

        $customer = DB::table('customers')->where('id', $user->customer_id)->first();
        if (!$customer || $customer->status === 'pending') {
            return response()->json(['message' => 'Your account is waiting for approval by OD Automotive.'], 403);
        }
        if ($customer->status === 'suspended') {
            return response()->json(['message' => 'This account has been suspended. Please contact OD Automotive.'], 403);
        }

        DB::table('customer_users')->where('id', $user->id)->update(['last_login_at' => now()]);
        $request->session()->regenerate();
        $request->session()->put('customer_user_id', $user->id);

        return response()->json(['success' => true] + $this->sessionPayload($user->id, $portal));
    }

    public function logout(Request $request)
    {
        // Only drop the portal login so an admin session in the same browser survives.
        $request->session()->forget('customer_user_id');

        return response()->json(['success' => true]);
    }

    public function checkAuth(Request $request, PortalService $portal)
    {
        $userId = $request->session()->get('customer_user_id');
        if (!$userId || !$portal->isEnabled()) {
            return response()->json(['authenticated' => false, 'config' => $portal->branding()]);
        }

        $payload = $this->sessionPayload($userId, $portal);
        if (!$payload) {
            $request->session()->forget('customer_user_id');

            return response()->json(['authenticated' => false, 'config' => $portal->branding()]);
        }

        return response()->json(['authenticated' => true] + $payload);
    }

    public function me(Request $request, PortalService $portal)
    {
        $user = $request->attributes->get('portal_user');
        $payload = $this->sessionPayload($user->id, $portal);

        return response()->json($payload ?: ['user' => null]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $email = strtolower($validated['email']);

        $user = DB::table('customer_users')->where('email', $email)->where('is_active', true)->first();
        if ($user) {
            $token = Str::random(48);
            DB::table('customer_password_resets')->where('email', $email)->delete();
            DB::table('customer_password_resets')->insert([
                'email' => $email,
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addHour(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $link = url('/portal/reset-password') . '?token=' . $token . '&email=' . urlencode($email);
            try {
                Mail::raw("Hello {$user->name},\n\nUse this link to choose a new portal password (valid for one hour):\n{$link}\n\nIf you did not ask for this, you can ignore this email.", function ($message) use ($email) {
                    $message->to($email)->subject('Reset your OD Automotive portal password');
                });
            } catch (\Throwable $e) {
                Log::error('Portal reset email failed', ['email' => $email, 'error' => $e->getMessage()]);
            }
        }

        return response()->json(['success' => true, 'message' => 'If that email has an account, a reset link is on its way.']);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $email = strtolower($validated['email']);

        $reset = DB::table('customer_password_resets')
            ->where('email', $email)
            ->where('token_hash', hash('sha256', $validated['token']))
            ->where('expires_at', '>', now())
            ->first();

        if (!$reset) {
            return response()->json(['message' => 'This reset link is invalid or has expired.'], 422);
        }

        DB::table('customer_users')->where('email', $email)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);
        DB::table('customer_password_resets')->where('email', $email)->delete();

        return response()->json(['success' => true, 'message' => 'Password updated. You can sign in now.']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'sometimes|required|string|max:255',
            'contact_name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        DB::table('customer_users')->where('id', $user->id)->update(array_filter([
            'name' => $validated['name'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'updated_at' => now(),
        ], fn($value) => $value !== null));

        if ($user->role === 'owner') {
            DB::table('customers')->where('id', $customer->id)->update(array_filter([
                'company_name' => $validated['company_name'] ?? null,
                'contact_name' => $validated['contact_name'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'updated_at' => now(),
            ], fn($value) => $value !== null));
        }

        return response()->json(['success' => true] + $this->sessionPayload($user->id, new PortalService()));
    }

    public function changePassword(Request $request)
    {
        $user = $request->attributes->get('portal_user');
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $row = DB::table('customer_users')->where('id', $user->id)->first();
        if (!$row || !Hash::check($validated['current_password'], $row->password)) {
            return response()->json(['message' => 'Your current password is incorrect.'], 422);
        }

        DB::table('customer_users')->where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Password changed.']);
    }

    public function updateNotificationPrefs(Request $request, PortalService $portal)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if (!in_array($user->role, ['owner', 'finance'], true)) {
            return response()->json(['message' => 'Only the account owner can change notification settings.'], 403);
        }

        $validated = $request->validate([
            'email' => 'sometimes|boolean',
            'sms' => 'sometimes|boolean',
            'whatsapp' => 'sometimes|boolean',
            'shipment_updates' => 'sometimes|boolean',
            'payment_updates' => 'sometimes|boolean',
            'ticket_updates' => 'sometimes|boolean',
        ]);

        $prefs = array_merge($portal->notificationPrefs($customer), $validated);
        DB::table('customers')->where('id', $customer->id)->update(['notification_prefs' => json_encode($prefs), 'updated_at' => now()]);

        return response()->json(['success' => true, 'notification_prefs' => $prefs]);
    }

    // ----------------------------------------------------------------------- team

    public function team(Request $request)
    {
        $customer = $request->attributes->get('portal_customer');

        return response()->json(
            DB::table('customer_users')->where('customer_id', $customer->id)
                ->select('id', 'name', 'email', 'phone', 'role', 'is_active', 'last_login_at', 'created_at')
                ->orderBy('id')->get()
        );
    }

    public function addTeamMember(Request $request)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if ($user->role !== 'owner') {
            return response()->json(['message' => 'Only the account owner can manage team members.'], 403);
        }

        $this->normalizeEmail($request);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('customer_users', 'email'), Rule::unique('customers', 'email')],
            'phone' => 'nullable|string|max:50',
            'role' => ['required', Rule::in(['owner', 'finance', 'operations'])],
            'password' => 'required|string|min:8',
        ]);

        $id = DB::table('customer_users')->insertGetId([
            'customer_id' => $customer->id,
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'id' => $id], 201);
    }

    public function updateTeamMember(Request $request, $id)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if ($user->role !== 'owner') {
            return response()->json(['message' => 'Only the account owner can manage team members.'], 403);
        }

        $member = DB::table('customer_users')->where('id', $id)->where('customer_id', $customer->id)->first();
        if (!$member) {
            return response()->json(['message' => 'Team member not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'role' => ['sometimes', Rule::in(['owner', 'finance', 'operations'])],
            'is_active' => 'sometimes|boolean',
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        $demoting = (isset($validated['role']) && $validated['role'] !== 'owner') || (array_key_exists('is_active', $validated) && !$validated['is_active']);
        if ($member->role === 'owner' && $demoting) {
            $owners = DB::table('customer_users')->where('customer_id', $customer->id)->where('role', 'owner')->where('is_active', true)->count();
            if ($owners <= 1) {
                return response()->json(['message' => 'The account needs at least one active owner.'], 422);
            }
        }

        $update = array_intersect_key($validated, array_flip(['name', 'role', 'is_active']));
        if (!empty($validated['password'])) {
            $update['password'] = Hash::make($validated['password']);
        }
        $update['updated_at'] = now();
        DB::table('customer_users')->where('id', $id)->update($update);

        return response()->json(['success' => true]);
    }

    public function removeTeamMember(Request $request, $id)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if ($user->role !== 'owner') {
            return response()->json(['message' => 'Only the account owner can manage team members.'], 403);
        }
        if ((int) $id === (int) $user->id) {
            return response()->json(['message' => 'You cannot remove yourself.'], 422);
        }

        DB::table('customer_users')->where('id', $id)->where('customer_id', $customer->id)->delete();

        return response()->json(['success' => true]);
    }

    // ------------------------------------------------------------------ API token

    public function createApiToken(Request $request)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if ($user->role !== 'owner' || $request->attributes->get('portal_via_token')) {
            return response()->json(['message' => 'Only the account owner can manage API access.'], 403);
        }

        $token = 'odp_' . Str::random(40);
        DB::table('customers')->where('id', $customer->id)->update(['api_token_hash' => hash('sha256', $token), 'updated_at' => now()]);

        return response()->json(['success' => true, 'token' => $token, 'message' => 'Copy this token now. It will not be shown again.']);
    }

    public function revokeApiToken(Request $request)
    {
        $user = $request->attributes->get('portal_user');
        $customer = $request->attributes->get('portal_customer');
        if ($user->role !== 'owner' || $request->attributes->get('portal_via_token')) {
            return response()->json(['message' => 'Only the account owner can manage API access.'], 403);
        }

        DB::table('customers')->where('id', $customer->id)->update(['api_token_hash' => null, 'updated_at' => now()]);

        return response()->json(['success' => true]);
    }

    // -------------------------------------------------------------------- helpers

    private function normalizeEmail(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }
    }

    private function sessionPayload($userId, PortalService $portal): ?array
    {
        $user = DB::table('customer_users')->where('id', $userId)->where('is_active', true)->first();
        $customer = $user ? DB::table('customers')->where('id', $user->customer_id)->first() : null;
        if (!$user || !$customer) {
            return null;
        }

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'abilities' => self::ROLE_ABILITIES[$user->role] ?? [],
            ],
            'customer' => [
                'id' => $customer->id,
                'company_name' => $customer->company_name,
                'contact_name' => $customer->contact_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'status' => $customer->status,
                'pricing_tier' => $customer->pricing_tier,
                'discount_percent' => (float) $customer->discount_percent,
                'credit_terms_days' => (int) $customer->credit_terms_days,
                'credit_balance' => (float) $customer->credit_balance,
                'approval_threshold' => $customer->approval_threshold !== null ? (float) $customer->approval_threshold : null,
                'has_api_token' => !empty($customer->api_token_hash),
                'notification_prefs' => $portal->notificationPrefs($customer),
            ],
            'config' => $portal->branding(),
            'payment_methods' => array_map(fn($method) => array_diff_key($method, ['enabled' => 1]), $portal->customerPaymentMethods()),
        ];
    }

    private function logActivity(string $action, string $description): void
    {
        (new PortalService())->logActivity('how_to_reg', $action, $description);
    }
}
