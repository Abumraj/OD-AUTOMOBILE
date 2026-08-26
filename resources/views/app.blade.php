<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport' }}</title>
    <meta name="description" content="{{ $ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.' }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport' }}">
    <meta property="og:description" content="{{ $ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.' }}">
    <meta property="og:image" content="{{ $ogImage ?? asset('logo-dark.png') }}">
    <meta property="og:url" content="{{ $ogUrl ?? url()->current() }}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport' }}">
    <meta name="twitter:description" content="{{ $ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.' }}">
    <meta name="twitter:image" content="{{ $ogImage ?? asset('logo-dark.png') }}">
    <link rel="icon" type="image/png" href="/logo-dark.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/logo-dark.png">
    @viteReactRefresh
    @vite(['resources/js/app.jsx', 'resources/css/app.css'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
