@extends('emails.base')

@section('content')
    <div style="margin-bottom: 24px;">
        <h2>Hello {{ $customer_name ?? 'there' }},</h2>
        <p>{{ $message }}</p>
    </div>

    @if(!empty($portal_url))
    <div style="text-align: center; margin: 32px 0;">
        <a href="{{ $portal_url }}" class="button">Open your portal</a>
    </div>
    @endif
@endsection
