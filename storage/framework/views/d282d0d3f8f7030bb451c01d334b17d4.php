<?php $__env->startSection('content'); ?>
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello <?php echo e($customer_name); ?>,</h2>
        <p>Your shipment has been successfully delivered! Thank you for choosing OD Automotive & Logistics.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        <?php if(isset($tracking_number)): ?>
        <div class="info-card">
            <p class="label">Tracking Number</p>
            <p class="value"><?php echo e($tracking_number); ?></p>
        </div>
        <?php endif; ?>

        <?php if(isset($vehicle_details)): ?>
        <div class="info-card">
            <p class="label">Vehicle Details</p>
            <p class="value"><?php echo e($vehicle_details); ?></p>
        </div>
        <?php endif; ?>

        <?php if(isset($delivery_date)): ?>
        <div class="info-card">
            <p class="label">Delivery Date</p>
            <p class="value"><?php echo e($delivery_date); ?></p>
        </div>
        <?php endif; ?>

        <?php if(isset($delivery_location)): ?>
        <div class="info-card">
            <p class="label">Delivered To</p>
            <p class="value"><?php echo e($delivery_location); ?></p>
        </div>
        <?php endif; ?>
    </div>

    <p style="margin-top: 24px;">We hope to serve you again soon!</p>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('emails.base', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH C:\od-auto\laravel-backend\resources\views/emails/shipment-delivered.blade.php ENDPATH**/ ?>