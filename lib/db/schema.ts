import { pgTable, text, serial, timestamp, integer, decimal, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

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

// Admin users table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
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
  serviceType: text('service_type').notNull(), // 'transfer', 'hourly', 'airport', 'business', 'mda'
  tripType: text('trip_type').notNull().default('one-way'), // 'one-way' or 'round-trip'

  // Trip metrics
  distance: decimal('distance', { precision: 10, scale: 2 }), // in km (legacy)
  duration: integer('duration'), // in minutes
  hours: integer('hours'), // for hourly/forfait bookings

  // 3-segment distances (CA/TP system)
  distanceCA: decimal('distance_ca', { precision: 10, scale: 2 }), // Depot → Pickup (km)
  distanceTP: decimal('distance_tp', { precision: 10, scale: 2 }), // Pickup → Dropoff (km)
  distanceReturn: decimal('distance_return', { precision: 10, scale: 2 }), // Dropoff → Depot (km)

  // Pricing - 2025/2026 Tariff Grid
  isNightRate: boolean('is_night_rate').notNull().default(false), // true = tarif nuit (20h-7h + Dim/JF)
  rateType: text('rate_type'), // 'Tarif jour', 'Tarif nuit', 'Forfait 3H', etc.

  // Forfait info
  isForfait: boolean('is_forfait').notNull().default(false),
  forfaitName: text('forfait_name'), // 'Forfait 3H / 270km', etc.
  forfaitHours: integer('forfait_hours'), // 3, 4, 5, 6, 7, 8
  forfaitMaxKm: integer('forfait_max_km'), // 270, 360, 450, etc.

  // Price breakdown
  baseFare: decimal('base_fare', { precision: 10, scale: 2 }), // Prise en charge
  distanceCharge: decimal('distance_charge', { precision: 10, scale: 2 }), // km charge
  hourlyCharge: decimal('hourly_charge', { precision: 10, scale: 2 }), // extra hours
  waitingCharge: decimal('waiting_charge', { precision: 10, scale: 2 }), // MDA charge
  forfaitDiscount: decimal('forfait_discount', { precision: 10, scale: 2 }), // savings from forfait

  // Final prices
  totalPriceHT: decimal('total_price_ht', { precision: 10, scale: 2 }).notNull(), // Hors Taxes
  totalPriceTTC: decimal('total_price_ttc', { precision: 10, scale: 2 }).notNull(), // Toutes Taxes Comprises
  tvaAmount: decimal('tva_amount', { precision: 10, scale: 2 }), // TVA (10%)
  tvaRate: decimal('tva_rate', { precision: 5, scale: 2 }).default('10.00'), // 10%

  // Legacy field (keep for compatibility)
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),

  // Price breakdown as JSON (for complex scenarios)
  priceBreakdown: jsonb('price_breakdown'),

  // Special requests
  notes: text('notes'),
  specialRequests: jsonb('special_requests'),

  // Status
  status: text('status').notNull().default('pending'), // 'pending', 'verified', 'confirmed', 'in_progress', 'completed', 'cancelled'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'refunded'
  paymentMethod: text('payment_method').default('stripe'), // 'stripe', 'cash', 'other'

  // Email confirmation
  confirmationToken: text('confirmation_token'),
  confirmedViaEmail: boolean('confirmed_via_email').notNull().default(false),
  otpVerified: boolean('otp_verified').notNull().default(false),

  // Admin approval fields
  adminConfirmedBy: integer('admin_confirmed_by').references(() => adminUsers.id),
  adminConfirmedAt: timestamp('admin_confirmed_at'),
  adminNotes: text('admin_notes'), // Internal admin notes (not visible to customer)
  requiresAdminApproval: boolean('requires_admin_approval').notNull().default(true),
  rejectionReason: text('rejection_reason'), // Reason if admin rejects booking

  // Documents
  documentsPdfPath: text('documents_pdf_path'), // Path to generated PDFs

  // Stripe
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),

  // Legal acceptance
  cgvAccepted: boolean('cgv_accepted').notNull().default(false),
  cgvAcceptedAt: timestamp('cgv_accepted_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// OTP Verifications table
export const otpVerifications = pgTable('otp_verifications', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  code: text('code').notNull(), // 6-digit code
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Working hours table
export const workingHours = pgTable('working_hours', {
  id: serial('id').primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Exception days (holidays, closures)
export const exceptions = pgTable('exceptions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  reason: text('reason').notNull(),
  isClosed: boolean('is_closed').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

// Availability settings for driver (legacy - use workingHours instead)
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
});

// Pricing rules - Grille Tarifaire 2025/2026
export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  ruleType: text('rule_type').notNull(), // 'hourly', 'per_km', 'forfait', 'airport', 'mda', 'extra_hour'
  serviceType: text('service_type'), // 'transfer', 'hourly', 'airport', 'business', 'mda'

  // Rate type
  timeSlot: text('time_slot').notNull().default('day'), // 'day' or 'night'

  // Prices HT and TTC
  priceHT: decimal('price_ht', { precision: 10, scale: 2 }).notNull(),
  priceTTC: decimal('price_ttc', { precision: 10, scale: 2 }).notNull(),

  // For forfaits
  forfaitHours: integer('forfait_hours'), // 3, 4, 5, 6, 7, 8
  forfaitMaxKm: integer('forfait_max_km'), // 270, 360, 450, 540, 630, 720
  hourlyRateTTC: decimal('hourly_rate_ttc', { precision: 10, scale: 2 }), // effective hourly rate

  // For per-km rates
  zoneType: text('zone_type'), // 'agglomeration', 'hors_agglo', 'hors_agglo_one_way', 'deplacement'
  maxKm: integer('max_km'), // e.g., 24 for agglomeration

  // Legacy fields (for compatibility)
  baseFare: decimal('base_fare', { precision: 10, scale: 2 }),
  perKm: decimal('per_km', { precision: 10, scale: 2 }),
  perMinute: decimal('per_minute', { precision: 10, scale: 2 }),
  perHour: decimal('per_hour', { precision: 10, scale: 2 }),
  minPrice: decimal('min_price', { precision: 10, scale: 2 }),

  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type NewOtpVerification = typeof otpVerifications.$inferInsert;

export type WorkingHours = typeof workingHours.$inferSelect;
export type NewWorkingHours = typeof workingHours.$inferInsert;

export type Exception = typeof exceptions.$inferSelect;
export type NewException = typeof exceptions.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;

export type PricingRule = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;

// Company and invoice settings
export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value'),
  settingType: text('setting_type').notNull().default('text'), // 'text', 'json', 'number', 'boolean'
  category: text('category').notNull().default('general'), // 'company', 'invoice', 'quote', 'general'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CompanySetting = typeof companySettings.$inferSelect;
export type NewCompanySetting = typeof companySettings.$inferInsert;

