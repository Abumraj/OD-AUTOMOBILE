# Customer (Business) Portal

A separate, private dashboard where each business signs in at `/portal` to see every service OD has rendered
and to act on it. OD controls it from **Admin → Customer Portal**.

## Setup

```powershell
php artisan migrate        # adds customers, payments, tickets, documents... and portal settings
```

The migration is `2026_10_11_000001_create_customer_portal_tables.php`. It is idempotent and reversible.
Uploaded files are stored privately under `storage/app/portal/` and served only through authenticated routes.

## How it fits together

| Concern | Where |
| --- | --- |
| Settings, linking, history, alerts, analytics, statements | `app/Services/PortalService.php` |
| Customer sign-in, registration, team, API token | `app/Http/Controllers/Api/Portal/PortalAuthController.php` |
| Read-only views (history, vehicles, invoices, documents) | `app/Http/Controllers/Api/Portal/PortalDataController.php` |
| Customer actions (requests, quotes, uploads, tickets, payments) | `app/Http/Controllers/Api/Portal/PortalActionController.php` |
| Admin control (accounts, settings, payments, quotes, tickets) | `app/Http/Controllers/Api/PortalAdminController.php` |
| Customer guard | `app/Http/Middleware/CustomerAuth.php` (`customer.auth`) |
| React portal | `resources/js/pages/PortalApp.jsx`, `resources/js/pages/portal/` |
| React admin page | `resources/js/pages/admin/AdminPortalPage.jsx` |

Customer routes live under `/api/portal/*`; admin routes under `/api/admin/portal/*` (behind `admin.auth`).
The customer session key (`customer_user_id`) is separate from the admin session, so both can be signed in
in one browser.

## Registration mode (switchable in admin)

Stored in `settings.portal_registration_mode`:

- `open`: anyone can register and gets access at once.
- `approval` (default): registration creates a pending account; an admin must approve it.
- `admin_only`: self-registration is closed; OD creates every account.

`settings.portal_enabled` is a master switch that locks all customers out.

## How records reach a customer

Existing records only carry a name and email. Each service table (`quotes`, `shipments`, `procurements`,
`autosales`, `truckings`, `clearances`, `auction_requests`, `invoices`) gets a nullable `customer_id`.

- Accounts created or approved by an admin are *link-verified*; records with a matching email are linked
  automatically, including records created later.
- A self-registered account in `open` mode is **not** linked by email until an admin confirms it
  (**Confirm and link**), so nobody can claim another company's records by typing its email.
- Shipments created from a customer's own portal quote are linked explicitly through `quote_id`.

## Payments (no gateway yet)

Invoices gain `status` (`unpaid`, `partial`, `paid`, `void`), `amount_paid` and `due_date` (from the customer's
credit terms). Customers submit a payment with an optional proof; an admin confirms or rejects it, and the
invoice status is recalculated from confirmed payments. Offline receipts are recorded by an admin.
Account credit is a ledger (`customer_credit_entries`) that a customer can apply to invoices.

Gateway methods (Paystack, Flutterwave, Remita, Stripe, PayPal, virtual accounts) are listed in settings but
cannot be enabled until their integration is written. Add it behind a new service in `app/Services/` and flip
`kind: gateway` methods on in `PortalAdminController::updateSettings`.

Totals are always kept **per currency**; invoices are issued in USD and NGN and are never added together.

## Roles

| Role | Can |
| --- | --- |
| `owner` | everything, including team and API token |
| `finance` | pay, approve requests and quotes, documents, support |
| `operations` | request services, documents, support (requests above the approval threshold wait for sign-off) |

## Notifications

`NotificationService` now checks each business's channel preferences (email/SMS/WhatsApp and category) before
sending. Portal notices use the `portal-notice` email and SMS templates.

## Accounting API

An owner can generate a read-only token in **Settings**. Send it as `Authorization: Bearer <token>` to the
`GET` endpoints, for example `/api/portal/invoices`, `/api/portal/history` and `/api/portal/statement`.
Tokens are stored hashed and cannot write.
