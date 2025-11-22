# Deployment Guide - MobiService VTC

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)
- All environment variables ready

### Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit - MobiService VTC"
git branch -M main
git remote add origin https://github.com/yourusername/mobiservice.git
git push -u origin main
```

2. **Import to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Click "Import Git Repository"
- Select your GitHub repository
- Click "Import"

3. **Configure Environment Variables**

Add these in Vercel Project Settings → Environment Variables:

```
DATABASE_URL=your_neon_postgres_url
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
DRIVER_EMAIL=patrice@mobiservice.fr
DRIVER_PHONE=+33612345678
```

4. **Deploy**
- Click "Deploy"
- Wait 2-3 minutes
- Your app is live! 🎉

### Post-Deployment Configuration

#### 1. Update Stripe Webhook
- Go to Stripe Dashboard → Webhooks
- Update endpoint URL to: `https://your-domain.vercel.app/api/webhooks/stripe`
- Test the webhook

#### 2. Update Mapbox Token Restrictions
- Go to Mapbox Account → Access Tokens
- Edit your access token
- Update URL restrictions:
  - `https://your-domain.vercel.app/*`
  - `https://*.vercel.app/*` (for preview deployments)

#### 3. Test Production
- Visit your site
- Complete a test booking with Stripe test card
- Check booking appears in driver dashboard
- Verify email receipt (when implemented)

## Custom Domain Setup

### 1. Add Domain in Vercel
- Project Settings → Domains
- Add your domain (e.g., `mobiservice.fr`)
- Follow DNS configuration instructions

### 2. Update DNS
Add these records to your domain registrar:

**For apex domain (mobiservice.fr):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Update Environment Variables
```
NEXTAUTH_URL=https://mobiservice.fr
NEXT_PUBLIC_APP_URL=https://mobiservice.fr
```

### 4. SSL/HTTPS
Vercel automatically provisions SSL certificates. Usually takes 5-10 minutes.

## Production Checklist

### Before Launch
- [ ] Switch Stripe to production mode (not test)
- [ ] Update all environment variables to production values
- [ ] Test complete booking flow on production
- [ ] Verify Mapbox works
- [ ] Test Stripe payments with real card
- [ ] Check mobile responsiveness
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Verify emails are being sent
- [ ] Test driver dashboard functionality
- [ ] Add Google Analytics or similar
- [ ] Set up error monitoring (Sentry)

### Legal Requirements (France)
- [ ] Add mentions légales (legal notice)
- [ ] Add politique de confidentialité (privacy policy)
- [ ] Add CGV/CGU (terms and conditions)
- [ ] Ensure RGPD compliance
- [ ] Display company information (SIRET, etc.)

### SEO Setup
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google My Business
- [ ] Add schema.org markup for local business
- [ ] Optimize meta descriptions
- [ ] Add Open Graph images

## Monitoring & Maintenance

### Analytics
Add to `app/layout.tsx`:
```typescript
// Google Analytics
<Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
```

### Error Tracking
Install Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Performance Monitoring
Vercel provides built-in analytics:
- Enable in Project Settings → Analytics
- Monitor Core Web Vitals
- Track page load times

## Scaling Considerations

### Database
- Neon free tier: 0.5 GB storage
- Upgrade to Pro when needed: ~$19/month
- Set up automated backups

### Stripe
- Monitor transaction volume
- Plan for Stripe fees: 1.5% + €0.25 per transaction (EU)

### Mapbox API
- Free tier: 50,000 map loads/month
- Typical usage: ~5-10 bookings/day = well within free tier
- Monitor usage in Mapbox dashboard

### Serverless Functions
- Vercel free tier: 100 GB-hours/month
- More than sufficient for small VTC service
- Upgrade to Pro if needed: $20/month

## Backup Strategy

### Database Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Automated Backups
- Neon Pro includes automated backups
- Alternatively, use GitHub Actions for scheduled backups

### Code Repository
- Always keep GitHub as source of truth
- Tag releases: `git tag v1.0.0`

## Rollback Procedure

If deployment fails:

1. **Via Vercel Dashboard**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via Git**
   ```bash
   git revert HEAD
   git push
   ```

## Support & Troubleshooting

### Common Production Issues

**Issue: Booking not saving**
- Check Vercel function logs
- Verify DATABASE_URL is correct
- Check Neon database connection limit

**Issue: Payment not processing**
- Verify Stripe webhook is configured
- Check Stripe logs
- Ensure webhook secret is correct

**Issue: Maps not loading**
- Check access token restrictions
- Verify token has required scopes
- Check browser console for errors

### Debug Tools
- Vercel Logs: `vercel logs`
- Database: Neon dashboard
- Payments: Stripe dashboard
- Maps: Mapbox Dashboard

## Costs Breakdown (Monthly)

**Free Tier:**
- Vercel: Free
- Neon: Free
- Mapbox: $0 (with free tier)
- **Total: €0/month**

**Small Business (~100 bookings/month):**
- Vercel: Free
- Neon: €0
- Mapbox: ~€0-5
- Stripe fees: ~€50 (on €2000 revenue)
- **Total: €65/month**

**Growing Business (Custom Domain):**
- Vercel Pro: €18/month
- Neon Pro: €17/month
- Mapbox: ~€0-10
- Domain: €12/year
- **Total: €61/month**

## Next Steps After Deployment

1. **Marketing**
   - Create social media profiles
   - Set up Google My Business
   - Local SEO optimization

2. **Features**
   - Add email notifications
   - Implement SMS alerts
   - Add customer reviews
   - Create loyalty program

3. **Optimization**
   - Add caching for static pages
   - Optimize images
   - Set up CDN

4. **Security**
   - Add rate limiting
   - Implement CAPTCHA on forms
   - Set up CSP headers

---

Congratulations on deploying MobiService! 🚀

For questions or issues, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Stripe Documentation](https://stripe.com/docs)

