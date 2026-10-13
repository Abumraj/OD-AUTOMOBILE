<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Statement of account</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; }
        .banner { background: #413481; color: #ffffff; padding: 18px 25px; }
        .banner h1 { margin: 0; font-size: 20px; }
        .banner p { margin: 4px 0 0; font-size: 11px; opacity: 0.85; }
        .wrap { padding: 18px 25px; }
        .meta td { padding: 2px 12px 2px 0; vertical-align: top; }
        .label { color: #64748b; font-size: 9px; text-transform: uppercase; }
        table.lines { width: 100%; border-collapse: collapse; margin-top: 16px; }
        table.lines th { background: #f1f5f9; text-align: left; padding: 7px 6px; font-size: 9px; text-transform: uppercase; color: #475569; }
        table.lines td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
        .num { text-align: right; }
        .totals { margin-top: 16px; width: 100%; }
        .totals td { padding: 4px 6px; }
        .grand { font-size: 13px; font-weight: bold; }
        .foot { margin-top: 28px; color: #64748b; font-size: 9px; }
    </style>
</head>
<body>
    <div class="banner">
        <h1>Statement of Account</h1>
        <p>OD Automotive &amp; Logistics</p>
    </div>
    <div class="wrap">
        <table class="meta">
            <tr>
                <td><div class="label">Customer</div><strong>{{ $customer->company_name }}</strong><br>{{ $customer->email }}</td>
                <td><div class="label">Period</div>{{ $from ?: 'Beginning' }} to {{ $to ?: date('Y-m-d') }}</td>
                <td><div class="label">Generated</div>{{ date('Y-m-d') }}</td>
            </tr>
        </table>

        <table class="lines">
            <thead>
                <tr>
                    <th>Date</th><th>Reference</th><th>Description</th>
                    <th class="num">Invoiced</th><th class="num">Paid</th><th class="num">Balance</th>
                </tr>
            </thead>
            <tbody>
            @forelse($statement['lines'] as $line)
                <tr>
                    <td>{{ $line['date'] }}</td>
                    <td>{{ $line['reference'] }}</td>
                    <td>{{ $line['description'] }}</td>
                    <td class="num">{{ $line['debit'] ? number_format($line['debit'], 2) : '' }}</td>
                    <td class="num">{{ $line['credit'] ? number_format($line['credit'], 2) : '' }}</td>
                    <td class="num">{{ number_format($line['balance'], 2) }}</td>
                </tr>
            @empty
                <tr><td colspan="6">No invoices in this period.</td></tr>
            @endforelse
            </tbody>
        </table>

        <table class="totals">
            <tr><td class="num" width="75%">Total invoiced ({{ $statement['currency'] }})</td><td class="num">{{ number_format($statement['total_invoiced'], 2) }}</td></tr>
            <tr><td class="num">Total paid</td><td class="num">{{ number_format($statement['total_paid'], 2) }}</td></tr>
            <tr class="grand"><td class="num">Balance due</td><td class="num">{{ number_format($statement['balance_due'], 2) }}</td></tr>
        </table>

        <p class="foot">Payments appear on this statement once OD Automotive has confirmed them.</p>
    </div>
</body>
</html>
