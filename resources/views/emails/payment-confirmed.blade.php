@extends('emails.base')

@section('content')
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name }},</h2>
        <p>Your payment has been successfully processed. Thank you for your payment.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        @if(isset($transaction_id))
        <div class="info-card">
            <p class="label">Transaction ID</p>
            <p class="value">{{ $transaction_id }}</p>
        </div>
        @endif

        @if(isset($amount))
        <div class="info-card">
            <p class="label">Amount</p>
            <p class="value">{{ $amount }}</p>
        </div>
        @endif

        @if(isset($service_description))
        <div class="info-card">
            <p class="label">Service</p>
            <p class="value">{{ $service_description }}</p>
        </div>
        @endif

        @if(isset($payment_date))
        <div class="info-card">
            <p class="label">Payment Date</p>
            <p class="value">{{ $payment_date }}</p>
        </div>
        @endif
    </div>

    <p style="margin-top: 24px;">Your service will proceed as scheduled. If you have any questions, please contact our support team.</p>
@endsection
