-- Migration: Ajouter la table company_settings pour les paramètres de l'entreprise et de facturation
-- Date: 2025-12-21

CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'json', 'number', 'boolean'
    category TEXT NOT NULL DEFAULT 'general', -- 'company', 'invoice', 'quote', 'general'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances de recherche par clé
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON company_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_company_settings_category ON company_settings(category);

-- Insérer les valeurs par défaut pour l'entreprise
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) VALUES
    ('name', 'MobiService VTC', 'text', 'company', 'Nom de l''entreprise'),
    ('address', '4 rue des artisans', 'text', 'company', 'Adresse de l''entreprise'),
    ('city', 'Cluses', 'text', 'company', 'Ville'),
    ('postalCode', '74300', 'text', 'company', 'Code postal'),
    ('siret', 'XXX XXX XXX XXXXX', 'text', 'company', 'Numéro SIRET'),
    ('tva', 'FRXX XXX XXX XXX', 'text', 'company', 'Numéro TVA intracommunautaire'),
    ('phone', '+33 (0)6 07 72 50 07', 'text', 'company', 'Téléphone'),
    ('email', 'contact@mobiservice-vtc.fr', 'text', 'company', 'Email de contact'),
    ('website', 'www.mobiservice-vtc.fr', 'text', 'company', 'Site web'),
    ('paymentTerms', 'Paiement à réception de facture', 'text', 'company', 'Conditions de paiement'),
    ('footerText', 'MobiService VTC - Transport premium en Haute-Savoie', 'text', 'company', 'Texte du pied de page')
ON CONFLICT (setting_key) DO NOTHING;

-- Insérer les valeurs par défaut pour la facturation
INSERT INTO company_settings (setting_key, setting_value, setting_type, category, description) VALUES
    ('invoicePrefix', 'INV', 'text', 'invoice', 'Préfixe des numéros de facture'),
    ('quotePrefix', 'DEV', 'text', 'quote', 'Préfixe des numéros de devis'),
    ('quoteValidityDays', '30', 'number', 'quote', 'Validité des devis en jours'),
    ('defaultPaymentTerms', 'Paiement à réception', 'text', 'invoice', 'Conditions de paiement par défaut'),
    ('showDetailedBreakdown', 'true', 'boolean', 'invoice', 'Afficher le détail des calculs'),
    ('showDistanceSegments', 'true', 'boolean', 'invoice', 'Afficher les segments de distance (CA/TP/Return)'),
    ('showQRCode', 'false', 'boolean', 'invoice', 'Afficher un QR code sur les documents')
ON CONFLICT (setting_key) DO NOTHING;

-- Commentaires sur la table
COMMENT ON TABLE company_settings IS 'Paramètres configurables de l''entreprise et de la facturation';
COMMENT ON COLUMN company_settings.setting_key IS 'Clé unique du paramètre';
COMMENT ON COLUMN company_settings.setting_value IS 'Valeur du paramètre (stockée en TEXT)';
COMMENT ON COLUMN company_settings.setting_type IS 'Type de la valeur (text, json, number, boolean)';
COMMENT ON COLUMN company_settings.category IS 'Catégorie du paramètre (company, invoice, quote, general)';

