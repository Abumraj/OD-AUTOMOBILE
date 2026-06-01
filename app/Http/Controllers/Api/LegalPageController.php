<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class LegalPageController extends Controller
{
    public function getPublishedPages()
    {
        $pages = DB::table('legal_pages')
            ->where('is_published', true)
            ->orderBy('display_order', 'asc')
            ->select('id', 'slug', 'title', 'display_order')
            ->get();

        return response()->json($pages);
    }

    public function getPageBySlug($slug)
    {
        $page = DB::table('legal_pages')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        return response()->json($page);
    }
}
