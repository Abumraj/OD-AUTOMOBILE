# Quote Request to Shipment Workflow

## Overview
This document describes the complete workflow from when a user submits a quote request on the website to when it appears in the admin dashboard and gets converted to a shipment.

## Workflow Steps

### 1. User Submits Quote Request
**Frontend:** User fills out the 4-step quote form at `/quote`
- Step 1: Service selection
- Step 2: Vehicle details (year, make, model, origin, destination)
- Step 3: Contact information (name, email, phone, contact method)
- Step 4: Review and submit

**API Endpoint:** `POST /api/quotes`

**What Happens:**
1. Quote data is validated
2. New record created in `quotes` table with status `pending`
3. Activity log entry created: "submitted a quote request for [vehicle]"
4. Success response returned with quote ID
5. User sees success message and can return to home page

**Database Tables Updated:**
- `quotes` - New quote record
- `activity_logs` - Submission activity

---

### 2. Admin Views Quote Requests
**Frontend:** Admin dashboard at `/admin` shows QuotesTable component

**API Endpoint:** `GET /api/admin/quotes`

**What's Displayed:**
- All quotes ordered by most recent first
- Filter tabs: All, Pending, Approved
- Quote details: Customer name, contact info, vehicle, route, service, status, submission time
- Action buttons for pending quotes: Approve, Reject

**Quote Statuses:**
- `pending` - Awaiting admin review (yellow badge)
- `approved` - Approved but not yet converted (green badge)
- `converted` - Converted to shipment (blue badge)

---

### 3. Admin Approves Quote
**Action:** Admin clicks "Approve" button on a pending quote

**API Endpoint:** `POST /api/admin/quotes/{id}/approve`

**What Happens:**
1. Quote status updated to `approved`
2. New shipment record created in `shipments` table:
   - Auto-generated tracking ID: `OD-[5-digit-number]-AUTO`
   - Status set to `procurement` (first stage in pipeline)
   - All customer and vehicle details copied from quote
   - Initial flags: not starred, not delayed, 0% clearance progress
3. Quote status updated to `converted`
4. Activity log entry created: "approved quote and created shipment [tracking_id] for [customer]"
5. Success response with tracking ID returned
6. Admin sees alert with new tracking ID
7. QuotesTable refreshes to show updated status

**Database Tables Updated:**
- `quotes` - Status changed from `pending` → `approved` → `converted`
- `shipments` - New shipment record created
- `activity_logs` - Approval activity

**Result:**
- Quote no longer shows action buttons (status: converted)
- New shipment appears in Kanban board under "Procurement" column
- Activity stream shows the approval action
- Customer can now track shipment using the tracking ID

---

### 4. Admin Rejects Quote
**Action:** Admin clicks "Reject" button on a pending quote

**API Endpoint:** `DELETE /api/admin/quotes/{id}/reject`

**What Happens:**
1. Quote record deleted from database
2. Activity log entry created: "rejected quote request from [customer]"
3. Success response returned
4. Admin sees confirmation alert
5. QuotesTable refreshes - quote no longer appears

**Database Tables Updated:**
- `quotes` - Record deleted
- `activity_logs` - Rejection activity

---

## API Endpoints Summary

### Quote Submission (Public)
```
POST /api/quotes
Body: {
  service, year, make, model, origin, destination,
  fullName, email, phone, contactMethod
}
Response: { success, quote_id, message }
```

### Admin Quote Management
```
GET /api/admin/quotes
Response: Array of quote objects

POST /api/admin/quotes/{id}/approve
Response: { success, message, tracking_id, shipment_id }

DELETE /api/admin/quotes/{id}/reject
Response: { success, message }
```

---

## Database Schema

### quotes Table
- id
- service
- vehicle_year, vehicle_make, vehicle_model
- origin, destination
- customer_name, email, phone, contact_method
- status (pending|approved|converted)
- created_at, updated_at

### shipments Table
- id
- tracking_id (unique)
- customer_name, customer_email, customer_phone
- vehicle_year, vehicle_make, vehicle_model
- origin, destination
- status (procurement|shipping|at_port|clearing|delivered)
- vessel_name, is_starred, is_delayed
- clearance_progress, delivered_at
- created_at, updated_at

### activity_logs Table
- id
- icon (material symbol name)
- user_name
- action (description)
- location
- created_at, updated_at

---

## Frontend Components

### Public-Facing
- **QuotePage** (`/quote`) - Multi-step quote request form
- **QuoteStep1-4** - Individual form steps
- **api.submitQuote()** - API service method

### Admin Dashboard
- **AdminDashboard** (`/admin`) - Main admin layout
- **QuotesTable** - Quote management table with approve/reject actions
- **KanbanBoard** - Shipment pipeline showing converted quotes
- **ActivityStream** - Shows quote submissions and approvals
- **api.getQuotes()**, **api.approveQuote()**, **api.rejectQuote()** - API service methods

---

## Complete Flow Example

1. **Customer Action:** John submits quote for 2024 Toyota Camry from USA to Lagos
2. **System:** Quote #15 created with status `pending`, activity logged
3. **Admin Action:** Admin views quotes table, sees John's request
4. **Admin Action:** Admin clicks "Approve" on quote #15
5. **System:** 
   - Quote #15 status → `converted`
   - Shipment created with tracking ID `OD-45821-AUTO`
   - Shipment appears in Kanban "Procurement" column
   - Activity: "Admin approved quote and created shipment OD-45821-AUTO for John"
6. **Result:** John can now track shipment using tracking ID OD-45821-AUTO
7. **Next Steps:** Admin can move shipment through pipeline stages (procurement → shipping → at port → clearing → delivered)

---

## Notes

- Quote submissions are automatically logged in activity stream
- Approved quotes automatically create shipments in "procurement" status
- Rejected quotes are permanently deleted (consider soft delete for audit trail)
- Tracking IDs are randomly generated 5-digit numbers (consider sequential for production)
- All admin actions are logged in activity stream for audit purposes
