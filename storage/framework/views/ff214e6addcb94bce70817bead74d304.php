<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dock Receipt - <?php echo e($receipt->receipt_number); ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #0f172a;
            background: #f7f9fb;
        }
        
        .container {
            width: 100%;
            max-width: 740px;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header-banner {
            background: linear-gradient(135deg, #413481 0%, #5a4ba3 100%);
            height: 80px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 10px;
        }
        
        .header-illustration {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            opacity: 0.9;
        }
        
        .logo-container {
            position: relative;
            z-index: 10;
            text-align: center;
        }
        
        .logo {
            max-width: 70px;
            height: auto;
            display: block;
            margin: 0 auto;
            filter: brightness(0) invert(1);
        }
        
        .content-wrapper {
            padding: 18px 25px;
        }
        
        .title-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .document-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            line-height: 1;
            margin-bottom: 3px;
        }
        
        .document-number {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .company-info {
            text-align: right;
            font-size: 8px;
            color: #45464d;
            line-height: 1.4;
            font-weight: 500;
        }
        
        .company-website {
            margin-top: 4px;
            color: #0f172a;
            text-transform: uppercase;
            font-weight: 700;
        }
        
        .info-table {
            width: 100%;
            margin-bottom: 10px;
        }
        
        .info-table td {
            padding: 5px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .info-label {
            font-size: 10px;
            font-weight: 700;
            color: #45464d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: 35%;
        }
        
        .info-value {
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
        }
        
        .section-title {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-top: 10px;
            margin-bottom: 6px;
            padding-bottom: 5px;
            border-bottom: 2px solid #0f172a;
        }
        
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        
        table.data-table thead {
            background: #f7f9fb;
        }
        
        table.data-table th {
            text-align: left;
            padding: 5px 6px;
            font-size: 8px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            border-bottom: 2px solid #0f172a;
        }
        
        table.data-table th:last-child {
            text-align: right;
        }
        
        table.data-table td {
            padding: 5px 6px;
            font-size: 9px;
            color: #0f172a;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        
        table.data-table td:last-child {
            text-align: right;
        }
        
        .item-code {
            font-size: 8px;
            font-weight: 700;
            color: #45464d;
            display: block;
            margin-bottom: 2px;
        }
        
        .item-title {
            font-weight: 700;
            font-size: 10px;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 1px;
        }
        
        .item-description {
            font-size: 8px;
            color: #45464d;
            max-width: 400px;
            line-height: 1.3;
            font-style: italic;
        }
        
        .totals-section {
            margin-top: 10px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .totals-wrapper {
            width: 100%;
            max-width: 200px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
        }
        
        .total-label {
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .total-value {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .grand-total {
            padding-top: 8px;
            border-top: 2px solid #0f172a;
            margin-top: 4px;
        }
        
        .stamp-section {
            background: #f0fff4;
            border: 2px solid #48bb78;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            margin: 10px 0;
        }
        
        .stamp-text {
            font-size: 11px;
            font-weight: 700;
            color: #22543d;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        
        .stamp-date {
            font-size: 9px;
            color: #2f855a;
            font-weight: 500;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 12px;
            margin-bottom: 10px;
        }
        
        .signature-box {
            display: flex;
            flex-direction: column;
        }
        
        .signature-line {
            width: 100px;
            height: 20px;
            margin-bottom: 5px;
            border-bottom: 2px solid #0f172a;
        }
        
        .signature-name {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 1px;
        }
        
        .signature-title {
            font-size: 9px;
            font-weight: 700;
            color: #ef4444;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .signature-website {
            text-align: right;
            font-size: 9px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .footer {
            background: #f7f9fb;
            padding: 10px 25px;
            text-align: center;
            font-size: 7px;
            color: #45464d;
            line-height: 1.4;
        }
        
        .footer-copyright {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 4px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #edf2f7;
            color: #0f172a;
            font-weight: 700;
            border-radius: 4px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Illustrated Header Banner -->
        <div class="header-banner">
            <div class="header-illustration">
                <!-- Simplified illustration placeholder - will show logo instead -->
            </div>
            <div class="logo-container">
                <img src="<?php echo e(public_path('logo-light.png')); ?>" alt="OD Automotive & Logistics" class="logo">
            </div>
        </div>
        
        <!-- Content -->
        <div class="content-wrapper">
            <!-- Title Section -->
            <div class="title-section">
                <div>
                    <div class="document-title">DOCK RECEIPT</div>
                    <div class="document-number">No. <?php echo e($receipt->receipt_number); ?></div>
                </div>
                <div class="company-info">
                    <p>OD AUTOMOTIVE & LOGISTICS</p>
                    <p>PROFESSIONAL SHIPPING SERVICES</p>
                </div>
            </div>
            
            <!-- Key Information Table -->
            <table class="info-table">
                <tr>
                    <td class="info-label">Receipt Number</td>
                    <td class="info-value"><?php echo e($receipt->receipt_number); ?></td>
                    <td class="info-label">Reference</td>
                    <td class="info-value"><?php echo e($receipt->reference_number); ?></td>
                </tr>
                <tr>
                    <td class="info-label">Date</td>
                    <td class="info-value"><?php echo e(date('M d, Y', strtotime($receipt->date_received))); ?></td>
                    <td class="info-label">Status</td>
                    <td class="info-value"><span class="status-badge"><?php echo e(strtoupper($receipt->stage)); ?></span></td>
                </tr>
            </table>
            
            <!-- Customer Information -->
            <div class="section-title">Customer Information</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <span class="item-code">#CUSTOMER</span>
                            <div class="item-title"><?php echo e($receipt->customer_name); ?></div>
                            <div class="item-description">Primary customer contact for this shipment</div>
                        </td>
                        <td>
                            <?php if($shipment->customer_email): ?>
                                <?php echo e($shipment->customer_email); ?>

                                <?php if($shipment->customer_phone): ?><br><?php endif; ?>
                            <?php endif; ?>
                            <?php if($shipment->customer_phone): ?>
                                <?php echo e($shipment->customer_phone); ?>

                            <?php endif; ?>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Shipment Details -->
            <div class="section-title">Shipment Details</div>
            <table class="data-table">
                <tbody>
                    <tr>
                        <td style="width: 50%;">
                            <span class="item-code">#VEHICLE</span>
                            <div class="item-title"><?php echo e($receipt->vehicle_description); ?></div>
                            <div class="item-description">
                                <?php if($shipment->vin): ?>VIN: <?php echo e($shipment->vin); ?><?php endif; ?>
                                <?php if($shipment->year): ?> | Year: <?php echo e($shipment->year); ?><?php endif; ?>
                                <?php if($shipment->car_color): ?> | Color: <?php echo e($shipment->car_color); ?><?php endif; ?>
                            </div>
                        </td>
                        <td style="width: 50%;">
                            <span class="item-code">#STATUS</span>
                            <div class="item-title"><?php echo e($stage_name); ?></div>
                            <div class="item-description">Current shipment stage</div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-code">#ORIGIN</span>
                            <div class="item-title"><?php echo e($shipment->origin_port); ?></div>
                            <div class="item-description"><?php echo e($shipment->origin_country); ?></div>
                        </td>
                        <td>
                            <span class="item-code">#DESTINATION</span>
                            <div class="item-title"><?php echo e($shipment->destination_port); ?></div>
                            <div class="item-description"><?php echo e($shipment->destination_country); ?></div>
                        </td>
                    </tr>
                    <?php if($shipment->vessel_name || $shipment->container_number || $shipment->booking_number): ?>
                    <tr>
                        <td colspan="2">
                            <span class="item-code">#SHIPPING</span>
                            <?php if($shipment->vessel_name): ?><strong>Vessel:</strong> <?php echo e($shipment->vessel_name); ?><?php endif; ?>
                            <?php if($shipment->container_number): ?> | <strong>Container:</strong> <?php echo e($shipment->container_number); ?><?php endif; ?>
                            <?php if($shipment->booking_number): ?> | <strong>Booking:</strong> <?php echo e($shipment->booking_number); ?><?php endif; ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if($shipment->auction_date || $shipment->shipping_date || $shipment->departure_date): ?>
                    <tr>
                        <td colspan="2">
                            <span class="item-code">#DATES</span>
                            <?php if($shipment->auction_date): ?><strong>Auction:</strong> <?php echo e(date('M d, Y', strtotime($shipment->auction_date))); ?><?php endif; ?>
                            <?php if($shipment->shipping_date): ?> | <strong>Shipping:</strong> <?php echo e(date('M d, Y', strtotime($shipment->shipping_date))); ?><?php endif; ?>
                            <?php if($shipment->departure_date): ?> | <strong>Departure:</strong> <?php echo e(date('M d, Y', strtotime($shipment->departure_date))); ?><?php endif; ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if($shipment->estimated_arrival_date || $shipment->actual_arrival_date || $shipment->delivery_date): ?>
                    <tr>
                        <td colspan="2">
                            <span class="item-code">#ARRIVAL</span>
                            <?php if($shipment->estimated_arrival_date): ?><strong>ETA:</strong> <?php echo e(date('M d, Y', strtotime($shipment->estimated_arrival_date))); ?><?php endif; ?>
                            <?php if($shipment->actual_arrival_date): ?> | <strong>Arrived:</strong> <?php echo e(date('M d, Y', strtotime($shipment->actual_arrival_date))); ?><?php endif; ?>
                            <?php if($shipment->delivery_date): ?> | <strong>Delivered:</strong> <?php echo e(date('M d, Y', strtotime($shipment->delivery_date))); ?><?php endif; ?>
                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if($shipment->total_cost): ?>
                    <tr>
                        <td colspan="2">
                            <span class="item-code">#COST</span>
                            <strong>Total Cost:</strong> $<?php echo e(number_format($shipment->total_cost, 2)); ?>

                        </td>
                    </tr>
                    <?php endif; ?>
                    <?php if($shipment->tracking_number): ?>
                    <tr>
                        <td colspan="2">
                            <span class="item-code">#TRACKING</span>
                            <strong>Tracking Number:</strong> <?php echo e($shipment->tracking_number); ?>

                        </td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            
            <!-- Receipt Summary -->
            <div class="totals-section">
                <div class="totals-wrapper">
                    <div class="total-row">
                        <span class="total-label">Received At</span>
                        <span class="total-value"><?php echo e($receipt->location_received); ?></span>
                    </div>
                    <div class="total-row grand-total">
                        <span class="total-label">Receipt Date</span>
                        <span class="total-value"><?php echo e(date('M d, Y', strtotime($receipt->date_received))); ?></span>
                    </div>
                </div>
            </div>
            
            <?php if($receipt->notes): ?>
            <div class="section-title">Additional Notes</div>
            <p style="color: #45464d; line-height: 1.5; margin-bottom: 10px; font-size: 10px;"><?php echo e($receipt->notes); ?></p>
            <?php endif; ?>
            
            <!-- Stamp Section -->
            <div class="stamp-section">
                <div class="stamp-text">✓ RECEIVED FOR SHIPMENT</div>
                <div class="stamp-date"><?php echo e($generated_date); ?></div>
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-name">Authorized Officer</div>
                    <div class="signature-title">/ OD Automotive</div>
                </div>
                <div class="signature-website">
                    OD Automotive
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-copyright">© <?php echo e(date('Y')); ?> OD Automotive & Logistics Inc.</p>
            <p>This is an official dock receipt. For inquiries, reference: <?php echo e($receipt->receipt_number); ?></p>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\od-auto\laravel-backend\resources\views/receipts/dock-receipt.blade.php ENDPATH**/ ?>