# 🚀 Quick Vercel Deployment

## Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 2: Deploy on Vercel

### Via Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Select your `mobiservice` repository
4. Click **"Import"**

### Add Environment Variables

In the deployment setup, add these environment variables:

**Required:**
- `DATABASE_URL` - Your Neon Postgres URL
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Your Mapbox token
- `NEXTAUTH_URL` - `https://your-app.vercel.app` (update after first deploy)
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL` - `https://your-app.vercel.app` (update after first deploy)
- `DRIVER_EMAIL` - `patrice@mobiservice.fr`
- `DRIVER_PHONE` - `+33612345678`

**Optional (for future Stripe):**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Your app is live! 🎉

## Step 3: Update URLs After First Deploy

1. Copy your Vercel URL (e.g., `https://mobiservice-xyz.vercel.app`)
2. Go to **Project Settings** → **Environment Variables**
3. Update:
   - `NEXTAUTH_URL` → Your Vercel URL
   - `NEXT_PUBLIC_APP_URL` → Your Vercel URL
4. **Redeploy** (or it will auto-deploy on next push)

## Done! ✅

Your app is now live on Vercel with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments for branches
- ✅ Automatic deployments on push

---

**Need more details?** See `VERCEL_DEPLOYMENT.md` for complete guide.

