-- Migration: Ajouter les champs pour stocker les URLs des différents documents PDF
-- Date: 2025-12-21

-- Ajouter les nouveaux champs pour les URLs des documents
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS devis_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS facture_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_commande_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_reservation_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_pdf_generated_at TIMESTAMP;

-- Commentaires pour documentation
COMMENT ON COLUMN bookings.devis_pdf_url IS 'URL Vercel Blob du devis PDF';
COMMENT ON COLUMN bookings.facture_pdf_url IS 'URL Vercel Blob de la facture PDF';
COMMENT ON COLUMN bookings.bon_commande_pdf_url IS 'URL Vercel Blob du bon de commande PDF';
COMMENT ON COLUMN bookings.bon_reservation_pdf_url IS 'URL Vercel Blob du bon de réservation PDF';
COMMENT ON COLUMN bookings.last_pdf_generated_at IS 'Date de la dernière génération de PDF';

-- Index pour recherche rapide des documents générés
CREATE INDEX IF NOT EXISTS idx_bookings_devis_pdf ON bookings(devis_pdf_url) WHERE devis_pdf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_facture_pdf ON bookings(facture_pdf_url) WHERE facture_pdf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_last_pdf_date ON bookings(last_pdf_generated_at);


