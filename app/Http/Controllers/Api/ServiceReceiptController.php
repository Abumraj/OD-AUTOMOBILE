<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReceiptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/** Admin side of the optional vehicle sales receipts (behind admin.auth). */
class ServiceReceiptController extends Controller
{
    public function __construct(private ReceiptService $receipts)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'record_type' => ['required', Rule::in(ReceiptService::TABLES)],
            'record_id' => 'required|integer',
        ]);

        return response()->json($this->receipts->forRecord($validated['record_type'], (int) $validated['record_id']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'record_type' => ['required', Rule::in(ReceiptService::TABLES)],
            'record_id' => 'required|integer',
            'file' => 'required|' . ReceiptService::FILE_RULE,
        ]);

        if (!$this->receipts->recordExists($validated['record_type'], (int) $validated['record_id'])) {
            return response()->json(['message' => 'That record does not exist.'], 404);
        }

        $id = $this->receipts->store(
            $validated['record_type'],
            (int) $validated['record_id'],
            $request->file('file'),
            'admin',
            (string) $request->session()->get('admin_name', 'Admin')
        );

        return response()->json(['success' => true, 'id' => $id], 201);
    }

    public function download($id)
    {
        $receipt = DB::table('service_receipts')->where('id', $id)->first();
        if (!$receipt || !Storage::disk('local')->exists($receipt->path)) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }

        return Storage::disk('local')->download($receipt->path, $receipt->original_name);
    }

    public function destroy($id)
    {
        $receipt = DB::table('service_receipts')->where('id', $id)->first();
        if ($receipt) {
            $this->receipts->delete($receipt);
        }

        return response()->json(['success' => true]);
    }
}
