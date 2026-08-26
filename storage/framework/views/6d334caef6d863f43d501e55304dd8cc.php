<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport'); ?></title>
    <meta name="description" content="<?php echo e($ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.'); ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?php echo e($ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport'); ?>">
    <meta property="og:description" content="<?php echo e($ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.'); ?>">
    <meta property="og:image" content="<?php echo e($ogImage ?? asset('logo-dark.png')); ?>">
    <meta property="og:url" content="<?php echo e($ogUrl ?? url()->current()); ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo e($ogTitle ?? 'OD Automotive & Logistics | Professional Industrial Transport'); ?>">
    <meta name="twitter:description" content="<?php echo e($ogDescription ?? 'Professional automotive logistics and transport services. Expert vehicle procurement, auction bidding, and door-to-door delivery.'); ?>">
    <meta name="twitter:image" content="<?php echo e($ogImage ?? asset('logo-dark.png')); ?>">
    <link rel="icon" type="image/png" href="/logo-dark.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/logo-dark.png">
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.jsx', 'resources/css/app.css']); ?>
</head>
<body>
    <div id="root"></div>
</body>
</html>
<?php /**PATH C:\od-auto\laravel-backend\resources\views/app.blade.php ENDPATH**/ ?>