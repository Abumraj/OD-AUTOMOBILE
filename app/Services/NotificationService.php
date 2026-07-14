<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $termiiService;

    public function __construct()
    {
        $this->termiiService = new TermiiService();
    }

    /**
     * Send email using template from database.
     * Silently fails on any error and logs it.
     */
    public function sendEmail($templateSlug, $to, $variables = [])
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
                    'office_address', 'office_city', 'office_country',
                    'office_phone', 'office_email',
                    'social_facebook', 'social_instagram'
                ])
                ->pluck('value', 'key')
                ->toArray();

            $data = array_merge($settings, $variables);

            $subject = $this->replaceVariables($template->subject, $data);

            Mail::send('emails.' . $template->slug, $data, function ($message) use ($to, $subject) {
                $message->to($to)
                    ->subject($subject);
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

    /**
     * Send both email and SMS notifications.
     */
    public function send($emailTemplateSlug, $smsTemplateSlug, $email, $phone, $variables = [])
    {
        $emailSent = $this->sendEmail($emailTemplateSlug, $email, $variables);
        $smsSent = $this->sendSMS($smsTemplateSlug, $phone, $variables);

        return [
            'email_sent' => $emailSent,
            'sms_sent' => $smsSent
        ];
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
