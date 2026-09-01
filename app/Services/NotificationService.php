<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $termiiService;
    protected $whatsappService;

    public function __construct()
    {
        $this->termiiService = new TermiiService();
        $this->whatsappService = new WhatsAppService();
    }

    /**
     * Send email using template from database.
     * Silently fails on any error and logs it.
     */
    public function sendEmail($templateSlug, $to, $variables = [], $attachments = [])
    {
        if (empty($to)) {
            return false;
        }

        try {
            $template = DB::table('email_templates')
                ->where('slug', $templateSlug)
                ->where('is_active', true)
                ->first();

            if (!$template) {
                Log::warning('Email template not found or inactive', ['slug' => $templateSlug]);
                return false;
            }

            $settings = DB::table('settings')
                ->whereIn('key', [
                    'office_address',
                    'office_city',
                    'office_country',
                    'office_phone',
                    'office_email',
                    'social_facebook',
                    'social_instagram'
                ])
                ->pluck('value', 'key')
                ->toArray();

            $data = array_merge($settings, $variables);

            $subject = $this->replaceVariables($template->subject, $data);

            Mail::send('emails.' . $template->slug, $data, function ($message) use ($to, $subject, $attachments) {
                $message->to($to)
                    ->subject($subject);

                foreach ($attachments as $attachment) {
                    $message->attachData($attachment['contents'], $attachment['name'], [
                        'mime' => $attachment['mime'] ?? 'application/octet-stream'
                    ]);
                }
            });

            Log::info('Email sent successfully', [
                'to' => $to,
                'template' => $templateSlug
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send email', [
                'to' => $to,
                'template' => $templateSlug,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Send SMS using template from database.
     * Silently fails on any error and logs it.
     */
    public function sendSMS($templateSlug, $to, $variables = [])
    {
        if (empty($to)) {
            return false;
        }

        try {
            $result = $this->termiiService->sendTemplatedSMS($templateSlug, $to, $variables);
            return $result['success'] ?? false;
        } catch (\Exception $e) {
            Log::error('Failed to send SMS', [
                'to' => $to,
                'template' => $templateSlug,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    public function sendWhatsApp($templateSlug, $to, $variables = [], $attachment = null)
    {
        if (empty($to)) {
            return false;
        }

        try {
            $template = DB::table('sms_templates')
                ->where('slug', $templateSlug)
                ->where('is_active', true)
                ->first();

            if (!$template) {
                Log::warning('WhatsApp template not found or inactive', ['slug' => $templateSlug]);
                return false;
            }

            $message = $this->replaceVariables($template->message, $variables);
            $result = $attachment
                ? $this->whatsappService->sendDocument($to, $attachment['contents'], $attachment['name'], $message, $attachment['mime'] ?? 'application/pdf')
                : $this->whatsappService->sendText($to, $message);

            return $result['success'] ?? false;
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification', ['to' => $to, 'template' => $templateSlug, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send both email and SMS notifications.
     */
    public function send($emailTemplateSlug, $smsTemplateSlug, $email, $phone, $variables = [], $attachments = [])
    {
        $emailSent = $this->sendEmail($emailTemplateSlug, $email, $variables, $attachments);
        $smsSent = $this->sendSMS($smsTemplateSlug, $phone, $variables);
        $whatsappSent = $this->sendWhatsApp($smsTemplateSlug, $phone, $variables, $attachments[0] ?? null);

        return [
            'email_sent' => $emailSent,
            'sms_sent' => $smsSent,
            'whatsapp_sent' => $whatsappSent
        ];
    }

    /**
     * Send a status update email for admin-managed service records.
     */
    public function sendServiceStatusUpdate($serviceType, $record, $updateDescription = null)
    {
        if (!$record) {
            return false;
        }

        $email = $record->customer_email ?? $record->client_email ?? null;
        if (empty($email)) {
            return false;
        }

        $status = $record->status ?? $record->shipment_status ?? 'updated';
        $templateSlug = 'shipment-update';

        $variables = [
            'customer_name' => $record->customer_name ?? $record->client_name ?? 'Customer',
            'tracking_number' => $record->tracking_number ?? $record->reference_number ?? $record->id ?? 'N/A',
            'reference_number' => $record->reference_number ?? $record->tracking_number ?? $record->id ?? 'N/A',
            'status' => ucwords(str_replace('_', ' ', $status)),
            'current_location' => $updateDescription ?? ($record->location ?? $record->destination_port ?? $record->origin_port ?? 'Updated'),
            'tracking_url' => url('/tracking'),
            'service_name' => $serviceType,
            'vehicle_details' => trim(($record->vehicle_year ?? '') . ' ' . ($record->vehicle_make ?? '') . ' ' . ($record->vehicle_model ?? '')),
            'estimated_delivery' => $record->estimated_arrival_date ?? $record->arrival_date ?? $record->trucking_date ?? now()->toDateString(),
            'delivery_date' => $record->delivery_date ?? now()->toDateString(),
            'delivery_location' => $record->destination_port ?? $record->location ?? $record->origin_port ?? 'Updated location',
            'service_details' => $updateDescription ?? $serviceType
        ];

        return $this->sendEmail($templateSlug, $email, $variables);
    }

    /**
     * Send shipment update notification to customer.
     */
    public function sendShipmentUpdate($shipment, $updateDescription = null)
    {
        if (!$shipment) {
            return false;
        }

        $templateSlug = $shipment->status === 'delivered' ? 'shipment-delivered' : 'shipment-update';

        $variables = [
            'customer_name' => $shipment->customer_name,
            'tracking_number' => $shipment->tracking_number,
            'reference_number' => $shipment->reference_number,
            'status' => ucwords(str_replace('_', ' ', $shipment->status)),
            'current_location' => $updateDescription ?? ($shipment->destination_port . ', ' . $shipment->destination_country),
            'tracking_url' => url('/tracking'),
            'vehicle_details' => trim(($shipment->vehicle_year ?? '') . ' ' . ($shipment->vehicle_make ?? '') . ' ' . ($shipment->vehicle_model ?? '')),
            'estimated_delivery' => $shipment->estimated_arrival_date ?? 'TBD',
            'delivery_date' => $shipment->delivery_date ?? now()->toDateString(),
            'delivery_location' => $shipment->destination_port . ', ' . $shipment->destination_country
        ];

        return $this->send(
            $templateSlug,
            $templateSlug,
            $shipment->customer_email,
            $shipment->customer_phone,
            $variables
        );
    }

    /**
     * Send quote received notification to customer.
     */
    public function sendQuoteReceived($quote)
    {
        if (!$quote) {
            return false;
        }

        $variables = [
            'customer_name' => $quote->customer_name,
            'reference_number' => $quote->reference_number ?? 'REF-' . $quote->id,
            'service_type' => $quote->service,
            'pickup_location' => $quote->origin,
            'delivery_location' => $quote->destination,
            'vehicle_details' => trim(($quote->vehicle_year ?? '') . ' ' . ($quote->vehicle_make ?? '') . ' ' . ($quote->vehicle_model ?? ''))
        ];

        return $this->send(
            'quote-received',
            'quote-received',
            $quote->email,
            $quote->phone,
            $variables
        );
    }

    /**
     * Send contact form received notification to customer.
     */
    public function sendContactReceived($contact)
    {
        if (!$contact) {
            return false;
        }

        $variables = [
            'customer_name' => $contact->name,
            'reference_number' => 'MSG-' . $contact->id,
            'subject' => $contact->service,
            'phone_number' => $contact->phone,
            'message' => $contact->message ?? ''
        ];

        return $this->send(
            'contact-received',
            'contact-received',
            $contact->email,
            $contact->phone,
            $variables
        );
    }

    /**
     * Send auction bid/request confirmation to customer.
     */
    public function sendAuctionBidPlaced($auctionRequest)
    {
        if (!$auctionRequest) {
            return false;
        }

        $variables = [
            'customer_name' => $auctionRequest->customer_name,
            'auction_reference' => 'AUC-' . $auctionRequest->id,
            'vehicle_details' => trim(($auctionRequest->vehicle_year ?? '') . ' ' . ($auctionRequest->vehicle_make ?? '') . ' ' . ($auctionRequest->vehicle_model ?? '')),
            'bid_amount' => '$' . number_format($auctionRequest->max_budget, 2),
            'auction_date' => now()->toDateString(),
            'auction_location' => $auctionRequest->auction_location ?? 'Online Auction'
        ];

        return $this->send(
            'auction-bid-placed',
            'auction-bid-placed',
            $auctionRequest->customer_email,
            $auctionRequest->customer_phone,
            $variables
        );
    }

    /**
     * Replace template variables in a string.
     */
    protected function replaceVariables($string, $variables)
    {
        foreach ($variables as $key => $value) {
            $string = str_replace('{{' . $key . '}}', $value ?? '', $string);
        }

        return $string;
    }
}
