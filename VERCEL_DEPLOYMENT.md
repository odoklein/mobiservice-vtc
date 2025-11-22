# Vercel Deployment Guide - MobiService VTC

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- All environment variables ready

---

## Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Step 2: Deploy on Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your `mobiservice` repository
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   
   Click **"Environment Variables"** and add all of these:

   ```
   DATABASE_URL=your_neon_postgres_url
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   STRIPE_WEBHOOK_SECRET=whsec_... (optional, for webhooks)
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...
   NEXTAUTH_URL=https://your-app.vercel.app (update after first deploy)
   NEXTAUTH_SECRET=your_random_secret_here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app (update after first deploy)
   DRIVER_EMAIL=patrice@mobiservice.fr
   DRIVER_PHONE=+33612345678
   ```

   **Note**: For `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`, use a placeholder first, then update after the first deployment with your actual Vercel URL.

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-app.vercel.app` 🎉

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
   # ... add all other variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Step 3: Post-Deployment Configuration

### 1. Update Environment Variables

After the first deployment, update these variables with your actual Vercel URL:

1. Go to **Project Settings** → **Environment Variables**
2. Update:
   - `NEXTAUTH_URL` → `https://your-app.vercel.app`
   - `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app`
3. **Redeploy** (or wait for auto-deploy on next push)

### 2. Stripe Webhook Setup (If using Stripe in future)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
5. Copy the **Signing secret** → Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Mapbox Token Restrictions

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Edit your access token
3. Add URL restrictions:
   - `https://your-app.vercel.app/*`
   - `https://*.vercel.app/*` (for preview deployments)

### 4. Database Migration

If you haven't run migrations on your production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"
npm run db:push
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
# Then run db:push
```

---

## 🔧 Vercel Configuration

Your project already has a `vercel.json` file. Vercel will automatically:
- Detect Next.js framework
- Use the correct build settings
- Set up serverless functions for API routes
- Enable ISR (Incremental Static Regeneration)
- Provide SSL/HTTPS automatically

---

## 📊 Features

### Automatic Deployments
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches or pull requests
- **Instant Rollbacks**: One-click rollback to previous deployments

### Performance
- **Edge Network**: Global CDN for fast loading
- **Serverless Functions**: Automatic scaling for API routes
- **Image Optimization**: Automatic Next.js Image optimization
- **Analytics**: Built-in performance monitoring

---

## 🧪 Testing Production

### Test Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Booking form loads
- [ ] Address autocomplete works (Mapbox)
- [ ] Price calculation works
- [ ] Mock payment flow works
- [ ] Success page displays
- [ ] Booking appears in database
- [ ] Driver dashboard accessible (if implemented)

---

## 🔄 Continuous Deployment

Vercel automatically:
- Deploys on every push to `main`
- Creates preview deployments for branches/PRs
- Runs build checks before deploying
- Provides deployment URLs for each commit

### Manual Deployment

You can also trigger deployments manually:
- Via Vercel Dashboard → **Deployments** → **Redeploy**
- Via Vercel CLI: `vercel --prod`

---

## 🐛 Troubleshooting

### Build Fails

1. **Check Build Logs**
   - Go to Vercel Dashboard → **Deployments** → Click on failed deployment
   - Review error messages

2. **Common Issues**:
   - Missing environment variables
   - TypeScript errors (currently disabled in `next.config.ts`)
   - Missing dependencies
   - Database connection issues

### API Routes Not Working

- Verify API routes are in `app/api/` directory
- Check serverless function logs in Vercel Dashboard
- Ensure environment variables are set correctly

### Environment Variables Not Loading

- Variables must start with `NEXT_PUBLIC_` to be available in browser
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Mapbox Not Loading

- Verify token is set correctly
- Check token has required scopes
- Verify URL restrictions allow your Vercel domain
- Check browser console for errors

---

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://...` |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox API token | `pk.ey...` |
| `NEXTAUTH_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `DRIVER_EMAIL` | Driver contact email | `patrice@mobiservice.fr` |
| `DRIVER_PHONE` | Driver contact phone | `+33612345678` |

### Optional Variables (For Future Stripe Integration)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## 🎯 Next Steps

1. **Custom Domain** (Optional)
   - Go to Project Settings → **Domains**
   - Add your custom domain (e.g., `mobiservice.fr`)
   - Follow DNS configuration instructions

2. **Enable Analytics**
   - Go to Project Settings → **Analytics**
   - Enable Vercel Analytics for performance monitoring

3. **Set Up Monitoring**
   - Configure error tracking (e.g., Sentry)
   - Set up uptime monitoring
   - Configure alerts

---

## 🆘 Need Help?

- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Support](https://vercel.com/support)

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] All environment variables prepared
- [ ] Database is set up and migrated
- [ ] Build passes locally (`npm run build`)
- [ ] No TypeScript/ESLint errors (or disabled in config)

After deploying:
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Test all pages and features
- [ ] Verify API routes work
- [ ] Check database connections
- [ ] Test booking flow end-to-end
- [ ] Update Mapbox token restrictions
- [ ] Set up Stripe webhook (if using Stripe)

---

**Ready to deploy?** Follow the steps above and your app will be live in minutes! 🚀

