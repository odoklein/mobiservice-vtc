# MobiService VTC - Quick Setup Guide

Follow these steps to get MobiService up and running quickly.

## Step 1: Database Setup (5 minutes)

### Neon Postgres

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project called "mobiservice"
3. Copy the connection string (looks like: `postgresql://user:password@host/database`)
4. Add it to your `.env.local` file as `DATABASE_URL`

### Initialize Database

```bash
npm run db:push
```

This creates all the tables automatically.

## Step 2: Stripe Setup (10 minutes)

### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Go to Developers > API Keys
3. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

### Webhook Setup (for production)

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

**For local testing**, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Step 3: Mapbox Setup (10 minutes)

### Create Account

1. Go to [mapbox.com](https://account.mapbox.com) and create a free account
2. Verify your email address

### Create Access Token

1. Navigate to [Account page](https://account.mapbox.com/access-tokens/)
2. Click "Create a token"
3. Give it a name (e.g., "MobiService Production")
4. Select the following scopes:
   - `styles:read` (for maps)
   - `geocoding:read` (for address search)
   - `directions:read` (for distance calculation)
5. Optionally, set URL restrictions for production:
   - Add your domain (e.g., `https://yourdomain.com/*`)
6. Copy the token → `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Pricing

⚠️ **Note**: Mapbox offers 50,000 free map loads per month, which is more than enough for a small VTC service. After that, it's $5 per 1,000 additional loads.

## Step 4: Environment Variables

Create `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...

# NextAuth (generate a random string)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
DRIVER_EMAIL=patrice@mobiservice.fr
DRIVER_PHONE=+33612345678
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Step 5: Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Step 6: Test the Booking Flow

1. Go to http://localhost:3000/reservation
2. Fill in addresses (will autocomplete with Mapbox)
3. Select date and time
4. Enter customer info
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

## Step 7: Deploy to Vercel (5 minutes)

### One-Click Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add all environment variables from `.env.local`
5. Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to your Vercel URL
6. Deploy!

### After Deployment

1. Update Stripe webhook URL to your production domain
2. Update Mapbox access token restrictions

## Common Issues

### Mapbox not loading
- Check access token is correct
- Verify token has required scopes (geocoding, directions)
- Check browser console for errors
- Ensure token is not expired or revoked

### Stripe checkout not working
- Verify both Stripe keys are set
- Check Stripe dashboard logs
- Test with card `4242 4242 4242 4242`

### Database connection failed
- Verify connection string format
- Check Neon dashboard for database status
- Ensure IP whitelist allows connections (Neon allows all by default)

### Build errors
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check Node version: `node -v` (needs 18+)

## Production Checklist

Before going live:

- [ ] Set up production Stripe account (not test mode)
- [ ] Configure real payment methods
- [ ] Update Stripe webhook to production URL
- [ ] Restrict Mapbox access token to your domain
- [ ] Set up email service (Resend, SendGrid)
- [ ] Add authentication to driver dashboard
- [ ] Configure custom domain in Vercel
- [ ] Test all booking flows end-to-end
- [ ] Set up monitoring (Vercel Analytics, Sentry)
- [ ] Add terms and conditions
- [ ] Add privacy policy
- [ ] Test on mobile devices

## Next Steps

1. **Customize branding**: Edit `lib/constants.ts`
2. **Add email notifications**: Integrate Resend or SendGrid
3. **Secure driver dashboard**: Add NextAuth.js
4. **Add reviews system**: Let customers leave reviews
5. **SMS notifications**: Integrate Twilio
6. **Analytics**: Add Google Analytics or Plausible

## Support

Need help? Check:
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Mapbox API Docs](https://docs.mapbox.com)

---

Good luck with your VTC service! 🚗✨

