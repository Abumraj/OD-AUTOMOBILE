<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service' => 'required|string',
            'year' => 'required|string',
            'make' => 'required|string',
            'model' => 'required|string',
            'origin' => 'required|string',
            'destination' => 'required|string',
            'fullName' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'contactMethod' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $quoteId = DB::table('quotes')->insertGetId([
            'service' => $request->service,
            'vehicle_year' => $request->year,
            'vehicle_make' => $request->make,
            'vehicle_model' => $request->model,
            'origin' => $request->origin,
            'destination' => $request->destination,
            'customer_name' => $request->fullName,
            'email' => $request->email,
            'phone' => $request->phone,
            'contact_method' => $request->contactMethod,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_logs')->insert([
            'icon' => 'request_quote',
            'user_name' => $request->fullName,
            'action' => 'submitted a quote request for ' . $request->year . ' ' . $request->make . ' ' . $request->model,
            'location' => 'Website',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'quote_id' => $quoteId,
            'message' => 'Quote request received successfully. We will contact you soon.'
        ]);
    }
}
