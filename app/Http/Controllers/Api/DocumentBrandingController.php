<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DocumentBranding;
use Illuminate\Http\Request;

/** Admin screen for the signature printed on invoices and dock receipts. */
class DocumentBrandingController extends Controller
{
    public function __construct(private DocumentBranding $branding)
    {
    }

    public function show()
    {
        $settings = $this->branding->settings();

        return response()->json([
            'has_signature' => $settings['has_signature'],
            'name' => $settings['name'],
            'title' => $settings['title'],
            'updated_at' => $settings['updated_at'],
            'default_name' => DocumentBranding::DEFAULT_NAME,
            'default_title' => DocumentBranding::DEFAULT_TITLE,
        ]);
    }

    public function image()
    {
        $image = $this->branding->imageContents();
        if (!$image) {
            return response()->json(['message' => 'No signature has been uploaded.'], 404);
        }

        return response($image['contents'], 200, ['Content-Type' => $image['mime'], 'Cache-Control' => 'no-store']);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            // PNG with a transparent background looks best on the page. SVG is refused on purpose.
            'signature' => 'nullable|file|mimes:png,jpg,jpeg|max:2048|dimensions:max_width=5000,max_height=5000',
            'name' => 'nullable|string|max:100',
            'title' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('signature')) {
            $this->branding->saveImage($request->file('signature'));
        }
        if ($request->has('name') || $request->has('title')) {
            $this->branding->saveDetails($validated['name'] ?? null, $validated['title'] ?? null);
        }

        return $this->show();
    }

    public function destroy()
    {
        $this->branding->removeImage();

        return $this->show();
    }
}
