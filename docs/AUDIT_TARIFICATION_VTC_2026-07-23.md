# Audit du moteur de tarification VTC

Date : 23 juillet 2026. Périmètre : devis de transfert au départ du dépôt `4 rue des Artisans, 74300 Cluses`.

## Conclusion exécutive

Le moteur actuellement exposé au client n'est pas adapté à une exploitation VTC professionnelle sans correction. Il facture systématiquement le retour au dépôt, ce qui protège partiellement les longues courses, mais il ne valorise pas le temps de conduite. Plus grave, le parcours de devis, le parcours de sauvegarde de réservation et la grille administrable n'emploient pas le même moteur. Un client peut donc voir un prix incluant des péages et de l'attente puis avoir une réservation enregistrée sur un autre prix qui les omet.

La recommandation est un **modèle hybride inspiré de la Méthode B améliorée** : km client et temps réel systématiques, approche plafonnée à 50 %, retour à vide progressif, frais externes exacts et garde-fous métier. Il ne faut pas déployer la Méthode B telle quelle avant de paramétrer son prix de prise en charge, son tarif minute, ses règles d'aéroport/montagne et ses plafonds.

## 1. Faits relevés dans le code

### Les trois moteurs en présence

| Usage | Implémentation | Conséquence |
|---|---|---|
| Estimation affichée pour un transfert | `app/api/pricing/estimate/route.ts` appelle `lib/pricing/tariffs-2026.ts` | Grille codée en dur ; inclut péage x1 A/S ou x2 A/R et attente seulement pour A/R. |
| Réservation enregistrée / prix serveur | `app/api/bookings/route.ts` appelle `lib/pricing.ts` | Grille base de données/fallback distincte ; le péage et l'attente ne lui sont pas transmis. |
| Paramètres administrables | `lib/services/pricing-service.ts` et table `pricing_rules` | Ces paramètres n'alimentent pas l'API d'estimation affichée. |

Cette divergence est critique : le champ administrable `min_price`, les tarifs CA/TP, MDA et aéroport ne constituent pas une source unique de vérité pour le devis client.

### Formule du devis affiché (transfert A/S)

Soit :

- `CA_out` : dépôt → client ;
- `TP` : client → destination ;
- `CA_return` : destination → dépôt ;
- `T` : péage du seul trajet avec client ;
- `rCA` : tarif CA déterminé par le total `CA_out + TP + CA_return` ;
- `rTP` : tarif TP.

Au tarif jour, `rTP = 1,32 €/km`. `rCA` vaut 1,32 €/km jusqu'à 50 km de distance totale, puis 1,10 €/km (50–75), 0,90 €/km (75–100) et 0,70 €/km au-delà de 100 km.

Pour un aller simple hors forfait agglomération :

`Prix TTC = CA_out × rCA + TP × 1,32 + CA_return × rCA + T`

Le total A/R de moins de 25 km bascule sur un forfait de 33 € jour / 47,50 € nuit. Pour un aller-retour client, `TP` et le péage sont doublés, tandis que le retour au dépôt est le trajet pickup → dépôt.

Le tarif nuit s'applique de 20 h à 7 h, les dimanches et jours fériés : TP 1,90 €/km ; CA de 1,90 à 0,70 €/km selon le même palier.

### Variables effectivement prises en compte

| Élément | Devis affiché | Réservation recalculée serveur | Observation |
|---|---|---|---|
| Distance dépôt → client | Oui | Oui | CA, tarifée au palier global. |
| Distance client | Oui | Oui | TP, doublée en A/R. |
| Retour chauffeur | Oui, toujours | Oui, toujours | Facturé à 100 % via le tarif CA ; pas de retour progressif. |
| Durée de conduite | Calculée mais non tarifée | Non tarifée | La durée n'influence pas un transfert. |
| Péages | Oui, T x1 A/S / x2 A/R | Non transmis au calcul | Risque de différence de prix. |
| Attente | Oui uniquement A/R, après 15 min à 1,20 €/min jour ou 1,80 €/min nuit | Non transmise / non calculée pour transfert | Risque de sous-facturation. |
| Zones | Seulement paliers de distance CA | Idem | Aucune zone géographique, saison, relief ou congestion. |
| Aéroport | Pas de logique dédiée dans l'estimation transfert | Forfaits Genève 116 € / Lyon 232 € si `serviceType=airport` | Deux approches contradictoires. |
| Suppléments / remises | Pas dans le calcul de devis | Remise possible après création, par admin | Non paramétrés dans le moteur. |
| Prix minimum | Forfait agglomération seulement | `minPrice` appliqué aux services horaires, pas clairement au transfert hors forfait | Règle non centralisée. |

