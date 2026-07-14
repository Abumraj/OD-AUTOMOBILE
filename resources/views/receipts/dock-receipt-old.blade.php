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
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
        }
        
        .container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            padding: 40px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .logo {
            max-width: 160px;
            height: auto;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
        }
        
        .company-tagline {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        
        .document-title {
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            letter-spacing: 1px;
            color: #374151;
            text-transform: uppercase;
        }
        
        .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 35px;
        }
        
        .receipt-info-item {
            padding: 0;
        }
        
        .receipt-info-label {
            font-weight: 500;
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .receipt-info-value {
            font-size: 14px;
            color: #111827;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-weight: 600;
            font-size: 11px;
            color: #111827;
            padding: 0 0 10px 0;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .section-content {
            padding: 0;
            background-color: transparent;
        }
        
        .info-grid {
            display: block;
            width: 100%;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 500;
            font-size: 11px;
            color: #6b7280;
            flex: 0 0 35%;
        }
        
        .info-value {
            font-size: 11px;
            color: #111827;
            flex: 1;
            text-align: right;
        }
        
        .stamp-section {
            margin-top: 40px;
            padding: 25px;
            text-align: center;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }
        
        .stamp-text {
            font-size: 13px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stamp-date {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
        }
        
        .footer-note {
            margin-top: 8px;
            font-style: normal;
            color: #6b7280;
            line-height: 1.5;
        }
        
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
        }
        
        .signature-box {
            flex: 1;
        }
        
        .signature-line {
            border-top: 1px solid #d1d5db;
            margin-top: 50px;
            padding-top: 8px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            border-radius: 12px;
            font-size: 9px;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="{{ public_path('logo-light.png') }}" alt="OD Automotive & Logistics" class="logo">
            </div>
            <div class="company-name">OD AUTOMOTIVE & LOGISTICS</div>
            <div class="company-tagline">Professional Vehicle Shipping & Logistics Services</div>
            <div class="document-title">DOCK RECEIPT</div>
        </div>
        
        <div class="receipt-info">
            <div class="receipt-info-item">
                <div class="receipt-info-label">Receipt Number</div>
                <div class="receipt-info-value">{{ $receipt->receipt_number }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">Reference Number</div>
                <div class="receipt-info-value">{{ $receipt->reference_number }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">Date of Receipt</div>
                <div class="receipt-info-value">{{ date('M d, Y', strtotime($receipt->date_received)) }}</div>
            </div>
            <div class="receipt-info-item">
                <div class="receipt-info-label">Shipment Stage</div>
                <div class="receipt-info-value">
                    {{ $stage_name }}
                    <div class="status-badge">{{ strtoupper($receipt->stage) }}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="section-content">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-label">Customer Name</div>
                        <div class="info-value">{{ $receipt->customer_name }}</div>
                    </div>
                    @if($shipment->customer_email)
                    <div class="info-row">
                        <div class="info-label">Email</div>
                        <div class="info-value">{{ $shipment->customer_email }}</div>
                    </div>
                    @endif
                    @if($shipment->customer_phone)
                    <div class="info-row">
                        <div class="info-label">Phone</div>
                        <div class="info-value">{{ $shipment->customer_phone }}</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Shipment Details</div>
            <div class="section-content">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-label">Description of Goods</div>
                        <div class="info-value">{{ $receipt->vehicle_description }}</div>
                    </div>
                    @if($shipment->vin)
                    <div class="info-row">
                        <div class="info-label">VIN</div>
                        <div class="info-value">{{ $shipment->vin }}</div>
                    </div>
                    @endif
                    @if($shipment->year)
                    <div class="info-row">
                        <div class="info-label">Year</div>
                        <div class="info-value">{{ $shipment->year }}</div>
                    </div>
                    @endif
                    @if($shipment->car_color)
                    <div class="info-row">
                        <div class="info-label">Color</div>
                        <div class="info-value">{{ $shipment->car_color }}</div>
                    </div>
                    @endif
                    <div class="info-row">
                        <div class="info-label">Origin</div>
                        <div class="info-value">{{ $shipment->origin_port }}, {{ $shipment->origin_country }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Destination</div>
                        <div class="info-value">{{ $shipment->destination_port }}, {{ $shipment->destination_country }}</div>
                    </div>
                    @if($shipment->shipping_type_name)
                    <div class="info-row">
                        <div class="info-label">Shipping Type</div>
                        <div class="info-value">{{ $shipment->shipping_type_name }}</div>
                    </div>
                    @endif
                    @if($shipment->shipping_line_name)
                    <div class="info-row">
                        <div class="info-label">Shipping Line</div>
                        <div class="info-value">{{ $shipment->shipping_line_name }}</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Receipt Location</div>
            <div class="section-content">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-label">Location Received</div>
                        <div class="info-value">{{ $receipt->location_received }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Date Received</div>
                        <div class="info-value">{{ date('M d, Y', strtotime($receipt->date_received)) }}</div>
                    </div>
                </div>
            </div>
        </div>
        
        @if($receipt->notes)
        <div class="section">
            <div class="section-title">Additional Notes</div>
            <div class="section-content">
                {{ $receipt->notes }}
            </div>
        </div>
        @endif
        
        <div class="stamp-section">
            <div class="stamp-text">✓ Received for Shipment</div>
            <div class="stamp-date">{{ $generated_date }}</div>
            <div style="margin-top: 12px; font-size: 10px; color: #6b7280; line-height: 1.6;">
                This receipt confirms that the above-described goods have been received<br>
                at the specified location and are ready for processing.
            </div>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">
                    Authorized Signature
                </div>
            </div>
            <div class="signature-box">
                <div class="signature-line">
                    Date
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div>OD AUTOMOTIVE & LOGISTICS</div>
            <div>Professional Vehicle Shipping & Logistics Services</div>
            <div class="footer-note">
                This is an official dock receipt issued by OD Automotive & Logistics.<br>
                For inquiries, please contact us with your receipt number: {{ $receipt->receipt_number }}
            </div>
        </div>
    </div>
</body>
</html>
