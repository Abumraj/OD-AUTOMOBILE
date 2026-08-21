<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $accessToken;
    protected $phoneNumberId;
    protected $apiVersion;
    protected $enabled;

    public function __construct()
    {
        $settings = DB::table('settings')
            ->whereIn('key', [
                'whatsapp_access_token',
                'whatsapp_phone_number_id',
                'whatsapp_api_version',
                'whatsapp_enabled'
            ])
            ->pluck('value', 'key');

        $this->accessToken = $settings['whatsapp_access_token'] ?? '';
        $this->phoneNumberId = $settings['whatsapp_phone_number_id'] ?? '';
        $this->apiVersion = $settings['whatsapp_api_version'] ?? 'v20.0';
        $this->enabled = ($settings['whatsapp_enabled'] ?? 'false') === 'true';
    }

    public function sendText($to, $message)
    {
        if (!$this->isConfigured($to)) {
            return ['success' => false, 'message' => 'WhatsApp service is disabled or not configured'];
        }

        try {
            $response = Http::withToken($this->accessToken)
                ->timeout(30)
                ->post($this->endpoint('messages'), [
                    'messaging_product' => 'whatsapp',
                    'to' => $this->normalizePhone($to),
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $message
                    ]
                ]);

            return $this->result($response, $to);
        } catch (\Exception $e) {
            Log::error('Exception while sending WhatsApp message', ['to' => $to, 'error' => $e->getMessage()]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function sendDocument($to, $contents, $filename, $caption = null, $mime = 'application/pdf')
    {
        if (!$this->isConfigured($to)) {
            return ['success' => false, 'message' => 'WhatsApp service is disabled or not configured'];
        }

        try {
            $mediaResponse = Http::withToken($this->accessToken)
                ->timeout(60)
                ->attach('file', $contents, $filename)
                ->post($this->endpoint('media'), [
                    'messaging_product' => 'whatsapp',
                    'type' => $mime
                ]);

            if (!$mediaResponse->successful() || empty($mediaResponse->json('id'))) {
                Log::error('Failed to upload WhatsApp document', ['to' => $to, 'response' => $mediaResponse->json()]);
                return ['success' => false, 'message' => $mediaResponse->json('error.message', 'Failed to upload document')];
            }

            $document = ['id' => $mediaResponse->json('id'), 'filename' => $filename];
            if ($caption) {
                $document['caption'] = $caption;
            }

            $response = Http::withToken($this->accessToken)
                ->timeout(30)
                ->post($this->endpoint('messages'), [
                    'messaging_product' => 'whatsapp',
                    'to' => $this->normalizePhone($to),
                    'type' => 'document',
                    'document' => $document
                ]);

            return $this->result($response, $to);
        } catch (\Exception $e) {
            Log::error('Exception while sending WhatsApp document', ['to' => $to, 'filename' => $filename, 'error' => $e->getMessage()]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    protected function isConfigured($to)
    {
        return $this->enabled && !empty($to) && !empty($this->accessToken) && !empty($this->phoneNumberId);
    }

    protected function endpoint($resource)
    {
        return "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/{$resource}";
    }

    protected function normalizePhone($phone)
    {
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        return ltrim($phone, '+');
    }

    protected function result($response, $to)
    {
        $result = $response->json();
        if ($response->successful() && !empty($result['messages'][0]['id'])) {
            Log::info('WhatsApp message sent successfully', ['to' => $to, 'message_id' => $result['messages'][0]['id']]);
            return ['success' => true, 'data' => $result];
        }

        Log::error('Failed to send WhatsApp message', ['to' => $to, 'response' => $result]);
        return ['success' => false, 'message' => $result['error']['message'] ?? 'Failed to send WhatsApp message', 'data' => $result];
    }
}
