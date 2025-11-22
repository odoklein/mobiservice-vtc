# Instructions pour créer les icônes PWA

Les icônes PWA doivent être créées à partir du logo MobiService (`public/Mobiservices-logo.png`).

## Icônes requises

1. **icon-192.png** (192x192px)
   - Placez dans `public/icon-192.png`
   - Format: PNG avec fond transparent ou blanc

2. **icon-512.png** (512x512px)
   - Placez dans `public/icon-512.png`
   - Format: PNG avec fond transparent ou blanc

3. **apple-touch-icon.png** (180x180px)
   - Placez dans `public/apple-touch-icon.png`
   - Format: PNG
   - Note: iOS ajoutera automatiquement des coins arrondis et un effet brillant

## Méthodes pour créer les icônes

### Option 1: Utiliser un outil en ligne
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Option 2: Utiliser un éditeur d'image
1. Ouvrir `public/Mobiservices-logo.png`
2. Redimensionner à chaque taille requise
3. Exporter en PNG
4. Placer dans le dossier `public/`

### Option 3: Utiliser ImageMagick (ligne de commande)
```bash
# Installer ImageMagick si nécessaire
# Puis redimensionner le logo
convert public/Mobiservices-logo.png -resize 192x192 public/icon-192.png
convert public/Mobiservices-logo.png -resize 512x512 public/icon-512.png
convert public/Mobiservices-logo.png -resize 180x180 public/apple-touch-icon.png
```

## Notes importantes

- Les icônes doivent être carrées (ratio 1:1)
- Utilisez le logo complet MobiService VTC
- Assurez-vous que le logo est bien centré
- Pour iOS, l'icône peut avoir un fond coloré (vert MobiService #00FF88)

