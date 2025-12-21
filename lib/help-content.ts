// Help content parsed from documentation files
// This file consolidates all help and documentation content for the admin help center

export interface HelpSection {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'documentation' | 'guide' | 'configuration';
  keywords: string[];
}

export const helpSections: HelpSection[] = [
  // FAQ - Gestion des réservations
  {
    id: 'faq-confirm-booking',
    title: 'Comment confirmer une réservation ?',
    content: 'Les réservations sont créées avec le statut "verified" (vérifiée). Vous devez les approuver manuellement depuis la page de détail de la réservation en cliquant sur "Approuver la réservation". Une fois approuvée, elle passe au statut "confirmed" et un email de confirmation est envoyé au client.',
    category: 'faq',
    keywords: ['réservation', 'confirmer', 'approuver', 'statut', 'verified', 'confirmed'],
  },
  {
    id: 'faq-booking-statuses',
    title: 'Quels sont les statuts possibles ?',
    content: 'Le workflow des statuts suit cet ordre : pending (en attente) → verified (vérifiée par email OTP) → confirmed (confirmée par admin) → in_progress (en cours) → completed (terminée) → cancelled (annulée)',
    category: 'faq',
    keywords: ['statut', 'workflow', 'pending', 'verified', 'confirmed', 'completed', 'cancelled'],
  },
  {
    id: 'faq-edit-booking',
    title: 'Comment modifier une réservation ?',
    content: 'Depuis la page de détail, cliquez sur "Modifier" pour éditer les informations. Les modifications sont sauvegardées immédiatement.',
    category: 'faq',
    keywords: ['modifier', 'éditer', 'réservation', 'changement'],
  },
  {
    id: 'faq-generate-invoice',
    title: 'Comment générer une facture ou un devis ?',
    content: 'Sur la page de détail de la réservation, utilisez les boutons "Générer facture" ou "Générer devis". Les documents sont créés au format PDF et stockés dans Vercel Blob Storage.',
    category: 'faq',
    keywords: ['facture', 'devis', 'générer', 'pdf', 'document'],
  },

  // FAQ - Tarification
  {
    id: 'faq-change-pricing',
    title: 'Comment modifier les tarifs ?',
    content: 'Allez dans Paramètres > Tarification. Vous pouvez modifier tous les tarifs (forfaits, tarifs jour/nuit, aéroports, MDA) via l\'interface à onglets. Les modifications sont immédiates et s\'appliquent aux nouvelles réservations.',
    category: 'faq',
    keywords: ['tarif', 'prix', 'modifier', 'paramètres', 'forfait'],
  },
  {
    id: 'faq-pricing-existing-bookings',
    title: 'Les changements de tarifs affectent-ils les réservations existantes ?',
    content: 'Non, seules les nouvelles réservations utilisent les nouveaux tarifs. Les réservations existantes conservent leurs prix d\'origine.',
    category: 'faq',
    keywords: ['tarif', 'prix', 'réservation', 'existante', 'changement'],
  },
  {
    id: 'faq-reset-pricing',
    title: 'Comment réinitialiser les tarifs ?',
    content: 'Dans la page Tarification, cliquez sur "Réinitialiser" pour restaurer les valeurs par défaut. Attention : cette action remplace tous les tarifs actuels.',
    category: 'faq',
    keywords: ['tarif', 'réinitialiser', 'défaut', 'reset'],
  },

  // FAQ - Factures et Devis
  {
    id: 'faq-customize-invoices',
    title: 'Comment personnaliser les factures et devis ?',
    content: 'Allez dans Paramètres > Factures & Devis. Vous pouvez modifier les informations de l\'entreprise, les préfixes de numérotation, la validité des devis, et activer/désactiver l\'affichage des détails de calcul.',
    category: 'faq',
    keywords: ['facture', 'devis', 'personnaliser', 'paramètres', 'entreprise'],
  },
  {
    id: 'faq-invoice-details',
    title: 'Que contiennent les factures détaillées ?',
    content: 'Les factures détaillées incluent : le détail du calcul (prise en charge, distance, heures supplémentaires, MDA), les segments de distance (CA, TP, Retour), et toutes les informations de trajet.',
    category: 'faq',
    keywords: ['facture', 'détails', 'calcul', 'distance', 'MDA'],
  },
  {
    id: 'faq-document-storage',
    title: 'Où sont stockés les documents générés ?',
    content: 'Les documents PDF sont sauvegardés dans Vercel Blob Storage. Les URLs sont stockées dans la base de données (champs devis_pdf_url, facture_pdf_url, etc.).',
    category: 'faq',
    keywords: ['document', 'stockage', 'pdf', 'blob', 'vercel'],
  },

  // FAQ - Workflow
  {
    id: 'faq-booking-workflow',
    title: 'Quel est le processus complet de réservation ?',
    content: '1. Client crée une estimation → 2. Client confirme via email OTP → 3. Réservation passe en "verified" → 4. Admin approuve → 5. Réservation passe en "confirmed" → 6. Email de confirmation envoyé → 7. Service effectué → 8. Statut "completed"',
    category: 'faq',
    keywords: ['workflow', 'processus', 'réservation', 'étapes'],
  },
  {
    id: 'faq-auto-confirm',
    title: 'Les réservations sont-elles automatiquement confirmées ?',
    content: 'Non. Même après vérification par email OTP, les réservations nécessitent une approbation manuelle par l\'administrateur. Cela vous donne un contrôle total sur les réservations acceptées.',
    category: 'faq',
    keywords: ['confirmation', 'automatique', 'approbation', 'manuel', 'contrôle'],
  },

  // Documentation - PDF Generation
  {
    id: 'doc-pdf-system',
    title: 'Système de génération PDF',
    content: `Le système de génération PDF utilise @react-pdf/renderer pour créer des documents professionnels. Chaque type de document (devis, facture, bon de commande, bon de réservation) a son propre champ dans la base de données.

**Workflow complet :**
1. Admin clique "Générer Facture"
2. POST /api/admin/bookings/{id}/generate-pdf?type=facture
3. @react-pdf/renderer génère le PDF
4. Upload vers Vercel Blob
5. Sauvegarde de l'URL dans la DB (facture_pdf_url)
6. Retour JSON avec URL et actions disponibles

**Réponse API :**
{
  "success": true,
  "url": "https://blob.vercel-storage.com/facture-123-xxx.pdf",
  "filename": "facture-123-xxx.pdf",
  "type": "facture",
  "bookingId": 123,
  "actions": {
    "download": "...",
    "sendToClient": "...",
    "sendToDriver": "..."
  }
}`,
    category: 'documentation',
    keywords: ['pdf', 'génération', 'facture', 'devis', 'react-pdf', 'blob', 'workflow'],
  },
  {
    id: 'doc-pdf-sending',
    title: 'Envoi de documents par email',
    content: `L'API permet d'envoyer les documents générés par email aux clients et chauffeurs.

**Endpoint :**
POST /api/admin/bookings/{id}/send-document?type=facture&recipient=client

**Fonctionnalités :**
- Email stylé avec couleurs MobiService (#00FF88)
- Lien direct vers le PDF dans Blob Storage
- Détails de la réservation inclus
- Support client et chauffeur

**Template email inclut :**
- Header avec logo MobiService
- Détails de la réservation (date, trajet, passagers)
- Bouton CTA pour télécharger le PDF
- Footer avec coordonnées
- Version texte brut pour compatibilité`,
    category: 'documentation',
    keywords: ['email', 'envoi', 'document', 'client', 'chauffeur', 'resend'],
  },
  {
    id: 'doc-database-schema',
    title: 'Schéma de base de données - Documents',
    content: `Chaque type de document a son propre champ dans la table bookings :

**Champs ajoutés :**
- devis_pdf_url: URL Blob du devis
- facture_pdf_url: URL Blob de la facture
- bon_commande_pdf_url: URL Blob du bon de commande
- bon_reservation_pdf_url: URL Blob du bon de réservation
- last_pdf_generated_at: Timestamp de dernière génération

**Migration SQL :**
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS devis_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS facture_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_commande_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_reservation_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_pdf_generated_at TIMESTAMP;

Voir migrations/add-pdf-url-fields.sql pour le script complet.`,
    category: 'documentation',
    keywords: ['database', 'schema', 'migration', 'sql', 'pdf', 'url', 'neon'],
  },

  // Guide - Usage pratique
  {
    id: 'guide-generate-pdf',
    title: 'Guide : Générer un document PDF',
    content: `**Étape par étape :**

1. Accédez à la page de détail de la réservation
2. Cliquez sur "Générer facture" ou "Générer devis"
3. Le système génère le PDF (peut prendre 3-5 secondes)
4. Une fois généré, vous avez 4 options :
   - **Télécharger** : Ouvre le PDF dans un nouvel onglet
   - **Envoyer au client** : Email automatique au client
   - **Envoyer au chauffeur** : Email automatique au chauffeur
   - **Copier le lien** : Copie l'URL publique dans le presse-papier

**Code exemple (Frontend) :**
\`\`\`javascript
async function generatePDF(bookingId, type) {
  const response = await fetch(
    \`/api/admin/bookings/\${bookingId}/generate-pdf?type=\${type}\`,
    { method: 'POST' }
  );
  const data = await response.json();
  
  if (data.success) {
    // Document prêt - URL dans data.url
    return data;
  }
}
\`\`\``,
    category: 'guide',
    keywords: ['guide', 'tutoriel', 'générer', 'pdf', 'facture', 'devis', 'étapes'],
  },
  {
    id: 'guide-send-document',
    title: 'Guide : Envoyer un document par email',
    content: `**Comment envoyer un document :**

1. Générez d'abord le document (devis ou facture)
2. Cliquez sur "Envoyer"
3. Choisissez le destinataire :
   - **Au client** : Envoie à l'email du client (booking.guestEmail)
   - **Au chauffeur** : Envoie à l'email configuré (DRIVER_EMAIL)
4. Le système envoie l'email via Resend
5. Confirmation affichée à l'écran

**Email contenu :**
- Objet personnalisé avec numéro de réservation
- Message de présentation
- Détails du trajet
- Bouton de téléchargement du PDF
- Coordonnées de contact

**Code exemple :**
\`\`\`javascript
async function sendDocument(bookingId, type, recipient) {
  const response = await fetch(
    \`/api/admin/bookings/\${bookingId}/send-document?type=\${type}&recipient=\${recipient}\`,
    { method: 'POST' }
  );
  const data = await response.json();
  
  if (data.success) {
    alert(\`Document envoyé à \${data.recipient}\`);
  }
}
\`\`\``,
    category: 'guide',
    keywords: ['guide', 'envoyer', 'email', 'document', 'client', 'chauffeur'],
  },

  // Configuration
  {
    id: 'config-env-vars',
    title: 'Variables d\'environnement requises',
    content: `**Variables essentielles pour la génération PDF :**

\`\`\`bash
# Vercel Blob Storage (REQUIS pour PDF)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx

# Resend (REQUIS pour envoi email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@mobiservice-vtc.fr

# URL de l'application
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app

# Email du chauffeur (optionnel)
DRIVER_EMAIL=chauffeur@mobiservice-vtc.fr
\`\`\`

**Comment obtenir les tokens :**

1. **Vercel Blob** : 
   - Aller sur https://vercel.com/dashboard
   - Sélectionner votre projet
   - Storage → Blob → Create Store
   - Copier le token généré

2. **Resend API** :
   - Créer un compte sur https://resend.com
   - Générer une API key
   - Vérifier votre domaine d'envoi`,
    category: 'configuration',
    keywords: ['configuration', 'environnement', 'variable', 'blob', 'resend', 'token', 'api'],
  },
  {
    id: 'config-troubleshooting',
    title: 'Résolution de problèmes courants',
    content: `**Erreur : "BLOB_READ_WRITE_TOKEN n'est pas configuré"**
→ Ajouter la variable d'environnement dans Vercel ou .env.local

**PDF ne se génère pas (timeout)**
→ Vérifier que la fonction a bien 30s de timeout dans vercel.json
→ Vérifier les logs Vercel pour l'erreur exacte

**Cold start très lent (> 10s)**
→ Normal pour le premier appel (Puppeteer + Chrome)
→ Les appels suivants sont plus rapides (< 5s)

**Erreur : "Booking not found"**
→ Vérifier que la réservation existe dans la DB
→ Vérifier l'ID dans l'URL

**Erreur : "Non autorisé"**
→ Pour admin : vérifier la connexion
→ Pour client : vérifier l'email et le code OTP

**Email non reçu**
→ Vérifier RESEND_API_KEY dans les variables d'environnement
→ Vérifier que le domaine est vérifié dans Resend
→ Consulter les logs Resend (dashboard)`,
    category: 'configuration',
    keywords: ['troubleshooting', 'erreur', 'problème', 'debug', 'timeout', 'blob', 'email'],
  },
  {
    id: 'config-performance',
    title: 'Performance et coûts',
    content: `**Performance attendue :**
- Première génération : 10-15s (cold start Puppeteer)
- Générations suivantes : 3-5s
- Cache : PDF sauvegardé dans Blob Storage
- Régénération : Ajouter ?regenerate=true à l'URL

**Coûts estimés (Vercel) :**
- Blob Storage : ~$0.15/GB/mois + $0.02/GB transfert
- Vercel Functions : Inclus dans le plan (limite: 100 GB-hours/mois sur Hobby)
- PDF moyen : ~200-500 KB
- 1000 PDFs/mois : ~$0.10-0.20

**Optimisations :**
- Les PDFs sont mis en cache après génération
- Pas de régénération automatique (manuel uniquement)
- Compression automatique par Vercel Blob
- Rate limiting recommandé pour l'endpoint public`,
    category: 'configuration',
    keywords: ['performance', 'coûts', 'optimisation', 'cache', 'vercel', 'blob'],
  },

  // Paramètres généraux
  {
    id: 'faq-working-hours',
    title: 'Comment configurer les horaires d\'ouverture ?',
    content: 'Allez dans Paramètres > Horaires. Configurez les heures d\'ouverture pour chaque jour de la semaine et activez/désactivez les jours selon vos besoins.',
    category: 'faq',
    keywords: ['horaires', 'ouverture', 'paramètres', 'configuration'],
  },
  {
    id: 'faq-depot-address',
    title: 'Comment modifier l\'adresse du dépôt ?',
    content: 'Allez dans Paramètres > Dépôt VTC. Modifiez l\'adresse et les coordonnées GPS. Cette adresse est utilisée pour calculer les distances CA et retour.',
    category: 'faq',
    keywords: ['dépôt', 'adresse', 'gps', 'paramètres', 'CA'],
  },
  {
    id: 'faq-change-password',
    title: 'Comment changer mon mot de passe ?',
    content: 'Allez dans Paramètres > Mot de passe. Entrez votre ancien mot de passe et le nouveau. Le mot de passe doit contenir au moins 8 caractères.',
    category: 'faq',
    keywords: ['mot de passe', 'password', 'sécurité', 'changer'],
  },
];

// Helper function to search help content
export function searchHelpContent(query: string): HelpSection[] {
  const lowercaseQuery = query.toLowerCase().trim();
  
  if (!lowercaseQuery) {
    return helpSections;
  }

  return helpSections.filter(section => {
    const titleMatch = section.title.toLowerCase().includes(lowercaseQuery);
    const contentMatch = section.content.toLowerCase().includes(lowercaseQuery);
    const keywordMatch = section.keywords.some(keyword => 
      keyword.toLowerCase().includes(lowercaseQuery)
    );
    
    return titleMatch || contentMatch || keywordMatch;
  });
}

// Get sections by category
export function getHelpByCategory(category: HelpSection['category']): HelpSection[] {
  return helpSections.filter(section => section.category === category);
}

