<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
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
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 10px;
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

        .totals-section {
            margin-top: 10px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .totals-wrapper {
            width: 100%;
            max-width: 220px;
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

        .grand-total .total-label,
        .grand-total .total-value {
            font-size: 14px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header-banner">
            <img src="{{ public_path('logo-light.png') }}" alt="OD Automotive & Logistics" class="logo">
        </div>

        <div class="content-wrapper">
            <div class="title-section">
                <div>
                    <div class="document-title">INVOICE</div>
                    <div class="document-number">No. {{ $invoice->invoice_number }}</div>
                </div>
                <div class="company-info">
                    <p>OD AUTOMOTIVE & LOGISTICS</p>
                    <p>PROFESSIONAL SHIPPING SERVICES</p>
                </div>
            </div>

            <table class="info-table">
                <tr>
                    <td class="info-label">Invoice Number</td>
                    <td class="info-value">{{ $invoice->invoice_number }}</td>
                    <td class="info-label">Reference</td>
                    <td class="info-value">{{ $invoice->reference_number }}</td>
                </tr>
                <tr>
                    <td class="info-label">Date Issued</td>
                    <td class="info-value">{{ date('M d, Y', strtotime($invoice->date_issued)) }}</td>
                    <td class="info-label">Service</td>
                    <td class="info-value">{{ $invoice->service_label }}</td>
                </tr>
            </table>

            <div class="section-title">Bill To</div>
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
                            <div class="item-title">{{ $invoice->customer_name }}</div>
                        </td>
                        <td>
                            @if($invoice->customer_email)
                                {{ $invoice->customer_email }}
                                @if($invoice->customer_phone)<br>@endif
                            @endif
                            @if($invoice->customer_phone)
                                {{ $invoice->customer_phone }}
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title">Invoice Item</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <span class="item-code">#{{ strtoupper($invoice->service_label) }}</span>
                            <div class="item-title">{{ $invoice->description }}</div>
                        </td>
                        <td>{{ $invoice->currency === 'USD' ? '$' : '₦' }}{{ number_format($invoice->amount, 2) }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals-section">
                <div class="totals-wrapper">
                    <div class="total-row grand-total">
                        <span class="total-label">Total Due</span>
                        <span class="total-value">{{ $invoice->currency === 'USD' ? '$' : '₦' }}{{ number_format($invoice->amount, 2) }}</span>
                    </div>
                </div>
            </div>

            @if(!empty($invoice->notes))
            <div class="section-title">Additional Notes</div>
            <p style="color: #45464d; line-height: 1.5; margin-bottom: 10px; font-size: 10px;">{{ $invoice->notes }}</p>
            @endif

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

        <div class="footer">
            <p class="footer-copyright">© {{ date('Y') }} OD Automotive & Logistics Inc.</p>
            <p>This is an official invoice. For inquiries, reference: {{ $invoice->invoice_number }}</p>
        </div>
    </div>
</body>
</html>
