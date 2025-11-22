# Netlify Deployment Checklist - MobiService VTC

## ✅ Pre-Deployment Checklist

### 1. **Test Local Build** ⚠️ CRITICAL
```bash
npm run build
npm run start
```
- Visit `http://localhost:3000` and test all pages
- Verify booking flow works
- Check that API routes respond correctly
- Fix any build errors before deploying

### 2. **Environment Variables Checklist**

Prepare all these variables for Netlify:

#### Database
- [ ] `DATABASE_URL` - Your Neon Postgres connection string

#### Stripe (Production Keys)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Use `pk_live_...` for production
- [ ] `STRIPE_SECRET_KEY` - Use `sk_live_...` for production
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (get after setting up webhook)

#### Mapbox
- [ ] `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Your Mapbox access token

#### NextAuth (if using)
- [ ] `NEXTAUTH_URL` - Will be `https://your-site.netlify.app` (update after first deploy)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` - Will be `https://your-site.netlify.app` (update after first deploy)
- [ ] `DRIVER_EMAIL` - patrice@mobiservice.fr
- [ ] `DRIVER_PHONE` - +33612345678

### 3. **Install Netlify Next.js Plugin**

The `netlify.toml` file is already configured, but make sure the plugin is installed:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

### 4. **Verify Git Repository**
```bash
git status
git add .
git commit -m "Prepare for Netlify deployment"
git push
```

### 5. **Check for Sensitive Data**
- [ ] No API keys in code
- [ ] No database URLs in code
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to Git

---

## 🚀 Deployment Steps

### Step 1: Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your `mobiservice` repository

### Step 2: Configure Build Settings

Netlify should auto-detect Next.js, but verify:
- **Build command**: `npm run build`
- **Publish directory**: `.next` (or leave empty, plugin handles it)
- **Node version**: 18 (set in netlify.toml)

### Step 3: Add Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

Add ALL variables from the checklist above.

**Important**: 
- For `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`, use a placeholder first: `https://your-site-name.netlify.app`
- You'll update these after the first deployment with your actual URL

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait 3-5 minutes for build to complete
3. Note your site URL (e.g., `https://mobiservice-xyz.netlify.app`)

### Step 5: Update Environment Variables

After first deployment, update:
- `NEXTAUTH_URL` → Your actual Netlify URL
- `NEXT_PUBLIC_APP_URL` → Your actual Netlify URL

Then trigger a new deployment (or wait for auto-deploy on next push).

---

## 🔧 Post-Deployment Configuration

### 1. **Stripe Webhook Setup**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-site.netlify.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
5. Copy the **Signing secret** → Update `STRIPE_WEBHOOK_SECRET` in Netlify
6. Test the webhook

### 2. **Mapbox Token Restrictions**

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Edit your access token
3. Add URL restrictions:
   - `https://your-site.netlify.app/*`
   - `https://*.netlify.app/*` (for branch previews)

### 3. **Custom Domain (Optional)**

1. Netlify Dashboard → Site Settings → Domain management
2. Add your custom domain (e.g., `mobiservice.fr`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

### 4. **Database Migration**

If you haven't run migrations on production database:
```bash
# Set DATABASE_URL to production database
export DATABASE_URL="your_production_database_url"
npm run db:push
```

Or use Netlify CLI:
```bash
netlify env:get DATABASE_URL
# Then run db:push with that URL
```

---

## 🧪 Testing Production

### Test Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Booking form loads
- [ ] Address autocomplete works (Mapbox)
- [ ] Price calculation works
- [ ] Stripe checkout redirects correctly
- [ ] Webhook receives events (check Stripe Dashboard)
- [ ] Booking appears in database
- [ ] Driver dashboard accessible (if implemented)

### Test Stripe Payment

Use Stripe test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Netlify Dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies
   - Node version mismatch

### API Routes Not Working

- Verify `@netlify/plugin-nextjs` is installed
- Check `netlify.toml` configuration
- Ensure API routes are in `app/api/` directory

### Environment Variables Not Loading

- Variables must start with `NEXT_PUBLIC_` to be available in browser
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Mapbox Not Loading

- Verify token is set correctly
- Check token has required scopes
- Verify URL restrictions allow your Netlify domain
- Check browser console for errors

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Test webhook in Stripe Dashboard
- Check Netlify function logs

---

## 📊 Monitoring

### Netlify Analytics

Enable in Site Settings → Analytics to track:
- Page views
- Build times
- Function execution times

### Stripe Dashboard

Monitor:
- Successful payments
- Failed payments
- Webhook events
- Customer activity

---

## 🔄 Continuous Deployment

Netlify automatically deploys on:
- Push to main branch
- Pull requests (creates preview deployments)

To disable auto-deploy:
- Site Settings → Build & deploy → Stop auto publishing

---

## 📝 Notes

- **Next.js 15** on Netlify requires the `@netlify/plugin-nextjs` plugin
- Serverless functions are automatically created for API routes
- Static pages are pre-rendered at build time
- ISR (Incremental Static Regeneration) is supported
- Edge functions are supported for better performance

---

## 🆘 Need Help?

- [Netlify Docs](https://docs.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Netlify Support](https://www.netlify.com/support/)

