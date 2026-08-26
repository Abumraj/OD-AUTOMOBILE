<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeoController extends Controller
{
    private function defaults(): array
    {
        $settings = DB::table('settings')
            ->whereIn('key', ['site_title', 'site_description'])
            ->pluck('value', 'key');

        return [
            'ogTitle' => $settings['site_title'] ?? 'OD Automotive & Logistics | Professional Industrial Transport',
            'ogDescription' => $settings['site_description'] ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.',
            'ogImage' => asset('logo-dark.png'),
            'ogUrl' => url()->current(),
        ];
    }

    public function index()
    {
        return view('app', $this->defaults());
    }

    public function tracking(Request $request)
    {
        $data = $this->defaults();
        $reference = $request->query('ref');

        if ($reference) {
            $shipment = DB::table('shipments')
                ->where(function ($query) use ($reference) {
                    $query->where('tracking_number', $reference)
                        ->orWhere('reference_number', $reference)
                        ->orWhere('vin', $reference)
                        ->orWhere('vehicle_vin', $reference);
                })
                ->where('is_active', true)
                ->first();

            if ($shipment) {
                $vehicle = trim(($shipment->year ?? $shipment->vehicle_year ?? '') . ' ' . ($shipment->car_model ?? trim(($shipment->vehicle_make ?? '') . ' ' . ($shipment->vehicle_model ?? ''))));
                $data['ogTitle'] = trim('Track Shipment ' . $shipment->reference_number . ($vehicle ? " - {$vehicle}" : ''));
                $data['ogDescription'] = 'Status: ' . ucwords(str_replace('_', ' ', $shipment->status)) . '. Track your vehicle shipment in real-time with OD Automotive & Logistics.';

                if (!empty($shipment->image_link)) {
                    $data['ogImage'] = str_starts_with($shipment->image_link, 'http')
                        ? $shipment->image_link
                        : asset($shipment->image_link);
                }
            }
        }

        return view('app', $data);
    }
}
