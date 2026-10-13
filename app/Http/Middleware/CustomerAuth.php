<?php

namespace App\Http\Middleware;

use App\Services\PortalService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the customer portal. Accepts either the portal session or, for read-only
 * GET requests, a customer API token (used for accounting integrations).
 */
class CustomerAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $portal = new PortalService();
        if (!$portal->isEnabled()) {
            return response()->json(['error' => 'Portal unavailable', 'message' => 'The customer portal is currently switched off.'], 503);
        }

        $user = null;
        $customer = null;
        $viaToken = false;

        $userId = $request->session()->get('customer_user_id');
        if ($userId) {
            $user = DB::table('customer_users')->where('id', $userId)->where('is_active', true)->first();
            $customer = $user ? DB::table('customers')->where('id', $user->customer_id)->first() : null;
        } elseif ($token = $request->bearerToken()) {
            if (!$request->isMethod('GET')) {
                return response()->json(['error' => 'Forbidden', 'message' => 'API tokens are read-only.'], 403);
            }
            $customer = DB::table('customers')->where('api_token_hash', hash('sha256', $token))->first();
            $viaToken = (bool) $customer;
            if ($customer) {
                $user = (object) ['id' => 0, 'customer_id' => $customer->id, 'name' => 'API', 'email' => $customer->email, 'role' => 'finance'];
            }
        }

        if (!$user || !$customer) {
            return response()->json(['error' => 'Unauthorized', 'message' => 'Please sign in to access the portal.'], 401);
        }

        if ($customer->status !== 'active') {
            if ($userId) {
                $request->session()->forget('customer_user_id');
            }

            return response()->json([
                'error' => 'Account inactive',
                'message' => $customer->status === 'pending'
                    ? 'Your account is waiting for approval by OD Automotive.'
                    : 'This account has been suspended. Please contact OD Automotive.',
            ], 403);
        }

        $request->attributes->set('portal_user', $user);
        $request->attributes->set('portal_customer', $customer);
        $request->attributes->set('portal_via_token', $viaToken);

        // New records OD created for a confirmed customer appear without any manual step.
        // At most once a minute per customer: matching scans the legacy tables.
        if ($customer->link_verified && Cache::add('portal.sync.' . $customer->id, 1, 60)) {
            $portal->syncRecords($customer->id);
        }

        return $next($request);
    }
}
