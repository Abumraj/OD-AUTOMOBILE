<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'OD Automotive & Logistics' }}</title>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            vertical-align: middle;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #121414;
            color: #e2e2e2;
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 16px;
        }
        .header {
            background-color: #0d0d6b;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-radius: 12px 12px 0 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .hero {
            position: relative;
            background-color: #0d0d6b;
            padding: 48px 24px;
            text-align: center;
            overflow: hidden;
        }
        .hero-bg {
            position: absolute;
            inset: 0;
            opacity: 0.1;
            pointer-events: none;
        }
        .hero-content {
            position: relative;
            z-index: 10;
        }
        .hero h1 {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: #e2e2e2;
            margin: 0 0 8px 0;
        }
        .hero .subtitle {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #ea6b1b;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            background-color: #1a1c1c;
            padding: 24px;
        }
        .content h2 {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: #e2e2e2;
            margin: 0 0 8px 0;
        }
        .content p {
            font-size: 16px;
            line-height: 24px;
            color: #c7c5d3;
            margin: 0 0 16px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
            margin: 24px 0;
        }
        .info-card {
            background-color: #282a2b;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .info-card .label {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: #ea6b1b;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .info-card .value {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #e2e2e2;
            margin-bottom: 4px;
        }
        .info-card .detail {
            font-size: 14px;
            color: #c7c5d3;
        }
        .button {
            display: inline-block;
            background-color: #ea6b1b;
            color: #4b1b00;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 16px;
            font-weight: 700;
            padding: 16px 40px;
            border-radius: 9999px;
            text-decoration: none;
            text-align: center;
            margin: 24px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .button:hover {
            opacity: 0.9;
        }
        .progress-container {
            background-color: #1e2020;
            padding: 16px;
            border-radius: 12px;
            margin: 24px 0;
        }
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 8px;
        }
        .progress-label {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: #e2e2e2;
        }
        .progress-value {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #ea6b1b;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #0d0d6b;
            border-radius: 9999px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background-color: #ea6b1b;
            border-radius: 9999px;
            box-shadow: 0 0 10px rgba(234, 107, 27, 0.5);
        }
        .footer {
            background-color: #0c0f0f;
            padding: 24px;
            border-radius: 0 0 12px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .footer-content {
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            color: #c7c5d3;
            margin: 8px 0;
        }
        .footer a {
            color: #ea6b1b;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .social-links {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin: 16px 0;
        }
        .social-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: #282a2b;
            border-radius: 50%;
            color: #c7c5d3;
            text-decoration: none;
        }
        .social-link:hover {
            background-color: #333535;
            color: #ea6b1b;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div style="display: flex; align-items: center; gap: 8px;">
                <img src="{{ $logo_url ?? 'https://via.placeholder.com/150x40?text=OD+Automotive' }}" alt="OD Automotive" style="height: 40px; width: auto;">
            </div>
            <div style="color: #c7c5d3;">
                <span class="material-symbols-outlined">notifications</span>
            </div>
        </div>

        <!-- Hero Section -->
        <div class="hero">
            <div class="hero-bg">
                <div style="position: absolute; top: 0; right: 0; width: 256px; height: 256px; background-color: #ea6b1b; border-radius: 50%; filter: blur(80px); margin-right: -128px; margin-top: -128px;"></div>
            </div>
            <div class="hero-content">
                <h1>{{ $hero_title ?? 'Notification' }}</h1>
                <p class="subtitle">{{ $hero_subtitle ?? 'OD Automotive & Logistics' }}</p>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content">
            @yield('content')
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <p style="font-weight: 600; color: #e2e2e2; margin-bottom: 16px;">OD Automotive & Logistics</p>
                <p>Professional automotive transport and logistics solutions</p>
                
                @if(isset($office_address) && $office_address)
                <p>{{ $office_address }}@if(isset($office_city) && $office_city), {{ $office_city }}@endif @if(isset($office_country) && $office_country), {{ $office_country }}@endif</p>
                @endif
                
                @if(isset($office_phone) && $office_phone)
                <p>Phone: <a href="tel:{{ $office_phone }}">{{ $office_phone }}</a></p>
                @endif
                
                @if(isset($office_email) && $office_email)
                <p>Email: <a href="mailto:{{ $office_email }}">{{ $office_email }}</a></p>
                @endif

                <div class="social-links">
                    @if(isset($social_facebook) && $social_facebook)
                    <a href="{{ $social_facebook }}" class="social-link" target="_blank">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    @endif
                    
                    @if(isset($social_instagram) && $social_instagram)
                    <a href="{{ $social_instagram }}" class="social-link" target="_blank">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    @endif
                </div>

                <p style="font-size: 11px; color: #918f9d; margin-top: 16px;">
                    © {{ date('Y') }} OD Automotive & Logistics. All rights reserved.
                </p>
                <p style="font-size: 11px; color: #918f9d;">
                    You received this email because you are a customer of OD Automotive & Logistics.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