### Anomalies de conception vérifiables

1. L'API affichée utilise `calculateTransferPrice` (grille dure), alors que l'API de réservation utilise `calculatePrice` (grille BD). Les changements admin ne sont donc pas garantis dans le devis client.
2. Le devis affiché ajoute les péages seulement pour le segment client. Les péages des trajets à vide sont absorbés sans analyse de rentabilité.
3. La réservation serveur recalcule sans `tollCost` ni `waitingMinutes`. Elle peut enregistrer un montant inférieur au devis affiché.
4. Dans `calculatePrice`, le commentaire et le code ajoutent le péage x2, même en aller simple ; l'estimation affichée l'ajoute x1. Dès qu'un péage est transmis à ce moteur, les deux résultats divergent encore.
5. La tarification CA devient 0,70 €/km dès que le total dépasse 100 km. Sur les longues distances, cette baisse est appliquée à **tout** le retour, pas par tranche : effet de seuil et couverture insuffisante du retour réel.
6. La durée routière est récupérée par le routeur mais ne participe pas au prix d'un transfert. Les bouchons, routes de montagne, neige, attente frontière et circulation aéroport sont donc à 0 €.
7. La détection de péages est heuristique (mots-clés d'autoroute et forfaits par distance) et retourne 0 € si la clé Google manque ou si la détection échoue. Ce n'est pas une source de péage transactionnelle.

## 2. Comparaison avec la Méthode B améliorée

| Élément | Moteur actuel | Méthode B améliorée | Impact métier |
|---|---|---|---|
| Distance approche | CA à 100 % du tarif CA | 50 % du tarif/km | B est plus acceptable si le client est éloigné du dépôt ; il faut une indemnité plancher pour éviter les petites courses non rentables. |
| Distance client | 1,32 €/km jour, sans temps | Tarif/km + temps réel | B reflète mieux les axes lents et la montagne. |
| Temps trajet | 0 € | Tarif/minute | Défaut majeur actuel : la productivité chauffeur est ignorée. |
| Retour à vide | Toujours à 100 % du tarif CA ; baisse uniforme à 0,70 €/km sur longues distances | 0 % jusqu'à 50 km, 30 % de 50 à 120, 50 % de 120 à 250, devis au-delà | B évite de facturer un retour court tout en sécurisant les longues distances. |
| Péages | Estimation heuristique, client seulement | Péages exacts | Il faut une API/concessionnaire ou une validation opérateur ; ne pas confondre vignette suisse et péage de course. |
| Attente | A/R seulement, après 15 min | Après 15 min | B doit être appliquée à toute attente constatée, quel que soit le type de course. |
| Longues distances | Réduction forte du CA à 0,70 €/km | Retour gradué puis négociation >250 km | B protège mieux la marge, mais nécessite un plafond/prix commercial. |
| Montagne | Aucun coefficient | Temps réel, à compléter par coefficient saison/route | Le temps corrige une part du sujet ; neige, chaînes et immobilisation exigent une règle dédiée. |
| Aéroport | Forfait séparé ou transfert au km selon le flux | Même formule + frais opérationnels configurables | Une seule formule, avec supplément aéroport explicite, évite les contradictions. |
| Rentabilité chauffeur | Dépend surtout des km ; sensible aux bouchons et péages retour | Dépend des km, minutes et retour ajusté | B est plus stable par heure travaillée. |
| Prix client | Bas sur les trajets longs/lents, parfois opaque | Plus corrélé au service rendu, potentiellement plus élevé | Afficher une décomposition courte et un prix ferme pour préserver la conversion. |

## 3. Simulations Rhône-Alpes — aller simple, tarif jour

### Hypothèses contrôlées

- Prise en charge au dépôt de Cluses : `CA_out = 0 km`.
- Itinéraire routier rapide, hors trafic, passager seul ; aucune attente, remise ou supplément.
- La Méthode B ne définit pas de prix de prise en charge ni de tarif minute. Pour obtenir des chiffres reproductibles, cette simulation prend **0 € de prise en charge**, reprend le tarif jour actuel de **1,32 €/km** et le tarif minute actuel d'attente de **1,20 €/min**. Tout frais de prise en charge ajouté doit s'ajouter à chaque prix B.
- Péage classe 1 du trajet rapide : 0 € Genève Aéroport (trajet sans péage facturé ; la vignette suisse est un coût annuel d'exploitation), 5,10 € Annecy, 0 € Chamonix, 18,90 € Lyon, 17,40 € Grenoble. Les derniers montants sont des estimations de l'itinéraire choisi et doivent être revalidés à la réservation.
- Retour B : 30 % pour Genève et Annecy, 0 % Chamonix, 50 % Lyon et Grenoble.

Sur ces courses, le total A/R est supérieur à 100 km (sauf Chamonix : 82,4 km). Le moteur actuel applique donc un retour à 0,70 €/km sur toutes les autres courses. Sa formule simplifiée est `TP × 2,02 + péage` (et `TP × 2,22` pour Chamonix, palier 75–100).

| Trajet | TP / durée | Péage | Prix actuel TTC | Prix B TTC* | Écart € | Écart % | Lecture commerciale |
|---|---:|---:|---:|---:|---:|---:|---|
| Cluses → Genève Aéroport | 51,4 km / 61 min | 0,00 € | 103,83 € | 161,40 € | +57,57 € | +55,5 % | L'actuel ne paie aucune des 61 min ; B peut être jugée chère sans forfait aéroport ou prix d'appel. |
| Cluses → Annecy | 69 km / 46 min | 5,10 € | 144,48 € | 178,70 € | +34,22 € | +23,7 % | B rémunère le temps sans doubler totalement le retour. Écart commercial encore défendable si le service est premium. |
| Cluses → Chamonix | 41,2 km / 32 min | 0,00 € | 83,22 € | 92,78 € | +9,56 € | +11,5 % | Écart faible, mais le cas montagne justifie une règle hiver/chaînes distincte. |
| Cluses → Lyon Part-Dieu | 185 km / 111 min | 18,90 € | 392,60 € | 518,40 € | +125,80 € | +32,0 % | L'actuel est exposé : 3 h environ d'exploitation avec retour, sans prix du temps et avec péages retour absorbés. B est plus viable, à présenter en devis ferme. |
| Cluses → Grenoble | 159 km / 96 min | 17,40 € | 338,58 € | 447,42 € | +108,84 € | +32,1 % | Même risque de sous-valorisation sur l'axe alpin ; B est plus cohérent avec le temps immobilisé. |

\*B = `0 + approche 0 + TP × 1,32 + durée × 1,20 + TP × 1,32 × taux retour + péage`.

Les distances, durées et péages sont des valeurs d'itinéraires de référence consultées le 23 juillet 2026, hors trafic. Les itinéraires Mappy confirment notamment : Annecy 69 km / 46 min / 5,10 € de péage ; Chamonix 41,2 km / 32 min / 0 € ; Lyon environ 185 km / 1 h 51 / 18,90 € ; Grenoble 159 km / 1 h 36 / 17,40 €. Les écarts de cartographie et de trafic doivent être recalculés à la commande.

## 4. Risques de prix

### Sous-facturation

- **Temps** : toutes les courses de transfert, particulièrement Lyon/Grenoble et les routes de montagne, car la durée est gratuite.
- **Péages retour** : le prix actuel ne récupère que le péage du client. Le retour à vide avec autoroute est supporté par le chauffeur.
- **Péages / attente au paiement** : ils peuvent apparaître au devis puis être absents de la réservation sauvegardée.
- **Longue distance** : le retour est ramené à 0,70 €/km dès le seuil >100 km, sans test de marge par heure ni par km réel.
- **Aéroport et frontière** : attente, dépose, congestion et éventuelle vignette ne sont pas modélisées.

### Sur-facturation ou refus client

- Le retour est facturé à 100 % même pour un trajet court où le chauffeur peut enchaîner localement. Cela peut rendre l'actuel moins lisible qu'un supplément retour gradué.
- L'effet de seuil des paliers CA produit des variations de prix peu intuitives autour de 50, 75 et 100 km.
- Une B calibrée à 1,20 €/min sans frais de prise en charge augmente déjà de 11,5 % à 55,5 % les cinq exemples. Ajouter un forfait de prise en charge sans plafonnement peut dégrader la conversion sur Genève/Chamonix.

## 5. Décision recommandée

### A) Diagnostic actuel

**Le moteur actuel est non adapté pour une plateforme VTC professionnelle en exploitation terrain**, surtout pour les longues distances, les axes alpins, les aéroports et les réservations avec attente. Il peut convenir comme prototype de calcul kilométrique simple à faible volume, mais pas comme moteur de devis, de réservation et de facturation fiable.

### B) Forces

- Les trois segments dépôt → client → destination → dépôt sont explicitement calculés.
- Les règles jour/nuit, dimanche et jours fériés sont définies.
- Le forfait d'agglomération évite les micro-prix.
- L'attente après 15 minutes existe dans le moteur de devis A/R.
- Les péages sont distingués de la TVA transport dans le moteur d'estimation.

### C) Faiblesses

- Absence de source unique de vérité tarifaire.
- Absence de tarification du temps de conduite pour les transferts.
- Péages non fiables et incohérents entre flux.
- Attente, suppléments, remises, aéroport, montagne et minimum non orchestrés dans une même formule.
- Retour facturé de façon rigide, sans analyse de chance de réaffectation chauffeur.
- Aucun contrôle de marge minimale, de durée maximale ou de validation manuelle au-delà d'un seuil.

### D) Recommandation

**Créer un modèle hybride**, fondé sur la Méthode B améliorée, plutôt que conserver le moteur actuel ou reprendre B sans garde-fous.

La formule recommandée, TTC, est :

`max(prix minimum, prise en charge + km approche × 50 % × taux km + km client × taux km + minutes réelles × taux minute + retour à vide gradué + péages exacts + attente après franchise + suppléments - remise)`

avec :

- retour 0 / 30 / 50 % selon 0–50 / 50–120 / 120–250 km ;
- au-delà de 250 km : devis manuel ou forfait préconfiguré ;
- péages facturés selon une politique explicite : ceux du trajet client en débours/ligne séparée, ceux du retour inclus dans le coefficient retour ou dans une marge minimale ;
- une grille aéroport / montagne / hiver explicite, jamais implicite dans un libellé ;
- une marge plancher par course et par heure chauffeur, avec validation manuelle si elle n'est pas atteinte.

### E) Architecture cible

1. **Un service de pricing unique côté serveur** : un seul `calculateQuote(input, pricingVersion)` appelé par estimation, création, paiement, devis PDF et administration.
2. **Entrées routières immuables** : segments, durée trafic, itinéraire, péages, devise/vignette, horodatage et fournisseur de cartographie sont conservés dans le devis.
3. **Configuration versionnée en base** : taux km/min, prise en charge, retour, franchise attente, zones/suppléments, TVA, minimums et règles de validation. Un devis conserve la version utilisée.
4. **Moteur de règles explicable** : retourner chaque ligne de prix (approche, km client, temps, retour, péage, attente, supplément, remise), avec total HT/TTC et règles déclenchées.
5. **Garde-fous** : plafonds de remise, contrôle de marge, validation humaine pour >250 km, météo/chaînes, péage ou route indisponible, attente inconnue et franchissement frontière.
6. **Tests de non-régression** : les cinq trajets de ce rapport, de jour/nuit, en A/S et A/R, avec/sans attente/péage ; même résultat obligatoire entre écran, API de réservation, paiement et facture.

