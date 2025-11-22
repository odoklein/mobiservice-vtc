# 🚀 Pre-Deployment Checklist for Netlify

## ⚠️ CRITICAL: Fix Build Errors First

Before deploying, you MUST fix these build errors:

### 1. ✅ Fixed: Next.js 15 Route Params
- Updated `app/api/driver/bookings/[id]/status/route.ts` to use async params
- Next.js 15 requires `params` to be a Promise

### 2. ✅ Fixed: ESLint Config
- Updated `eslint.config.mjs` import paths

### 3. ✅ Added: Netlify Plugin
- Added `@netlify/plugin-nextjs` to devDependencies

---

## 📋 Pre-Deployment Checklist

### Build & Test Locally
- [ ] Run `npm run build` - **MUST SUCCEED**
- [ ] Run `npm run start` and test all pages
- [ ] Test booking flow end-to-end
- [ ] Verify API routes work
- [ ] Check for console errors

### Environment Variables Preparation

Gather all these values before deploying:

#### Database
- [ ] `DATABASE_URL` - Production Neon Postgres URL

#### Stripe (Switch to LIVE keys!)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - `pk_live_...` (NOT test key)
- [ ] `STRIPE_SECRET_KEY` - `sk_live_...` (NOT test key)
- [ ] `STRIPE_WEBHOOK_SECRET` - Get after setting up webhook

#### Mapbox
- [ ] `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Your access token

#### NextAuth
- [ ] `NEXTAUTH_URL` - `https://your-site.netlify.app` (update after deploy)
- [ ] `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` - `https://your-site.netlify.app` (update after deploy)
- [ ] `DRIVER_EMAIL` - patrice@mobiservice.fr
- [ ] `DRIVER_PHONE` - +33612345678

### Code Quality
- [ ] No console.logs in production code
- [ ] No TODO comments for critical features
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved

### Security
- [ ] No API keys in code
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to Git
- [ ] Database connection uses SSL

### Git
- [ ] All changes committed
- [ ] Code pushed to repository
- [ ] `.env.local` NOT committed

### Dependencies
- [ ] Run `npm install` to ensure all packages are installed
- [ ] `@netlify/plugin-nextjs` is in devDependencies

---

## 🚀 Quick Deploy Steps

1. **Install Netlify Plugin** (if not done):
   ```bash
   npm install --save-dev @netlify/plugin-nextjs
   ```

2. **Test Build**:
   ```bash
   npm run build
   ```

3. **Push to Git**:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push
   ```

4. **Deploy on Netlify**:
   - Go to netlify.com
   - Import your Git repository
   - Add all environment variables
   - Deploy!

5. **Post-Deploy**:
   - Update Stripe webhook URL
   - Update Mapbox token restrictions
   - Test production site

---

## 📝 Important Notes

- **Stripe**: Use LIVE keys for production, not test keys!
- **Mapbox**: Update token URL restrictions after deployment
- **Database**: Ensure production database is set up and migrated
- **Webhooks**: Stripe webhook must be configured AFTER deployment

See `NETLIFY_DEPLOYMENT.md` for detailed deployment instructions.

