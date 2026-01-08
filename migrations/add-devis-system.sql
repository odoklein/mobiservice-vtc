-- Migration: Add Devis (Quote) System Fields
-- Date: 2026-01-08
-- Description: Adds discount and customer comment fields to bookings table

-- Add discount percentage field (5, 8, 12)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Add discount amount field
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2);

-- Add customer comment field
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_comment TEXT;

-- Update existing 'pending' bookings that have been OTP verified to 'quote_sent'
-- This ensures backward compatibility
UPDATE bookings 
SET status = 'quote_sent' 
WHERE status = 'pending' AND otp_verified = true;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Comment on new columns
COMMENT ON COLUMN bookings.discount_percentage IS 'Discount percentage applied by driver (5, 8, or 12)';
COMMENT ON COLUMN bookings.discount_amount IS 'Calculated discount amount in euros';
COMMENT ON COLUMN bookings.customer_comment IS 'Customer comment or feedback on the quote';
