-- ============================================================================
-- MOBISERVICE VTC - COMPLETE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- Run this script directly on your PostgreSQL database (Neon, Supabase, Dokploy, etc.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES CREATION
-- ----------------------------------------------------------------------------

-- Users table (customers & driver)
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'customer',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,

  -- Guest booking info
  "guest_name" TEXT,
  "guest_email" TEXT,
  "guest_phone" TEXT,

  -- Trip details
  "pickup_address" TEXT NOT NULL,
  "pickup_lat" NUMERIC(10, 7),
  "pickup_lng" NUMERIC(10, 7),

  "dropoff_address" TEXT NOT NULL,
  "dropoff_lat" NUMERIC(10, 7),
  "dropoff_lng" NUMERIC(10, 7),

  "pickup_date" TIMESTAMP NOT NULL,
  "pickup_time" TEXT NOT NULL,

  -- Return trip
  "return_date" TIMESTAMP,
  "return_time" TEXT,

  "passengers" INTEGER NOT NULL DEFAULT 1,
  "luggage" INTEGER NOT NULL DEFAULT 0,

  -- Service type
  "service_type" TEXT NOT NULL,
  "trip_type" TEXT NOT NULL DEFAULT 'one-way',

  -- Trip metrics
  "distance" NUMERIC(10, 2),
  "duration" INTEGER,
  "hours" INTEGER,

  -- 3-segment distances (CA/TP system)
  "distance_ca" NUMERIC(10, 2),
  "distance_tp" NUMERIC(10, 2),
  "distance_return" NUMERIC(10, 2),

  -- Pricing
  "is_night_rate" BOOLEAN NOT NULL DEFAULT FALSE,
  "rate_type" TEXT,

  -- Forfait info
  "is_forfait" BOOLEAN NOT NULL DEFAULT FALSE,
  "forfait_name" TEXT,
  "forfait_hours" INTEGER,
  "forfait_max_km" INTEGER,

  -- Price breakdown
  "base_fare" NUMERIC(10, 2),
  "distance_charge" NUMERIC(10, 2),
  "hourly_charge" NUMERIC(10, 2),
  "waiting_charge" NUMERIC(10, 2),
  "forfait_discount" NUMERIC(10, 2),

  -- Manual discount
  "discount_percentage" INTEGER,
  "discount_amount" NUMERIC(10, 2),

  "customer_comment" TEXT,

  -- Final prices
  "total_price_ht" NUMERIC(10, 2) NOT NULL,
  "total_price_ttc" NUMERIC(10, 2) NOT NULL,
  "tva_amount" NUMERIC(10, 2),
  "tva_rate" NUMERIC(5, 2) DEFAULT 10.00,

  -- Legacy fields
  "base_price" NUMERIC(10, 2) NOT NULL,
  "total_price" NUMERIC(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',

  "price_breakdown" JSONB,

  "notes" TEXT,
  "special_requests" JSONB,

  -- Status
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_status" TEXT NOT NULL DEFAULT 'pending',
  "payment_method" TEXT DEFAULT 'stripe',

  -- Email confirmation
  "confirmation_token" TEXT,
  "confirmed_via_email" BOOLEAN NOT NULL DEFAULT FALSE,
  "otp_verified" BOOLEAN NOT NULL DEFAULT FALSE,

  -- Admin approval fields
  "admin_confirmed_by" INTEGER REFERENCES "admin_users"("id") ON DELETE SET NULL,
  "admin_confirmed_at" TIMESTAMP,
  "admin_notes" TEXT,
  "requires_admin_approval" BOOLEAN NOT NULL DEFAULT TRUE,
  "rejection_reason" TEXT,

  -- Documents
  "documents_pdf_path" TEXT,
  "devis_pdf_url" TEXT,
  "facture_pdf_url" TEXT,
  "bon_commande_pdf_url" TEXT,
  "bon_reservation_pdf_url" TEXT,
  "last_pdf_generated_at" TIMESTAMP,

  -- Stripe
  "stripe_payment_intent_id" TEXT,
  "stripe_session_id" TEXT,

  -- Legal
  "cgv_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
  "cgv_accepted_at" TIMESTAMP,

  -- Timestamps
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "confirmed_at" TIMESTAMP,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP
);

-- OTP Verifications table
CREATE TABLE IF NOT EXISTS "otp_verifications" (
  "id" SERIAL PRIMARY KEY,
  "booking_id" INTEGER NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verified_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Working Hours table
CREATE TABLE IF NOT EXISTS "working_hours" (
  "id" SERIAL PRIMARY KEY,
  "day_of_week" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Exception Days table
CREATE TABLE IF NOT EXISTS "exceptions" (
  "id" SERIAL PRIMARY KEY,
  "date" TIMESTAMP NOT NULL,
  "reason" TEXT NOT NULL,
  "is_closed" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL PRIMARY KEY,
  "booking_id" INTEGER REFERENCES "bookings"("id") ON DELETE SET NULL,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "reviewer_name" TEXT NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Availability table (Legacy)
CREATE TABLE IF NOT EXISTS "availability" (
  "id" SERIAL PRIMARY KEY,
  "day_of_week" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT TRUE
);

-- Pricing Rules table
CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" SERIAL PRIMARY KEY,
  "rule_type" TEXT NOT NULL,
  "service_type" TEXT,
  "time_slot" TEXT NOT NULL DEFAULT 'day',
  "price_ht" NUMERIC(10, 2) NOT NULL,
  "price_ttc" NUMERIC(10, 2) NOT NULL,
  "forfait_hours" INTEGER,
  "forfait_max_km" INTEGER,
  "hourly_rate_ttc" NUMERIC(10, 2),
  "zone_type" TEXT,
  "max_km" INTEGER,
  "base_fare" NUMERIC(10, 2),
  "per_km" NUMERIC(10, 2),
  "per_minute" NUMERIC(10, 2),
  "per_hour" NUMERIC(10, 2),
  "min_price" NUMERIC(10, 2),
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Company Settings table
CREATE TABLE IF NOT EXISTS "company_settings" (
  "id" SERIAL PRIMARY KEY,
  "setting_key" TEXT NOT NULL UNIQUE,
  "setting_value" TEXT,
  "setting_type" TEXT NOT NULL DEFAULT 'text',
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_company_settings_key" ON "company_settings"("setting_key");
CREATE INDEX IF NOT EXISTS "idx_company_settings_category" ON "company_settings"("category");

-- ----------------------------------------------------------------------------
-- 2. INITIAL SEED DATA
-- ----------------------------------------------------------------------------

-- Seed Working Hours (Sunday=0 to Saturday=6)
INSERT INTO "working_hours" ("day_of_week", "start_time", "end_time", "is_active") VALUES
(0, '00:00', '23:59', true),
(1, '00:00', '23:59', true),
(2, '00:00', '23:59', true),
(3, '00:00', '23:59', true),
(4, '00:00', '23:59', true),
(5, '00:00', '23:59', true),
(6, '00:00', '23:59', true)
ON CONFLICT DO NOTHING;

-- Seed Company Settings
INSERT INTO "company_settings" ("setting_key", "setting_value", "setting_type", "category", "description") VALUES
('name', 'MobiService VTC', 'text', 'company', 'Nom de l''entreprise'),
('address', '4 rue des artisans', 'text', 'company', 'Adresse'),
('city', 'Cluses', 'text', 'company', 'Ville'),
('postalCode', '74300', 'text', 'company', 'Code postal'),
('siret', 'XXX XXX XXX XXXXX', 'text', 'company', 'Numéro SIRET'),
('tva', 'FRXX XXX XXX XXX', 'text', 'company', 'Numéro TVA'),
('phone', '+33 (0)6 07 72 50 07', 'text', 'company', 'Téléphone'),
('email', 'contact@mobiservice-vtc.fr', 'text', 'company', 'Email'),
('website', 'www.mobiservice-vtc.fr', 'text', 'company', 'Site web'),
('paymentTerms', 'Paiement à réception de facture', 'text', 'company', 'Conditions de paiement'),
('footerText', 'MobiService VTC - Transport premium en Haute-Savoie', 'text', 'company', 'Texte de pied de page'),
('invoicePrefix', 'INV', 'text', 'invoice', 'Préfixe pour les numéros de facture'),
('quotePrefix', 'DEV', 'text', 'quote', 'Préfixe pour les numéros de devis'),
('quoteValidityDays', '30', 'number', 'quote', 'Validité des devis en jours'),
('showDetailedBreakdown', 'true', 'boolean', 'invoice', 'Afficher le détail du calcul'),
('showDistanceSegments', 'true', 'boolean', 'invoice', 'Afficher les segments de distance')
ON CONFLICT ("setting_key") DO NOTHING;

-- Seed Pricing Rules (Day & Night Forfaits, Per-Km, MDA, Airport)
INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "forfait_hours", "forfait_max_km", "hourly_rate_ttc", "description", "is_active", "created_at", "updated_at") VALUES
('forfait', 'hourly', 'day', '210.91', '232.00', 2, 180, '116.00', 'Forfait 2H / 180km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '263.64', '290.00', 2.5, 225, '116.00', 'Forfait 2.5H / 225km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '316.36', '348.00', 3, 270, '116.00', 'Forfait 3H / 270km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '369.09', '406.00', 3.5, 315, '116.00', 'Forfait 3.5H / 315km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '421.82', '464.00', 4, 360, '116.00', 'Forfait 4H / 360km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '474.55', '522.00', 4.5, 405, '116.00', 'Forfait 4.5H / 405km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '527.27', '580.00', 5, 450, '116.00', 'Forfait 5H / 450km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '580.00', '638.00', 5.5, 495, '116.00', 'Forfait 5.5H / 495km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '600.00', '660.00', 6, 540, '110.00', 'Forfait 6H / 540km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '650.00', '715.00', 6.5, 585, '110.00', 'Forfait 6.5H / 585km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '668.18', '735.00', 7, 630, '105.00', 'Forfait 7H / 630km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '715.91', '787.50', 7.5, 675, '105.00', 'Forfait 7.5H / 675km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'day', '763.64', '840.00', 8, 720, '105.00', 'Forfait 8H / 720km (Jour)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '254.55', '280.00', 2, 180, '140.00', 'Forfait 2H / 180km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '306.82', '337.50', 2.5, 225, '135.00', 'Forfait 2.5H / 225km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '354.55', '390.00', 3, 270, '130.00', 'Forfait 3H / 270km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '413.64', '455.00', 3.5, 315, '130.00', 'Forfait 3.5H / 315km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '472.73', '520.00', 4, 360, '130.00', 'Forfait 4H / 360km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '531.82', '585.00', 4.5, 405, '130.00', 'Forfait 4.5H / 405km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '590.91', '650.00', 5, 450, '130.00', 'Forfait 5H / 450km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '650.00', '715.00', 5.5, 495, '130.00', 'Forfait 5.5H / 495km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '681.82', '750.00', 6, 540, '125.00', 'Forfait 6H / 540km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '738.64', '812.50', 6.5, 585, '125.00', 'Forfait 6.5H / 585km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '763.64', '840.00', 7, 630, '120.00', 'Forfait 7H / 630km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '818.18', '900.00', 7.5, 675, '120.00', 'Forfait 7.5H / 675km (Nuit)', true, NOW(), NOW()),
('forfait', 'hourly', 'night', '872.73', '960.00', 8, 720, '120.00', 'Forfait 8H / 720km (Nuit)', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "per_km", "zone_type", "description", "is_active", "created_at", "updated_at") VALUES
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'tp', 'Tarif TP (Jour) - Prix constant au km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.73', '1.90', '1.90', 'tp', 'Tarif TP (Nuit) - Prix constant au km', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "per_km", "zone_type", "max_km", "description", "is_active", "created_at", "updated_at") VALUES
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'ca', 25, 'Tarif CA (Jour) - 0-25km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '1.20', '1.32', '1.32', 'ca', 50, 'Tarif CA (Jour) - 25-50km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '1.00', '1.10', '1.10', 'ca', 75, 'Tarif CA (Jour) - 50-75km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '0.82', '0.90', '0.90', 'ca', 100, 'Tarif CA (Jour) - 75-100km', true, NOW(), NOW()),
('per_km', 'transfer', 'day', '0.64', '0.70', '0.70', 'ca', NULL, 'Tarif CA (Jour) - 100+km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.73', '1.90', '1.90', 'ca', 25, 'Tarif CA (Nuit) - 0-25km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.55', '1.70', '1.70', 'ca', 50, 'Tarif CA (Nuit) - 25-50km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.27', '1.40', '1.40', 'ca', 75, 'Tarif CA (Nuit) - 50-75km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '1.00', '1.10', '1.10', 'ca', 100, 'Tarif CA (Nuit) - 75-100km', true, NOW(), NOW()),
('per_km', 'transfer', 'night', '0.64', '0.70', '0.70', 'ca', NULL, 'Tarif CA (Nuit) - 100+km', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "max_km", "description", "is_active", "created_at", "updated_at") VALUES
('forfait', 'agglomeration', 'day', '30.00', '33.00', 25, 'Forfait agglomération (Jour) - ≤25km A/R', true, NOW(), NOW()),
('forfait', 'agglomeration', 'night', '43.18', '47.50', 25, 'Forfait agglomération (Nuit) - ≤25km A/R', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "per_minute", "description", "is_active", "created_at", "updated_at") VALUES
('mda', 'mda', 'day', '1.09', '1.20', '1.20', 'MDA (Jour) - Par minute après 10 min gratuites', true, NOW(), NOW()),
('mda', 'mda', 'night', '1.64', '1.80', '1.80', 'MDA (Nuit) - Par minute après 10 min gratuites', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "description", "is_active", "created_at", "updated_at") VALUES
('airport', 'airport', 'day', '105.45', '116.00', 'Aéroport Genève (Jour)', true, NOW(), NOW()),
('airport', 'airport', 'night', '118.18', '130.00', 'Aéroport Genève (Nuit)', true, NOW(), NOW()),
('airport', 'airport', 'day', '210.91', '232.00', 'Aéroport Lyon-Saint Exupéry (Jour)', true, NOW(), NOW()),
('airport', 'airport', 'night', '236.36', '260.00', 'Aéroport Lyon-Saint Exupéry (Nuit)', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "per_hour", "description", "is_active", "created_at", "updated_at") VALUES
('extra_hour', 'hourly', 'day', '105.45', '116.00', '116.00', 'Heure supplémentaire (Jour)', true, NOW(), NOW()),
('extra_hour', 'hourly', 'night', '127.27', '140.00', '140.00', 'Heure supplémentaire (Nuit)', true, NOW(), NOW());

INSERT INTO "pricing_rules" ("rule_type", "service_type", "time_slot", "price_ht", "price_ttc", "min_price", "description", "is_active", "created_at", "updated_at") VALUES
('min_price', 'transfer', 'day', '30.00', '33.00', '33.00', 'Prix minimum (Forfait agglomération jour)', true, NOW(), NOW());
