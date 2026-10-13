<?php $__env->startSection('content'); ?>
    <div style="margin-bottom: 24px;">
        <h2>Hello <?php echo e($customer_name ?? 'there'); ?>,</h2>
        <p><?php echo e($message); ?></p>
    </div>

    <?php if(!empty($portal_url)): ?>
    <div style="text-align: center; margin: 32px 0;">
        <a href="<?php echo e($portal_url); ?>" class="button">Open your portal</a>
    </div>
    <?php endif; ?>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('emails.base', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH C:\od-auto\laravel-backend\resources\views/emails/portal-notice.blade.php ENDPATH**/ ?>