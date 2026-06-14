<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestimonialController extends Controller
{
    public function index()
    {
        $testimonials = DB::table('testimonials')
            ->where('is_approved', true)
            ->orderBy('is_featured', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($testimonial) {
                return [
                    'id' => $testimonial->id,
                    'quote' => $testimonial->quote,
                    'name' => $testimonial->customer_name,
                    'location' => $testimonial->location,
                    'company' => $testimonial->company,
                    'social_link' => $testimonial->social_link,
                    'rating' => $testimonial->rating,
                    'is_featured' => (bool) $testimonial->is_featured
                ];
            });

        return response()->json($testimonials);
    }

    public function featured()
    {
        $testimonials = DB::table('testimonials')
            ->where('is_approved', true)
            ->where('is_featured', true)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($testimonial) {
                return [
                    'quote' => $testimonial->quote,
                    'name' => $testimonial->customer_name,
                    'location' => $testimonial->location,
                    'company' => $testimonial->company,
                    'social_link' => $testimonial->social_link,
                    'rating' => $testimonial->rating
                ];
            });

        return response()->json($testimonials);
    }
}
