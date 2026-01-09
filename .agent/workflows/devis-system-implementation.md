---
description: Implementation Plan - Devis (Quote) System with Approval Workflow
---

# 📋 Analyse Système Devis - MobiService VTC

## Table des Matières
1. [Flux Actuel (Problématique)](#flux-actuel)
2. [Pages et Routes Existantes](#pages-et-routes)
3. [Emails Envoyés Actuellement](#emails-actuels)
4. [Problèmes Identifiés](#problemes)
5. [Nouveau Flux Simplifié](#nouveau-flux)
6. [Plan d'Implémentation](#implementation)

---

## 1. Flux Actuel (Problématique) {#flux-actuel}

### Séquence Actuelle Complète

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: CLIENT REMPLIT LE FORMULAIRE                                      │
│  📍 Page: /reservation                                                       │
│                                                                             │
│  - Choix service (transfer/hourly)                                          │
│  - Adresses départ/arrivée                                                  │
│  - Date, heure, passagers                                                   │
│  - Calcul prix automatique                                                  │
│  - Saisie nom, email, téléphone                                             │
│  - Envoi OTP par email                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: VÉRIFICATION OTP                                                  │
│  📍 API: /api/bookings/verify-otp                                           │
│                                                                             │
│  - Client entre le code 6 chiffres reçu par email                           │
│  - Status: quote_sent                                                       │
│  - 📧 Email #1 au DRIVER: "Nouvelle demande de devis"                       │
│  - 📧 Email #2 au CLIENT: "Votre Devis" avec lien /quote/[id]               │
│  - Redirection vers /quote/[id]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: PAGE DEVIS CLIENT                                                 │
│  📍 Page: /quote/[id]                                                        │
│                                                                             │
│  ❌ PROBLÈME: Le CLIENT peut faire des actions qui devraient être DRIVER    │
│                                                                             │
│  Boutons actuels (INCORRECTS):                                              │
│  - ✅ "Accepter" → appelle /api/quote/[id]/accept                           │
│  - ❌ "Refuser" → appelle /api/quote/[id]/refuse                            │
│  - 💬 "Ajouter un commentaire" → appelle /api/quote/[id]/comment            │
│                                                                             │
│  Statuts possibles:                                                         │
│  - quote_sent (initial)                                                     │
│  - quote_modified (après remise)                                            │
│  - quote_accepted (client accepte)                                          │
│  - quote_refused (client refuse)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: DRIVER DANS L'ADMIN                                               │
│  📍 Page: /admin/bookings/[id]                                              │
│                                                                             │
│  Actions disponibles (CONFUSES):                                            │
│  - Boutons remise: -5%, -8%, -12%                                           │
│     → Appelle /api/admin/bookings/[id]/apply-discount                       │
│     → Status: quote_modified                                                │
│     → 📧 Email au CLIENT: "Remise appliquée"                                │
│                                                                             │
│  - Bouton "Confirmer le Devis" (acceptQuote)                                │
│     → Status: confirmed                                                     │
│     → AUCUN EMAIL!                                                          │
│                                                                             │
│  - Bouton "Refuser" (refuseQuote)                                           │
│     → Status: quote_refused                                                 │
│     → AUCUN EMAIL!                                                          │
│                                                                             │
│  - Bouton "Approuver" (approveBooking)                                      │
│     → Seulement si status = "verified"                                      │
│     → Status: confirmed                                                     │
│     → 📧 Email au CLIENT: "Réservation confirmée"                           │
│     → 📧 Email au DRIVER: "Confirmation réservation"                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pages et Routes Existantes {#pages-et-routes}

### Pages Client (Public)

| Page | Chemin | Rôle |
|------|--------|------|
| Réservation | `/reservation` | Formulaire de demande de devis |
| Devis | `/quote/[id]` | Affichage du devis (avec boutons client ❌) |
| Confirmation | `/booking-confirmed` | Page après confirmation réservation |

### Pages Admin (Driver)

| Page | Chemin | Rôle |
|------|--------|------|
| Liste | `/admin/bookings` | Liste de toutes les réservations |
| Détail | `/admin/bookings/[id]` | Détail d'une réservation/devis |
| Nouveau | `/admin/bookings/new` | Créer manuellement une réservation |

### Routes API - Quote (Actions CLIENT)

| Route | Méthode | Action | Email Envoyé |
|-------|---------|--------|--------------|
| `/api/quote/[id]` | GET | Récupérer le devis | ❌ |
| `/api/quote/[id]/accept` | POST | Client accepte | ✅ Client + Driver |
| `/api/quote/[id]/refuse` | POST | Client refuse | ✅ Client + Driver |
| `/api/quote/[id]/comment` | POST | Client commente | ✅ Driver |

### Routes API - Admin (Actions DRIVER)

| Route | Méthode | Action | Email Envoyé |
|-------|---------|--------|--------------|
| `/api/admin/bookings/[id]` | GET/PATCH/DELETE | CRUD booking | ❌ |
| `/api/admin/bookings/[id]/apply-discount` | POST | Appliquer remise | ✅ Client |
| `/api/admin/bookings/[id]/approve` | POST | Approuver (verified→confirmed) | ✅ Client + Driver |
| `/api/admin/bookings/[id]/reject` | POST | Rejeter | ✅ Client |

### Routes API - Booking Creation

| Route | Méthode | Action | Email Envoyé |
|-------|---------|--------|--------------|
| `/api/bookings` | POST | Créer réservation | ✅ Driver |
| `/api/bookings/send-otp` | POST | Envoyer OTP | ✅ Client |
| `/api/bookings/verify-otp` | POST | Vérifier OTP + créer devis | ✅ Client |

---

## 3. Emails Envoyés Actuellement {#emails-actuels}

### Flux Complet avec Tous les Emails

```
                         CRÉATION DEVIS
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
📧 1. OTP Email         📧 2. Nouveau Devis    📧 3. Votre Devis
   → Client                → Driver               → Client
                              │
                              ▼
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Driver applique       Driver confirme      Driver refuse
     remise (-X%)           direct             direct
        │                     │                     │
        ▼                     ▼                     ▼
📧 4. Remise !           (aucun email)        (aucun email)
   → Client                   │                     │
        │                     │                     │
        ▼                     ▼                     ▼
   Client voit page       Status:               Status:
   avec nouveau prix      confirmed           quote_refused
        │
        ▼
   Client peut:
   ├── Accepter
   │   ├── 📧 5. Devis Accepté → Client
   │   └── 📧 6. Notification → Driver
   │
   ├── Refuser
   │   ├── 📧 7. Devis Refusé → Client
   │   └── 📧 8. Notification → Driver
   │
   └── Commenter
       └── 📧 9. Nouveau Commentaire → Driver

TOTAL POSSIBLE: 9 EMAILS pour une seule réservation!
```

### Tableau Récapitulatif des Emails

| # | Moment | Destinataire | Sujet | Route |
|---|--------|--------------|-------|-------|
| 1 | OTP envoyé | Client | "Votre code de vérification" | `/api/bookings/send-otp` |
| 2 | Booking créé | Driver | "Nouvelle demande de devis" | `/api/bookings` (POST) |
| 3 | OTP vérifié | Client | "Votre Devis" | `/api/bookings/verify-otp` |
| 4 | Remise appliquée | Client | "Remise de X%" | `/api/admin/.../apply-discount` |
| 5 | Client accepte | Client | "Devis Accepté" | `/api/quote/[id]/accept` |
| 6 | Client accepte | Driver | "Devis Accepté par X" | `/api/quote/[id]/accept` |
| 7 | Client refuse | Client | "Devis Refusé" | `/api/quote/[id]/refuse` |
| 8 | Client refuse | Driver | "Devis Refusé par X" | `/api/quote/[id]/refuse` |
| 9 | Client commente | Driver | "Nouveau commentaire" | `/api/quote/[id]/comment` |
| 10 | Admin approuve | Client | "Réservation confirmée" | `/api/admin/.../approve` |
| 11 | Admin approuve | Driver | "Réservation confirmée" | `/api/admin/.../approve` |
| 12 | Admin rejette | Client | "Réservation non disponible" | `/api/admin/.../reject` |

---

## 4. Problèmes Identifiés {#problemes}

### ❌ Problème 1: Confusion des Rôles

```
ACTUEL:                              ATTENDU:
Client peut:                         Client peut:
- Accepter le devis ❌               - Voir le devis ✅
- Refuser le devis ❌                - Voir le statut ✅
- Ajouter commentaire ❌             - Contacter driver ✅

Driver peut:                         Driver peut:
- Appliquer remise ✅                - Appliquer remise ✅
- Confirmer le devis ✅              - Accepter la demande ✅
- Refuser le devis ✅                - Refuser la demande ✅
```

### ❌ Problème 2: Trop d'Emails

| Scénario | Emails Actuels | Emails Attendus |
|----------|----------------|-----------------|
| Devis simple accepté | 6 emails | 2 emails |
| Devis avec remise accepté | 8 emails | 2 emails |
| Devis refusé | 4 emails | 2 emails |

### ❌ Problème 3: Incohérence des Textes (Page Client `/quote/[id]`)

| Élément | Texte Actuel | Problème |
|---------|--------------|----------|
| Titre | "BON DE RÉSERVATION" | C'est un DEVIS, pas une réservation |
| Bouton | "Accepter" | Client ne devrait pas accepter |
| Message après "Accepter" | "Notre équipe va confirmer" | Pourquoi confirmer si déjà accepté? |
| Statut | "Devis accepté" | Confusion avec confirmation |

### ❌ Problème 4: Incohérence des Textes (Page Admin `/admin/bookings/[id]`)

| Élément | Texte Actuel | Problème |
|---------|--------------|----------|
| Message status quote_sent | "Le client a demandé un devis. Vous pouvez appliquer une remise ou confirmer directement." | Peu clair |
| Message status quote_accepted | "Le client a accepté le devis. Confirmez pour créer la réservation." | Double confirmation inutile |
| Bouton | "Confirmer le Devis" | Devrait être "Accepter la demande" |
| 2ème Bouton | "Approuver" | Doublon de "Confirmer le Devis" |

### ❌ Problème 5: Multiples Statuts Confus

```
Statuts Actuels:
- pending
- quote_sent
- quote_modified  
- quote_accepted
- quote_refused
- verified
- confirmed
- in_progress
- completed
- cancelled

Statuts Nécessaires:
- quote_pending (demande reçue)
- confirmed (accepté par driver)
- refused (refusé par driver)
- completed (course terminée)
- cancelled (annulé)
```

---

## 5. Nouveau Flux Simplifié {#nouveau-flux}

### Flux Cible

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: CLIENT REMPLIT LE FORMULAIRE                                      │
│  📍 Page: /reservation                                                       │
│                                                                             │
│  - Mêmes champs qu'avant                                                    │
│  - Vérification OTP par email                                               │
│  - Status: quote_pending                                                    │
│  - 📧 Email UNIQUE au DRIVER: "Nouvelle demande de devis"                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: CLIENT VOIT SA DEMANDE (PASSIVE)                                  │
│  📍 Page: /quote/[id]                                                        │
│                                                                             │
│  Affichage UNIQUEMENT:                                                      │
│  - Détails du trajet                                                        │
│  - Prix estimé                                                              │
│  - Statut: "En attente de confirmation"                                     │
│  - Coordonnées pour contact                                                 │
│                                                                             │
│  ❌ Pas de boutons Accepter/Refuser                                         │
│  ❌ Pas de formulaire commentaire                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: DRIVER TRAITE LA DEMANDE                                          │
│  📍 Page: /admin/bookings/[id]                                              │
│                                                                             │
│  Options:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ OPTION A: Accepter                                                    │  │
│  │ - Bouton vert: "Accepter la demande"                                  │  │
│  │ - Status → confirmed                                                  │  │
│  │ - 📧 Email au CLIENT: "Réservation confirmée - XXX€"                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ OPTION B: Appliquer remise + Accepter                                 │  │
│  │ - Clic sur -5%, -8%, ou -12%                                          │  │
│  │ - Puis "Accepter avec remise"                                         │  │
│  │ - Status → confirmed                                                  │  │
│  │ - 📧 Email au CLIENT: "Réservation confirmée - XXX€ (-X%)"            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ OPTION C: Refuser                                                     │  │
│  │ - Bouton rouge: "Refuser la demande"                                  │  │
│  │ - Modal: raison obligatoire                                           │  │
│  │ - Status → refused                                                    │  │
│  │ - 📧 Email au CLIENT: "Demande non disponible - Raison"               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ⬇️
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: CLIENT REÇOIT LA DÉCISION                                         │
│  📍 Page: /quote/[id] (mise à jour automatique)                             │
│                                                                             │
│  Si ACCEPTÉ:                                                                │
│  - Bandeau vert: "Réservation confirmée!"                                   │
│  - Prix final affiché (avec remise si applicable)                           │
│  - Informations chauffeur                                                   │
│  - Récapitulatif trajet                                                     │
│                                                                             │
│  Si REFUSÉ:                                                                 │
│  - Bandeau rouge: "Demande non disponible"                                  │
│  - Raison affichée                                                          │
│  - Lien vers nouvelle demande                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Comparaison Emails

| Scénario | Avant | Après |
|----------|-------|-------|
| Demande créée | 3 emails | **1 email** (Driver) |
| Driver accepte | +2 emails | **+1 email** (Client) |
| Driver + remise + accepte | +3 emails | **+1 email** (Client) |
| Driver refuse | +2 emails | **+1 email** (Client) |
| **TOTAL MAX** | **8 emails** | **2 emails** |

---

## 6. Plan d'Implémentation {#implementation}

### Phase 1: Mise à jour des Statuts

```diff
// lib/db/schema.ts - Simplifier les statuts

- status: 'pending' | 'verified' | 'quote_sent' | 'quote_modified' | 'quote_accepted' | 'quote_refused' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
+ status: 'quote_pending' | 'confirmed' | 'refused' | 'in_progress' | 'completed' | 'cancelled'
```

### Phase 2: Modifier la création de booking

**Fichier**: `app/api/bookings/route.ts`

```diff
- status: 'quote_sent'
+ status: 'quote_pending'
```

**Fichier**: `app/api/bookings/verify-otp/route.ts`

```diff
- status: 'quote_sent'
+ status: 'quote_pending'

- // Email "Votre Devis" au client avec lien d'action
+ // Email simple "Demande reçue" au client (sans CTA)
```

### Phase 3: Supprimer les routes client

**À SUPPRIMER**:
- `app/api/quote/[id]/accept/route.ts`
- `app/api/quote/[id]/refuse/route.ts`
- `app/api/quote/[id]/comment/route.ts`

**À GARDER**:
- `app/api/quote/[id]/route.ts` (GET uniquement)

### Phase 4: Créer route admin unifiée

**Nouveau fichier**: `app/api/admin/bookings/[id]/accept-quote/route.ts`

```typescript
// Logique:
// 1. Vérifier authentification admin
// 2. Récupérer booking
// 3. Appliquer remise si demandée
// 4. Mettre à jour status → 'confirmed'
// 5. Envoyer UN SEUL email au client avec prix final
```

**Modifier**: `app/api/admin/bookings/[id]/reject/route.ts`

```diff
- if (!['verified', 'pending'].includes(booking.status))
+ if (!['quote_pending'].includes(booking.status))

- status: 'cancelled'
+ status: 'refused'
```

### Phase 5: Refondre la page client

**Fichier**: `app/(public)/quote/[id]/page.tsx`

```diff
- // Boutons Accepter/Refuser/Commenter
- {canTakeAction && (
-   <div className="space-y-4">
-     <Button onClick={handleAccept}>Accepter</Button>
-     <Button onClick={handleRefuse}>Refuser</Button>
-     <Button onClick={handleComment}>Commenter</Button>
-   </div>
- )}

+ // Affichage statut uniquement
+ {quote.status === 'quote_pending' && (
+   <StatusBanner type="pending" message="Votre demande est en cours de traitement" />
+ )}
+ {quote.status === 'confirmed' && (
+   <StatusBanner type="success" message="Réservation confirmée!" />
+ )}
+ {quote.status === 'refused' && (
+   <StatusBanner type="error" message="Demande non disponible" reason={quote.rejectionReason} />
+ )}
```

### Phase 6: Simplifier la page admin

**Fichier**: `app/admin/bookings/[id]/page.tsx`

```diff
// Texte du bandeau quote
- {booking.status === 'quote_sent' && 'Le client a demandé un devis...'}
+ {booking.status === 'quote_pending' && 'Nouvelle demande de devis en attente de votre décision.'}

// Boutons d'action
- <Button onClick={acceptQuote}>Confirmer le Devis</Button>
- <Button onClick={refuseQuote}>Refuser</Button>
+ <Button onClick={acceptWithDiscount} className="bg-green-600">
+   {selectedDiscount ? `Accepter avec -${selectedDiscount}%` : 'Accepter'}
+ </Button>
+ <Button onClick={() => setShowRefuseModal(true)} variant="destructive">
+   Refuser
+ </Button>

// Supprimer les anciens boutons
- <Button onClick={approveBooking}>Approuver</Button>
```

### Phase 7: Simplifier les emails

**Templates nécessaires (2 seulement)**:

1. **Email Driver - Nouvelle demande**
```
Sujet: 📄 Nouvelle demande de devis #XXX
Corps: Client, trajet, prix estimé, lien admin
```

2. **Email Client - Décision**
```
Si accepté:
Sujet: ✅ Réservation confirmée - MobiService VTC
Corps: Récap trajet, prix final (avec remise si applicable), contact

Si refusé:
Sujet: ❌ Demande non disponible - MobiService VTC  
Corps: Raison, invitation nouvelle demande
```

---

## Checklist d'Implémentation

### À SUPPRIMER
- [ ] `app/api/quote/[id]/accept/route.ts`
- [ ] `app/api/quote/[id]/refuse/route.ts`
- [ ] `app/api/quote/[id]/comment/route.ts`

### À CRÉER
- [ ] `app/api/admin/bookings/[id]/accept-quote/route.ts`

### À MODIFIER
- [ ] `app/api/bookings/route.ts` - Status initial
- [ ] `app/api/bookings/verify-otp/route.ts` - Email simplifié
- [ ] `app/api/admin/bookings/[id]/apply-discount/route.ts` - Ne pas changer status
- [ ] `app/api/admin/bookings/[id]/reject/route.ts` - Nouveau status
- [ ] `app/(public)/quote/[id]/page.tsx` - Vue passive
- [ ] `app/admin/bookings/[id]/page.tsx` - UX simplifiée
- [ ] `lib/db/schema.ts` - Statuts simplifiés (migration)

### TESTS
- [ ] Créer demande depuis /reservation
- [ ] Vérifier page /quote/[id] sans boutons
- [ ] Driver accepte sans remise → email correct
- [ ] Driver accepte avec remise → email correct
- [ ] Driver refuse → email correct
- [ ] Client voit mise à jour statut

---

## Notes Importantes

### Rétrocompatibilité des Statuts

Pour les réservations existantes avec anciens statuts:
```sql
UPDATE bookings SET status = 'quote_pending' WHERE status IN ('quote_sent', 'quote_modified', 'pending');
UPDATE bookings SET status = 'confirmed' WHERE status IN ('quote_accepted', 'verified');
UPDATE bookings SET status = 'refused' WHERE status = 'quote_refused';
```

### Emails Supprimés

Les emails suivants ne seront PLUS envoyés:
- "Votre Devis" au client (remplacé par vue page)
- "Devis Accepté" (supprimé - client ne décide plus)
- "Devis Refusé par client" (supprimé)
- "Nouveau commentaire" (supprimé)
- "Remise appliquée" (intégré dans email confirmation)

### Comportement Attendu Final

```
1. Client soumet demande
   → Driver reçoit 1 email
   → Client voit page "En attente"

2. Driver prend décision (avec ou sans remise)
   → Client reçoit 1 email de confirmation OU refus
   → Page client mise à jour automatiquement

TOTAL: 2 EMAILS MAX par réservation
```
