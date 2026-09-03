<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminDashboardController extends Controller
{
    public function getRevenueAnalysis(Request $request)
    {
        if ($request->session()->get('admin_role', 'admin') !== 'superadmin') {
            return response()->json(['error' => 'Unauthorized. Superadmin access required.'], 403);
        }

        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);
        $startDate = $validated['start_date'] ?? now()->startOfYear()->toDateString();
        $endDate = $validated['end_date'] ?? now()->toDateString();
        $services = [
            ['service' => 'Shipments', 'table' => 'shipments', 'amount' => 'total_cost', 'date' => 'created_at'],
            ['service' => 'Procurement', 'table' => 'procurements', 'amount' => 'price_usd', 'date' => 'date_procured'],
            ['service' => 'Autosales', 'table' => 'autosales', 'amount' => 'amount', 'date' => 'sale_date'],
            ['service' => 'Clearance', 'table' => 'clearances', 'amount' => 'total_paid', 'date' => 'date_stamp'],
            ['service' => 'Trucking', 'table' => 'truckings', 'amount' => 'amount', 'date' => 'trucking_date'],
        ];

        $breakdown = collect($services)->map(function ($service) use ($startDate, $endDate) {
            $query = DB::table($service['table'])->whereNotNull($service['date']);
            $query->whereBetween($service['date'], [$startDate, $endDate]);

            return [
                'service' => $service['service'],
                'orders' => $query->count(),
                'revenue' => (float) (DB::table($service['table'])
                    ->whereNotNull($service['date'])
                    ->whereBetween($service['date'], [$startDate, $endDate])
                    ->sum($service['amount']) ?? 0),
            ];
        })->values();

        $monthly = collect($services)->flatMap(function ($service) use ($startDate, $endDate) {
            return DB::table($service['table'])
                ->selectRaw("DATE_FORMAT({$service['date']}, '%Y-%m') as month, SUM({$service['amount']}) as revenue")
                ->whereNotNull($service['date'])
                ->whereBetween($service['date'], [$startDate, $endDate])
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->map(fn($row) => ['month' => $row->month, 'service' => $service['service'], 'revenue' => (float) $row->revenue]);
        })->groupBy('month')->map(function ($entries, $month) {
            return ['month' => $month, 'revenue' => $entries->sum('revenue')];
        })->sortBy('month')->values();

        return response()->json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_revenue' => $breakdown->sum('revenue'),
            'total_orders' => $breakdown->sum('orders'),
            'breakdown' => $breakdown,
            'monthly_revenue' => $monthly,
        ]);
    }

    public function getClientOrders(Request $request)
    {
        $query = trim((string) $request->get('query', ''));
        if (strlen($query) < 2) {
            return response()->json(['message' => 'Enter at least two characters to search for a client.'], 422);
        }

        $term = '%' . $query . '%';
        $orders = collect([
            ...DB::table('quotes')->where(fn($builder) => $builder->where('customer_name', 'like', $term)->orWhere('email', 'like', $term))->orderByDesc('created_at')->get()->map(fn($record) => ['service' => 'Quote', 'status' => $record->status, 'date' => $record->created_at, 'details' => $record]),
            ...DB::table('shipments')->where(fn($builder) => $builder->where('customer_name', 'like', $term)->orWhere('customer_email', 'like', $term))->orderByDesc('created_at')->get()->map(fn($record) => ['service' => 'Shipment', 'status' => $record->status, 'date' => $record->created_at, 'details' => $record]),
            ...DB::table('truckings')->where(fn($builder) => $builder->where('customer_name', 'like', $term)->orWhere('customer_email', 'like', $term))->orderByDesc('created_at')->get()->map(fn($record) => ['service' => 'Trucking', 'status' => $record->shipment_status ?? $record->status, 'date' => $record->trucking_date ?? $record->created_at, 'details' => $record]),
            ...DB::table('clearances')->where('client_name', 'like', $term)->orderByDesc('created_at')->get()->map(fn($record) => ['service' => 'Clearance', 'status' => $record->status, 'date' => $record->date_stamp ?? $record->created_at, 'details' => $record]),
        ])->sortByDesc('date')->values();

        return response()->json([
            'summary' => [
                'total' => $orders->count(),
                'quotes' => $orders->where('service', 'Quote')->count(),
                'shipments' => $orders->where('service', 'Shipment')->count(),
                'truckings' => $orders->where('service', 'Trucking')->count(),
                'clearances' => $orders->where('service', 'Clearance')->count(),
            ],
            'orders' => $orders,
        ]);
    }

    // Authentication
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $admin = DB::table('admin_users')
            ->where('email', $validated['email'])
            ->where('is_active', true)
            ->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            return response()->json([
                'error' => 'Invalid credentials',
                'message' => 'Email or password is incorrect'
            ], 401);
        }

        // Update last login
        DB::table('admin_users')
            ->where('id', $admin->id)
            ->update(['last_login_at' => now()]);

        // Store admin session
        $request->session()->put('admin_id', $admin->id);
        $request->session()->put('admin_name', $admin->name);
        $request->session()->put('admin_email', $admin->email);
        $request->session()->put('admin_role', $admin->role ?? 'admin');

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role ?? 'admin'
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['admin_id', 'admin_name', 'admin_email', 'admin_role']);
        $request->session()->flush();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function checkAuth(Request $request)
    {
        if ($request->session()->has('admin_id')) {
            return response()->json([
                'authenticated' => true,
                'admin' => [
                    'id' => $request->session()->get('admin_id'),
                    'name' => $request->session()->get('admin_name'),
                    'email' => $request->session()->get('admin_email'),
                    'role' => $request->session()->get('admin_role', 'admin')
                ]
            ]);
        }

        return response()->json([
            'authenticated' => false
        ]);
    }

    public function getStats()
    {
        // Total quotes count
        $totalQuotes = DB::table('quotes')->count();

        // Active shipments - currently in progress (not pending, delivered, or cancelled)
        $activeShipments = DB::table('shipments')
            ->whereIn('status', ['auction_won', 'documentation', 'shipping', 'in_transit', 'customs'])
            ->where('is_active', true)
            ->count();

        // Pending clearance - shipments in customs
        $pendingClearance = DB::table('shipments')
            ->where('status', 'customs')
            ->where('is_active', true)
            ->count();

        // Delivered this year
        $deliveredYTD = DB::table('shipments')
            ->where('status', 'delivered')
            ->whereYear('created_at', date('Y'))
            ->count();

        // New service totals and profit summary
        $procurementCount = DB::table('procurements')->where('is_active', true)->count();
        $truckingCount = DB::table('truckings')->where('is_active', true)->count();
        $autoSalesCount = DB::table('autosales')->where('is_active', true)->count();
        $clearanceCount = DB::table('clearances')->where('is_active', true)->count();

        // Quote growth calculation - last 30 days vs previous 30 days
        $lastMonthQuotes = DB::table('quotes')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
        $previousMonthQuotes = DB::table('quotes')
            ->whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
            ->count();

        $quotesGrowth = $previousMonthQuotes > 0
            ? round((($lastMonthQuotes - $previousMonthQuotes) / $previousMonthQuotes) * 100, 1)
            : ($lastMonthQuotes > 0 ? 100 : 0);

        // Critical delays - shipments past ETA and still in transit
        $criticalDelays = DB::table('shipments')
            ->whereIn('status', ['in_transit', 'customs'])
            ->where(function ($query) {
                $query->whereNotNull('estimated_arrival_date')
                    ->whereRaw('estimated_arrival_date < CURDATE()')
                    ->whereNull('actual_arrival_date');
            })
            ->orWhere(function ($query) {
                $query->whereNotNull('eta')
                    ->whereRaw('eta < CURDATE()')
                    ->whereNull('actual_arrival_date');
            })
            ->where('is_active', true)
            ->count();

        // Success rate - delivered vs total shipments this year
        $totalShipmentsYTD = DB::table('shipments')
            ->whereYear('created_at', date('Y'))
            ->count();

        $successRate = $totalShipmentsYTD > 0
            ? round(($deliveredYTD / $totalShipmentsYTD) * 100, 1)
            : 0;

        return response()->json([
            'total_quotes' => $totalQuotes,
            'quotes_growth' => $quotesGrowth,
            'active_shipments' => $activeShipments,
            'pending_clearance' => $pendingClearance,
            'critical_delays' => $criticalDelays,
            'delivered_ytd' => $deliveredYTD,
            'success_rate' => $successRate,
            'procurement_count' => $procurementCount,
            'trucking_count' => $truckingCount,
            'auto_sales_count' => $autoSalesCount,
            'clearance_count' => $clearanceCount,
        ]);
    }

    public function getKanbanData()
    {
        $stages = ['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered'];
        $kanbanData = [];

        foreach ($stages as $stage) {
            $shipments = DB::table('shipments')
                ->where('status', $stage)
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get();

            $kanbanData[$stage] = [
                'count' => DB::table('shipments')->where('status', $stage)->count(),
                'cards' => $shipments->map(function ($shipment) {
                    return [
                        'id' => $shipment->id,
                        'tracking_id' => $shipment->tracking_id,
                        'customer' => $shipment->customer_name,
                        'vehicle' => $shipment->vehicle_year . ' ' . $shipment->vehicle_make . ' ' . $shipment->vehicle_model,
                        'status' => $shipment->status,
                        'is_delayed' => $shipment->is_delayed ?? false,
                        'is_starred' => $shipment->is_starred ?? false,
                        'progress' => $shipment->clearance_progress ?? null,
                        'vessel_name' => $shipment->vessel_name ?? null,
                        'updated_at' => $shipment->updated_at,
                    ];
                })
            ];
        }

        return response()->json($kanbanData);
    }

    public function getAnalytics()
    {
        // Shipments over time (last 6 months)
        $shipmentsOverTime = DB::table('shipments')
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Status distribution
        $statusDistribution = DB::table('shipments')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // Monthly revenue (using total_cost)
        $monthlyRevenue = DB::table('shipments')
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(CAST(total_cost AS DECIMAL(10,2))) as revenue')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->whereNotNull('total_cost')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top destinations
        $topDestinations = DB::table('shipments')
            ->select('destination_country', DB::raw('COUNT(*) as count'))
            ->groupBy('destination_country')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        // Quotes vs Shipments comparison
        $quotesVsShipments = DB::table(DB::raw('(
            SELECT DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count, "quotes" as type
            FROM quotes
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            UNION ALL
            SELECT DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count, "shipments" as type
            FROM shipments
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
        ) as combined'))
            ->select('month', 'type', 'count')
            ->orderBy('month')
            ->get();

        $serviceProfitSources = [
            ['service' => 'Procurement', 'table' => 'procurements', 'date' => 'created_at', 'profit' => 'profit'],
            ['service' => 'Trucking', 'table' => 'truckings', 'date' => 'created_at', 'profit' => 'profit'],
            ['service' => 'Auto Sales', 'table' => 'autosales', 'date' => 'sale_date', 'profit' => 'profit'],
            ['service' => 'Clearance', 'table' => 'clearances', 'date' => 'date_stamp', 'profit' => 'profit'],
        ];

        $monthlyProfitOverTime = collect($serviceProfitSources)->flatMap(function ($service) {
            $query = DB::table($service['table'])
                ->selectRaw("DATE_FORMAT({$service['date']}, '%Y-%m') as month, SUM(CAST({$service['profit']} AS DECIMAL(12,2))) as profit")
                ->whereNotNull($service['date'])
                ->whereNotNull($service['profit'])
                ->where($service['date'], '>=', now()->subMonths(6))
                ->groupBy('month')
                ->orderBy('month');

            return $query->get()->map(fn($row) => [
                'month' => $row->month,
                'service' => $service['service'],
                'profit' => (float) ($row->profit ?? 0),
            ]);
        })->groupBy('month')->map(function ($entries, $month) {
            return [
                'month' => $month,
                'profit' => round((float) $entries->sum('profit'), 2),
            ];
        })->sortBy('month')->values();

        $serviceProfitBreakdown = collect($serviceProfitSources)->map(function ($service) {
            $profit = (float) DB::table($service['table'])
                ->whereNotNull($service['profit'])
                ->sum($service['profit']) ?? 0;

            return [
                'service' => $service['service'],
                'profit' => round($profit, 2),
            ];
        })->values();

        return response()->json([
            'shipments_over_time' => $shipmentsOverTime,
            'status_distribution' => $statusDistribution,
            'monthly_revenue' => $monthlyRevenue,
            'top_destinations' => $topDestinations,
            'quotes_vs_shipments' => $quotesVsShipments,
            'monthly_profit_over_time' => $monthlyProfitOverTime,
            'service_profit_breakdown' => $serviceProfitBreakdown,
        ]);
    }

    public function getActivityStream()
    {
        $activities = DB::table('activity_logs')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($activities->map(function ($activity) {
            return [
                'id' => $activity->id,
                'icon' => $activity->icon,
                'user' => $activity->user_name,
                'action' => $activity->action,
                'time' => $activity->created_at,
                'location' => $activity->location,
            ];
        }));
    }

    public function getFleetHealth()
    {
        $totalCarriers = DB::table('carriers')->count();
        $activeCarriers = DB::table('carriers')->where('status', 'active')->count();
        $carriersActive = $totalCarriers > 0 ? round(($activeCarriers / $totalCarriers) * 100) : 88;

        $totalVessels = DB::table('vessels')->count();
        $onTimeVessels = DB::table('vessels')->where('is_on_time', true)->count();
        $vesselOnTime = $totalVessels > 0 ? round(($onTimeVessels / $totalVessels) * 100) : 94;

        $logisticsPartners = DB::table('logistics_partners')->where('is_verified', true)->count();

        return response()->json([
            'carriers_active' => $carriersActive,
            'vessel_on_time' => $vesselOnTime,
            'logistics_partners' => $logisticsPartners ?: 324
        ]);
    }

    public function updateShipmentStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,auction_won,documentation,shipping,in_transit,customs,delivered,cancelled'
        ]);

        $shipment = DB::table('shipments')->where('id', $id)->first();

        if (!$shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        $progressMap = [
            'pending' => 0,
            'auction_won' => 15,
            'documentation' => 30,
            'shipping' => 45,
            'in_transit' => 70,
            'customs' => 85,
            'delivered' => 100,
            'cancelled' => 0
        ];

        DB::table('shipments')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'progress_percentage' => $progressMap[$validated['status']] ?? 0,
                'updated_at' => now()
            ]);

        // Add status update log
        if ($shipment->status !== $validated['status']) {
            DB::table('shipment_updates')->insert([
                'shipment_id' => $id,
                'status' => $validated['status'],
                'description' => 'Status updated to ' . $validated['status'],
                'update_date' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Notify customer about status change (silently fail if not possible)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendShipmentUpdate((object) array_merge((array) $shipment, [
                'status' => $validated['status']
            ]));
        } catch (\Exception $e) {
            Log::error('Failed to notify customer about shipment status update', [
                'shipment_id' => $id,
                'error' => $e->getMessage()
            ]);
        }

        DB::table('activity_logs')->insert([
            'icon' => 'sync',
            'user_name' => 'Admin',
            'action' => 'updated status for shipment #' . $id,
            'location' => 'Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true]);
    }

    public function getQuotes()
    {
        $quotes = DB::table('quotes')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($quote) {
                return [
                    'id' => $quote->id,
                    'customer_name' => $quote->customer_name,
                    'email' => $quote->email,
                    'phone' => $quote->phone,
                    'contact_method' => $quote->contact_method,
                    'service' => $quote->service,
                    'vehicle' => $quote->vehicle_year . ' ' . $quote->vehicle_make . ' ' . $quote->vehicle_model,
                    'vehicle_year' => $quote->vehicle_year,
                    'vehicle_make' => $quote->vehicle_make,
                    'vehicle_model' => $quote->vehicle_model,
                    'origin' => $quote->origin,
                    'destination' => $quote->destination,
                    'status' => $quote->status,
                    'created_at' => $quote->created_at,
                    'updated_at' => $quote->updated_at
                ];
            });

        return response()->json($quotes);
    }

    public function approveQuote(Request $request, $id)
    {
        $quote = DB::table('quotes')->where('id', $id)->first();

        if (!$quote) {
            return response()->json(['error' => 'Quote not found'], 404);
        }

        DB::table('quotes')
            ->where('id', $id)
            ->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

        $trackingNumber = 'OD-' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT) . '-AUTO';
        $referenceNumber = 'REF-' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);

        $shipmentId = DB::table('shipments')->insertGetId([
            'tracking_number' => $trackingNumber,
            'reference_number' => $referenceNumber,
            'quote_id' => $quote->id,
            'customer_name' => $quote->customer_name,
            'customer_email' => $quote->email,
            'customer_phone' => $quote->phone ?? '',
            'vehicle_year' => $quote->vehicle_year ?? '',
            'vehicle_make' => $quote->vehicle_make ?? '',
            'vehicle_model' => $quote->vehicle_model ?? '',
            'origin_port' => $quote->origin ?? '',
            'origin_country' => $quote->origin ?? '',
            'destination_port' => $quote->destination ?? '',
            'destination_country' => $quote->destination ?? '',
            'status' => 'pending',
            'progress_percentage' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('quotes')
            ->where('id', $id)
            ->update(['status' => 'converted']);

        // Notify customer about new shipment (silently fail if not possible)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendShipmentUpdate((object) [
                'id' => $shipmentId,
                'tracking_number' => $trackingNumber,
                'reference_number' => $referenceNumber,
                'customer_name' => $quote->customer_name,
                'customer_email' => $quote->email,
                'customer_phone' => $quote->phone ?? '',
                'status' => 'pending',
                'vehicle_year' => $quote->vehicle_year,
                'vehicle_make' => $quote->vehicle_make,
                'vehicle_model' => $quote->vehicle_model,
                'origin_port' => $quote->origin,
                'origin_country' => $quote->origin,
                'destination_port' => $quote->destination,
                'destination_country' => $quote->destination,
                'estimated_arrival_date' => 'TBD',
                'delivery_date' => null
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify customer about shipment created from quote', [
                'shipment_id' => $shipmentId,
                'quote_id' => $id,
                'error' => $e->getMessage()
            ]);
        }

        DB::table('activity_logs')->insert([
            'icon' => 'check_circle',
            'user_name' => 'Admin',
            'action' => 'approved quote and created shipment ' . $trackingNumber . ' for ' . $quote->customer_name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quote approved and shipment created',
            'tracking_number' => $trackingNumber,
            'reference_number' => $referenceNumber,
            'shipment_id' => $shipmentId
        ]);
    }

    public function rejectQuote(Request $request, $id)
    {
        $quote = DB::table('quotes')->where('id', $id)->first();

        if (!$quote) {
            return response()->json(['error' => 'Quote not found'], 404);
        }

        DB::table('quotes')->where('id', $id)->delete();

        DB::table('activity_logs')->insert([
            'icon' => 'cancel',
            'user_name' => 'Admin',
            'action' => 'rejected quote request from ' . $quote->customer_name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quote rejected and removed'
        ]);
    }

    public function getTestimonials()
    {
        $testimonials = DB::table('testimonials')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($testimonial) {
                return [
                    'id' => $testimonial->id,
                    'quote' => $testimonial->quote,
                    'customer_name' => $testimonial->customer_name,
                    'location' => $testimonial->location,
                    'company' => $testimonial->company,
                    'social_link' => $testimonial->social_link,
                    'rating' => $testimonial->rating,
                    'is_featured' => (bool) $testimonial->is_featured,
                    'is_approved' => (bool) $testimonial->is_approved,
                    'shipment_id' => $testimonial->shipment_id,
                    'created_at' => $testimonial->created_at,
                    'updated_at' => $testimonial->updated_at
                ];
            });

        return response()->json($testimonials);
    }

    public function createTestimonial(Request $request)
    {
        $validated = $request->validate([
            'quote' => 'required|string',
            'customer_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'social_link' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'is_featured' => 'boolean',
            'shipment_id' => 'nullable|exists:shipments,id'
        ]);

        $testimonialId = DB::table('testimonials')->insertGetId([
            'quote' => $validated['quote'],
            'customer_name' => $validated['customer_name'],
            'location' => $validated['location'],
            'company' => $validated['company'] ?? null,
            'social_link' => $validated['social_link'] ?? null,
            'rating' => $validated['rating'],
            'is_featured' => $validated['is_featured'] ?? false,
            'is_approved' => true,
            'shipment_id' => $validated['shipment_id'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_logs')->insert([
            'icon' => 'rate_review',
            'user_name' => 'Admin',
            'action' => 'added testimonial from ' . $validated['customer_name'],
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Testimonial created successfully',
            'testimonial_id' => $testimonialId
        ]);
    }

    public function updateTestimonial(Request $request, $id)
    {
        $testimonial = DB::table('testimonials')->where('id', $id)->first();

        if (!$testimonial) {
            return response()->json(['error' => 'Testimonial not found'], 404);
        }

        $validated = $request->validate([
            'quote' => 'sometimes|string',
            'customer_name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'company' => 'nullable|string|max:255',
            'social_link' => 'nullable|string|max:255',
            'rating' => 'sometimes|integer|min:1|max:5',
            'is_featured' => 'sometimes|boolean',
            'is_approved' => 'sometimes|boolean'
        ]);

        DB::table('testimonials')
            ->where('id', $id)
            ->update(array_merge($validated, ['updated_at' => now()]));

        DB::table('activity_logs')->insert([
            'icon' => 'edit',
            'user_name' => 'Admin',
            'action' => 'updated testimonial from ' . $testimonial->customer_name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Testimonial updated successfully'
        ]);
    }

    public function deleteTestimonial($id)
    {
        $testimonial = DB::table('testimonials')->where('id', $id)->first();

        if (!$testimonial) {
            return response()->json(['error' => 'Testimonial not found'], 404);
        }

        DB::table('testimonials')->where('id', $id)->delete();

        DB::table('activity_logs')->insert([
            'icon' => 'delete',
            'user_name' => 'Admin',
            'action' => 'deleted testimonial from ' . $testimonial->customer_name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Testimonial deleted successfully'
        ]);
    }

    public function toggleFeatured($id)
    {
        $testimonial = DB::table('testimonials')->where('id', $id)->first();

        if (!$testimonial) {
            return response()->json(['error' => 'Testimonial not found'], 404);
        }

        $newFeaturedStatus = !$testimonial->is_featured;

        DB::table('testimonials')
            ->where('id', $id)
            ->update([
                'is_featured' => $newFeaturedStatus,
                'updated_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'is_featured' => $newFeaturedStatus,
            'message' => $newFeaturedStatus ? 'Testimonial featured' : 'Testimonial unfeatured'
        ]);
    }

    public function getWhatsAppSettings()
    {
        $isAdmin = request()->session()->has('admin_id');
        $settings = DB::table('settings')
            ->whereIn('key', [
                'whatsapp_phone',
                'whatsapp_message',
                'whatsapp_enabled',
                'whatsapp_access_token',
                'whatsapp_phone_number_id',
                'whatsapp_api_version'
            ])
            ->pluck('value', 'key');

        return response()->json([
            'phone' => $settings['whatsapp_phone'] ?? '',
            'message' => $settings['whatsapp_message'] ?? 'Hello! I would like to inquire about your auto import services.',
            'enabled' => $isAdmin && ($settings['whatsapp_enabled'] ?? 'false') === 'true',
            'access_token' => $isAdmin ? ($settings['whatsapp_access_token'] ?? '') : '',
            'phone_number_id' => $isAdmin ? ($settings['whatsapp_phone_number_id'] ?? '') : '',
            'api_version' => $isAdmin ? ($settings['whatsapp_api_version'] ?? 'v20.0') : null
        ]);
    }

    public function updateWhatsAppSettings(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
            'message' => 'required|string|max:500',
            'enabled' => 'required|boolean',
            'access_token' => 'nullable|string',
            'phone_number_id' => 'nullable|string|max:100',
            'api_version' => 'required|string|max:20'
        ]);

        foreach (
            [
                'whatsapp_phone' => $validated['phone'],
                'whatsapp_message' => $validated['message'],
                'whatsapp_enabled' => $validated['enabled'] ? 'true' : 'false',
                'whatsapp_access_token' => $validated['access_token'] ?? '',
                'whatsapp_phone_number_id' => $validated['phone_number_id'] ?? '',
                'whatsapp_api_version' => $validated['api_version']
            ] as $key => $value
        ) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        DB::table('activity_logs')->insert([
            'icon' => 'settings',
            'user_name' => 'Admin',
            'action' => 'updated WhatsApp settings',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp settings updated successfully'
        ]);
    }

    public function getContactSettings()
    {
        $settings = DB::table('settings')
            ->whereIn('key', [
                'contact_email',
                'contact_phone',
                'contact_location',
                'business_hours_weekday',
                'business_hours_saturday',
                'business_hours_sunday',
                'contact_page_title',
                'contact_page_subtitle'
            ])
            ->pluck('value', 'key');

        return response()->json([
            'contact_email' => $settings['contact_email'] ?? 'info@odautomotive.com',
            'contact_phone' => $settings['contact_phone'] ?? '+234 XXX XXX XXXX',
            'contact_location' => $settings['contact_location'] ?? 'Serving clients across Africa',
            'business_hours_weekday' => $settings['business_hours_weekday'] ?? '9:00 AM - 6:00 PM',
            'business_hours_saturday' => $settings['business_hours_saturday'] ?? '10:00 AM - 4:00 PM',
            'business_hours_sunday' => $settings['business_hours_sunday'] ?? 'Closed',
            'contact_page_title' => $settings['contact_page_title'] ?? 'Contact Us',
            'contact_page_subtitle' => $settings['contact_page_subtitle'] ?? 'Have questions about our services? Ready to start your automotive import journey? We\'re here to help.'
        ]);
    }

    public function updateContactSettings(Request $request)
    {
        $validated = $request->validate([
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:50',
            'contact_location' => 'required|string|max:255',
            'business_hours_weekday' => 'required|string|max:100',
            'business_hours_saturday' => 'required|string|max:100',
            'business_hours_sunday' => 'required|string|max:100',
            'contact_page_title' => 'required|string|max:100',
            'contact_page_subtitle' => 'required|string|max:500'
        ]);

        foreach ($validated as $key => $value) {
            DB::table('settings')
                ->where('key', $key)
                ->update([
                    'value' => $value,
                    'updated_at' => now()
                ]);
        }

        DB::table('activity_logs')->insert([
            'icon' => 'settings',
            'user_name' => 'Admin',
            'action' => 'updated contact page settings',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contact settings updated successfully'
        ]);
    }

    public function getContactMessages()
    {
        $messages = DB::table('contact_messages')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'name' => $message->name,
                    'email' => $message->email,
                    'phone' => $message->phone,
                    'service' => $message->service,
                    'message' => $message->message,
                    'status' => $message->status,
                    'admin_notes' => $message->admin_notes,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at
                ];
            });

        return response()->json($messages);
    }

    public function updateContactMessageStatus(Request $request, $id)
    {
        $message = DB::table('contact_messages')->where('id', $id)->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:new,read,replied,archived',
            'admin_notes' => 'nullable|string'
        ]);

        DB::table('contact_messages')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'admin_notes' => $validated['admin_notes'] ?? $message->admin_notes,
                'updated_at' => now()
            ]);

        DB::table('activity_logs')->insert([
            'icon' => 'mail',
            'user_name' => 'Admin',
            'action' => 'updated contact message from ' . $message->name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message status updated successfully'
        ]);
    }

    public function deleteContactMessage($id)
    {
        $message = DB::table('contact_messages')->where('id', $id)->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        DB::table('contact_messages')->where('id', $id)->delete();

        DB::table('activity_logs')->insert([
            'icon' => 'delete',
            'user_name' => 'Admin',
            'action' => 'deleted contact message from ' . $message->name,
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully'
        ]);
    }

    public function getTrackingProviders()
    {
        $providers = [];

        $grimaldi_enabled = DB::table('settings')->where('key', 'tracking_grimaldi_enabled')->value('value');
        if ($grimaldi_enabled === 'true') {
            $providers[] = [
                'name' => DB::table('settings')->where('key', 'tracking_grimaldi_name')->value('value'),
                'url' => DB::table('settings')->where('key', 'tracking_grimaldi_url')->value('value'),
                'provider' => 'grimaldi'
            ];
        }

        $sallaum_enabled = DB::table('settings')->where('key', 'tracking_sallaum_enabled')->value('value');
        if ($sallaum_enabled === 'true') {
            $providers[] = [
                'name' => DB::table('settings')->where('key', 'tracking_sallaum_name')->value('value'),
                'url' => DB::table('settings')->where('key', 'tracking_sallaum_url')->value('value'),
                'provider' => 'sallaum'
            ];
        }

        return response()->json($providers);
    }

    public function getTrackingSettings()
    {
        $settings = DB::table('settings')
            ->whereIn('key', [
                'tracking_grimaldi_enabled',
                'tracking_grimaldi_url',
                'tracking_grimaldi_name',
                'tracking_sallaum_enabled',
                'tracking_sallaum_url',
                'tracking_sallaum_name',
                'tracking_internal_enabled'
            ])
            ->pluck('value', 'key');

        return response()->json($settings);
    }

    public function updateTrackingSettings(Request $request)
    {
        $validated = $request->validate([
            'tracking_grimaldi_enabled' => 'required|string',
            'tracking_grimaldi_url' => 'nullable|string',
            'tracking_grimaldi_name' => 'nullable|string',
            'tracking_sallaum_enabled' => 'required|string',
            'tracking_sallaum_url' => 'nullable|string',
            'tracking_sallaum_name' => 'nullable|string',
            'tracking_internal_enabled' => 'required|string'
        ]);

        foreach ($validated as $key => $value) {
            DB::table('settings')
                ->where('key', $key)
                ->update([
                    'value' => $value,
                    'updated_at' => now()
                ]);
        }

        DB::table('activity_stream')->insert([
            'action' => 'Tracking Settings Updated',
            'description' => 'Tracking provider settings were modified',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tracking settings updated successfully'
        ]);
    }

    // Autosales Management
    public function getAutosales(Request $request)
    {
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = strtolower($request->get('sort_order', 'desc'));
        $search = $request->get('search', '');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $status = $request->get('status');
        $shippingType = $request->get('shipping_type');
        $customer = $request->get('customer');
        $allowedSortFields = ['id', 'sale_date', 'car_make', 'car_model', 'car_year', 'sale_type', 'color', 'vin', 'amount', 'profit', 'created_at'];

        if (!in_array($sortBy, $allowedSortFields, true)) {
            $sortBy = 'created_at';
        }
        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }

        $query = DB::table('autosales');
        if ($search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                foreach (['sale_date', 'car_make', 'car_model', 'car_year', 'sale_type', 'color', 'vin', 'amount', 'profit'] as $field) {
                    $q->orWhere($field, 'like', $searchTerm);
                }
            });
        }
        if ($dateFrom) $query->whereDate('sale_date', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('sale_date', '<=', $dateTo);
        if ($status) $query->where('sale_type', $status);
        if ($shippingType) $query->where('shipping_type', $shippingType);
        if ($customer) $query->where('customer_name', 'like', '%' . $customer . '%');

        return response()->json($query->orderBy($sortBy, $sortOrder)->get());
    }

    public function getAutosale($id)
    {
        $record = DB::table('autosales')->where('id', $id)->first();
        return $record
            ? response()->json($record)
            : response()->json(['error' => 'Autosale record not found'], 404);
    }

    public function createAutosale(Request $request)
    {
        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'sale_date' => 'nullable|date',
            'car_make' => 'nullable|string|max:255',
            'car_model' => 'nullable|string|max:255',
            'car_year' => 'nullable|string|max:10',
            'sale_type' => 'nullable|string|in:outright,swap',
            'shipping_type' => 'nullable|string|in:container,roro',
            'color' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: 'Walk-in Customer';
        $carMake = trim((string) ($validated['car_make'] ?? '')) ?: 'Vehicle';
        $carModel = trim((string) ($validated['car_model'] ?? '')) ?: 'Unspecified';

        $id = DB::table('autosales')->insertGetId(array_merge($validated, [
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'car_make' => $carMake,
            'car_model' => $carModel,
            'sale_type' => $validated['sale_type'] ?? 'outright',
            'shipping_type' => $validated['shipping_type'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        if (!empty($validated['customer_email'])) {
            (new NotificationService())->sendServiceStatusUpdate('Autosale', (object) array_merge($validated, ['id' => $id, 'customer_name' => $customerName]), 'Autosale created');
        }

        DB::table('activity_stream')->insert([
            'action' => 'Autosale Created',
            'description' => 'New autosale record created',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Autosale record created successfully', 'id' => $id]);
    }

    public function updateAutosale(Request $request, $id)
    {
        if (!DB::table('autosales')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Autosale record not found'], 404);
        }
        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'sale_date' => 'nullable|date',
            'car_make' => 'nullable|string|max:255',
            'car_model' => 'nullable|string|max:255',
            'car_year' => 'nullable|string|max:10',
            'sale_type' => 'nullable|string|in:outright,swap',
            'shipping_type' => 'nullable|string|in:container,roro',
            'color' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: 'Walk-in Customer';
        $carMake = trim((string) ($validated['car_make'] ?? '')) ?: 'Vehicle';
        $carModel = trim((string) ($validated['car_model'] ?? '')) ?: 'Unspecified';

        DB::table('autosales')->where('id', $id)->update(array_merge($validated, [
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'car_make' => $carMake,
            'car_model' => $carModel,
            'sale_type' => $validated['sale_type'] ?? 'outright',
            'shipping_type' => $validated['shipping_type'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now(),
        ]));
        DB::table('activity_stream')->insert([
            'action' => 'Autosale Updated',
            'description' => 'Autosale record updated',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Autosale record updated successfully']);
    }

    public function deleteAutosale($id)
    {
        if (!DB::table('autosales')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Autosale record not found'], 404);
        }
        DB::table('autosales')->where('id', $id)->delete();
        DB::table('activity_stream')->insert([
            'action' => 'Autosale Deleted',
            'description' => 'Autosale record deleted',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Autosale record deleted successfully']);
    }

    private function normalizeOptionalFields(array $data): array
    {
        foreach ($data as $key => $value) {
            if ($value === '') {
                $data[$key] = null;
            }
        }

        return $data;
    }

    // Procurement Management
    public function getProcurements(Request $request)
    {
        $sortBy = $request->get('sort_by', 'arrival_date');
        $sortOrder = strtolower($request->get('sort_order', 'asc'));
        $search = $request->get('search', '');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $status = $request->get('status');
        $shippingType = $request->get('shipping_type');
        $auctionSite = $request->get('auction_site');

        $allowedSortFields = ['id', 'date_procured', 'car_make', 'car_model', 'car_year', 'price_usd', 'auction_charge_usd', 'auction_site', 'state', 'trucking', 'shipping', 'arrival_date', 'profit_ngn', 'trucking_fee', 'status', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields, true)) $sortBy = 'arrival_date';
        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }
        $query = DB::table('procurements');
        if ($search !== '') {
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                foreach (['date_procured', 'car_make', 'car_model', 'car_year', 'auction_site', 'state', 'shipping', 'trucking_fee', 'status'] as $field) {
                    $q->orWhere($field, 'like', $searchTerm);
                }
            });
        }
        if ($dateFrom) $query->whereDate('date_procured', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('date_procured', '<=', $dateTo);
        if ($status) $query->where('status', $status);
        if ($shippingType) $query->where('shipping', $shippingType);
        if ($auctionSite) $query->where('auction_site', $auctionSite);
        if ($sortBy === 'arrival_date' && $sortOrder === 'asc') {
            return response()->json($query->orderByRaw('arrival_date IS NULL ASC')->orderBy('arrival_date', 'asc')->get());
        }

        return response()->json($query->orderBy($sortBy, $sortOrder)->get());
    }

    public function getProcurement($id)
    {
        $record = DB::table('procurements')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Procurement record not found'], 404);
        }

        return response()->json($record);
    }

    public function createProcurement(Request $request)
    {
        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'date_procured' => 'nullable|date',
            'car_make' => 'nullable|string|max:100',
            'car_model' => 'nullable|string|max:100',
            'car_year' => 'nullable|string|max:10',
            'price_usd' => 'nullable|numeric',
            'auction_charge_usd' => 'nullable|numeric',
            'auction_site' => 'nullable|string|in:copart,iaai,manheim,avc,dealership',
            'state' => 'nullable|string|max:255',
            'trucking' => 'nullable|numeric',
            'shipping' => 'nullable|string|max:50',
            'arrival_date' => 'nullable|date',
            'profit_ngn' => 'nullable|numeric',
            'trucking_fee' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:pending,purchased,cancelled,on_vessel,arrived',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: 'Walk-in Customer';

        $id = DB::table('procurements')->insertGetId(array_merge($validated, [
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'auction_site' => $validated['auction_site'] ?? 'copart',
            'status' => $validated['status'] ?? 'pending',
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        $record = (object) array_merge($validated, ['id' => $id, 'customer_name' => $customerName, 'customer_email' => $validated['customer_email'] ?? null]);

        if (!empty($validated['customer_email'])) {
            (new NotificationService())->sendServiceStatusUpdate('Procurement', $record, 'Procurement created');
        }

        DB::table('activity_stream')->insert([
            'action' => 'Procurement Created',
            'description' => 'New procurement record created',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Procurement record created successfully',
            'id' => $id,
        ]);
    }

    public function updateProcurement(Request $request, $id)
    {
        $record = DB::table('procurements')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Procurement record not found'], 404);
        }

        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'date_procured' => 'nullable|date',
            'car_make' => 'nullable|string|max:100',
            'car_model' => 'nullable|string|max:100',
            'car_year' => 'nullable|string|max:10',
            'price_usd' => 'nullable|numeric',
            'auction_charge_usd' => 'nullable|numeric',
            'auction_site' => 'nullable|string|in:copart,iaai,manheim,avc,dealership',
            'state' => 'nullable|string|max:255',
            'trucking' => 'nullable|numeric',
            'shipping' => 'nullable|string|max:50',
            'arrival_date' => 'nullable|date',
            'profit_ngn' => 'nullable|numeric',
            'trucking_fee' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:pending,purchased,cancelled,on_vessel,arrived',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: ($record->customer_name ?? 'Walk-in Customer');
        $statusChanged = ($record->status ?? null) !== ($validated['status'] ?? null);

        DB::table('procurements')->where('id', $id)->update(array_merge($validated, [
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'auction_site' => $validated['auction_site'] ?? ($record->auction_site ?? 'copart'),
            'status' => $validated['status'] ?? ($record->status ?? 'pending'),
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now(),
        ]));

        if ($statusChanged && !empty($validated['customer_email'])) {
            (new NotificationService())->sendServiceStatusUpdate('Procurement', (object) array_merge((array) $record, $validated, ['customer_email' => $validated['customer_email']]), 'Procurement status updated');
        }

        DB::table('activity_stream')->insert([
            'action' => 'Procurement Updated',
            'description' => 'Procurement record updated',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Procurement record updated successfully',
        ]);
    }

    public function deleteProcurement($id)
    {
        $record = DB::table('procurements')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Procurement record not found'], 404);
        }

        DB::table('procurements')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Procurement Deleted',
            'description' => 'Procurement record deleted',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Procurement record deleted successfully',
        ]);
    }

    // Clearance Management
    public function getClearances(Request $request)
    {
        $sortBy = $request->get('sort_by', 'date_stamp');
        $sortOrder = strtolower($request->get('sort_order', 'desc'));
        $search = $request->get('search', '');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $status = $request->get('status');
        $shippingType = $request->get('shipping_type');
        $client = $request->get('client');
        $allowedSortFields = ['id', 'item', 'client_name', 'status', 'date_stamp', 'total_paid', 'profit', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields, true)) $sortBy = 'date_stamp';
        if (!in_array($sortOrder, ['asc', 'desc'], true)) $sortOrder = 'desc';

        $query = DB::table('clearances')
            ->leftJoin('shipping_types', 'clearances.shipping_type_id', '=', 'shipping_types.id')
            ->leftJoin('shipping_lines', 'clearances.shipping_line_id', '=', 'shipping_lines.id')
            ->select('clearances.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name');
        if ($search !== '') {
            $term = '%' . $search . '%';
            $query->where(function ($q) use ($term) {
                foreach (['clearances.item', 'clearances.client_name', 'clearances.status', 'shipping_types.name', 'shipping_lines.name'] as $field) {
                    $q->orWhere($field, 'like', $term);
                }
            });
        }
        if ($dateFrom) $query->whereDate('date_stamp', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('date_stamp', '<=', $dateTo);
        if ($status) $query->where('clearances.status', $status);
        if ($shippingType) $query->whereRaw('LOWER(shipping_types.code) = ?', [strtolower($shippingType)]);
        if ($client) $query->where('clearances.client_name', 'like', '%' . $client . '%');
        return response()->json($query->orderBy('clearances.' . $sortBy, $sortOrder)->get());
    }

    public function getClearance($id)
    {
        $record = DB::table('clearances')->where('id', $id)->first();
        return $record ? response()->json($record) : response()->json(['error' => 'Clearance record not found'], 404);
    }

    public function createClearance(Request $request)
    {
        $validated = $this->normalizeOptionalFields($request->validate([
            'item' => 'nullable|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'shipping_type_id' => 'nullable|integer|exists:shipping_types,id',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'status' => 'nullable|in:cleared,not_cleared',
            'date_stamp' => 'nullable|date',
            'total_paid' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $item = trim((string) ($validated['item'] ?? '')) ?: 'New Clearance';
        $clientName = trim((string) ($validated['client_name'] ?? '')) ?: 'Walk-in Client';

        $id = DB::table('clearances')->insertGetId(array_merge($validated, [
            'item' => $item,
            'client_name' => $clientName,
            'client_email' => $validated['client_email'] ?? null,
            'shipping_type_id' => $validated['shipping_type_id'] ?? null,
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'status' => $validated['status'] ?? 'not_cleared',
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
        DB::table('activity_stream')->insert(['action' => 'Clearance Created', 'description' => 'New clearance record created', 'location' => 'Admin Dashboard', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Clearance record created successfully', 'id' => $id]);
    }

    public function updateClearance(Request $request, $id)
    {
        if (!DB::table('clearances')->where('id', $id)->exists()) return response()->json(['error' => 'Clearance record not found'], 404);
        $validated = $this->normalizeOptionalFields($request->validate([
            'item' => 'nullable|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'shipping_type_id' => 'nullable|integer|exists:shipping_types,id',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'status' => 'nullable|in:cleared,not_cleared',
            'date_stamp' => 'nullable|date',
            'total_paid' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $item = trim((string) ($validated['item'] ?? '')) ?: 'New Clearance';
        $clientName = trim((string) ($validated['client_name'] ?? '')) ?: 'Walk-in Client';

        DB::table('clearances')->where('id', $id)->update(array_merge($validated, [
            'item' => $item,
            'client_name' => $clientName,
            'client_email' => $validated['client_email'] ?? null,
            'shipping_type_id' => $validated['shipping_type_id'] ?? null,
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'status' => $validated['status'] ?? 'not_cleared',
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now(),
        ]));
        DB::table('activity_stream')->insert(['action' => 'Clearance Updated', 'description' => 'Clearance record updated', 'location' => 'Admin Dashboard', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Clearance record updated successfully']);
    }

    public function deleteClearance($id)
    {
        if (!DB::table('clearances')->where('id', $id)->exists()) return response()->json(['error' => 'Clearance record not found'], 404);
        DB::table('clearances')->where('id', $id)->delete();
        DB::table('activity_stream')->insert(['action' => 'Clearance Deleted', 'description' => 'Clearance record deleted', 'location' => 'Admin Dashboard', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Clearance record deleted successfully']);
    }

    // Trucking Management
    public function getTruckings(Request $request)
    {
        $sortBy = $request->get('sort_by', 'eta');
        $sortOrder = $request->get('sort_order', 'asc');
        $search = $request->get('search', '');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $status = $request->get('status');
        $shippingType = $request->get('shipping_type');
        $customer = $request->get('customer');

        $allowedSortFields = [
            'id',
            'customer_name',
            'customer_email',
            'vehicle_make',
            'vehicle_model',
            'vehicle_year',
            'auction_site',
            'shipping_type',
            'shipping_line_id',
            'trucking_date',
            'payment_status',
            'shipment_status',
            'location',
            'tracking',
            'trucking_fee_status',
            'status',
            'origin_port',
            'destination_port',
            'amount',
            'profit',
            'created_at'
        ];

        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'eta';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $query = DB::table('truckings')
            ->leftJoin('shipping_lines', 'truckings.shipping_line_id', '=', 'shipping_lines.id')
            ->select('truckings.*', 'shipping_lines.name as shipping_line_name');

        if (!empty($search)) {
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('customer_name', 'like', $searchTerm)
                    ->orWhere('customer_email', 'like', $searchTerm)
                    ->orWhere('customer_phone', 'like', $searchTerm)
                    ->orWhere('vehicle_make', 'like', $searchTerm)
                    ->orWhere('vehicle_model', 'like', $searchTerm)
                    ->orWhere('vehicle_year', 'like', $searchTerm)
                    ->orWhere('auction_site', 'like', $searchTerm)
                    ->orWhere('shipping_type', 'like', $searchTerm)
                    ->orWhere('shipping_lines.name', 'like', $searchTerm)
                    ->orWhere('vin', 'like', $searchTerm)
                    ->orWhere('location', 'like', $searchTerm)
                    ->orWhere('tracking', 'like', $searchTerm)
                    ->orWhere('trucking_fee_status', 'like', $searchTerm)
                    ->orWhere('status', 'like', $searchTerm)
                    ->orWhere('origin_port', 'like', $searchTerm)
                    ->orWhere('destination_port', 'like', $searchTerm)
                    ->orWhere('origin_country', 'like', $searchTerm)
                    ->orWhere('destination_country', 'like', $searchTerm);
            });
        }
        if ($dateFrom) $query->whereDate('trucking_date', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('trucking_date', '<=', $dateTo);
        if ($status) $query->where('truckings.status', $status);
        if ($shippingType) $query->where('truckings.shipping_type', $shippingType);
        if ($customer) $query->where('truckings.customer_name', 'like', '%' . $customer . '%');

        $truckings = $query->orderBy('truckings.' . $sortBy, $sortOrder)->get()->map(function ($record) {
            return [
                'id' => $record->id,
                'customer_name' => $record->customer_name,
                'customer_email' => $record->customer_email,
                'customer_phone' => $record->customer_phone,
                'vehicle_make' => $record->vehicle_make,
                'vehicle_model' => $record->vehicle_model,
                'vehicle_year' => $record->vehicle_year,
                'auction_site' => $record->auction_site,
                'shipping_type' => $record->shipping_type,
                'shipping_line_id' => $record->shipping_line_id,
                'shipping_line_name' => $record->shipping_line_name,
                'trucking_date' => $record->trucking_date,
                'color' => $record->color,
                'vin' => $record->vin,
                'payment_status' => $record->payment_status,
                'shipment_status' => $record->shipment_status,
                'location' => $record->location,
                'tracking' => $record->tracking,
                'trucking_fee_status' => $record->trucking_fee_status,
                'status' => $record->status,
                'origin_port' => $record->origin_port,
                'origin_country' => $record->origin_country,
                'destination_port' => $record->destination_port,
                'destination_country' => $record->destination_country,
                'amount' => $record->amount,
                'profit' => $record->profit,
                'notes' => $record->notes,
                'admin_notes' => $record->admin_notes,
                'is_active' => $record->is_active,
                'created_at' => $record->created_at,
            ];
        });

        return response()->json($truckings);
    }

    public function getTrucking($id)
    {
        $record = DB::table('truckings')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Trucking record not found'], 404);
        }

        return response()->json($record);
    }

    public function createTrucking(Request $request)
    {
        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'auction_site' => 'nullable|string|in:copart,iaai,manheim,avc,dealership',
            'shipping_type' => 'nullable|string|in:container,roro',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'trucking_date' => 'nullable|date',
            'color' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:255',
            'payment_status' => 'nullable|string|max:50',
            'shipment_status' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'tracking' => 'nullable|string|max:255',
            'trucking_fee_status' => 'nullable|string|in:paid,unpaid',
            'status' => 'nullable|string|in:pending,arrived,on_vessel',
            'origin_port' => 'nullable|string|max:255',
            'origin_country' => 'nullable|string|max:255',
            'destination_port' => 'nullable|string|max:255',
            'destination_country' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: 'Walk-in Customer';

        $id = DB::table('truckings')->insertGetId([
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'auction_site' => $validated['auction_site'] ?? 'copart',
            'shipping_type' => $validated['shipping_type'] ?? 'container',
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'trucking_date' => $validated['trucking_date'] ?? null,
            'color' => $validated['color'] ?? null,
            'vin' => $validated['vin'] ?? null,
            'payment_status' => $validated['payment_status'] ?? null,
            'shipment_status' => $validated['shipment_status'] ?? null,
            'location' => $validated['location'] ?? null,
            'tracking' => $validated['tracking'] ?? null,
            'trucking_fee_status' => $validated['trucking_fee_status'] ?? 'unpaid',
            'status' => $validated['status'] ?? 'pending',
            'origin_port' => $validated['origin_port'] ?? null,
            'origin_country' => $validated['origin_country'] ?? null,
            'destination_port' => $validated['destination_port'] ?? null,
            'destination_country' => $validated['destination_country'] ?? null,
            'amount' => $validated['amount'] ?? null,
            'profit' => $validated['profit'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (!empty($validated['customer_email'])) {
            (new NotificationService())->sendServiceStatusUpdate('Trucking', (object) array_merge($validated, ['id' => $id]), 'Trucking created');
        }

        DB::table('activity_stream')->insert([
            'action' => 'Trucking Created',
            'description' => 'New trucking record for ' . $validated['customer_name'] . ' created',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trucking record created successfully',
            'id' => $id,
        ]);
    }

    public function updateTrucking(Request $request, $id)
    {
        $record = DB::table('truckings')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Trucking record not found'], 404);
        }

        $validated = $this->normalizeOptionalFields($request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'auction_site' => 'nullable|string|in:copart,iaai,manheim,avc,dealership',
            'shipping_type' => 'nullable|string|in:container,roro',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'trucking_date' => 'nullable|date',
            'color' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:255',
            'payment_status' => 'nullable|string|max:50',
            'shipment_status' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'tracking' => 'nullable|string|max:255',
            'trucking_fee_status' => 'nullable|string|in:paid,unpaid',
            'status' => 'nullable|string|in:pending,arrived,on_vessel',
            'origin_port' => 'nullable|string|max:255',
            'origin_country' => 'nullable|string|max:255',
            'destination_port' => 'nullable|string|max:255',
            'destination_country' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric',
            'profit' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]));

        $customerName = trim((string) ($validated['customer_name'] ?? '')) ?: ($record->customer_name ?? 'Walk-in Customer');
        $statusChanged = ($record->status ?? null) !== ($validated['status'] ?? null);

        DB::table('truckings')->where('id', $id)->update([
            'customer_name' => $customerName,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'auction_site' => $validated['auction_site'] ?? ($record->auction_site ?? 'copart'),
            'shipping_type' => $validated['shipping_type'] ?? ($record->shipping_type ?? 'container'),
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'trucking_date' => $validated['trucking_date'] ?? null,
            'color' => $validated['color'] ?? null,
            'vin' => $validated['vin'] ?? null,
            'payment_status' => $validated['payment_status'] ?? null,
            'shipment_status' => $validated['shipment_status'] ?? null,
            'location' => $validated['location'] ?? null,
            'tracking' => $validated['tracking'] ?? null,
            'trucking_fee_status' => $validated['trucking_fee_status'] ?? ($record->trucking_fee_status ?? 'unpaid'),
            'status' => $validated['status'] ?? ($record->status ?? 'pending'),
            'origin_port' => $validated['origin_port'] ?? null,
            'origin_country' => $validated['origin_country'] ?? null,
            'destination_port' => $validated['destination_port'] ?? null,
            'destination_country' => $validated['destination_country'] ?? null,
            'amount' => $validated['amount'] ?? null,
            'profit' => $validated['profit'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now(),
        ]);

        if ($statusChanged && !empty($validated['customer_email'])) {
            (new NotificationService())->sendServiceStatusUpdate('Trucking', (object) array_merge((array) $record, $validated, ['customer_email' => $validated['customer_email']]), 'Trucking status updated');
        }

        DB::table('activity_stream')->insert([
            'action' => 'Trucking Updated',
            'description' => 'Trucking record for ' . $record->customer_name . ' updated',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trucking record updated successfully',
        ]);
    }

    public function deleteTrucking($id)
    {
        $record = DB::table('truckings')->where('id', $id)->first();

        if (!$record) {
            return response()->json(['error' => 'Trucking record not found'], 404);
        }

        DB::table('truckings')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Trucking Deleted',
            'description' => 'Trucking record for ' . $record->customer_name . ' deleted',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trucking record deleted successfully',
        ]);
    }

    // Shipment Management
    public function getShipments(Request $request)
    {
        $sortBy = $request->get('sort_by', 'eta');
        $sortOrder = $request->get('sort_order', 'asc');
        $search = $request->get('search', '');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $etaFrom = $request->get('eta_from');
        $etaTo = $request->get('eta_to');
        $status = $request->get('status');
        $shippingType = $request->get('shipping_type');
        $customer = $request->get('customer');

        // Validate sort parameters
        $allowedSortFields = [
            'created_at',
            'tracking_number',
            'reference_number',
            'customer_name',
            'status',
            'progress_percentage',
            'estimated_arrival_date',
            'delivery_date',
            'vehicle_make',
            'vehicle_model',
            'vehicle_year',
            'origin_port',
            'destination_port',
            'total_cost',
            'shipping_provider',
            'vessel_name',
            'container_number',
            'car_model',
            'year',
            'vin',
            'eta',
            'shipping_fee',
            'shipping_fee_status',
            'c_number'
        ];

        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'eta';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $query = DB::table('shipments')
            ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
            ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
            ->select('shipments.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name');

        // Apply search filter
        if (!empty($search)) {
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('shipments.reference_number', 'like', $searchTerm)
                    ->orWhere('shipments.tracking_number', 'like', $searchTerm)
                    ->orWhere('shipments.customer_name', 'like', $searchTerm)
                    ->orWhere('shipments.customer_email', 'like', $searchTerm)
                    ->orWhere('shipments.customer_phone', 'like', $searchTerm)
                    ->orWhere('shipments.vehicle_make', 'like', $searchTerm)
                    ->orWhere('shipments.vehicle_model', 'like', $searchTerm)
                    ->orWhere('shipments.vehicle_year', 'like', $searchTerm)
                    ->orWhere('shipments.car_model', 'like', $searchTerm)
                    ->orWhere('shipments.vin', 'like', $searchTerm)
                    ->orWhere('shipments.container_number', 'like', $searchTerm)
                    ->orWhere('shipments.c_number', 'like', $searchTerm)
                    ->orWhere('shipments.booking_number', 'like', $searchTerm)
                    ->orWhere('shipments.vessel_name', 'like', $searchTerm)
                    ->orWhere('shipments.origin_port', 'like', $searchTerm)
                    ->orWhere('shipments.destination_port', 'like', $searchTerm)
                    ->orWhere('shipments.shipping_provider', 'like', $searchTerm)
                    ->orWhere('shipments.status', 'like', $searchTerm)
                    ->orWhere('shipping_types.name', 'like', $searchTerm)
                    ->orWhere('shipping_lines.name', 'like', $searchTerm);
            });
        }
        if ($dateFrom) $query->whereDate('shipments.created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('shipments.created_at', '<=', $dateTo);
        if ($etaFrom) $query->whereDate('shipments.eta', '>=', $etaFrom);
        if ($etaTo) $query->whereDate('shipments.eta', '<=', $etaTo);
        if ($status) $query->where('shipments.status', $status);
        if ($shippingType) $query->whereRaw('LOWER(shipping_types.code) = ?', [strtolower($shippingType)]);
        if ($customer) $query->where('shipments.customer_name', 'like', '%' . $customer . '%');

        if ($sortBy === 'eta' && $sortOrder === 'asc') {
            $query->orderByRaw('shipments.eta IS NULL ASC')->orderBy('shipments.eta', 'asc');
        } else {
            $query->orderBy('shipments.' . $sortBy, $sortOrder);
        }

        $shipments = $query
            ->get()
            ->map(function ($shipment) {
                return [
                    'id' => $shipment->id,
                    'tracking_number' => $shipment->tracking_number,
                    'reference_number' => $shipment->reference_number,
                    'customer_name' => $shipment->customer_name,
                    'customer_email' => $shipment->customer_email,
                    'customer_phone' => $shipment->customer_phone,
                    'vehicle' => trim(($shipment->vehicle_year ?? '') . ' ' . ($shipment->vehicle_make ?? '') . ' ' . ($shipment->vehicle_model ?? '')),
                    'vehicle_make' => $shipment->vehicle_make,
                    'vehicle_model' => $shipment->vehicle_model,
                    'vehicle_year' => $shipment->vehicle_year,
                    'vehicle_vin' => $shipment->vehicle_vin,
                    'vehicle_description' => $shipment->vehicle_description,
                    'car_model' => $shipment->car_model,
                    'year' => $shipment->year,
                    'car_color' => $shipment->car_color,
                    'image_link' => $shipment->image_link,
                    'vin' => $shipment->vin,
                    'shipping_type_id' => $shipment->shipping_type_id,
                    'shipping_type_name' => $shipment->shipping_type_name,
                    'shipping_line_id' => $shipment->shipping_line_id,
                    'shipping_line_name' => $shipment->shipping_line_name,
                    'eta' => $shipment->eta,
                    'client_name' => $shipment->client_name,
                    'origin' => $shipment->origin_port . ', ' . $shipment->origin_country,
                    'origin_port' => $shipment->origin_port,
                    'origin_country' => $shipment->origin_country,
                    'destination' => $shipment->destination_port . ', ' . $shipment->destination_country,
                    'destination_port' => $shipment->destination_port,
                    'destination_country' => $shipment->destination_country,
                    'status' => $shipment->status,
                    'progress_percentage' => $shipment->progress_percentage,
                    'shipping_provider' => $shipment->shipping_provider,
                    'vessel_name' => $shipment->vessel_name,
                    'container_number' => $shipment->container_number,
                    'c_number' => $shipment->c_number,
                    'booking_number' => $shipment->booking_number,
                    'auction_date' => $shipment->auction_date,
                    'shipping_date' => $shipment->shipping_date,
                    'departure_date' => $shipment->departure_date,
                    'estimated_arrival_date' => $shipment->estimated_arrival_date,
                    'actual_arrival_date' => $shipment->actual_arrival_date,
                    'delivery_date' => $shipment->delivery_date,
                    'total_cost' => $shipment->total_cost,
                    'shipping_fee' => $shipment->shipping_fee,
                    'shipping_fee_status' => $shipment->shipping_fee_status,
                    'notes' => $shipment->notes,
                    'admin_notes' => $shipment->admin_notes,
                    'is_active' => $shipment->is_active,
                    'created_at' => $shipment->created_at
                ];
            });

        return response()->json($shipments);
    }

    public function getShipment($id)
    {
        $shipment = DB::table('shipments')->where('id', $id)->first();

        if (!$shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        $updates = DB::table('shipment_updates')
            ->where('shipment_id', $id)
            ->orderBy('update_date', 'desc')
            ->get();

        return response()->json([
            'shipment' => $shipment,
            'updates' => $updates
        ]);
    }

    public static function generateUniqueShipmentReference(string $year = null): string
    {
        $year = $year ?: date('Y');
        $prefix = "OD-{$year}-";

        $nextNumber = 1;
        $existingReferences = DB::table('shipments')
            ->where('reference_number', 'like', $prefix . '%')
            ->pluck('reference_number')
            ->all();

        foreach ($existingReferences as $reference) {
            $suffix = preg_replace('/^' . preg_quote($prefix, '/') . '/', '', (string) $reference);
            if (preg_match('/^\d{4}$/', (string) $suffix)) {
                $nextNumber = max($nextNumber, (int) $suffix + 1);
            }
        }

        $reference = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

        $attempts = 0;
        while (DB::table('shipments')->where('reference_number', $reference)->exists()) {
            $attempts++;
            if ($attempts > 25) {
                throw new \RuntimeException('Unable to generate a unique shipment reference for the current year.');
            }

            $nextNumber++;
            $reference = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
        }

        return $reference;
    }

    public function createShipment(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_description' => 'nullable|string',
            'origin_port' => 'nullable|string|max:255',
            'origin_country' => 'nullable|string|max:255',
            'destination_port' => 'nullable|string|max:255',
            'destination_country' => 'nullable|string|max:255',
            'shipping_provider' => 'nullable|string|max:100',
            'vessel_name' => 'nullable|string|max:255',
            'container_number' => 'nullable|string|max:100',
            'booking_number' => 'nullable|string|max:100',
            'status' => 'nullable|string',
            'auction_date' => 'nullable|date',
            'shipping_date' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'estimated_arrival_date' => 'nullable|date',
            'total_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'car_model' => 'nullable|string|max:255',
            'year' => 'nullable|string|max:4',
            'car_color' => 'nullable|string|max:100',
            'image_link' => 'nullable|string',
            'vin' => 'nullable|string|max:17',
            'shipping_type_id' => 'nullable|integer|exists:shipping_types,id',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'eta' => 'nullable|date',
            'client_name' => 'nullable|string|max:255',
            'shipping_fee' => 'nullable|numeric',
            'shipping_fee_status' => 'nullable|string|in:PAID,UNPAID',
            'c_number' => 'nullable|string|max:100'
        ]);

        // Generate tracking and reference numbers
        $trackingNumber = 'TRK-' . strtoupper(substr(md5(uniqid()), 0, 10));
        $referenceNumber = self::generateUniqueShipmentReference();

        // Calculate progress based on status
        $progressMap = [
            'pending' => 0,
            'auction_won' => 15,
            'documentation' => 30,
            'shipping' => 45,
            'in_transit' => 70,
            'customs' => 85,
            'delivered' => 100,
            'cancelled' => 0
        ];

        $shipmentId = DB::table('shipments')->insertGetId([
            'tracking_number' => $trackingNumber,
            'reference_number' => $referenceNumber,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'origin_port' => $validated['origin_port'] ?? null,
            'origin_country' => $validated['origin_country'] ?? null,
            'destination_port' => $validated['destination_port'] ?? null,
            'destination_country' => $validated['destination_country'] ?? null,
            'shipping_provider' => $validated['shipping_provider'] ?? null,
            'vessel_name' => $validated['vessel_name'] ?? null,
            'container_number' => $validated['container_number'] ?? null,
            'booking_number' => $validated['booking_number'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'progress_percentage' => $progressMap[$validated['status'] ?? 'pending'] ?? 0,
            'auction_date' => $validated['auction_date'] ?? null,
            'shipping_date' => $validated['shipping_date'] ?? null,
            'departure_date' => $validated['departure_date'] ?? null,
            'estimated_arrival_date' => $validated['estimated_arrival_date'] ?? null,
            'total_cost' => $validated['total_cost'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'car_model' => $validated['car_model'] ?? null,
            'year' => $validated['year'] ?? null,
            'car_color' => $validated['car_color'] ?? null,
            'image_link' => $validated['image_link'] ?? null,
            'vin' => $validated['vin'] ?? null,
            'shipping_type_id' => $validated['shipping_type_id'] ?? null,
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'eta' => $validated['eta'] ?? null,
            'client_name' => $validated['client_name'] ?? null,
            'shipping_fee' => $validated['shipping_fee'] ?? null,
            'shipping_fee_status' => $validated['shipping_fee_status'] ?? 'UNPAID',
            'c_number' => $validated['c_number'] ?? null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create initial update
        DB::table('shipment_updates')->insert([
            'shipment_id' => $shipmentId,
            'status' => $validated['status'] ?? 'pending',
            'description' => 'Shipment created',
            'update_date' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Notify customer about new shipment (silently fail if not possible)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendShipmentUpdate((object) [
                'id' => $shipmentId,
                'tracking_number' => $trackingNumber,
                'reference_number' => $referenceNumber,
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'status' => $validated['status'] ?? 'pending',
                'vehicle_year' => $validated['vehicle_year'],
                'vehicle_make' => $validated['vehicle_make'],
                'vehicle_model' => $validated['vehicle_model'],
                'origin_port' => $validated['origin_port'] ?? null,
                'origin_country' => $validated['origin_country'] ?? null,
                'destination_port' => $validated['destination_port'] ?? null,
                'destination_country' => $validated['destination_country'] ?? null,
                'estimated_arrival_date' => $validated['estimated_arrival_date'] ?? null,
                'delivery_date' => $validated['delivery_date'] ?? null
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify customer about new shipment', [
                'shipment_id' => $shipmentId,
                'error' => $e->getMessage()
            ]);
        }

        DB::table('activity_stream')->insert([
            'action' => 'Shipment Created',
            'description' => "New shipment {$referenceNumber} created for {$validated['customer_name']}",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shipment created successfully',
            'shipment_id' => $shipmentId,
            'tracking_number' => $trackingNumber,
            'reference_number' => $referenceNumber
        ]);
    }

    public function updateShipment(Request $request, $id)
    {
        $shipment = DB::table('shipments')->where('id', $id)->first();

        if (!$shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_description' => 'nullable|string',
            'origin_port' => 'nullable|string|max:255',
            'origin_country' => 'nullable|string|max:255',
            'destination_port' => 'nullable|string|max:255',
            'destination_country' => 'nullable|string|max:255',
            'shipping_provider' => 'nullable|string|max:100',
            'vessel_name' => 'nullable|string|max:255',
            'container_number' => 'nullable|string|max:100',
            'booking_number' => 'nullable|string|max:100',
            'status' => 'nullable|string',
            'auction_date' => 'nullable|date',
            'shipping_date' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'estimated_arrival_date' => 'nullable|date',
            'actual_arrival_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'total_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean',
            'car_model' => 'nullable|string|max:255',
            'year' => 'nullable|string|max:4',
            'car_color' => 'nullable|string|max:100',
            'image_link' => 'nullable|string',
            'vin' => 'nullable|string|max:17',
            'shipping_type_id' => 'nullable|integer|exists:shipping_types,id',
            'shipping_line_id' => 'nullable|integer|exists:shipping_lines,id',
            'eta' => 'nullable|date',
            'client_name' => 'nullable|string|max:255',
            'shipping_fee' => 'nullable|numeric',
            'shipping_fee_status' => 'nullable|string|in:PAID,UNPAID',
            'c_number' => 'nullable|string|max:100'
        ]);

        // Calculate progress based on status
        $progressMap = [
            'pending' => 0,
            'auction_won' => 15,
            'documentation' => 30,
            'shipping' => 45,
            'in_transit' => 70,
            'customs' => 85,
            'delivered' => 100,
            'cancelled' => 0
        ];
        $status = $validated['status'] ?? $shipment->status ?? 'pending';

        DB::table('shipments')->where('id', $id)->update([
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'origin_port' => $validated['origin_port'] ?? null,
            'origin_country' => $validated['origin_country'] ?? null,
            'destination_port' => $validated['destination_port'] ?? null,
            'destination_country' => $validated['destination_country'] ?? null,
            'shipping_provider' => $validated['shipping_provider'] ?? null,
            'vessel_name' => $validated['vessel_name'] ?? null,
            'container_number' => $validated['container_number'] ?? null,
            'booking_number' => $validated['booking_number'] ?? null,
            'status' => $status,
            'progress_percentage' => $progressMap[$status] ?? 0,
            'auction_date' => $validated['auction_date'] ?? null,
            'shipping_date' => $validated['shipping_date'] ?? null,
            'departure_date' => $validated['departure_date'] ?? null,
            'estimated_arrival_date' => $validated['estimated_arrival_date'] ?? null,
            'actual_arrival_date' => $validated['actual_arrival_date'] ?? null,
            'delivery_date' => $validated['delivery_date'] ?? null,
            'total_cost' => $validated['total_cost'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'car_model' => $validated['car_model'] ?? null,
            'year' => $validated['year'] ?? null,
            'car_color' => $validated['car_color'] ?? null,
            'image_link' => $validated['image_link'] ?? null,
            'vin' => $validated['vin'] ?? null,
            'shipping_type_id' => $validated['shipping_type_id'] ?? null,
            'shipping_line_id' => $validated['shipping_line_id'] ?? null,
            'eta' => $validated['eta'] ?? null,
            'client_name' => $validated['client_name'] ?? null,
            'shipping_fee' => $validated['shipping_fee'] ?? null,
            'shipping_fee_status' => $validated['shipping_fee_status'] ?? 'UNPAID',
            'c_number' => $validated['c_number'] ?? null,
            'updated_at' => now()
        ]);

        // Add update if status changed
        if ($shipment->status !== $status) {
            DB::table('shipment_updates')->insert([
                'shipment_id' => $id,
                'status' => $status,
                'description' => 'Status updated to ' . $status,
                'update_date' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Notify customer about status change (silently fail if not possible)
            try {
                $notificationService = new NotificationService();
                $notificationService->sendShipmentUpdate((object) array_merge((array) $shipment, [
                    'status' => $status
                ]));
            } catch (\Exception $e) {
                Log::error('Failed to notify customer about shipment status change', [
                    'shipment_id' => $id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        DB::table('activity_stream')->insert([
            'action' => 'Shipment Updated',
            'description' => "Shipment {$shipment->reference_number} updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shipment updated successfully'
        ]);
    }

    public function deleteShipment($id)
    {
        $shipment = DB::table('shipments')->where('id', $id)->first();

        if (!$shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        DB::table('shipment_updates')->where('shipment_id', $id)->delete();
        DB::table('shipments')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Shipment Deleted',
            'description' => "Shipment {$shipment->reference_number} deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shipment deleted successfully'
        ]);
    }

    public function addShipmentUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'location' => 'nullable|string|max:255',
            'description' => 'required|string'
        ]);

        $shipment = DB::table('shipments')->where('id', $id)->first();

        if (!$shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        DB::table('shipment_updates')->insert([
            'shipment_id' => $id,
            'status' => $validated['status'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'],
            'update_date' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Notify customer about new update (silently fail if not possible)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendShipmentUpdate((object) array_merge((array) $shipment, [
                'status' => $validated['status']
            ]), $validated['location'] ?? $validated['description']);
        } catch (\Exception $e) {
            Log::error('Failed to notify customer about shipment update', [
                'shipment_id' => $id,
                'error' => $e->getMessage()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Update added successfully'
        ]);
    }

    // Auction Management
    public function getAuctions()
    {
        $auctions = DB::table('auctions')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($auction) {
                return [
                    'id' => $auction->id,
                    'auction_number' => $auction->auction_number,
                    'vehicle' => trim($auction->vehicle_year . ' ' . $auction->vehicle_make . ' ' . $auction->vehicle_model),
                    'vehicle_make' => $auction->vehicle_make,
                    'vehicle_model' => $auction->vehicle_model,
                    'vehicle_year' => $auction->vehicle_year,
                    'vehicle_vin' => $auction->vehicle_vin,
                    'auction_platform' => $auction->auction_platform,
                    'auction_location' => $auction->auction_location,
                    'current_bid' => $auction->current_bid,
                    'buy_now_price' => $auction->buy_now_price,
                    'status' => $auction->status,
                    'auction_end_time' => $auction->auction_end_time,
                    'customer_name' => $auction->customer_name,
                    'featured' => $auction->featured,
                    'is_active' => $auction->is_active,
                    'created_at' => $auction->created_at
                ];
            });

        return response()->json($auctions);
    }

    public function getAuction($id)
    {
        $auction = DB::table('auctions')->where('id', $id)->first();

        if (!$auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        $bids = DB::table('auction_bids')
            ->where('auction_id', $id)
            ->orderBy('bid_time', 'desc')
            ->get();

        return response()->json([
            'auction' => $auction,
            'bids' => $bids
        ]);
    }

    public function createAuction(Request $request)
    {
        $validated = $request->validate([
            'vehicle_make' => 'required|string|max:100',
            'vehicle_model' => 'required|string|max:100',
            'vehicle_year' => 'required|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_color' => 'nullable|string|max:50',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_mileage' => 'nullable|integer',
            'vehicle_description' => 'nullable|string',
            'auction_platform' => 'required|string|max:100',
            'auction_location' => 'required|string|max:255',
            'lot_number' => 'nullable|string|max:100',
            'title_status' => 'required|string',
            'damage_description' => 'nullable|string',
            'current_bid' => 'nullable|numeric',
            'reserve_price' => 'nullable|numeric',
            'buy_now_price' => 'nullable|numeric',
            'estimated_repair_cost' => 'nullable|numeric',
            'market_value' => 'nullable|numeric',
            'status' => 'required|string',
            'auction_start_time' => 'nullable|date',
            'auction_end_time' => 'nullable|date',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_max_bid' => 'nullable|numeric',
            'deposit_paid' => 'boolean',
            'deposit_amount' => 'nullable|numeric',
            'admin_notes' => 'nullable|string',
            'featured' => 'boolean'
        ]);

        $auctionNumber = 'AUC-' . date('Y') . '-' . str_pad(DB::table('auctions')->count() + 1, 5, '0', STR_PAD_LEFT);

        $auctionId = DB::table('auctions')->insertGetId([
            'auction_number' => $auctionNumber,
            'vehicle_make' => $validated['vehicle_make'],
            'vehicle_model' => $validated['vehicle_model'],
            'vehicle_year' => $validated['vehicle_year'],
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_color' => $validated['vehicle_color'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'vehicle_mileage' => $validated['vehicle_mileage'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'auction_platform' => $validated['auction_platform'],
            'auction_location' => $validated['auction_location'],
            'lot_number' => $validated['lot_number'] ?? null,
            'title_status' => $validated['title_status'],
            'damage_description' => $validated['damage_description'] ?? null,
            'current_bid' => $validated['current_bid'] ?? 0,
            'reserve_price' => $validated['reserve_price'] ?? null,
            'buy_now_price' => $validated['buy_now_price'] ?? null,
            'estimated_repair_cost' => $validated['estimated_repair_cost'] ?? null,
            'market_value' => $validated['market_value'] ?? null,
            'status' => $validated['status'],
            'auction_start_time' => $validated['auction_start_time'] ?? null,
            'auction_end_time' => $validated['auction_end_time'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'customer_max_bid' => $validated['customer_max_bid'] ?? null,
            'deposit_paid' => $validated['deposit_paid'] ?? false,
            'deposit_amount' => $validated['deposit_amount'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'featured' => $validated['featured'] ?? false,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Auction Created',
            'description' => "New auction {$auctionNumber} created for {$validated['vehicle_year']} {$validated['vehicle_make']} {$validated['vehicle_model']}",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Auction created successfully',
            'auction_id' => $auctionId,
            'auction_number' => $auctionNumber
        ]);
    }

    public function updateAuction(Request $request, $id)
    {
        $auction = DB::table('auctions')->where('id', $id)->first();

        if (!$auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        $validated = $request->validate([
            'vehicle_make' => 'required|string|max:100',
            'vehicle_model' => 'required|string|max:100',
            'vehicle_year' => 'required|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_color' => 'nullable|string|max:50',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_mileage' => 'nullable|integer',
            'vehicle_description' => 'nullable|string',
            'auction_platform' => 'required|string|max:100',
            'auction_location' => 'required|string|max:255',
            'lot_number' => 'nullable|string|max:100',
            'title_status' => 'required|string',
            'damage_description' => 'nullable|string',
            'current_bid' => 'nullable|numeric',
            'reserve_price' => 'nullable|numeric',
            'buy_now_price' => 'nullable|numeric',
            'estimated_repair_cost' => 'nullable|numeric',
            'market_value' => 'nullable|numeric',
            'status' => 'required|string',
            'auction_start_time' => 'nullable|date',
            'auction_end_time' => 'nullable|date',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_max_bid' => 'nullable|numeric',
            'deposit_paid' => 'boolean',
            'deposit_amount' => 'nullable|numeric',
            'winning_bid' => 'nullable|numeric',
            'admin_notes' => 'nullable|string',
            'featured' => 'boolean',
            'is_active' => 'boolean'
        ]);

        DB::table('auctions')->where('id', $id)->update([
            'vehicle_make' => $validated['vehicle_make'],
            'vehicle_model' => $validated['vehicle_model'],
            'vehicle_year' => $validated['vehicle_year'],
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_color' => $validated['vehicle_color'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'vehicle_mileage' => $validated['vehicle_mileage'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'auction_platform' => $validated['auction_platform'],
            'auction_location' => $validated['auction_location'],
            'lot_number' => $validated['lot_number'] ?? null,
            'title_status' => $validated['title_status'],
            'damage_description' => $validated['damage_description'] ?? null,
            'current_bid' => $validated['current_bid'] ?? 0,
            'reserve_price' => $validated['reserve_price'] ?? null,
            'buy_now_price' => $validated['buy_now_price'] ?? null,
            'estimated_repair_cost' => $validated['estimated_repair_cost'] ?? null,
            'market_value' => $validated['market_value'] ?? null,
            'status' => $validated['status'],
            'auction_start_time' => $validated['auction_start_time'] ?? null,
            'auction_end_time' => $validated['auction_end_time'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'customer_max_bid' => $validated['customer_max_bid'] ?? null,
            'deposit_paid' => $validated['deposit_paid'] ?? false,
            'deposit_amount' => $validated['deposit_amount'] ?? null,
            'winning_bid' => $validated['winning_bid'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'featured' => $validated['featured'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now()
        ]);

        if ($auction->status !== $validated['status'] && $validated['status'] === 'won') {
            DB::table('auctions')->where('id', $id)->update(['won_at' => now()]);
        }

        DB::table('activity_stream')->insert([
            'action' => 'Auction Updated',
            'description' => "Auction {$auction->auction_number} updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Auction updated successfully'
        ]);
    }

    public function deleteAuction($id)
    {
        $auction = DB::table('auctions')->where('id', $id)->first();

        if (!$auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        DB::table('auction_bids')->where('auction_id', $id)->delete();
        DB::table('auctions')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Auction Deleted',
            'description' => "Auction {$auction->auction_number} deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Auction deleted successfully'
        ]);
    }

    public function addBid(Request $request, $id)
    {
        $validated = $request->validate([
            'bid_amount' => 'required|numeric',
            'bidder_name' => 'nullable|string|max:255',
            'is_our_bid' => 'boolean'
        ]);

        DB::table('auction_bids')->insert([
            'auction_id' => $id,
            'bid_amount' => $validated['bid_amount'],
            'bidder_name' => $validated['bidder_name'] ?? 'Anonymous',
            'is_our_bid' => $validated['is_our_bid'] ?? false,
            'bid_time' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('auctions')->where('id', $id)->update([
            'current_bid' => $validated['bid_amount'],
            'total_bids' => DB::raw('total_bids + 1'),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bid added successfully'
        ]);
    }

    public function getAuctionRequests()
    {
        $requests = DB::table('auction_requests')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function updateAuctionRequestStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'auction_id' => 'nullable|integer'
        ]);

        DB::table('auction_requests')->where('id', $id)->update([
            'status' => $validated['status'],
            'auction_id' => $validated['auction_id'] ?? null,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request status updated successfully'
        ]);
    }

    // Legal Pages Management
    public function getLegalPages()
    {
        $pages = DB::table('legal_pages')
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json($pages);
    }

    public function getLegalPage($id)
    {
        $page = DB::table('legal_pages')->where('id', $id)->first();

        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        return response()->json($page);
    }

    public function createLegalPage(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string|max:255|unique:legal_pages,slug',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'meta_description' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'integer'
        ]);

        $pageId = DB::table('legal_pages')->insertGetId([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'meta_description' => $validated['meta_description'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Legal Page Created',
            'description' => "New legal page '{$validated['title']}' created",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Legal page created successfully',
            'page_id' => $pageId
        ]);
    }

    public function updateLegalPage(Request $request, $id)
    {
        $page = DB::table('legal_pages')->where('id', $id)->first();

        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        $validated = $request->validate([
            'slug' => 'required|string|max:255|unique:legal_pages,slug,' . $id,
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'meta_description' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'integer'
        ]);

        DB::table('legal_pages')->where('id', $id)->update([
            'slug' => $validated['slug'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'meta_description' => $validated['meta_description'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Legal Page Updated',
            'description' => "Legal page '{$validated['title']}' updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Legal page updated successfully'
        ]);
    }

    public function deleteLegalPage($id)
    {
        $page = DB::table('legal_pages')->where('id', $id)->first();

        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        DB::table('legal_pages')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Legal Page Deleted',
            'description' => "Legal page '{$page->title}' deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Legal page deleted successfully'
        ]);
    }

    // About Us Management
    public function getAboutUsSections()
    {
        $sections = DB::table('about_us')
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json($sections);
    }

    public function getAboutUsSection($id)
    {
        $section = DB::table('about_us')->where('id', $id)->first();

        if (!$section) {
            return response()->json(['error' => 'Section not found'], 404);
        }

        return response()->json($section);
    }

    public function updateAboutUsSection(Request $request, $id)
    {
        $section = DB::table('about_us')->where('id', $id)->first();

        if (!$section) {
            return response()->json(['error' => 'Section not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'image_url' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'integer'
        ]);

        DB::table('about_us')->where('id', $id)->update([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'content' => $validated['content'],
            'image_url' => $validated['image_url'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'About Us Section Updated',
            'description' => "About Us section '{$validated['title']}' updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'About Us section updated successfully'
        ]);
    }

    public function createAboutUsSection(Request $request)
    {
        $validated = $request->validate([
            'section_key' => 'required|string|max:255|unique:about_us,section_key',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'image_url' => 'nullable|string',
            'is_published' => 'boolean',
            'display_order' => 'integer'
        ]);

        $id = DB::table('about_us')->insertGetId([
            'section_key' => $validated['section_key'],
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'content' => $validated['content'],
            'image_url' => $validated['image_url'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
            'metadata' => json_encode(['type' => 'leader']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'About Us Section Created',
            'description' => "New About Us section '{$validated['title']}' created",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'About Us section created successfully',
            'data' => ['id' => $id]
        ]);
    }

    public function deleteAboutUsSection($id)
    {
        $section = DB::table('about_us')->where('id', $id)->first();

        if (!$section) {
            return response()->json(['error' => 'Section not found'], 404);
        }

        DB::table('about_us')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'About Us Section Deleted',
            'description' => "About Us section '{$section->title}' deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'About Us section deleted successfully'
        ]);
    }

    public function searchShipments(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = DB::table('shipments')
            ->select(
                'id',
                'tracking_number',
                'reference_number',
                'vin',
                'vehicle_vin',
                'car_model',
                'vehicle_make',
                'vehicle_model',
                'year',
                'customer_name',
                'status',
                DB::raw("CONCAT(COALESCE(vehicle_make, ''), ' ', COALESCE(vehicle_model, ''), ' ', COALESCE(car_model, '')) as vehicle_description")
            )
            ->where(function ($q) use ($query) {
                $q->where('tracking_number', 'LIKE', "%{$query}%")
                    ->orWhere('reference_number', 'LIKE', "%{$query}%")
                    ->orWhere('vin', 'LIKE', "%{$query}%")
                    ->orWhere('vehicle_vin', 'LIKE', "%{$query}%")
                    ->orWhere('car_model', 'LIKE', "%{$query}%")
                    ->orWhere('vehicle_make', 'LIKE', "%{$query}%")
                    ->orWhere('vehicle_model', 'LIKE', "%{$query}%")
                    ->orWhere('customer_name', 'LIKE', "%{$query}%")
                    ->orWhere('customer_email', 'LIKE', "%{$query}%")
                    ->orWhere('container_number', 'LIKE', "%{$query}%")
                    ->orWhere('booking_number', 'LIKE', "%{$query}%");
            })
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json(['results' => $results]);
    }

    // Carousel Management
    public function getCarouselImages()
    {
        $images = DB::table('carousel_images')
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json($images);
    }

    public function getCarouselImage($id)
    {
        $image = DB::table('carousel_images')->where('id', $id)->first();

        if (!$image) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        return response()->json($image);
    }

    public function createCarouselImage(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'required|string',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'display_order' => 'integer',
            'is_active' => 'boolean'
        ]);

        $imageId = DB::table('carousel_images')->insertGetId([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'image_url' => $validated['image_url'],
            'button_text' => $validated['button_text'] ?? null,
            'button_link' => $validated['button_link'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Carousel Image Created',
            'description' => "New carousel image '{$validated['title']}' created",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Carousel image created successfully',
            'image_id' => $imageId
        ]);
    }

    public function updateCarouselImage(Request $request, $id)
    {
        $image = DB::table('carousel_images')->where('id', $id)->first();

        if (!$image) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'required|string',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'display_order' => 'integer',
            'is_active' => 'boolean'
        ]);

        DB::table('carousel_images')->where('id', $id)->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'image_url' => $validated['image_url'],
            'button_text' => $validated['button_text'] ?? null,
            'button_link' => $validated['button_link'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Carousel Image Updated',
            'description' => "Carousel image '{$validated['title']}' updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Carousel image updated successfully'
        ]);
    }

    public function deleteCarouselImage($id)
    {
        $image = DB::table('carousel_images')->where('id', $id)->first();

        if (!$image) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        DB::table('carousel_images')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Carousel Image Deleted',
            'description' => "Carousel image '{$image->title}' deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Carousel image deleted successfully'
        ]);
    }

    // General Settings
    public function getGeneralSettings()
    {
        $keys = ['minimum_deposit', 'office_address', 'office_city', 'office_country', 'office_phone', 'office_email', 'site_title', 'site_description'];
        $settings = DB::table('settings')
            ->whereIn('key', $keys)
            ->pluck('value', 'key');

        return response()->json([
            'minimum_deposit' => $settings['minimum_deposit'] ?? '1000',
            'office_address' => $settings['office_address'] ?? '',
            'office_city' => $settings['office_city'] ?? '',
            'office_country' => $settings['office_country'] ?? '',
            'office_phone' => $settings['office_phone'] ?? '',
            'office_email' => $settings['office_email'] ?? '',
            'site_title' => $settings['site_title'] ?? 'OD Automotive & Logistics | Professional Industrial Transport',
            'site_description' => $settings['site_description'] ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.'
        ]);
    }

    public function updateGeneralSettings(Request $request)
    {
        $validated = $request->validate([
            'minimum_deposit' => 'required|numeric|min:0',
            'office_address' => 'nullable|string|max:500',
            'office_city' => 'nullable|string|max:255',
            'office_country' => 'nullable|string|max:255',
            'office_phone' => 'nullable|string|max:50',
            'office_email' => 'nullable|email|max:255',
            'site_title' => 'nullable|string|max:255',
            'site_description' => 'nullable|string|max:500'
        ]);

        foreach ($validated as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        DB::table('activity_stream')->insert([
            'action' => 'General Settings Updated',
            'description' => 'General settings were modified',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'General settings updated successfully'
        ]);
    }

    // Homepage Services Management
    public function getHomepageServices()
    {
        $services = DB::table('homepage_services')
            ->orderBy('display_order', 'asc')
            ->get();

        $settings = DB::table('settings')
            ->whereIn('key', ['homepage_services_title', 'homepage_services_subtitle', 'homepage_services_description'])
            ->pluck('value', 'key');

        return response()->json([
            'services' => $services,
            'title' => $settings['homepage_services_title'] ?? 'Full-Spectrum Logistics',
            'subtitle' => $settings['homepage_services_subtitle'] ?? 'Our Expertise',
            'description' => $settings['homepage_services_description'] ?? ''
        ]);
    }

    public function updateHomepageService(Request $request, $id)
    {
        $validated = $request->validate([
            'icon' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'display_order' => 'required|integer',
            'is_active' => 'required|boolean'
        ]);

        DB::table('homepage_services')->where('id', $id)->update([
            'icon' => $validated['icon'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'display_order' => $validated['display_order'],
            'is_active' => $validated['is_active'],
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully'
        ]);
    }

    public function updateHomepageServicesSettings(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'required|string|max:255',
            'description' => 'required|string|max:500'
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => 'homepage_services_title'],
            ['value' => $validated['title'], 'updated_at' => now()]
        );

        DB::table('settings')->updateOrInsert(
            ['key' => 'homepage_services_subtitle'],
            ['value' => $validated['subtitle'], 'updated_at' => now()]
        );

        DB::table('settings')->updateOrInsert(
            ['key' => 'homepage_services_description'],
            ['value' => $validated['description'], 'updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Services section settings updated successfully'
        ]);
    }

    // Email Templates Management
    public function getEmailTemplates()
    {
        $templates = DB::table('email_templates')
            ->orderBy('type', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($templates);
    }

    public function getEmailTemplate($id)
    {
        $template = DB::table('email_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        return response()->json($template);
    }

    public function updateEmailTemplate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:500',
            'content' => 'required|string',
            'is_active' => 'required|boolean'
        ]);

        $template = DB::table('email_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        DB::table('email_templates')->where('id', $id)->update([
            'name' => $validated['name'],
            'subject' => $validated['subject'],
            'content' => $validated['content'],
            'is_active' => $validated['is_active'],
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'Email Template Updated',
            'description' => "Email template '{$validated['name']}' was updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email template updated successfully'
        ]);
    }

    public function testEmailTemplate(Request $request, $id)
    {
        $validated = $request->validate([
            'test_email' => 'required|email'
        ]);

        $template = DB::table('email_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        // Get settings for email footer
        $settings = DB::table('settings')
            ->whereIn('key', ['office_address', 'office_city', 'office_country', 'office_phone', 'office_email', 'social_facebook', 'social_instagram'])
            ->pluck('value', 'key');

        // Sample data for testing
        $sampleData = [
            'customer_name' => 'John Doe',
            'tracking_number' => 'OD-' . rand(10000, 99999) . '-AUTO',
            'status' => 'In Transit',
            'current_location' => 'Port of Los Angeles',
            'vehicle_details' => '2024 Tesla Model S',
            'estimated_delivery' => date('M d, Y', strtotime('+7 days')),
            'reference_number' => 'REF-' . rand(1000, 9999),
            'total_cost' => '$2,500.00',
            'transit_time' => '7-10 business days',
            'auction_reference' => 'AUC-' . rand(1000, 9999),
            'winning_bid' => '$45,000',
            'tracking_url' => url('/tracking'),
            'quote_url' => url('/quote'),
            'progress_percentage' => 65,
            'hero_title' => $template->name,
            'hero_subtitle' => strtoupper($template->type),
            'office_address' => $settings['office_address'] ?? '',
            'office_city' => $settings['office_city'] ?? '',
            'office_country' => $settings['office_country'] ?? '',
            'office_phone' => $settings['office_phone'] ?? '',
            'office_email' => $settings['office_email'] ?? '',
            'social_facebook' => $settings['social_facebook'] ?? '',
            'social_instagram' => $settings['social_instagram'] ?? ''
        ];

        try {
            Mail::send('emails.' . $template->slug, $sampleData, function ($message) use ($validated, $template) {
                $message->to($validated['test_email'])
                    ->subject('[TEST] ' . $template->subject);
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $validated['test_email']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage()
            ], 500);
        }
    }

    // SMS Templates Management
    public function getSMSTemplates()
    {
        $templates = DB::table('sms_templates')
            ->orderBy('type', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($templates);
    }

    public function getSMSTemplate($id)
    {
        $template = DB::table('sms_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        return response()->json($template);
    }

    public function updateSMSTemplate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message' => 'required|string|max:500',
            'is_active' => 'required|boolean'
        ]);

        $template = DB::table('sms_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        DB::table('sms_templates')->where('id', $id)->update([
            'name' => $validated['name'],
            'message' => $validated['message'],
            'is_active' => $validated['is_active'],
            'updated_at' => now()
        ]);

        DB::table('activity_stream')->insert([
            'action' => 'SMS Template Updated',
            'description' => "SMS template '{$validated['name']}' was updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'SMS template updated successfully'
        ]);
    }

    public function testSMSTemplate(Request $request, $id)
    {
        $validated = $request->validate([
            'test_phone' => 'required|string'
        ]);

        $template = DB::table('sms_templates')->where('id', $id)->first();

        if (!$template) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        // Sample data for testing
        $sampleData = [
            'customer_name' => 'John Doe',
            'tracking_number' => 'OD-' . rand(10000, 99999) . '-AUTO',
            'status' => 'In Transit',
            'current_location' => 'Port of Los Angeles',
            'vehicle_details' => '2024 Tesla Model S',
            'estimated_delivery' => date('M d, Y', strtotime('+7 days')),
            'reference_number' => 'REF-' . rand(1000, 9999),
            'total_cost' => '$2,500.00',
            'transit_time' => '7-10 days',
            'auction_reference' => 'AUC-' . rand(1000, 9999),
            'winning_bid' => '$45,000',
            'bid_amount' => '$42,000',
            'tracking_url' => url('/tracking'),
            'quote_url' => url('/quote'),
            'amount' => '$1,500.00',
            'transaction_id' => 'TXN-' . rand(10000, 99999),
            'pickup_date' => date('M d, Y', strtotime('+2 days')),
            'pickup_location' => 'Los Angeles, CA',
            'delivery_date' => date('M d, Y', strtotime('+7 days')),
            'delivery_location' => 'New York, NY'
        ];

        try {
            $termiiService = new \App\Services\TermiiService();
            $result = $termiiService->sendTemplatedSMS($template->slug, $validated['test_phone'], $sampleData);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test SMS: ' . $e->getMessage()
            ], 500);
        }
    }

    // Termii Settings
    public function getTermiiSettings()
    {
        $keys = ['termii_api_key', 'termii_sender_id', 'termii_channel', 'termii_enabled'];
        $settings = DB::table('settings')
            ->whereIn('key', $keys)
            ->pluck('value', 'key');

        return response()->json([
            'api_key' => $settings['termii_api_key'] ?? '',
            'sender_id' => $settings['termii_sender_id'] ?? 'OD Auto',
            'channel' => $settings['termii_channel'] ?? 'generic',
            'enabled' => ($settings['termii_enabled'] ?? 'false') === 'true'
        ]);
    }

    public function updateTermiiSettings(Request $request)
    {
        $validated = $request->validate([
            'api_key' => 'required|string',
            'sender_id' => 'required|string|max:11',
            'channel' => 'required|string|in:generic,dnd,whatsapp',
            'enabled' => 'required|boolean'
        ]);

        $settings = [
            'termii_api_key' => $validated['api_key'],
            'termii_sender_id' => $validated['sender_id'],
            'termii_channel' => $validated['channel'],
            'termii_enabled' => $validated['enabled'] ? 'true' : 'false'
        ];

        foreach ($settings as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        DB::table('activity_stream')->insert([
            'action' => 'Termii Settings Updated',
            'description' => 'Termii SMS settings were updated',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Termii settings updated successfully'
        ]);
    }

    public function getTermiiBalance()
    {
        try {
            $termiiService = new \App\Services\TermiiService();
            $result = $termiiService->getBalance();
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch balance: ' . $e->getMessage(),
                'balance' => 0
            ], 500);
        }
    }

    public function getSMSLog(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $query = DB::table('sms_log')
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('phone_number')) {
            $query->where('phone_number', 'like', '%' . $request->input('phone_number') . '%');
        }

        $total = $query->count();
        $logs = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return response()->json([
            'logs' => $logs,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage)
        ]);
    }

    // Social Media Settings
    public function getSocialMediaSettings()
    {
        $keys = ['social_facebook', 'social_instagram', 'social_twitter', 'social_linkedin', 'social_tiktok'];
        $settings = DB::table('settings')
            ->whereIn('key', $keys)
            ->pluck('value', 'key');

        return response()->json([
            'facebook' => $settings['social_facebook'] ?? '',
            'instagram' => $settings['social_instagram'] ?? '',
            'twitter' => $settings['social_twitter'] ?? '',
            'linkedin' => $settings['social_linkedin'] ?? '',
            'tiktok' => $settings['social_tiktok'] ?? ''
        ]);
    }

    public function updateSocialMediaSettings(Request $request)
    {
        $validated = $request->validate([
            'facebook' => 'nullable|string|max:255',
            'instagram' => 'nullable|string|max:255',
            'twitter' => 'nullable|string|max:255',
            'linkedin' => 'nullable|string|max:255',
            'tiktok' => 'nullable|string|max:255'
        ]);

        $keyMap = [
            'facebook' => 'social_facebook',
            'instagram' => 'social_instagram',
            'twitter' => 'social_twitter',
            'linkedin' => 'social_linkedin',
            'tiktok' => 'social_tiktok'
        ];

        foreach ($validated as $frontendKey => $value) {
            $dbKey = $keyMap[$frontendKey];
            DB::table('settings')
                ->updateOrInsert(
                    ['key' => $dbKey],
                    ['value' => $value ?? '', 'updated_at' => now()]
                );
        }

        DB::table('activity_logs')->insert([
            'icon' => 'settings',
            'user_name' => 'Admin',
            'action' => 'updated social media links',
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Social media settings updated successfully'
        ]);
    }

    // Performance Settings
    public function getPerformanceSettings()
    {
        $deliveredCount = DB::table('settings')
            ->where('key', 'delivered_cars_count')
            ->value('value');

        return response()->json([
            'delivered_cars_count' => $deliveredCount ?? '100'
        ]);
    }

    public function updatePerformanceSettings(Request $request)
    {
        $validated = $request->validate([
            'delivered_cars_count' => 'required|string'
        ]);

        DB::table('settings')
            ->updateOrInsert(
                ['key' => 'delivered_cars_count'],
                [
                    'value' => $validated['delivered_cars_count'],
                    'updated_at' => now()
                ]
            );

        DB::table('activity_stream')->insert([
            'action' => 'Performance Settings Updated',
            'description' => "Delivered cars count updated to {$validated['delivered_cars_count']}",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Performance settings updated successfully'
        ]);
    }

    // Services Management
    public function getServices()
    {
        $services = DB::table('services')
            ->orderBy('display_order', 'asc')
            ->get()
            ->map(function ($service) {
                $features = DB::table('service_features')
                    ->where('service_id', $service->id)
                    ->orderBy('display_order', 'asc')
                    ->pluck('feature_text')
                    ->toArray();

                return [
                    'id' => $service->id,
                    'title' => $service->title,
                    'slug' => $service->slug,
                    'icon' => $service->icon,
                    'description' => $service->description,
                    'youtube_video_id' => $service->youtube_video_id,
                    'display_order' => $service->display_order,
                    'is_active' => $service->is_active,
                    'features' => $features,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at
                ];
            });

        return response()->json($services);
    }

    public function getService($id)
    {
        $service = DB::table('services')->where('id', $id)->first();

        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $features = DB::table('service_features')
            ->where('service_id', $id)
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json([
            'service' => $service,
            'features' => $features
        ]);
    }

    public function createService(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:services,slug',
            'icon' => 'required|string|max:100',
            'description' => 'required|string',
            'youtube_video_id' => 'nullable|string|max:50',
            'display_order' => 'integer',
            'is_active' => 'boolean',
            'features' => 'array',
            'features.*' => 'string'
        ]);

        $serviceId = DB::table('services')->insertGetId([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'icon' => $validated['icon'],
            'description' => $validated['description'],
            'youtube_video_id' => $validated['youtube_video_id'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        if (!empty($validated['features'])) {
            foreach ($validated['features'] as $index => $feature) {
                DB::table('service_features')->insert([
                    'service_id' => $serviceId,
                    'feature_text' => $feature,
                    'display_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        DB::table('activity_stream')->insert([
            'action' => 'Service Created',
            'description' => "New service '{$validated['title']}' created",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'service_id' => $serviceId
        ]);
    }

    public function updateService(Request $request, $id)
    {
        $service = DB::table('services')->where('id', $id)->first();

        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:services,slug,' . $id,
            'icon' => 'required|string|max:100',
            'description' => 'required|string',
            'youtube_video_id' => 'nullable|string|max:50',
            'display_order' => 'integer',
            'is_active' => 'boolean',
            'features' => 'array',
            'features.*' => 'string'
        ]);

        DB::table('services')->where('id', $id)->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'icon' => $validated['icon'],
            'description' => $validated['description'],
            'youtube_video_id' => $validated['youtube_video_id'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'updated_at' => now()
        ]);

        DB::table('service_features')->where('service_id', $id)->delete();

        if (!empty($validated['features'])) {
            foreach ($validated['features'] as $index => $feature) {
                DB::table('service_features')->insert([
                    'service_id' => $id,
                    'feature_text' => $feature,
                    'display_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        DB::table('activity_stream')->insert([
            'action' => 'Service Updated',
            'description' => "Service '{$validated['title']}' updated",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully'
        ]);
    }

    public function deleteService($id)
    {
        $service = DB::table('services')->where('id', $id)->first();

        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        DB::table('service_features')->where('service_id', $id)->delete();
        DB::table('services')->where('id', $id)->delete();

        DB::table('activity_stream')->insert([
            'action' => 'Service Deleted',
            'description' => "Service '{$service->title}' deleted",
            'location' => 'Admin Dashboard',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully'
        ]);
    }

    // Admin User Management (Superadmin only)
    public function getAdminUsers(Request $request)
    {
        $adminRole = $request->session()->get('admin_role', 'admin');

        if ($adminRole !== 'superadmin') {
            return response()->json(['error' => 'Unauthorized. Superadmin access required.'], 403);
        }

        $adminUsers = DB::table('admin_users')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'admin',
                    'is_active' => (bool) $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ];
            });

        return response()->json($adminUsers);
    }

    public function createAdminUser(Request $request)
    {
        $adminRole = $request->session()->get('admin_role', 'admin');

        if ($adminRole !== 'superadmin') {
            return response()->json(['error' => 'Unauthorized. Superadmin access required.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admin_users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,superadmin',
            'is_active' => 'boolean'
        ]);

        $userId = DB::table('admin_users')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_logs')->insert([
            'icon' => 'person_add',
            'user_name' => $request->session()->get('admin_name'),
            'action' => 'created new admin user: ' . $validated['name'],
            'location' => 'Admin Management',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin user created successfully',
            'user_id' => $userId
        ]);
    }

    public function updateAdminUser(Request $request, $id)
    {
        $adminRole = $request->session()->get('admin_role', 'admin');

        if ($adminRole !== 'superadmin') {
            return response()->json(['error' => 'Unauthorized. Superadmin access required.'], 403);
        }

        $user = DB::table('admin_users')->where('id', $id)->first();

        if (!$user) {
            return response()->json(['error' => 'Admin user not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:admin_users,email,' . $id,
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:admin,superadmin',
            'is_active' => 'sometimes|boolean'
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['email'])) $updateData['email'] = $validated['email'];
        if (isset($validated['password'])) $updateData['password'] = Hash::make($validated['password']);
        if (isset($validated['role'])) $updateData['role'] = $validated['role'];
        if (isset($validated['is_active'])) $updateData['is_active'] = $validated['is_active'];
        $updateData['updated_at'] = now();

        DB::table('admin_users')
            ->where('id', $id)
            ->update($updateData);

        DB::table('activity_logs')->insert([
            'icon' => 'edit',
            'user_name' => $request->session()->get('admin_name'),
            'action' => 'updated admin user: ' . $user->name,
            'location' => 'Admin Management',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin user updated successfully'
        ]);
    }

    public function deleteAdminUser(Request $request, $id)
    {
        $adminRole = $request->session()->get('admin_role', 'admin');

        if ($adminRole !== 'superadmin') {
            return response()->json(['error' => 'Unauthorized. Superadmin access required.'], 403);
        }

        $currentAdminId = $request->session()->get('admin_id');

        if ($currentAdminId == $id) {
            return response()->json(['error' => 'Cannot delete your own account'], 400);
        }

        $user = DB::table('admin_users')->where('id', $id)->first();

        if (!$user) {
            return response()->json(['error' => 'Admin user not found'], 404);
        }

        DB::table('admin_users')->where('id', $id)->delete();

        DB::table('activity_logs')->insert([
            'icon' => 'person_remove',
            'user_name' => $request->session()->get('admin_name'),
            'action' => 'deleted admin user: ' . $user->name,
            'location' => 'Admin Management',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin user deleted successfully'
        ]);
    }
}
