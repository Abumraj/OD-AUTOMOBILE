<?php

namespace App\Http\Middleware;

use App\Services\DocumentBranding;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only super admins, and admins a super admin has allowed, may see or change the signature
 * printed on invoices and dock receipts. The permission is read from the database on every
 * request, so taking it away applies immediately.
 */
class AdminSignatureAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowed = DocumentBranding::adminMayManage(
            $request->session()->get('admin_id'),
            (string) $request->session()->get('admin_role', 'admin')
        );

        if (!$allowed) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only a super admin, or an admin a super admin has allowed, can manage the document signature.',
            ], 403);
        }

        return $next($request);
    }
}
