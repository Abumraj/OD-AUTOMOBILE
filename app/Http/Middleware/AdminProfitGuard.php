<?php

namespace App\Http\Middleware;

use App\Support\ProfitGuard;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps profit away from admins who are not super admins, on every admin API route:
 *  - requests: profit values are dropped, so a regular admin can never set or change profit,
 *    and sorting by a profit column is ignored (it would reveal the ordering);
 *  - responses: any profit key is removed from the JSON, whichever screen asked for it.
 * Spreadsheet exports and imports are handled where they are built.
 */
class AdminProfitGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (ProfitGuard::allowed()) {
            return $next($request);
        }

        $this->dropFromInput($request);

        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $response->setData(ProfitGuard::scrub($response->getData(false)));
        }

        return $response;
    }

    private function dropFromInput(Request $request): void
    {
        $bags = [$request->query, $request->request];
        if ($request->isJson()) {
            $bags[] = $request->json();
        }

        foreach ($bags as $bag) {
            foreach (ProfitGuard::COLUMNS as $column) {
                $bag->remove($column);
            }
            if (ProfitGuard::isProfitKey($bag->get('sort_by'))) {
                $bag->remove('sort_by');
            }
        }
    }
}
