@extends('emails.base')

@section('content')
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Your shipment has been successfully delivered! Thank you for choosing OD Automotive & Logistics.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        @if(isset($tracking_number))
        <div class="info-card">
            <p class="label">Tracking Number</p>
            <p class="value">{{ $tracking_number }}</p>
        </div>
        @endif

        @if(isset($vehicle_details))
        <div class="info-card">
            <p class="label">Vehicle Details</p>
            <p class="value">{{ $vehicle_details }}</p>
        </div>
        @endif

        @if(isset($delivery_date))
        <div class="info-card">
            <p class="label">Delivery Date</p>
            <p class="value">{{ $delivery_date }}</p>
        </div>
        @endif

        @if(isset($delivery_location))
        <div class="info-card">
            <p class="label">Delivered To</p>
            <p class="value">{{ $delivery_location }}</p>
        </div>
        @endif
    </div>

    <p style="margin-top: 24px;">We hope to serve you again soon!</p>
@endsection
