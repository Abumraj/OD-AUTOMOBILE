@extends('emails.base')

@section('content')
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Your bid has been placed successfully. We will notify you of the auction results.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        @if(isset($auction_reference))
        <div class="info-card">
            <p class="label">Auction Reference</p>
            <p class="value">{{ $auction_reference }}</p>
        </div>
        @endif

        @if(isset($vehicle_details))
        <div class="info-card">
            <p class="label">Vehicle</p>
            <p class="value">{{ $vehicle_details }}</p>
        </div>
        @endif

        @if(isset($bid_amount))
        <div class="info-card">
            <p class="label">Bid Amount</p>
            <p class="value">{{ $bid_amount }}</p>
        </div>
        @endif

        @if(isset($auction_date))
        <div class="info-card">
            <p class="label">Auction Date</p>
            <p class="value">{{ $auction_date }}</p>
        </div>
        @endif

        @if(isset($auction_location))
        <div class="info-card">
            <p class="label">Auction Location</p>
            <p class="value">{{ $auction_location }}</p>
        </div>
        @endif
    </div>

    <p style="margin-top: 24px;">We will keep you updated on the auction progress. Good luck!</p>
@endsection
