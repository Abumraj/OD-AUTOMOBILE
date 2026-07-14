<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AuctionController extends Controller
{
    public function getFeaturedAuctions()
    {
        $auctions = DB::table('auctions')
            ->where('is_active', true)
            ->where('featured', true)
            ->whereIn('status', ['upcoming', 'live'])
            ->orderBy('auction_end_time', 'asc')
            ->limit(12)
            ->get()
            ->map(function ($auction) {
                return [
                    'id' => $auction->id,
                    'auction_number' => $auction->auction_number,
                    'vehicle' => trim($auction->vehicle_year . ' ' . $auction->vehicle_make . ' ' . $auction->vehicle_model),
                    'vehicle_make' => $auction->vehicle_make,
                    'vehicle_model' => $auction->vehicle_model,
                    'vehicle_year' => $auction->vehicle_year,
                    'vehicle_mileage' => $auction->vehicle_mileage,
                    'vehicle_color' => $auction->vehicle_color,
                    'vehicle_description' => $auction->vehicle_description,
                    'auction_platform' => $auction->auction_platform,
                    'auction_location' => $auction->auction_location,
                    'title_status' => $auction->title_status,
                    'current_bid' => $auction->current_bid,
                    'buy_now_price' => $auction->buy_now_price,
                    'status' => $auction->status,
                    'auction_end_time' => $auction->auction_end_time,
                    'time_remaining_minutes' => $auction->time_remaining_minutes,
                    'total_bids' => $auction->total_bids
                ];
            });

        return response()->json($auctions);
    }

    public function submitRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'vehicle_make' => 'required|string|max:100',
            'vehicle_model' => 'required|string|max:100',
            'vehicle_year' => 'required|string|max:4',
            'max_budget' => 'required|numeric|min:0',
            'additional_requirements' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $requestId = DB::table('auction_requests')->insertGetId([
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'vehicle_make' => $request->vehicle_make,
            'vehicle_model' => $request->vehicle_model,
            'vehicle_year' => $request->vehicle_year,
            'max_budget' => $request->max_budget,
            'additional_requirements' => $request->additional_requirements,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Notify customer about auction request (silently fail if not possible)
        try {
            $notificationService = new NotificationService();
            $notificationService->sendAuctionBidPlaced((object) [
                'id' => $requestId,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'vehicle_make' => $request->vehicle_make,
                'vehicle_model' => $request->vehicle_model,
                'vehicle_year' => $request->vehicle_year,
                'max_budget' => $request->max_budget,
                'auction_location' => $request->additional_requirements
            ]);
        } catch (\Exception $e) {
            // Silently fail
        }

        DB::table('activity_stream')->insert([
            'action' => 'Auction Request Received',
            'description' => "New auction request for {$request->vehicle_year} {$request->vehicle_make} {$request->vehicle_model} from {$request->customer_name}",
            'location' => 'Public Website',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your auction request has been submitted successfully. We will contact you shortly.',
            'request_id' => $requestId
        ]);
    }
}
