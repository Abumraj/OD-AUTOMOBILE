<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TrackingController extends Controller
{
    public function track(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tracking_id' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $trackingId = $request->input('tracking_id');

        // Search by tracking number, reference number, or VIN
        $shipment = DB::table('shipments')
            ->leftJoin('shipping_types', 'shipments.shipping_type_id', '=', 'shipping_types.id')
            ->leftJoin('shipping_lines', 'shipments.shipping_line_id', '=', 'shipping_lines.id')
            ->select('shipments.*', 'shipping_types.name as shipping_type_name', 'shipping_lines.name as shipping_line_name')
            ->where(function ($query) use ($trackingId) {
                $query->where('shipments.tracking_number', $trackingId)
                    ->orWhere('shipments.reference_number', $trackingId)
                    ->orWhere('shipments.vin', $trackingId)
                    ->orWhere('shipments.vehicle_vin', $trackingId);
            })
            ->where('shipments.is_active', true)
            ->first();

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found. Please check your tracking number and try again.'
            ], 404);
        }

        // Get shipment updates
        $updates = DB::table('shipment_updates')
            ->where('shipment_id', $shipment->id)
            ->orderBy('update_date', 'desc')
            ->get();

        // Build stages based on status
        $statusMap = [
            'pending' => 0,
            'auction_won' => 1,
            'documentation' => 2,
            'shipping' => 3,
            'in_transit' => 4,
            'customs' => 5,
            'delivered' => 6,
            'cancelled' => -1
        ];

        $currentStatusIndex = $statusMap[$shipment->status] ?? 0;

        $stages = [
            [
                'name' => 'Auction Won',
                'date' => $shipment->auction_date ?? 'Pending',
                'completed' => $currentStatusIndex >= 1
            ],
            [
                'name' => 'Documentation',
                'date' => $shipment->shipping_date ?? 'Pending',
                'completed' => $currentStatusIndex >= 2
            ],
            [
                'name' => 'Shipping',
                'date' => $shipment->departure_date ?? 'Pending',
                'completed' => $currentStatusIndex >= 3
            ],
            [
                'name' => 'In Transit',
                'date' => $currentStatusIndex >= 4 ? ($shipment->departure_date ?? 'In Progress') : 'Pending',
                'completed' => $currentStatusIndex >= 4
            ],
            [
                'name' => 'Customs',
                'date' => $currentStatusIndex >= 5 ? 'Processing' : 'Pending',
                'completed' => $currentStatusIndex >= 5
            ],
            [
                'name' => 'Delivered',
                'date' => $shipment->delivery_date ?? ($shipment->estimated_arrival_date ? 'Est. ' . $shipment->estimated_arrival_date : 'Pending'),
                'completed' => $currentStatusIndex >= 6
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'reference' => $shipment->reference_number,
                'tracking_number' => $shipment->tracking_number,
                'status' => ucwords(str_replace('_', ' ', $shipment->status)),
                'progress' => $shipment->progress_percentage,
                'stages' => $stages,
                'details' => [
                    'car_model' => $shipment->car_model ?? $shipment->vehicle_type ?? 'N/A',
                    'year' => $shipment->year ?? 'N/A',
                    'car_color' => $shipment->car_color ?? 'N/A',
                    'vin' => $shipment->vin ?? 'N/A',
                    'image_link' => $shipment->image_link,
                    'shipping_type' => $shipment->shipping_type_name ?? 'N/A',
                    'shipping_line' => $shipment->shipping_line_name ?? 'N/A',
                    'eta' => $shipment->eta ? date('d/m/Y', strtotime($shipment->eta)) : ($shipment->estimated_arrival_date ?? 'TBD'),
                    'client_name' => $shipment->client_name ?? $shipment->customer_name ?? 'N/A',
                    'origin' => trim(implode(', ', array_filter([$shipment->origin_port ?? null, $shipment->origin_country ?? null]))) ?: 'N/A',
                    'destination' => trim(implode(', ', array_filter([$shipment->destination_port ?? null, $shipment->destination_country ?? null]))) ?: 'N/A',
                    'vessel' => $shipment->vessel_name ?? 'TBD',
                    'container_number' => $shipment->container_number ?? 'N/A',
                    'booking_number' => $shipment->booking_number ?? 'N/A'
                ],
                'updates' => $updates->map(function ($update) {
                    return [
                        'date' => $update->update_date,
                        'status' => ucwords(str_replace('_', ' ', $update->status)),
                        'location' => $update->location,
                        'description' => $update->description
                    ];
                }),
                'notes' => $shipment->notes,
                'last_update' => $updates->first()->update_date ?? $shipment->updated_at
            ]
        ]);
    }
}
