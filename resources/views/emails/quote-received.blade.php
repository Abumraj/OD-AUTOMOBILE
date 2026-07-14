@extends('emails.base')

@section('content')
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Thank you for your quote request. We have received your inquiry and our team is preparing a detailed quote for you.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        @if(isset($reference_number))
        <div class="info-card">
            <p class="label">Reference Number</p>
            <p class="value">{{ $reference_number }}</p>
        </div>
        @endif

        @if(isset($service_type))
        <div class="info-card">
            <p class="label">Service Type</p>
            <p class="value">{{ $service_type }}</p>
        </div>
        @endif

        @if(isset($vehicle_details))
        <div class="info-card">
            <p class="label">Vehicle Details</p>
            <p class="value">{{ $vehicle_details }}</p>
        </div>
        @endif

        @if(isset($pickup_location) && isset($delivery_location))
        <div class="info-card">
            <p class="label">Route</p>
            <p class="value">{{ $pickup_location }} → {{ $delivery_location }}</p>
        </div>
        @endif
    </div>

    <p style="margin-top: 24px;">We will respond within 24 hours. If you have any questions, please don't hesitate to contact our support team.</p>
@endsection
