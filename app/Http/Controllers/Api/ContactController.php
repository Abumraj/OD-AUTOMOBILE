<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactController extends Controller
{
    public function submitMessage(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'service' => 'required|string|max:100',
            'message' => 'nullable|string|max:2000'
        ]);

        $messageId = DB::table('contact_messages')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'service' => $validated['service'],
            'message' => $validated['message'] ?? null,
            'status' => 'new',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('activity_logs')->insert([
            'icon' => 'mail',
            'user_name' => $validated['name'],
            'action' => 'submitted a contact form',
            'location' => 'Contact Page',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you! We will contact you soon.',
            'message_id' => $messageId
        ]);
    }
}
