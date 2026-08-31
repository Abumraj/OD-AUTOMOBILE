<?php $__env->startSection('content'); ?>
    <!-- Greeting -->
    <div style="margin-bottom: 24px;">
        <h2>Hello <?php echo e($customer_name); ?>,</h2>
        <p>Your premium vehicle transport is proceeding as scheduled. Our logistics team has completed the latest checkpoint verification for your vehicle.</p>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        <?php if(isset($vehicle_details)): ?>
        <div class="info-card">
            <p class="label">Vehicle Details</p>
            <p class="value"><?php echo e($vehicle_details); ?></p>
        </div>
        <?php endif; ?>

        <div class="info-card">
            <p class="label">Tracking ID</p>
            <p class="value"><?php echo e($tracking_number); ?></p>
            <p class="detail">
                <span class="material-symbols-outlined" style="font-size: 16px; font-variation-settings: 'FILL' 1;">verified</span>
                Secure Transit
            </p>
        </div>

        <?php if(isset($status)): ?>
        <div class="info-card">
            <p class="label">Current Status</p>
            <p class="value"><?php echo e($status); ?></p>
            <?php if(isset($current_location)): ?>
            <p class="detail"><?php echo e($current_location); ?></p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <?php if(isset($estimated_delivery)): ?>
        <div class="info-card">
            <p class="label">Estimated Delivery</p>
            <p class="value"><?php echo e($estimated_delivery); ?></p>
        </div>
        <?php endif; ?>
    </div>

    <!-- Action Button -->
    <?php if(isset($tracking_url)): ?>
    <div style="text-align: center; margin: 32px 0;">
        <a href="<?php echo e($tracking_url); ?>" class="button">Track Your Shipment</a>
    </div>
    <?php endif; ?>

    <!-- Progress Bar -->
    <?php if(isset($progress_percentage)): ?>
    <div class="progress-container">
        <div class="progress-header">
            <span class="progress-label">Transit Progress</span>
            <span class="progress-value"><?php echo e($progress_percentage); ?>%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: <?php echo e($progress_percentage); ?>%;"></div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Additional Info -->
    <?php if(isset($additional_notes)): ?>
    <div style="background-color: #1e2020; padding: 16px; border-radius: 8px; border-left: 4px solid #ea6b1b; margin-top: 24px;">
        <p style="margin: 0; font-size: 14px; color: #c7c5d3;">
            <strong style="color: #e2e2e2;">Note:</strong> <?php echo e($additional_notes); ?>

        </p>
    </div>
    <?php endif; ?>

    <p style="margin-top: 24px;">If you have any questions about your shipment, please don't hesitate to contact our support team.</p>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('emails.base', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH C:\od-auto\laravel-backend\resources\views/emails/shipment-update.blade.php ENDPATH**/ ?>