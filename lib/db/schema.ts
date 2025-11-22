import { pgTable, text, serial, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

// Users table (customers and driver)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('customer'), // 'customer' or 'driver'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  
  // Guest booking info (if no account)
  guestName: text('guest_name'),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  
  // Trip details
  pickupAddress: text('pickup_address').notNull(),
  pickupLat: decimal('pickup_lat', { precision: 10, scale: 7 }),
  pickupLng: decimal('pickup_lng', { precision: 10, scale: 7 }),
  
  dropoffAddress: text('dropoff_address').notNull(),
  dropoffLat: decimal('dropoff_lat', { precision: 10, scale: 7 }),
  dropoffLng: decimal('dropoff_lng', { precision: 10, scale: 7 }),
  
  pickupDate: timestamp('pickup_date').notNull(),
  pickupTime: text('pickup_time').notNull(),
  
  passengers: integer('passengers').notNull().default(1),
  luggage: integer('luggage').notNull().default(0),
  
  // Service type
  serviceType: text('service_type').notNull(), // 'transfer', 'hourly', 'airport', etc.
  
  // Pricing
  distance: decimal('distance', { precision: 10, scale: 2 }), // in km
  duration: integer('duration'), // in minutes
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  
  // Special requests
  notes: text('notes'),
  specialRequests: jsonb('special_requests'),
  
  // Status
  status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'refunded'
  
  // Stripe
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id),
  userId: integer('user_id').references(() => users.id),
  
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  
  // Display info for anonymous reviews
  reviewerName: text('reviewer_name').notNull(),
  
  isPublished: boolean('is_published').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Availability settings for driver
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
});

// Pricing rules
export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  serviceType: text('service_type').notNull(),
  baseFare: decimal('base_fare', { precision: 10, scale: 2 }).notNull(),
  perKm: decimal('per_km', { precision: 10, scale: 2 }),
  perMinute: decimal('per_minute', { precision: 10, scale: 2 }),
  perHour: decimal('per_hour', { precision: 10, scale: 2 }),
  minPrice: decimal('min_price', { precision: 10, scale: 2 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;

export type PricingRule = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;

