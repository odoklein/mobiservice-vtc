# 📄 Système de Gestion des Documents PDF - Guide Complet

## ✅ Nouveautés (commit `b978a6d`)

### 1. Stockage Séparé des Documents

Chaque type de document a maintenant son propre champ dans la base de données:

| Type | Champ DB | Description |
|------|----------|-------------|
| Devis | `devis_pdf_url` | URL Blob du devis |
| Facture | `facture_pdf_url` | URL Blob de la facture |
| Bon de commande | `bon_commande_pdf_url` | URL Blob du bon |
| Bon de réservation | `bon_reservation_pdf_url` | URL Blob du BDR |

### 2. Nouvelle API de Génération

**POST** `/api/admin/bookings/{id}/generate-pdf?type=facture`

**Réponse JSON**:
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/facture-123-xxx.pdf",
  "filename": "facture-123-xxx.pdf",
  "type": "facture",
  "bookingId": 123,
  "message": "Facture générée avec succès",
  "actions": {
    "download": "https://blob.vercel-storage.com/...",
    "sendToClient": "/api/admin/bookings/123/send-document?type=facture&recipient=client",
    "sendToDriver": "/api/admin/bookings/123/send-document?type=facture&recipient=driver"
  }
}
```

### 3. API d'Envoi par Email

**POST** `/api/admin/bookings/{id}/send-document?type=facture&recipient=client`

Envoie le document par email avec:
- ✅ Email stylé avec couleurs MobiService (#00FF88)
- ✅ Lien direct vers le PDF dans Blob Storage
- ✅ Détails de la réservation
- ✅ Support client et chauffeur

## 🔧 Migration Base de Données

**IMPORTANT**: Exécutez ce SQL dans Neon Console:

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS devis_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS facture_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_commande_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bon_reservation_pdf_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_pdf_generated_at TIMESTAMP;
```

📁 **Script complet**: `migrations/add-pdf-url-fields.sql`

## 🎯 Comment Utiliser (Frontend)

### Étape 1: Générer le Document

