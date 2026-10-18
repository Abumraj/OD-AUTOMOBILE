<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Optional vehicle sales receipts attached to service records. Used by the admin
 * dashboard and the business portal, so the rules live in one place.
 */
class ReceiptService
{
    /** Service tables a receipt can be attached to. */
    public const TABLES = ['shipments', 'procurements', 'autosales', 'truckings', 'clearances', 'quotes', 'auction_requests'];

    /** Validation rule for the uploaded file: pdf or image, up to 8 MB. */
    public const FILE_RULE = 'file|max:8192|mimes:pdf,jpg,jpeg,png';

    public function recordExists(string $table, int $recordId): bool
    {
        return in_array($table, self::TABLES, true)
            && Schema::hasTable($table)
            && DB::table($table)->where('id', $recordId)->exists();
    }

    public function store(string $table, int $recordId, UploadedFile $file, string $byType, ?string $byName = null): int
    {
        $path = $file->store("receipts/{$table}/{$recordId}", 'local');

        return (int) DB::table('service_receipts')->insertGetId([
            'record_type' => $table,
            'record_id' => $recordId,
            'uploaded_by_type' => $byType,
            'uploaded_by_name' => $byName,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** Attach a file that is already stored on disk (a receipt chosen before the record existed). */
    public function attachStored(string $table, int $recordId, array $stored, string $byType, ?string $byName = null): int
    {
        $target = "receipts/{$table}/{$recordId}/" . basename($stored['path']);
        Storage::disk('local')->move($stored['path'], $target);

        return (int) DB::table('service_receipts')->insertGetId([
            'record_type' => $table,
            'record_id' => $recordId,
            'uploaded_by_type' => $byType,
            'uploaded_by_name' => $byName,
            'original_name' => $stored['name'],
            'path' => $target,
            'mime' => $stored['mime'] ?? null,
            'size' => $stored['size'] ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function forRecord(string $table, int $recordId): array
    {
        return DB::table('service_receipts')->where('record_type', $table)->where('record_id', $recordId)
            ->orderByDesc('id')
            ->get(['id', 'record_type', 'record_id', 'uploaded_by_type', 'uploaded_by_name', 'original_name', 'mime', 'size', 'created_at'])
            ->all();
    }

    public function delete(object $receipt): void
    {
        Storage::disk('local')->delete($receipt->path);
        DB::table('service_receipts')->where('id', $receipt->id)->delete();
    }

    /** Remove every receipt (rows and files) for a record that is being deleted. */
    public function deleteForRecord(string $table, int $recordId): void
    {
        foreach (DB::table('service_receipts')->where('record_type', $table)->where('record_id', $recordId)->get() as $receipt) {
            $this->delete($receipt);
        }
    }
}
