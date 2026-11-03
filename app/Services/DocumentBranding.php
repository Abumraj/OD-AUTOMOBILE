<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * The signatory shown at the bottom of generated documents (invoices and dock receipts).
 * One signature, uploaded by an admin, is used on every document.
 */
class DocumentBranding
{
    public const DEFAULT_NAME = 'Authorized Officer';
    public const DEFAULT_TITLE = 'OD Automotive';

    private const KEYS = ['document_signature_path', 'document_signature_name', 'document_signature_title', 'document_signature_updated_at'];
    private const MIME = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg'];

    /**
     * May this admin see and change the signature? Super admins always may; any other admin only
     * when a super admin has switched the permission on for them. Fails closed.
     */
    public static function adminMayManage($adminId, string $role): bool
    {
        if ($role === 'superadmin') {
            return true;
        }
        if (!$adminId) {
            return false;
        }

        try {
            if (!Schema::hasColumn('admin_users', 'can_manage_signature')) {
                return false;
            }

            return (bool) DB::table('admin_users')->where('id', $adminId)->where('is_active', true)->value('can_manage_signature');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /** Raw settings, for the admin screen. */
    public function settings(): array
    {
        $values = DB::table('settings')->whereIn('key', self::KEYS)->pluck('value', 'key');
        $path = $values['document_signature_path'] ?? null;

        return [
            'has_signature' => $path && Storage::disk('local')->exists($path),
            'name' => $values['document_signature_name'] ?? '',
            'title' => $values['document_signature_title'] ?? '',
            'updated_at' => $values['document_signature_updated_at'] ?? null,
            'path' => $path,
        ];
    }

    /**
     * What the document templates print: the image as an inline data URI (so the PDF never
     * depends on file paths), plus the name and title under it.
     *
     * @return array{data_uri:?string,width:int,height:int,name:string,title:string}
     */
    public function forDocuments(): array
    {
        try {
            $settings = $this->settings();
        } catch (\Throwable $e) {
            // The settings table is not reachable (fresh install, tests): fall back to the plain line.
            return ['data_uri' => null, 'width' => 0, 'height' => 0, 'name' => self::DEFAULT_NAME, 'title' => self::DEFAULT_TITLE];
        }

        $dataUri = null;
        $width = $height = 0;
        if ($settings['has_signature']) {
            $extension = strtolower(pathinfo($settings['path'], PATHINFO_EXTENSION));
            $contents = Storage::disk('local')->get($settings['path']);
            $dataUri = 'data:' . (self::MIME[$extension] ?? 'image/png') . ';base64,' . base64_encode($contents);

            // Fit inside 170 x 52 px, whatever the shape of the image.
            [$naturalWidth, $naturalHeight] = @getimagesizefromstring($contents) ?: [170, 52];
            $fit = min(170 / max($naturalWidth, 1), 52 / max($naturalHeight, 1));
            $width = max(1, (int) round($naturalWidth * $fit));
            $height = max(1, (int) round($naturalHeight * $fit));
        }

        return [
            'data_uri' => $dataUri,
            'width' => $width,
            'height' => $height,
            'name' => trim($settings['name']) !== '' ? $settings['name'] : self::DEFAULT_NAME,
            'title' => trim($settings['title']) !== '' ? $settings['title'] : self::DEFAULT_TITLE,
        ];
    }

    public function saveDetails(?string $name, ?string $title): void
    {
        $this->put('document_signature_name', $name ?? '');
        $this->put('document_signature_title', $title ?? '');
    }

    /**
     * Store a new signature image, replacing any earlier one. Large scans are scaled down so
     * every PDF stays small; transparency is kept for PNGs.
     */
    public function saveImage(UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension()) === 'png' ? 'png' : 'jpg';
        $path = 'branding/signature-' . bin2hex(random_bytes(6)) . '.' . $extension;

        Storage::disk('local')->put($path, $this->scaledDown($file->getRealPath(), $extension));

        $this->removeImage();
        $this->put('document_signature_path', $path);
        $this->put('document_signature_updated_at', now()->toDateTimeString());
    }

    public function removeImage(): void
    {
        $path = DB::table('settings')->where('key', 'document_signature_path')->value('value');
        if ($path) {
            Storage::disk('local')->delete($path);
        }
        DB::table('settings')->where('key', 'document_signature_path')->delete();
        $this->put('document_signature_updated_at', now()->toDateTimeString());
    }

    public function imageContents(): ?array
    {
        $settings = $this->settings();
        if (!$settings['has_signature']) {
            return null;
        }
        $extension = strtolower(pathinfo($settings['path'], PATHINFO_EXTENSION));

        return ['contents' => Storage::disk('local')->get($settings['path']), 'mime' => self::MIME[$extension] ?? 'image/png'];
    }

    private function scaledDown(string $source, string $extension): string
    {
        $original = file_get_contents($source);
        $image = @imagecreatefromstring($original);
        if (!$image) {
            return $original;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, 900 / $width, 360 / $height);
        if ($scale >= 1) {
            imagedestroy($image);

            return $original;
        }

        $resized = imagecreatetruecolor(max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale)));
        if ($extension === 'png') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagefill($resized, 0, 0, imagecolorallocatealpha($resized, 0, 0, 0, 127));
        } else {
            imagefill($resized, 0, 0, imagecolorallocate($resized, 255, 255, 255));
        }
        imagecopyresampled($resized, $image, 0, 0, 0, 0, imagesx($resized), imagesy($resized), $width, $height);

        ob_start();
        $extension === 'png' ? imagepng($resized) : imagejpeg($resized, null, 90);
        $scaled = (string) ob_get_clean();

        imagedestroy($image);
        imagedestroy($resized);

        return $scaled;
    }

    private function put(string $key, string $value): void
    {
        $exists = DB::table('settings')->where('key', $key)->exists();
        if ($exists) {
            DB::table('settings')->where('key', $key)->update(['value' => $value, 'updated_at' => now()]);
        } else {
            DB::table('settings')->insert(['key' => $key, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
