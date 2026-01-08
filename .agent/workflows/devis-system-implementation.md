---
description: Implementation Plan - Devis (Quote) System with Approval Workflow
---

# Implementation Plan: Devis (Quote) System

## Overview
Transform the current booking system into a quotation-based workflow where customers receive a devis (quote) that can be:
- Accepted or Refused by the customer
- Commented on by the customer
- Modified by the driver with discounts (5%, 8%, or 12%)
- Approved/Rejected by the driver

## Current Progress ✅

### Phase 1: Database & Backend (COMPLETED)
1. ✅ Updated `schema.ts` to add:
   - `discountPercentage` field (5, 8, 12)
   - `discountAmount` field
   - `customerComment` field
   
2. ✅ Modified booking creation API (`/api/bookings/route.ts`):
   - Changed initial status from `pending` to `quote_sent`
   - Updated email notifications to reflect "Devis" terminology
   
3. ✅ Updated OTP verification (`/api/bookings/verify-otp/route.ts`):
   - Changed status to `quote_sent` after verification
   - Updated email to send quote link instead of booking confirmation
   - Redirect to `/quote/{bookingId}` instead of success page

4. ✅ Updated reservation page UI:
   - Changed "Réservation" to "Devis" terminology
   - Updated button texts to "Demander mon devis"

## Remaining Work 🚧

### Phase 2: Quote Management Page (PRIORITY)

#### Step 1: Create Quote Detail Page
**File**: `app/(public)/quote/[id]/page.tsx`

Create a customer-facing quote page with:
- Quote details display (similar to uploaded image style)
- Trip information (pickup, dropoff, date, time)
- Price breakdown (HT, TVA, TTC)
- Current status indicator
- Action buttons based on status:
  - **If `quote_sent`**: Accept / Refuse / Add Comment
  - **If `quote_accepted`**: Show "Accepted" status
  - **If `quote_refused`**: Show "Refused" status
  - **If `quote_modified`**: Show new price with discount applied

**Design Requirements**:
- Clean, professional layout matching the uploaded "BON DE RÉSERVATION" style
- Show company info (MobiService VTC)
- Display legal references (Billet Collectif, Ordre de Mission)
- Show driver info
- Clear pricing with discount if applied
- Comment section for customer feedback

#### Step 2: Create Quote API Endpoints

**File**: `app/api/quote/[id]/route.ts`
```typescript
GET /api/quote/[id]
- Fetch quote details by ID
- Return booking data with status

POST /api/quote/[id]/accept
- Update status to 'quote_accepted'
- Send confirmation email to customer
- Notify driver

POST /api/quote/[id]/refuse
- Update status to 'quote_refused'
- Send notification to driver
- Optional: Ask for refusal reason

POST /api/quote/[id]/comment
- Save customer comment
- Notify driver of new comment
```

### Phase 3: Admin/Driver Dashboard Updates

#### Step 1: Update Admin Bookings List
**File**: `app/admin/bookings/page.tsx`

Add status filters:
- Quote Sent (quote_sent)
- Quote Accepted (quote_accepted)
- Quote Refused (quote_refused)
- Quote Modified (quote_modified)
- Confirmed (confirmed)

#### Step 2: Create Quote Management Interface
**File**: `app/admin/bookings/[id]/page.tsx`

Add driver actions:
- View customer comments
- Apply discount dropdown (5%, 8%, 12%)
- Recalculate price with discount
- Send modified quote to customer
- Approve quote → Convert to confirmed booking
- Reject quote with reason

**File**: `app/api/admin/bookings/[id]/apply-discount/route.ts`
```typescript
POST /api/admin/bookings/[id]/apply-discount
- Calculate new price with discount
- Update discountPercentage and discountAmount
- Update totalPriceTTC
- Change status to 'quote_modified'
- Send email to customer with new quote
```

### Phase 4: Email Templates

#### Template 1: Quote Sent (COMPLETED ✅)
- Subject: "📄 Votre Devis - MobiService VTC"
- Link to quote page
- Estimated price

#### Template 2: Quote Modified with Discount
**File**: `lib/email/templates/quote-modified.tsx`
- Subject: "🎉 Votre Devis Modifié - Remise Appliquée"
- Show original price
- Show discount percentage
- Show new price
- Link to accept/refuse

#### Template 3: Quote Accepted
**File**: `lib/email/templates/quote-accepted.tsx`
- Subject: "✅ Devis Accepté - Réservation Confirmée"
- Confirmation details
- Payment instructions
- Driver contact info

#### Template 4: Quote Refused
**File**: `lib/email/templates/quote-refused.tsx`
- Subject: "Devis Refusé - Merci de votre intérêt"
- Thank you message
- Invitation to request new quote

### Phase 5: Database Migration

Create migration file to add new columns:
```sql
-- Add discount and comment fields
ALTER TABLE bookings 
ADD COLUMN discount_percentage INTEGER,
ADD COLUMN discount_amount DECIMAL(10, 2),
ADD COLUMN customer_comment TEXT;

-- Update existing bookings status if needed
UPDATE bookings 
SET status = 'quote_sent' 
WHERE status = 'pending' AND otp_verified = true;
```

### Phase 6: Status Flow Diagram

```
Customer Request → quote_sent
                     ↓
         ┌───────────┴───────────┐
         ↓                       ↓
    Customer Accept         Customer Refuse
         ↓                       ↓
    quote_accepted         quote_refused
         ↓                       
    Driver Review               
         ↓                       
    ┌────┴────┐                 
    ↓         ↓                 
  Approve   Apply Discount      
    ↓         ↓                 
confirmed  quote_modified       
              ↓                 
         (back to customer)     
```

### Phase 7: UI Components to Create

1. **QuoteStatusBadge** (`components/quote/status-badge.tsx`)
   - Color-coded status indicators
   - Icons for each status

2. **QuoteActions** (`components/quote/quote-actions.tsx`)
   - Accept/Refuse buttons
   - Comment form
   - Conditional rendering based on status

3. **DiscountSelector** (`components/admin/discount-selector.tsx`)
   - Dropdown with 5%, 8%, 12% options
   - Price preview with discount
   - Apply button

4. **QuotePriceBreakdown** (`components/quote/price-breakdown.tsx`)
   - Original price
   - Discount (if applied)
   - Final price
   - TVA breakdown

## Implementation Order (Recommended)

1. ✅ Database schema updates (DONE)
2. ✅ Backend API updates (DONE)
3. ✅ Reservation page terminology (DONE)
4. 🚧 Create Quote Detail Page (`/quote/[id]`)
5. 🚧 Create Quote API endpoints
6. 🚧 Update Admin Dashboard
7. 🚧 Add Discount functionality
8. 🚧 Create Email Templates
9. 🚧 Run database migration
10. 🚧 Testing & Validation

## Testing Checklist

- [ ] Customer can request a quote
- [ ] Customer receives quote email with link
- [ ] Customer can view quote details
- [ ] Customer can accept quote
- [ ] Customer can refuse quote
- [ ] Customer can add comments
- [ ] Driver can see quote requests
- [ ] Driver can apply 5% discount
- [ ] Driver can apply 8% discount
- [ ] Driver can apply 12% discount
- [ ] Modified quote email sent correctly
- [ ] Customer can accept modified quote
- [ ] Quote converts to confirmed booking
- [ ] All emails are sent correctly

## Notes

- Keep existing booking flow for backward compatibility
- Ensure all prices recalculate correctly with discounts
- Add validation to prevent negative prices
- Log all status changes for audit trail
- Consider adding expiration date to quotes (e.g., 5 days)