```javascript
async function generatePDF(bookingId, type) {
  const response = await fetch(`/api/admin/bookings/${bookingId}/generate-pdf?type=${type}`, {
    method: 'POST',
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Document généré avec succès
    console.log('PDF URL:', data.url);
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Étape 2: Afficher les Options à l'Admin

```javascript
// Après génération réussie
const options = [
  {
    label: 'Télécharger',
    action: () => window.open(data.url, '_blank'),
    icon: '📥'
  },
  {
    label: 'Envoyer au client',
    action: () => sendDocument(bookingId, type, 'client'),
    icon: '📧'
  },
  {
    label: 'Envoyer au chauffeur',
    action: () => sendDocument(bookingId, type, 'driver'),
    icon: '🚗'
  },
  {
    label: 'Copier le lien',
    action: () => navigator.clipboard.writeText(data.url),
    icon: '🔗'
  }
];
```

### Étape 3: Envoyer par Email

```javascript
async function sendDocument(bookingId, type, recipient) {
  const response = await fetch(
    `/api/admin/bookings/${bookingId}/send-document?type=${type}&recipient=${recipient}`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  
  if (data.success) {
    alert(`Document envoyé à ${data.recipient}`);
  } else {
    alert(data.message);
  }
}
```

## 🎨 Exemple d'Interface Admin

```tsx
// Dans la page de détail booking
function BookingDocuments({ booking }) {
  const [generating, setGenerating] = useState(false);
  
  const generateAndShow = async (type) => {
    setGenerating(true);
    try {
      const result = await generatePDF(booking.id, type);
      
      // Modal avec options
      showModal({
        title: `${type === 'facture' ? 'Facture' : 'Devis'} généré`,
        message: 'Document prêt. Que souhaitez-vous faire ?',
        buttons: [
          {
            label: 'Télécharger',
            onClick: () => window.open(result.url, '_blank'),
            primary: true
          },
          {
            label: 'Envoyer au client',
            onClick: () => sendDocument(booking.id, type, 'client')
          },
          {
            label: 'Envoyer au chauffeur',
            onClick: () => sendDocument(booking.id, type, 'driver')
          }
        ]
      });
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-bold">Documents</h3>
      
      <div className="flex gap-2">
        <button 
          onClick={() => generateAndShow('devis')}
          disabled={generating}
          className="btn btn-primary"
        >
          {booking.devisPdfUrl ? '🔄 Régénérer' : '➕ Générer'} Devis
        </button>
        
        <button 
          onClick={() => generateAndShow('facture')}
          disabled={generating}
          className="btn btn-primary"
        >
          {booking.facturePdfUrl ? '🔄 Régénérer' : '➕ Générer'} Facture
        </button>
        
        <button 
          onClick={() => generateAndShow('bon')}
          disabled={generating}
          className="btn btn-secondary"
        >
          Bon de commande
        </button>
      </div>
      
      {/* Afficher les documents existants */}
      {booking.devisPdfUrl && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <span>📄 Devis</span>
          <a href={booking.devisPdfUrl} target="_blank" className="link">
            Voir
          </a>
          <button onClick={() => sendDocument(booking.id, 'devis', 'client')}>
            Envoyer
          </button>
        </div>
      )}
      
      {booking.facturePdfUrl && (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <span>📄 Facture</span>
          <a href={booking.facturePdfUrl} target="_blank" className="link">
            Voir
          </a>
          <button onClick={() => sendDocument(booking.id, 'facture', 'client')}>
            Envoyer
          </button>
        </div>
      )}
    </div>
  );
}
```

## 📧 Template Email

L'email envoyé inclut:
- ✅ Header avec logo MobiService (couleurs design system)
- ✅ Détails de la réservation (date, trajet, passagers)
- ✅ Bouton CTA pour télécharger le PDF
- ✅ Footer avec coordonnées
- ✅ Version texte brut pour compatibilité

## 🔒 Sécurité

- ✅ Authentification admin requise
- ✅ Validation du booking ID
- ✅ Vérification que le document existe avant envoi
- ✅ Logs détaillés de chaque action
- ✅ URLs Blob publiques mais non listables

## ⚙️ Variables d'Environnement

```bash
# Requis pour upload PDF
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx

# Requis pour envoi email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@mobiservice-vtc.fr

# Optionnel pour envoi au chauffeur
DRIVER_EMAIL=chauffeur@mobiservice-vtc.fr
```

## 🧪 Test Manuel

### 1. Tester la génération

```bash
curl -X POST https://votre-domaine.com/api/admin/bookings/1/generate-pdf?type=facture \
  -H "Cookie: admin_token=xxx"
```

### 2. Tester l'envoi email

```bash
curl -X POST "https://votre-domaine.com/api/admin/bookings/1/send-document?type=facture&recipient=client" \
  -H "Cookie: admin_token=xxx"
```

## 📊 Workflow Complet

```
Admin Dashboard
    ↓
Cliquer "Générer Facture"
    ↓
POST /api/admin/bookings/1/generate-pdf?type=facture
    ↓
@react-pdf/renderer génère le PDF
    ↓
Upload vers Vercel Blob
    ↓
Sauver facture_pdf_url dans DB
    ↓
Retourner JSON avec URL + actions
    ↓
Frontend affiche modal avec options:
  - Télécharger
  - Envoyer au client
  - Envoyer au chauffeur
  - Copier lien
    ↓
Si "Envoyer au client":
  POST /api/admin/bookings/1/send-document?type=facture&recipient=client
    ↓
  Resend envoie email avec lien PDF
    ↓
  Client reçoit email et peut télécharger
```

## 🎯 Prochaines Étapes

1. **Appliquer la migration SQL** (`migrations/add-pdf-url-fields.sql`)
2. **Attendre le déploiement Vercel**
3. **Mettre à jour le frontend** pour gérer la réponse JSON
4. **Tester la génération** de chaque type de document
5. **Tester l'envoi email** au client et chauffeur

---

**Status**: ✅ Backend complet | ⏳ Frontend à mettre à jour  
**Commit**: `b978a6d`  
**Date**: 2025-12-21

