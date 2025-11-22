# MobiService VTC - Premium Driver Booking Platform

A modern, full-stack web application for booking a premium VTC (private driver) service in Lyon, France.

## 🚀 Features

### Customer-Facing
- **Marketing Website**: Beautiful landing page showcasing the service, driver, and vehicle
- **30-Second Booking**: Fast and intuitive booking flow with Google Maps integration
- **Real-time Pricing**: Automatic price calculation based on distance and service type
- **Secure Payments**: Stripe integration for safe online payments
- **Booking Management**: Customer portal to view and manage reservations

### Driver Dashboard
- **Real-time Bookings**: View all bookings with status tracking
- **Daily Schedule**: See today's trips at a glance
- **Status Management**: Accept, start, and complete trips
- **Navigation**: Direct integration with Google Maps for directions
- **Customer Info**: Access to customer contact information

## 🛠️ Tech Stack

- **Frontend**: Next.js 13 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS 3.3, shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Backend**: Next.js API Routes (serverless)
- **Database**: Drizzle ORM + Neon Postgres
- **Authentication**: NextAuth.js (optional)
- **Payments**: Stripe Checkout
- **Maps**: Mapbox (Geocoding, Directions)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- A Neon Postgres database account
- Stripe account for payments
- Mapbox account for Maps API
- Vercel account for deployment (optional)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd mobiservice
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=your_neon_postgres_url_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# NextAuth (optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
DRIVER_EMAIL=patrice@mobiservice.fr
DRIVER_PHONE=+33612345678
```postgresql://neondb_owner:npg_zTh32CfSRuBN@ep-still-resonance-adqs2wzo-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

4. **Set up the database**

Generate and run migrations:
```bash
npm run db:generate
npm run db:push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📝 Database Setup

### Neon Postgres

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in `.env.local`

### Initialize Tables

```bash
npm run db:push
```

## 💳 Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 🗺️ Mapbox Setup

1. Create a free account at [mapbox.com](https://account.mapbox.com)
2. Navigate to your [Account page](https://account.mapbox.com/access-tokens/)
3. Create a new access token with the following scopes:
   - `styles:read` (for maps)
   - `geocoding:read` (for address search)
   - `directions:read` (for distance calculation)
4. Optionally, set URL restrictions for production
5. Add the access token to `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env.local`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables
4. Deploy!

Vercel will automatically:
- Build the Next.js app
- Deploy serverless functions
- Set up SSL/HTTPS
- Provide a production URL

### Environment Variables on Vercel

Add all the variables from `.env.local` to your Vercel project settings.

## 📱 Pages Structure

### Public Pages
- `/` - Home page
- `/services` - Services listing
- `/tarifs` - Pricing information
- `/driver` - About the driver (Patrice)
- `/contact` - Contact form
- `/reservation` - Booking flow
- `/reservation/success` - Booking confirmation

### Customer App
- `/app` - Customer portal (booking history)

### Driver Dashboard
- `/driver` - Driver dashboard (requires auth in production)

## 🎨 Customization

### Branding
Update constants in `lib/constants.ts`:
- Brand name and tagline
- Driver information
- Vehicle details
- Services and pricing

### Styling
Customize colors in `app/globals.css` and `tailwind.config.ts`.

### Email Templates
Add email sending service (e.g., Resend, SendGrid) for:
- Booking confirmations
- Driver notifications
- Receipts

## 🔒 Security Notes

- The driver dashboard currently has no authentication
- In production, implement NextAuth.js or similar
- Protect driver API routes with authentication
- Use environment variables for all secrets
- Enable Stripe webhook signature verification

## 📊 Database Schema

The app uses the following main tables:
- `users` - Customer and driver accounts
- `bookings` - All reservations
- `reviews` - Customer reviews
- `availability` - Driver availability schedule
- `pricing_rules` - Dynamic pricing configuration

## 🧪 Testing

Run tests (when implemented):
```bash
npm run test
```

## 📄 License

This project is private and proprietary.

## 🤝 Support

For support, email patrice@mobiservice.fr or visit our contact page.

## 🗓️ Roadmap

- [ ] Add NextAuth.js authentication
- [ ] Implement email notifications (Resend)
- [ ] Add SMS notifications (Twilio)
- [ ] Create admin panel for pricing management
- [ ] Add review system for customers
- [ ] Implement recurring bookings
- [ ] Add promotional codes/discounts
- [ ] Multi-language support (EN, IT)
- [ ] Mobile apps (React Native)

---

Built with ❤️ in Lyon, France
