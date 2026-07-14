<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ShippingConfigController extends Controller
{
    // Shipping Types
    public function getShippingTypes()
    {
        $types = DB::table('shipping_types')
            ->orderBy('name')
            ->get();

        return response()->json($types);
    }

    public function createShippingType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $code = Str::upper(Str::slug($request->name, '_'));

        $id = DB::table('shipping_types')->insertGetId([
            'name' => $request->name,
            'code' => $code,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $type = DB::table('shipping_types')->find($id);

        return response()->json([
            'message' => 'Shipping type created successfully',
            'shipping_type' => $type
        ], 201);
    }

    public function updateShippingType(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $code = Str::upper(Str::slug($request->name, '_'));

        DB::table('shipping_types')->where('id', $id)->update([
            'name' => $request->name,
            'code' => $code,
            'is_active' => $request->is_active ?? true,
            'updated_at' => now(),
        ]);

        $type = DB::table('shipping_types')->find($id);

        return response()->json([
            'message' => 'Shipping type updated successfully',
            'shipping_type' => $type
        ]);
    }

    public function deleteShippingType($id)
    {
        DB::table('shipping_types')->where('id', $id)->delete();

        return response()->json(['message' => 'Shipping type deleted successfully']);
    }

    // Shipping Lines
    public function getShippingLines()
    {
        $lines = DB::table('shipping_lines')
            ->orderBy('name')
            ->get();

        return response()->json($lines);
    }

    public function createShippingLine(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $code = Str::upper(Str::slug($request->name, '_'));

        $id = DB::table('shipping_lines')->insertGetId([
            'name' => $request->name,
            'code' => $code,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $line = DB::table('shipping_lines')->find($id);

        return response()->json([
            'message' => 'Shipping line created successfully',
            'shipping_line' => $line
        ], 201);
    }

    public function updateShippingLine(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $code = Str::upper(Str::slug($request->name, '_'));

        DB::table('shipping_lines')->where('id', $id)->update([
            'name' => $request->name,
            'code' => $code,
            'is_active' => $request->is_active ?? true,
            'updated_at' => now(),
        ]);

        $line = DB::table('shipping_lines')->find($id);

        return response()->json([
            'message' => 'Shipping line updated successfully',
            'shipping_line' => $line
        ]);
    }

    public function deleteShippingLine($id)
    {
        DB::table('shipping_lines')->where('id', $id)->delete();

        return response()->json(['message' => 'Shipping line deleted successfully']);
    }
}
