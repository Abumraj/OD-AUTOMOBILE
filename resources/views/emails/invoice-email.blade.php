<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">
                                OD AUTOMOTIVE & LOGISTICS
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 14px;">
                                Professional Vehicle Shipping & Logistics Services
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">
                                Invoice
                            </h2>

                            <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Dear {{ $customer_name }},
                            </p>

                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Please find attached your invoice for the service below.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 6px; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="color: #666666; font-size: 14px; font-weight: bold; width: 40%;">Invoice Number:</td>
                                                <td style="color: #1a1a1a; font-size: 14px; font-weight: bold;">{{ $invoice_number }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #666666; font-size: 14px; font-weight: bold;">Reference Number:</td>
                                                <td style="color: #1a1a1a; font-size: 14px;">{{ $reference_number }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #666666; font-size: 14px; font-weight: bold;">Description:</td>
                                                <td style="color: #1a1a1a; font-size: 14px;">{{ $description }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                The full invoice is attached to this email as a PDF document.
                            </p>

                            <p style="margin: 20px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                If you have any questions, please don't hesitate to contact us.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                                <strong>OD Automotive & Logistics</strong>
                            </p>
                            <p style="margin: 0 0 15px 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                Professional Vehicle Shipping & Logistics Services<br>
                                Trusted Partner for Your Automotive Transportation Needs
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 11px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
