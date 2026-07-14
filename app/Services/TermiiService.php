<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TermiiService
{
    protected $apiKey;
    protected $senderId;
    protected $channel;
    protected $enabled;
    protected $baseUrl = 'https://api.ng.termii.com/api';

    public function __construct()
    {
        $settings = DB::table('settings')
            ->whereIn('key', ['termii_api_key', 'termii_sender_id', 'termii_channel', 'termii_enabled'])
            ->pluck('value', 'key');

        $this->apiKey = $settings['termii_api_key'] ?? '';
        $this->senderId = $settings['termii_sender_id'] ?? 'OD Auto';
        $this->channel = $settings['termii_channel'] ?? 'generic';
        $this->enabled = ($settings['termii_enabled'] ?? 'false') === 'true';
    }

    /**
     * Send SMS using Termii API
     *
     * @param string $to Phone number (e.g., 2348123456789)
     * @param string $message SMS message content
     * @return array Response with success status and message
     */
    public function sendSMS($to, $message)
    {
        if (!$this->enabled) {
            Log::info('Termii SMS disabled. Message not sent.', ['to' => $to]);
            return [
                'success' => false,
                'message' => 'SMS service is disabled',
                'data' => null
            ];
        }

        if (empty($this->apiKey)) {
            Log::error('Termii API key not configured');
            return [
                'success' => false,
                'message' => 'SMS service not configured',
                'data' => null
            ];
        }

        // Clean phone number (remove spaces, dashes, etc.)
        $to = preg_replace('/[^0-9+]/', '', $to);

        // Ensure phone number starts with country code
        if (!str_starts_with($to, '+')) {
            // Assume Nigerian number if no country code
            if (str_starts_with($to, '0')) {
                $to = '234' . substr($to, 1);
            } elseif (!str_starts_with($to, '234')) {
                $to = '234' . $to;
            }
        } else {
            $to = substr($to, 1); // Remove + sign
        }

        try {
            $response = Http::timeout(30)->post($this->baseUrl . '/sms/send', [
                'to' => $to,
                'from' => $this->senderId,
                'sms' => $message,
                'type' => 'plain',
                'channel' => $this->channel,
                'api_key' => $this->apiKey,
            ]);

            $result = $response->json();

            if ($response->successful() && isset($result['message_id'])) {
                Log::info('SMS sent successfully via Termii', [
                    'to' => $to,
                    'message_id' => $result['message_id']
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'data' => $result
                ];
            } else {
                Log::error('Failed to send SMS via Termii', [
                    'to' => $to,
                    'response' => $result
                ]);

                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Failed to send SMS',
                    'data' => $result
                ];
            }
        } catch (\Exception $e) {
            Log::error('Exception while sending SMS via Termii', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'SMS service error: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Send SMS using template
     *
     * @param string $templateSlug Template slug from database
     * @param string $to Phone number
     * @param array $variables Template variables
     * @return array Response with success status and message
     */
    public function sendTemplatedSMS($templateSlug, $to, $variables = [])
    {
        $template = DB::table('sms_templates')
            ->where('slug', $templateSlug)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            Log::error('SMS template not found or inactive', ['slug' => $templateSlug]);
            return [
                'success' => false,
                'message' => 'SMS template not found or inactive',
                'data' => null
            ];
        }

        // Replace variables in message
        $message = $template->message;
        foreach ($variables as $key => $value) {
            $message = str_replace('{{' . $key . '}}', $value, $message);
        }

        // Log SMS attempt
        DB::table('sms_log')->insert([
            'template_slug' => $templateSlug,
            'phone_number' => $to,
            'message' => $message,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $result = $this->sendSMS($to, $message);

        // Update log with result
        DB::table('sms_log')
            ->where('phone_number', $to)
            ->where('template_slug', $templateSlug)
            ->orderBy('created_at', 'desc')
            ->limit(1)
            ->update([
                'status' => $result['success'] ? 'sent' : 'failed',
                'response' => json_encode($result['data']),
                'updated_at' => now()
            ]);

        return $result;
    }

    /**
     * Get account balance from Termii
     *
     * @return array Balance information
     */
    public function getBalance()
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'message' => 'API key not configured',
                'balance' => 0
            ];
        }

        try {
            $response = Http::timeout(30)->get($this->baseUrl . '/get-balance', [
                'api_key' => $this->apiKey
            ]);

            $result = $response->json();

            if ($response->successful()) {
                return [
                    'success' => true,
                    'balance' => $result['balance'] ?? 0,
                    'currency' => $result['currency'] ?? 'NGN',
                    'data' => $result
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to fetch balance',
                'balance' => 0
            ];
        } catch (\Exception $e) {
            Log::error('Exception while fetching Termii balance', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'balance' => 0
            ];
        }
    }

    /**
     * Verify phone number format
     *
     * @param string $phoneNumber
     * @return bool
     */
    public function isValidPhoneNumber($phoneNumber)
    {
        $cleaned = preg_replace('/[^0-9+]/', '', $phoneNumber);
        return strlen($cleaned) >= 10 && strlen($cleaned) <= 15;
    }
}
