<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dock Receipt - {{ $receipt->receipt_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
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
            height: 120px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 15px;
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
            max-width: 100px;
            height: auto;
            display: block;
            margin: 0 auto;
            filter: brightness(0) invert(1);
        }
        
        .content-wrapper {
            padding: 25px 30px;
        }
        
        .title-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .document-title {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            line-height: 1;
            margin-bottom: 4px;
        }
        
        .document-number {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .company-info {
            text-align: right;
            font-size: 9px;
            color: #45464d;
            line-height: 1.5;
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
            margin-bottom: 16px;
        }
        
        .info-table td {
            padding: 8px 0;
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
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 16px;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0f172a;
        }
        
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        
        table.data-table thead {
            background: #f7f9fb;
        }
        
        table.data-table th {
            text-align: left;
            padding: 8px 8px;
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 2px solid #0f172a;
        }
        
        table.data-table th:last-child {
            text-align: right;
        }
        
        table.data-table td {
            padding: 10px 8px;
            font-size: 11px;
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
            font-size: 12px;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        
        .item-description {
            font-size: 9px;
            color: #45464d;
            max-width: 400px;
            line-height: 1.3;
            font-style: italic;
        }
        
        .totals-section {
            margin-top: 16px;
            margin-bottom: 20px;
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
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 16px 0;
        }
        
        .stamp-text {
            font-size: 13px;
            font-weight: 700;
            color: #22543d;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stamp-date {
            font-size: 10px;
            color: #2f855a;
            font-weight: 500;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
            margin-bottom: 16px;
        }
        
        .signature-box {
            display: flex;
            flex-direction: column;
        }
        
        .signature-line {
            width: 100px;
            height: 30px;
            margin-bottom: 8px;
            border-bottom: 2px solid #0f172a;
        }
        
        .signature-name {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
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
            padding: 15px 30px;
            text-align: center;
            font-size: 8px;
            color: #45464d;
            line-height: 1.5;
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
                <img src="{{ public_path('logo-light.png') }}" alt="OD Automotive & Logistics" class="logo">
            </div>
        </div>
        
        <!-- Content -->
        <div class="content-wrapper">
            <!-- Title Section -->
            <div class="title-section">
                <div>
                    <div class="document-title">DOCK RECEIPT</div>
                    <div class="document-number">No. {{ $receipt->receipt_number }}</div>
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
                    <td class="info-value">{{ $receipt->receipt_number }}</td>
                    <td class="info-label">Reference</td>
                    <td class="info-value">{{ $receipt->reference_number }}</td>
                </tr>
                <tr>
                    <td class="info-label">Date</td>
                    <td class="info-value">{{ date('M d, Y', strtotime($receipt->date_received)) }}</td>
                    <td class="info-label">Status</td>
                    <td class="info-value"><span class="status-badge">{{ strtoupper($receipt->stage) }}</span></td>
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
                            <div class="item-title">{{ $receipt->customer_name }}</div>
                            <div class="item-description">Primary customer contact for this shipment</div>
                        </td>
                        <td>
                            @if($shipment->customer_email)
                                {{ $shipment->customer_email }}
                                @if($shipment->customer_phone)<br>@endif
                            @endif
                            @if($shipment->customer_phone)
                                {{ $shipment->customer_phone }}
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Shipment Details -->
            <div class="section-title">Shipment Details</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Information</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <span class="item-code">#VEHICLE</span>
                            <div class="item-title">{{ $receipt->vehicle_description }}</div>
                            <div class="item-description">
                                @if($shipment->vin)
                                    VIN: {{ $shipment->vin }}
                                    @if($shipment->year || $shipment->car_color) | @endif
                                @endif
                                @if($shipment->year)
                                    Year: {{ $shipment->year }}
                                    @if($shipment->car_color) | @endif
                                @endif
                                @if($shipment->car_color)
                                    Color: {{ $shipment->car_color }}
                                @endif
                            </div>
                        </td>
                        <td>
                            {{ $stage_name }}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-code">#ROUTE</span>
                            <div class="item-title">Shipping Route</div>
                            <div class="item-description">Origin to destination shipping path</div>
                        </td>
                        <td>
                            {{ $shipment->origin_port }}, {{ $shipment->origin_country }}<br>
                            → {{ $shipment->destination_port }}, {{ $shipment->destination_country }}
                        </td>
                    </tr>
                    @if($shipment->shipping_type_name || $shipment->shipping_line_name)
                    <tr>
                        <td>
                            <span class="item-code">#SHIPPING</span>
                            <div class="item-title">Shipping Method</div>
                            <div class="item-description">Transportation type and carrier information</div>
                        </td>
                        <td>
                            @if($shipment->shipping_type_name)
                                {{ $shipment->shipping_type_name }}
                                @if($shipment->shipping_line_name)<br>@endif
                            @endif
                            @if($shipment->shipping_line_name)
                                {{ $shipment->shipping_line_name }}
                            @endif
                        </td>
                    </tr>
                    @endif
                </tbody>
            </table>
            
            <!-- Receipt Location Totals -->
            <div class="totals-section">
                <div class="totals-wrapper">
                    <div class="total-row">
                        <span class="total-label">Location</span>
                        <span class="total-value">{{ $receipt->location_received }}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Date</span>
                        <span class="total-value">{{ date('M d, Y', strtotime($receipt->date_received)) }}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span class="total-label">Stage</span>
                        <span class="total-value">{{ $stage_name }}</span>
                    </div>
                </div>
            </div>
            
            @if($receipt->notes)
            <div class="section-title">Additional Notes</div>
            <p style="color: #45464d; line-height: 1.6; margin-bottom: 30px; font-size: 12px;">{{ $receipt->notes }}</p>
            @endif
            
            <!-- Stamp Section -->
            <div class="stamp-section">
                <div class="stamp-text">✓ RECEIVED FOR SHIPMENT</div>
                <div class="stamp-date">{{ $generated_date }}</div>
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
            <p class="footer-copyright">© {{ date('Y') }} OD Automotive & Logistics Inc.</p>
            <p>This is an official dock receipt. For inquiries, reference: {{ $receipt->receipt_number }}</p>
        </div>
    </div>
</body>
</html>
