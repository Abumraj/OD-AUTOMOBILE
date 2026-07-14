@extends('emails.base')

@section('content')
    <div style="margin-bottom: 24px;">
        <h2>Congratulations {{ $customer_name }}!</h2>
        <p>Excellent news! You have won the auction. Our team is excited to help you complete this transaction and arrange shipping for your new vehicle.</p>
    </div>

    <div class="info-grid">
        <div class="info-card">
            <p class="label">Auction Reference</p>
            <p class="value">{{ $auction_reference }}</p>
        </div>

        @if(isset($vehicle_details))
        <div class="info-card">
            <p class="label">Vehicle</p>
            <p class="value">{{ $vehicle_details }}</p>
        </div>
        @endif

        @if(isset($winning_bid))
        <div class="info-card">
            <p class="label">Winning Bid</p>
            <p class="value">{{ $winning_bid }}</p>
        </div>
        @endif

        @if(isset($payment_deadline))
        <div class="info-card">
            <p class="label">Payment Deadline</p>
            <p class="value">{{ $payment_deadline }}</p>
        </div>
        @endif
    </div>

    @if(isset($next_steps))
    <div style="background-color: #1e2020; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ea6b1b;">
        <h3 style="font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; color: #e2e2e2; margin: 0 0 16px 0;">Next Steps</h3>
        {!! $next_steps !!}
    </div>
    @endif

    <div style="text-align: center; margin: 32px 0;">
        <a href="{{ $payment_url ?? '#' }}" class="button">Complete Payment</a>
    </div>

    <p style="margin-top: 24px;">Our team will contact you within 24 hours to finalize the details and arrange shipping. Thank you for choosing OD Automotive & Logistics!</p>
@endsection
