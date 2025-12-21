# Configuration PDF Génération - MobiService VTC

## Variables d'environnement requises

### Vercel Blob Storage (REQUIS pour la sauvegarde des PDFs)
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Obtenir le token:
1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. Storage → Blob → Create Store
4. Copier le token généré

### URL de l'application (pour les liens dans les emails)
```bash
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

En local: `http://localhost:3000`

### Chrome Path (OPTIONNEL - pour développement local uniquement)
```bash
CHROME_PATH=/usr/bin/google-chrome
# ou sur macOS:
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
# ou sur Windows:
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

⚠️ **Note**: En production sur Vercel, Chromium est fourni par `@sparticuz/chromium` automatiquement.

## Test en local

### 1. Installer Chrome (si pas déjà installé)

**macOS**: 
```bash
brew install --cask google-chrome
```

**Ubuntu/Debian**:
```bash
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install google-chrome-stable
```

**Windows**: Télécharger depuis https://www.google.com/chrome/

### 2. Configurer les variables d'environnement

Copier `.env.local.example` vers `.env.local` et remplir les valeurs.

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

### 4. Tester l'endpoint

**Option A: Accès admin (avec authentification)**
```bash
# 1. Se connecter en tant qu'admin via le dashboard
# 2. Accéder directement à:
http://localhost:3000/api/estimate/1
```

**Option B: Accès client (avec OTP)**
```bash
# 1. Demander un OTP
curl -X POST http://localhost:3000/api/bookings/1/request-devis \
  -H "Content-Type: application/json" \
  -d '{"email": "client@example.com"}'

# 2. Récupérer le code OTP dans les logs ou l'email
# 3. Accéder au PDF avec le code:
http://localhost:3000/api/estimate/1?email=client@example.com&otp=123456
```

## Déploiement sur Vercel

### 1. Configurer les variables d'environnement

Dans le dashboard Vercel → Settings → Environment Variables:

- `BLOB_READ_WRITE_TOKEN` (obligatoire)
- `NEXT_PUBLIC_APP_URL` (obligatoire)
- Toutes les autres variables du projet (DATABASE_URL, STRIPE, etc.)

### 2. Déployer

```bash
git push origin main
```

Vercel déploiera automatiquement.

### 3. Vérifier la configuration

Le fichier `vercel.json` est déjà configuré pour:
- `maxDuration: 30s` (génération PDF peut prendre 10-15s)
- `memory: 1024MB` (Puppeteer + Chrome nécessitent de la mémoire)

## Résolution de problèmes

### Erreur: "BLOB_READ_WRITE_TOKEN n'est pas configuré"
→ Ajouter la variable d'environnement dans Vercel ou `.env.local`

### Erreur: "Chrome executable not found"
→ En local: installer Chrome et configurer `CHROME_PATH`
→ Sur Vercel: vérifier que `@sparticuz/chromium` est bien installé

### PDF ne se génère pas (timeout)
→ Vérifier que la fonction a bien 30s de timeout dans `vercel.json`
→ Vérifier les logs Vercel pour voir l'erreur exacte

### Cold start très lent (> 10s)
→ Normal pour le premier appel (Puppeteer + Chrome)
→ Les appels suivants sont plus rapides (< 5s)

### Erreur: "Booking not found"
→ Vérifier que la réservation existe dans la DB
→ Vérifier l'ID dans l'URL

### Erreur: "Non autorisé"
→ Pour admin: vérifier que vous êtes connecté
→ Pour client: vérifier l'email et le code OTP

## Architecture

```
Client/Admin
    ↓
GET /api/estimate/[bookingId]?email=X&otp=Y
    ↓
Vérification accès (admin JWT ou client OTP)
    ↓
Récupération booking + settings (DB)
    ↓
Génération HTML (generator-enhanced.ts)
    ↓
Conversion HTML → PDF (Puppeteer + Chromium)
    ↓
Upload Vercel Blob Storage
    ↓
Stream PDF au client
```

## Performance

- **Première génération**: 10-15s (cold start Puppeteer)
- **Générations suivantes**: 3-5s
- **Cache**: PDF sauvegardé dans Blob Storage
- **Régénération**: Ajouter `?regenerate=true` à l'URL

## Sécurité

- ✅ Authentification hybride (admin + client)
- ✅ OTP expire en 10 minutes
- ✅ Validation email/booking
- ✅ Pas d'exposition d'infos sensibles
- ✅ Rate limiting recommandé (à implémenter)

## Coûts estimés

- **Vercel Blob Storage**: ~$0.15/GB/mois + $0.02/GB transfert
- **Vercel Functions**: Inclus dans le plan (limite: 100 GB-hours/mois sur Hobby)
- **PDF moyen**: ~200-500 KB
- **1000 PDFs/mois**: ~$0.10-0.20

## Prochaines améliorations

- [ ] Rate limiting sur l'endpoint public
- [ ] Webhook pour régénération automatique si booking modifié
- [ ] Support multi-langue (EN, IT)
- [ ] Compression PDF pour réduire la taille
- [ ] Analytics sur les téléchargements

