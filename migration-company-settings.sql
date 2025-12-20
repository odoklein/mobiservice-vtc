-- Migration: Add company_settings table for invoice/quote customization
-- Run this SQL to create the table for storing company and invoice settings

CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON company_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_company_settings_category ON company_settings(category);

-- Insert default company settings
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) VALUES
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
ON CONFLICT (setting_key) DO NOTHING;

