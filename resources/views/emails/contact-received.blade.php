@extends('emails.base')

@section('content')
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Thank you for contacting OD Automotive & Logistics. We have received your message and will respond within 24 hours.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        @if(isset($reference_number))
        <div class="info-card">
            <p class="label">Reference Number</p>
            <p class="value">{{ $reference_number }}</p>
        </div>
        @endif

        @if(isset($subject))
        <div class="info-card">
            <p class="label">Subject</p>
            <p class="value">{{ $subject }}</p>
        </div>
        @endif

        @if(isset($phone_number))
        <div class="info-card">
            <p class="label">Your Phone</p>
            <p class="value">{{ $phone_number }}</p>
        </div>
        @endif
    </div>

    @if(isset($message) && $message)
    <div style="background-color: #1e2020; padding: 16px; border-radius: 8px; border-left: 4px solid #ea6b1b; margin-top: 24px;">
        <p style="margin: 0; font-size: 14px; color: #c7c5d3;">
            <strong style="color: #e2e2e2;">Your Message:</strong> {{ $message }}
        </p>
    </div>
    @endif

    <p style="margin-top: 24px;">If you need immediate assistance, please call us at {{ $office_phone ?? '' }}.</p>
@endsection
