<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class DeploymentController extends Controller
{
    /**
     * Run database migrations
     * 
     * This endpoint is designed to be called after deployment to run pending migrations.
     * It should be protected with a secret token to prevent unauthorized access.
     */
    public function runMigrations(Request $request)
    {
        try {
            // Validate the deployment token
            $deploymentToken = config('app.deployment_token');
            $requestToken = $request->header('X-Deployment-Token') ?? $request->input('token');

            if (!$deploymentToken || $requestToken !== $deploymentToken) {
                Log::warning('Unauthorized migration attempt', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Invalid deployment token.'
                ], 401);
            }

            Log::info('Starting migration process', [
                'ip' => $request->ip(),
                'timestamp' => now()
            ]);

            // Run migrations
            Artisan::call('migrate', [
                '--force' => true, // Required for production
            ]);

            $output = Artisan::output();

            Log::info('Migration completed successfully', [
                'output' => $output
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Migrations executed successfully',
                'output' => $output,
                'timestamp' => now()->toIso8601String()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Migration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String()
            ], 500);
        }
    }

    /**
     * Clear application cache
     * 
     * Useful for clearing cache after deployment
     */
    public function clearCache(Request $request)
    {
        try {
            $deploymentToken = config('app.deployment_token');
            $requestToken = $request->header('X-Deployment-Token') ?? $request->input('token');

            if (!$deploymentToken || $requestToken !== $deploymentToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Invalid deployment token.'
                ], 401);
            }

            $results = [];

            // Clear various caches
            Artisan::call('cache:clear');
            $results['cache'] = Artisan::output();

            Artisan::call('config:clear');
            $results['config'] = Artisan::output();

            Artisan::call('route:clear');
            $results['route'] = Artisan::output();

            Artisan::call('view:clear');
            $results['view'] = Artisan::output();

            Log::info('Cache cleared successfully');

            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully',
                'results' => $results,
                'timestamp' => now()->toIso8601String()
            ], 200);

        } catch (\Exception $e) {
            Log::error('Cache clear failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Cache clear failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get deployment status and environment info
     */
    public function status(Request $request)
    {
        try {
            $deploymentToken = config('app.deployment_token');
            $requestToken = $request->header('X-Deployment-Token') ?? $request->input('token');

            if (!$deploymentToken || $requestToken !== $deploymentToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Invalid deployment token.'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'environment' => config('app.env'),
                'debug_mode' => config('app.debug'),
                'app_url' => config('app.url'),
                'database_connection' => config('database.default'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'timestamp' => now()->toIso8601String()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Status check failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
