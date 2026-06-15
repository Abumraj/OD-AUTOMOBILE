<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminDashboardController extends Controller
{
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

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['admin_id', 'admin_name', 'admin_email']);
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
                    'email' => $request->session()->get('admin_email')
                ]
            ]);
        }

        return response()->json([
            'authenticated' => false
        ]);
    }

    public function getStats()
    {
        $totalQuotes = DB::table('quotes')->count();
        $activeShipments = DB::table('shipments')
            ->whereIn('status', ['shipping', 'at_port', 'clearing'])
            ->count();
        $pendingClearance = DB::table('shipments')
            ->where('status', 'clearing')
            ->count();
        $deliveredYTD = DB::table('shipments')
            ->where('status', 'delivered')
            ->whereYear('delivery_date', date('Y'))
            ->count();

        $lastMonthQuotes = DB::table('quotes')
            ->where('created_at', '>=', now()->subMonth())
            ->count();
        $previousMonthQuotes = DB::table('quotes')
            ->whereBetween('created_at', [now()->subMonths(2), now()->subMonth()])
            ->count();

        $quotesGrowth = $previousMonthQuotes > 0
            ? round((($lastMonthQuotes - $previousMonthQuotes) / $previousMonthQuotes) * 100, 1)
            : 0;

        $criticalDelays = DB::table('shipments')
            ->where('status', 'at_port')
            ->whereNotNull('estimated_arrival_date')
            ->whereRaw('estimated_arrival_date < NOW()')
            ->whereNull('actual_arrival_date')
            ->count();

        $totalDeliveries = DB::table('shipments')
            ->whereYear('delivery_date', date('Y'))
            ->count();
        $successRate = $totalDeliveries > 0
            ? round(($deliveredYTD / $totalDeliveries) * 100, 1)
            : 99.2;

        return response()->json([
            'total_quotes' => $totalQuotes,
            'quotes_growth' => $quotesGrowth,
            'active_shipments' => $activeShipments,
            'pending_clearance' => $pendingClearance,
            'critical_delays' => $criticalDelays,
            'delivered_ytd' => $deliveredYTD,
            'success_rate' => $successRate
        ]);
    }

    public function getKanbanData()
    {
        $stages = ['procurement', 'shipping', 'at_port', 'clearing', 'delivery'];
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
            'status' => 'required|in:procurement,shipping,at_port,clearing,delivery'
        ]);

        DB::table('shipments')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now()
            ]);

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
        $phone = DB::table('settings')->where('key', 'whatsapp_phone')->value('value');
        $message = DB::table('settings')->where('key', 'whatsapp_message')->value('value');

        return response()->json([
            'phone' => $phone ?? '',
            'message' => $message ?? 'Hello! I would like to inquire about your auto import services.'
        ]);
    }

    public function updateWhatsAppSettings(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
            'message' => 'required|string|max:500'
        ]);

        DB::table('settings')
            ->where('key', 'whatsapp_phone')
            ->update([
                'value' => $validated['phone'],
                'updated_at' => now()
            ]);

        DB::table('settings')
            ->where('key', 'whatsapp_message')
            ->update([
                'value' => $validated['message'],
                'updated_at' => now()
            ]);

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

    // Shipment Management
    public function getShipments()
    {
        $shipments = DB::table('shipments')
            ->orderBy('created_at', 'desc')
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
                    'booking_number' => $shipment->booking_number,
                    'auction_date' => $shipment->auction_date,
                    'shipping_date' => $shipment->shipping_date,
                    'departure_date' => $shipment->departure_date,
                    'estimated_arrival_date' => $shipment->estimated_arrival_date,
                    'actual_arrival_date' => $shipment->actual_arrival_date,
                    'delivery_date' => $shipment->delivery_date,
                    'total_cost' => $shipment->total_cost,
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

    public function createShipment(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_description' => 'nullable|string',
            'origin_port' => 'required|string|max:255',
            'origin_country' => 'required|string|max:255',
            'destination_port' => 'required|string|max:255',
            'destination_country' => 'required|string|max:255',
            'shipping_provider' => 'nullable|string|max:100',
            'vessel_name' => 'nullable|string|max:255',
            'container_number' => 'nullable|string|max:100',
            'booking_number' => 'nullable|string|max:100',
            'status' => 'required|string',
            'auction_date' => 'nullable|date',
            'shipping_date' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'estimated_arrival_date' => 'nullable|date',
            'total_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string'
        ]);

        // Generate tracking and reference numbers
        $trackingNumber = 'TRK-' . strtoupper(substr(md5(uniqid()), 0, 10));
        $referenceNumber = 'OD-' . date('Y') . '-' . str_pad(DB::table('shipments')->count() + 1, 4, '0', STR_PAD_LEFT);

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
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'origin_port' => $validated['origin_port'],
            'origin_country' => $validated['origin_country'],
            'destination_port' => $validated['destination_port'],
            'destination_country' => $validated['destination_country'],
            'shipping_provider' => $validated['shipping_provider'] ?? null,
            'vessel_name' => $validated['vessel_name'] ?? null,
            'container_number' => $validated['container_number'] ?? null,
            'booking_number' => $validated['booking_number'] ?? null,
            'status' => $validated['status'],
            'progress_percentage' => $progressMap[$validated['status']] ?? 0,
            'auction_date' => $validated['auction_date'] ?? null,
            'shipping_date' => $validated['shipping_date'] ?? null,
            'departure_date' => $validated['departure_date'] ?? null,
            'estimated_arrival_date' => $validated['estimated_arrival_date'] ?? null,
            'total_cost' => $validated['total_cost'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create initial update
        DB::table('shipment_updates')->insert([
            'shipment_id' => $shipmentId,
            'status' => $validated['status'],
            'description' => 'Shipment created',
            'update_date' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

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
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_year' => 'nullable|string|max:4',
            'vehicle_vin' => 'nullable|string|max:100',
            'vehicle_description' => 'nullable|string',
            'origin_port' => 'required|string|max:255',
            'origin_country' => 'required|string|max:255',
            'destination_port' => 'required|string|max:255',
            'destination_country' => 'required|string|max:255',
            'shipping_provider' => 'nullable|string|max:100',
            'vessel_name' => 'nullable|string|max:255',
            'container_number' => 'nullable|string|max:100',
            'booking_number' => 'nullable|string|max:100',
            'status' => 'required|string',
            'auction_date' => 'nullable|date',
            'shipping_date' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'estimated_arrival_date' => 'nullable|date',
            'actual_arrival_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'total_cost' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_active' => 'boolean'
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

        DB::table('shipments')->where('id', $id)->update([
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_year' => $validated['vehicle_year'] ?? null,
            'vehicle_vin' => $validated['vehicle_vin'] ?? null,
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'origin_port' => $validated['origin_port'],
            'origin_country' => $validated['origin_country'],
            'destination_port' => $validated['destination_port'],
            'destination_country' => $validated['destination_country'],
            'shipping_provider' => $validated['shipping_provider'] ?? null,
            'vessel_name' => $validated['vessel_name'] ?? null,
            'container_number' => $validated['container_number'] ?? null,
            'booking_number' => $validated['booking_number'] ?? null,
            'status' => $validated['status'],
            'progress_percentage' => $progressMap[$validated['status']] ?? 0,
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
            'updated_at' => now()
        ]);

        // Add update if status changed
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

        DB::table('shipment_updates')->insert([
            'shipment_id' => $id,
            'status' => $validated['status'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'],
            'update_date' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

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
}
