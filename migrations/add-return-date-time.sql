-- Add return date/time for A/R (transfer 1-3 days or forfait same day)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_date TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_time TEXT;
COMMENT ON COLUMN bookings.return_date IS 'Date du trajet retour (A/R)';
COMMENT ON COLUMN bookings.return_time IS 'Heure du trajet retour (HH:mm)';
