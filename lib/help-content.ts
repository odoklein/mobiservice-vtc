// Centre d'aide - Contenu simplifié pour administrateurs non-techniques
// Tout le contenu est en français simple, sans jargon technique

export interface HelpSection {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'guide';
  keywords: string[];
  icon?: string;
}

export const helpSections: HelpSection[] = [
  // ============================================
  // 📅 GESTION DES RÉSERVATIONS
  // ============================================
  {
    id: 'faq-confirm-booking',
    title: '✅ Comment confirmer une réservation ?',
    content: `Quand un client fait une réservation, vous recevez une notification.

📋 Étapes simples :
1. Allez dans "Réservations" dans le menu
2. Cherchez les réservations marquées "À approuver" (en bleu)
3. Cliquez dessus pour voir les détails
4. Cliquez sur le bouton "Approuver la réservation"

Une fois approuvée, le client reçoit automatiquement un email de confirmation ! 📧`,
    category: 'faq',
    keywords: ['réservation', 'confirmer', 'approuver', 'valider'],
    icon: '✅',
  },
  {
    id: 'faq-booking-statuses',
    title: '🔄 Que signifient les couleurs des réservations ?',
    content: `Chaque réservation a une couleur qui indique son état :

🟡 Jaune "En attente" → Le client n'a pas encore confirmé son email
🔵 Bleu "À approuver" → Le client a confirmé, c'est à vous d'approuver
🟢 Vert "Confirmé" → Tout est bon, la course est programmée
🟣 Violet "En cours" → La course est en train de se faire
⚫ Gris "Terminé" → La course est finie
🔴 Rouge "Annulé" → La réservation a été annulée`,
    category: 'faq',
    keywords: ['statut', 'couleur', 'état', 'réservation'],
    icon: '🔄',
  },
  {
    id: 'faq-edit-booking',
    title: '✏️ Comment modifier une réservation ?',
    content: `Vous pouvez modifier les détails d'une réservation à tout moment.

📋 Comment faire :
1. Cliquez sur la réservation que vous voulez modifier
2. Cliquez sur "Modifier" en haut de la page
3. Changez les informations (date, heure, adresse...)
4. Cliquez sur "Enregistrer"

💡 Conseil : Si vous changez une information importante (date, heure), pensez à prévenir le client !`,
    category: 'faq',
    keywords: ['modifier', 'changer', 'éditer', 'réservation'],
    icon: '✏️',
  },

  // ============================================
  // 📄 FACTURES ET DEVIS
  // ============================================
  {
    id: 'faq-generate-invoice',
    title: '📄 Comment créer une facture ou un devis ?',
    content: `Créer une facture ou un devis, c'est très simple !

📋 Étapes :
1. Allez sur la page de la réservation
2. Cliquez sur "Générer facture" ou "Générer devis"
3. Attendez quelques secondes
4. Le document est prêt !

📧 Vous pouvez ensuite :
• Voir le document (cliquez sur "Voir")
• L'envoyer au client par email (cliquez sur "Envoyer")
• Copier le lien pour le partager`,
    category: 'faq',
    keywords: ['facture', 'devis', 'créer', 'générer', 'document'],
    icon: '📄',
  },
  {
    id: 'faq-customize-invoices',
    title: '🏢 Comment personnaliser mes factures ?',
    content: `Vous pouvez ajouter les informations de votre entreprise sur toutes les factures.

📋 Comment faire :
1. Allez dans "Factures & Devis" dans le menu de gauche
2. Cliquez sur l'onglet "Paramètres"
3. Remplissez les informations :
   • Nom de votre entreprise
   • Adresse, téléphone, email
   • Numéro SIRET et TVA
   • Coordonnées bancaires
4. Cliquez sur "Enregistrer"

✨ Ces informations apparaîtront automatiquement sur tous vos documents !`,
    category: 'faq',
    keywords: ['facture', 'personnaliser', 'entreprise', 'paramètres'],
    icon: '🏢',
  },
  {
    id: 'faq-send-document',
    title: '📧 Comment envoyer un document au client ?',
    content: `Après avoir créé une facture ou un devis, vous pouvez l'envoyer directement par email.

📋 Étapes :
1. Sur la page de la réservation, créez d'abord le document
2. Cliquez sur "Envoyer"
3. Choisissez "Envoyer au client"
4. C'est fait ! Le client reçoit le document par email

💡 Le client recevra un bel email avec un lien pour télécharger le document.`,
    category: 'faq',
    keywords: ['envoyer', 'email', 'document', 'client'],
    icon: '📧',
  },

  // ============================================
  // 💰 TARIFICATION
  // ============================================
  {
    id: 'faq-change-pricing',
    title: '💰 Comment modifier mes tarifs ?',
    content: `Vous pouvez changer tous vos prix à tout moment.

📋 Comment faire :
1. Cliquez sur "Tarification" dans le menu de gauche
2. Choisissez ce que vous voulez modifier :
   • Forfaits horaires
   • Tarifs au kilomètre (jour/nuit)
   • Prix des aéroports
3. Modifiez les prix
4. Les changements sont sauvegardés automatiquement

⚠️ Important : Les nouvelles réservations utiliseront les nouveaux tarifs. Les réservations déjà faites gardent leurs anciens prix.`,
    category: 'faq',
    keywords: ['tarif', 'prix', 'modifier', 'forfait'],
    icon: '💰',
  },
  {
    id: 'faq-reset-pricing',
    title: '🔄 Comment revenir aux tarifs par défaut ?',
    content: `Si vous avez fait des erreurs dans vos tarifs, vous pouvez tout remettre comme au début.

⚠️ Attention : Cette action remplace TOUS vos tarifs actuels !

📋 Comment faire :
1. Allez dans "Tarification"
2. Cliquez sur le bouton "Réinitialiser" (en rouge)
3. Confirmez votre choix

💡 Conseil : Notez vos tarifs actuels avant de réinitialiser, au cas où.`,
    category: 'faq',
    keywords: ['tarif', 'réinitialiser', 'défaut', 'reset'],
    icon: '🔄',
  },

  // ============================================
  // ⚙️ PARAMÈTRES
  // ============================================
  {
    id: 'faq-working-hours',
    title: '🕐 Comment configurer mes horaires ?',
    content: `Définissez les jours et heures où vous travaillez.

📋 Comment faire :
1. Cliquez sur "Horaires" dans le menu
2. Pour chaque jour de la semaine :
   • Activez ou désactivez le jour
   • Choisissez l'heure d'ouverture
   • Choisissez l'heure de fermeture
3. Cliquez sur "Enregistrer"

💡 Les clients ne pourront pas réserver en dehors de ces horaires !`,
    category: 'faq',
    keywords: ['horaires', 'ouverture', 'fermeture', 'jours'],
    icon: '🕐',
  },
  {
    id: 'faq-depot-address',
    title: '📍 Comment changer l\'adresse de mon dépôt ?',
    content: `L'adresse du dépôt est utilisée pour calculer les prix.

📋 Comment faire :
1. Cliquez sur "Dépôt VTC" dans le menu
2. Tapez votre nouvelle adresse dans le champ
3. Sélectionnez l'adresse exacte dans la liste
4. Cliquez sur "Enregistrer"

💡 C'est l'adresse d'où partent vos véhicules. Le système l'utilise pour calculer les distances.`,
    category: 'faq',
    keywords: ['dépôt', 'adresse', 'garage', 'base'],
    icon: '📍',
  },
  {
    id: 'faq-change-password',
    title: '🔒 Comment changer mon mot de passe ?',
    content: `Pour plus de sécurité, changez votre mot de passe régulièrement.

📋 Comment faire :
1. Cliquez sur "Mot de passe" dans le menu
2. Entrez votre mot de passe actuel
3. Entrez votre nouveau mot de passe (2 fois)
4. Cliquez sur "Changer le mot de passe"

🔐 Votre mot de passe doit avoir :
• Au moins 8 caractères
• Une majuscule (A, B, C...)
• Une minuscule (a, b, c...)
• Un chiffre (1, 2, 3...)`,
    category: 'faq',
    keywords: ['mot de passe', 'changer', 'sécurité'],
    icon: '🔒',
  },

  // ============================================
  // 📖 GUIDES PRATIQUES
  // ============================================
  {
    id: 'guide-new-booking',
    title: '📖 Guide : Traiter une nouvelle réservation',
    content: `Quand vous recevez une nouvelle réservation, voici ce qu'il faut faire :

📋 Étapes :
1️⃣ Regardez la liste des réservations "À approuver" (en bleu)
2️⃣ Cliquez sur la réservation pour voir les détails
3️⃣ Vérifiez les informations :
   • Date et heure ✓
   • Adresses de départ et d'arrivée ✓
   • Nombre de passagers ✓
   • Prix ✓
4️⃣ Si tout est bon, cliquez sur "Approuver"
5️⃣ Le client reçoit un email automatiquement

🎉 C'est fait ! La course est confirmée.`,
    category: 'guide',
    keywords: ['guide', 'nouvelle', 'réservation', 'étapes'],
    icon: '📖',
  },
  {
    id: 'guide-daily-routine',
    title: '📖 Guide : Ma routine quotidienne',
    content: `Voici ce que vous devriez faire chaque jour :

☀️ Le matin :
1. Connectez-vous à l'administration
2. Vérifiez s'il y a des réservations "À approuver"
3. Regardez les courses du jour dans le tableau de bord

📅 Pendant la journée :
4. Approuvez les nouvelles réservations rapidement
5. Marquez les courses comme "Terminées" après chaque trajet

🌙 Le soir :
6. Vérifiez que toutes les courses du jour sont marquées "Terminées"
7. Jetez un œil aux réservations de demain

💡 Conseil : Plus vous répondez vite aux réservations, plus vos clients seront contents !`,
    category: 'guide',
    keywords: ['guide', 'quotidien', 'routine', 'jour'],
    icon: '📖',
  },
  {
    id: 'guide-create-invoice',
    title: '📖 Guide : Créer et envoyer une facture',
    content: `Après une course, vous pouvez créer et envoyer la facture au client :

📋 Étapes :
1️⃣ Allez sur la page de la réservation terminée
2️⃣ Cliquez sur "Générer facture"
3️⃣ Attendez quelques secondes (le document se crée)
4️⃣ Une fois créée, cliquez sur "Envoyer" puis "Au client"

✅ Le client reçoit la facture par email !

💡 Vous pouvez aussi :
• Télécharger la facture pour l'imprimer
• Copier le lien pour l'envoyer vous-même`,
    category: 'guide',
    keywords: ['guide', 'facture', 'créer', 'envoyer'],
    icon: '📖',
  },
];

// Fonction de recherche simplifiée
export function searchHelpContent(query: string): HelpSection[] {
  const q = query.toLowerCase().trim();

  if (!q) return helpSections;

  return helpSections.filter(section => {
    const titleMatch = section.title.toLowerCase().includes(q);
    const contentMatch = section.content.toLowerCase().includes(q);
    const keywordMatch = section.keywords.some(k => k.toLowerCase().includes(q));

    return titleMatch || contentMatch || keywordMatch;
  });
}

// Récupérer les sections par catégorie
export function getHelpByCategory(category: HelpSection['category']): HelpSection[] {
  return helpSections.filter(section => section.category === category);
}
