# Migration de la table company_settings

## Problème
Erreur: `relation "company_settings" does not exist`

La table `company_settings` n'existe pas dans votre base de données.

## Solution

### Option 1: Appliquer la migration manuellement (RECOMMANDÉ)

1. **Connectez-vous à votre base de données Neon**:
   - Allez sur https://console.neon.tech/
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor"

2. **Exécutez le script SQL**:
   Copiez et exécutez le contenu de `migrations/add-company-settings-table.sql`

### Option 2: Utiliser Drizzle Kit

```bash
# 1. Générer la migration
npm run db:generate

# 2. Appliquer la migration
npm run db:push
```

⚠️ **Note**: `db:push` synchronise TOUT le schéma, pas seulement cette table.

### Option 3: Script rapide (copier-coller dans SQL Editor)

```sql
-- Créer la table
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL DEFAULT 'text',
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON company_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_company_settings_category ON company_settings(category);

-- Données par défaut (entreprise)
INSERT INTO company_settings (setting_key, setting_value, setting_type, category) VALUES
    ('name', 'MobiService VTC', 'text', 'company'),
    ('address', '4 rue des artisans', 'text', 'company'),
    ('city', 'Cluses', 'text', 'company'),
    ('postalCode', '74300', 'text', 'company'),
    ('siret', 'XXX XXX XXX XXXXX', 'text', 'company'),
    ('tva', 'FRXX XXX XXX XXX', 'text', 'company'),
    ('phone', '+33 (0)6 07 72 50 07', 'text', 'company'),
    ('email', 'contact@mobiservice-vtc.fr', 'text', 'company'),
    ('website', 'www.mobiservice-vtc.fr', 'text', 'company')
ON CONFLICT (setting_key) DO NOTHING;

-- Données par défaut (facturation)
INSERT INTO company_settings (setting_key, setting_value, setting_type, category) VALUES
    ('invoicePrefix', 'INV', 'text', 'invoice'),
    ('quotePrefix', 'DEV', 'text', 'quote'),
    ('quoteValidityDays', '30', 'number', 'quote'),
    ('showDetailedBreakdown', 'true', 'boolean', 'invoice'),
    ('showDistanceSegments', 'true', 'boolean', 'invoice')
ON CONFLICT (setting_key) DO NOTHING;
```

## Vérification

Après avoir appliqué la migration, vérifiez que la table existe:

```sql
SELECT * FROM company_settings;
```

Vous devriez voir ~15 lignes avec les paramètres par défaut.

## Personnalisation

Pour personnaliser les valeurs, utilisez:

```sql
-- Exemple: Changer le nom de l'entreprise
UPDATE company_settings 
SET setting_value = 'Votre Nom d''Entreprise'
WHERE setting_key = 'name';

-- Exemple: Ajouter un IBAN
INSERT INTO company_settings (setting_key, setting_value, setting_type, category)
VALUES ('iban', 'FR76 1234 5678 9012 3456 7890 123', 'text', 'company')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Exemple: Ajouter un BIC
INSERT INTO company_settings (setting_key, setting_value, setting_type, category)
VALUES ('bic', 'BNPAFRPPXXX', 'text', 'company')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
```

## Interface Admin

Une fois la table créée, vous pouvez aussi modifier ces valeurs via le dashboard admin:
- URL: `/admin/settings/invoices`
- Nécessite une authentification admin

## Valeurs configurables

### Entreprise (category: 'company')
- `name` - Nom de l'entreprise
- `address` - Adresse
- `city` - Ville
- `postalCode` - Code postal
- `siret` - Numéro SIRET
- `tva` - Numéro TVA
- `phone` - Téléphone
- `email` - Email
- `website` - Site web
- `iban` - IBAN (optionnel)
- `bic` - BIC (optionnel)
- `bankDetails` - Détails bancaires (optionnel)
- `paymentTerms` - Conditions de paiement
- `footerText` - Texte du pied de page

### Facturation (category: 'invoice' ou 'quote')
- `invoicePrefix` - Préfixe factures (ex: INV)
- `quotePrefix` - Préfixe devis (ex: DEV)
- `quoteValidityDays` - Validité des devis en jours
- `defaultPaymentTerms` - Conditions de paiement
- `showDetailedBreakdown` - Afficher détail des calculs
- `showDistanceSegments` - Afficher segments CA/TP/Return
- `showQRCode` - Afficher QR code
- `qrCodeData` - Données du QR code (base64 image)

## Troubleshooting

### Erreur: "duplicate key value violates unique constraint"
La table existe déjà. Pas besoin de la recréer.

### Erreur: "permission denied"
Vérifiez que votre utilisateur DB a les droits CREATE TABLE.

### Les valeurs ne s'affichent pas dans les PDFs
1. Vérifiez que la table contient des données: `SELECT * FROM company_settings;`
2. Redéployez sur Vercel pour recharger le code
3. Videz le cache: ajoutez `?regenerate=true` à l'URL du PDF

