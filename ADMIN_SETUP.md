# Admin Panel Setup Guide

## Overview
This admin panel provides complete booking management, email notifications with OTP verification, PDF document generation, and working hours management.

## Features Implemented

### 1. Authentication
- Secure admin login with bcrypt password hashing
- JWT-based session management
- Protected routes with middleware

### 2. Admin Dashboard  
- Stats overview (bookings, revenue, pending items)
- Recent bookings list
- Quick actions

### 3. Booking Management
- List all bookings with search and filters
- View detailed booking information
- Manual payment confirmation for cash bookings
- Generate PDF documents (bon de commande, facture)

### 4. Email & OTP System
- Automatic confirmation emails on booking
- 6-digit OTP with 10-minute expiry
- Email verification endpoint

### 5. PDF Generation
- Bon de commande (purchase order)
- Facture (invoice) with VAT
- Stored in `/public/documents/bookings/`

### 6. Working Hours Management
- Configure operating hours per day
- Enable/disable specific days
- Exception days for holidays

## Setup Instructions

### 1. Database Migration

Run Drizzle migration to create new tables:

```bash
npm run db:push
```

This will create:
- `admin_users`
- `otp_verifications`
- `working_hours`
- `exceptions`

And update the `bookings` table with new fields.

### 2. Create First Admin User

You need to create the first admin user manually. First, generate a password hash:

```typescript
// Run this in a Node.js REPL or create a temporary script
import { hashPassword } from './lib/auth/admin';

const hash = await hashPassword('your-secure-password');
console.log(hash);
```

Then insert into database:

```sql
INSERT INTO admin_users (email, password_hash, name, created_at, updated_at)
VALUES (
  'admin@mobiservice-vtc.com',
  'YOUR_HASHED_PASSWORD_HERE',
  'Admin',
  NOW(),
  NOW()
);
```

### 3. Environment Variables

Add to your `.env.local`:

```env
# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-secret-key-min-32-chars-long-replace-this

# Resend Email API
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Database (already configured)
DATABASE_URL=postgresql://...
```

### 4. Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their testing domain
3. Get your API key from the dashboard  
4. Add to `.env.local`

### 5. Access Admin Panel

1. Start the development server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000/admin/login`

3. Login with the credentials you created

## File Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard
│   ├── login/page.tsx          # Login page
│   ├── bookings/
│   │   ├── page.tsx            # Bookings list
│   │   └── [id]/page.tsx       # Booking details
│   └── settings/
│       └── working-hours/page.tsx
├── api/
│   ├── admin/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── bookings/
│   │   │   ├── route.ts        # List bookings
│   │   │   └── [id]/
│   │   │       ├── route.ts    # Get/update booking
│   │   │       ├── confirm-payment/route.ts
│   │   │       └── generate-pdf/route.ts
│   │   └── settings/
│   │       └── working-hours/route.ts
│   └── bookings/
│       └── confirm/route.ts     # Email/OTP confirmation
└── booking-confirmed/page.tsx   # Success page

lib/
├── auth/
│   └── admin.ts                 # Auth utilities
├── email/
│   ├── resend.ts               # Email client
│   ├── otp.ts                  # OTP functions
│   └── templates/
│       └── booking-confirmation.tsx
├── pdf/
│   └── generator.ts            # PDF generation
├── utils/
│   └── availability.ts         # Working hours checks
└── db/
    └── schema.ts               # Database schema

middleware.ts                    # Route protection
```

## Usage

### Admin Dashboard
- **Login**: `/admin/login`
- **Dashboard**: `/admin`
- **Bookings**: `/admin/bookings`
- **Booking Detail**: `/admin/bookings/[id]`
- **Working Hours**: `/admin/settings/working-hours`

### Key Actions

**Confirm Cash Payment:**
1. Go to booking detail page
2. Click "Confirmer le paiement"
3. System updates `paymentStatus` to 'paid'

**Generate Documents:**
1. View booking details
2. Click "Bon de commande" or "Générer facture"
3. PDF opens in new tab

**Configure Hours:**
1. Go to `/admin/settings/working-hours`
2. Toggle days on/off
3. Set start/end times
4. Click "Enregistrer"

## Email Flow

1. User creates booking
2. System generates 6-digit OTP
3. Confirmation email sent with OTP and link
4. User clicks link or enters OTP
5. Booking marked as confirmed
6. Status updated to 'confirmed'

## Security Notes

- All admin routes protected by JWT middleware
- Passwords hashed with bcrypt (10 rounds)
- OTP expires after 10 minutes
- httpOnly cookies for session management

## Production Considerations

1. **PDF Storage**: Move from `/public` to private cloud storage (S3, Vercel Blob)
2. **Email Templates**: Test thoroughly with real email addresses
3. **OTP Cleanup**: Set up cron job to call `cleanExpiredOTPs()`
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **HTTPS**: Ensure all traffic uses HTTPS
6. **Backup**: Regular database backups
7. **Monitoring**: Add error tracking (Sentry, etc.)

## Troubleshooting

**Login fails:**
- Check password hash is correct
- Verify JWT_SECRET is set
- Check browser cookies enabled

**Emails not sending:**
- Verify RESEND_API_KEY is valid
- Check domain is verified in Resend
- Check server logs for errors

**PDFs not generating:**
- Ensure `/public/documents/bookings/` directory exists
- Check file permissions
- Review server logs

## Next Steps

- [ ] Add multi-admin support
- [ ] Implement audit logging
- [ ] Add SMS notifications
- [ ] Create booking reports/analytics
- [ ] Add booking conflicts detection
- [ ] Implement real PDF generation with Puppeteer

## Support

For issues or questions, refer to the implementation plan in `implementation_plan.md`.
