@extends('emails.base')

@section('content')
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Great news! Your shipping quote is now ready for review. We've carefully calculated the best route and pricing for your transport needs.</p>
    </div>

    <div class="info-grid">
        <div class="info-card">
            <p class="label">Reference Number</p>
            <p class="value">{{ $reference_number }}</p>
        </div>

        @if(isset($total_cost))
        <div class="info-card">
            <p class="label">Total Cost</p>
            <p class="value">{{ $total_cost }}</p>
        </div>
        @endif

        @if(isset($transit_time))
        <div class="info-card">
            <p class="label">Estimated Transit Time</p>
            <p class="value">{{ $transit_time }}</p>
        </div>
        @endif

        @if(isset($service_type))
        <div class="info-card">
            <p class="label">Service Type</p>
            <p class="value">{{ $service_type }}</p>
        </div>
        @endif
    </div>

    @if(isset($service_details))
    <div style="background-color: #1e2020; padding: 20px; border-radius: 12px; margin: 24px 0;">
        <h3 style="font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; color: #e2e2e2; margin: 0 0 16px 0;">Service Details</h3>
        {!! $service_details !!}
    </div>
    @endif

    @if(isset($quote_url))
    <div style="text-align: center; margin: 32px 0;">
        <a href="{{ $quote_url }}" class="button">View Full Quote</a>
    </div>
    @endif

    <p style="margin-top: 24px;">This quote is valid for 7 days. If you have any questions or would like to proceed, please contact us or click the button above to accept the quote online.</p>
@endsection
