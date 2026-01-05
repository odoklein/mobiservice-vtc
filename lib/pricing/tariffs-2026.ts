// Grille Tarifaire 2026 - Règles détaillées selon message client
// CA = Coût Additionnel (dépôt → pickup ou dropoff → dépôt)
// TP = Trajet Principal (pickup → dropoff)
// A/S = Aller Simple
// A/R = Aller Retour

import { isFrenchHoliday } from '../holidays';

// Taux de TVA différenciés selon le type de prestation
export const TVA_RATE_TRANSPORT = 0.10; // 10% - TVA sur le trajet (courses)
export const TVA_RATE_TOLL = 0.20; // 20% - TVA sur les péages d'autoroute
export const TVA_RATE_MDA = 0.20; // 20% - TVA sur les mises à disposition horaires

// Export pour compatibilité avec code existant
export const TVA_RATE = TVA_RATE_TRANSPORT;

// Dépôt VTC (fixe)
export const VTC_DEPOT_ADDRESS = '4 rue des artisans, 74300 Cluses';
export const VTC_DEPOT_COORDS = {
  lat: 46.0624,
  lng: 6.5813,
};

// Forfait agglomération (≤ 25 km A/R total)
export const FORFAIT_AGGLOMERATION = {
  day: { ht: 30.00, ttc: 33.00 },
  night: { ht: 43.18, ttc: 47.50 },
  maxKm: 25,
};

// Tarifs JOUR (7h-20h sauf Dim & JF)
export const DAY_RATES = {
  // Tarif TP (constant pour tous les seuils)
  TP_RATE: 1.32, // €/km TTC

  // Tarifs CA selon seuils (€/km TTC)
  CA_RATES: {
    '0-25': 1.32,   // Forfait agglomération (plancher)
    '25-50': 1.32,  // > 25km jusqu'à 50km (A/S ou A/R)
    '50-75': 1.10,  // > 50km jusqu'à 75km (A/S ou A/R)
    '75-100': 0.90, // > 75km jusqu'à 100km (A/S ou A/R)
    '100+': 0.70,   // > 100km (A/S ou A/R)
  },
};

// Tarifs NUIT (20h-7h + Dim & JF)
export const NIGHT_RATES = {
  // Tarif TP (constant pour tous les seuils)
  TP_RATE: 1.90, // €/km TTC

  // Tarifs CA selon seuils (€/km TTC)
  CA_RATES: {
    '0-25': 1.90,   // Forfait agglomération (plancher)
    '25-50': 1.70,  // > 25km jusqu'à 50km (A/S ou A/R)
    '50-75': 1.40,  // > 50km jusqu'à 75km (A/S ou A/R)
    '75-100': 1.10, // > 75km jusqu'à 100km (A/S ou A/R)
    '100+': 0.70,   // > 100km (A/S ou A/R)
  },
};

/**
 * Détermine si c'est un tarif nuit
 * Nuit: 20h-7h OU dimanche OU jour férié français
 */
export function isNightRate(date?: Date): boolean {
  if (!date) return false;

  const hours = date.getHours();
  const day = date.getDay();

  // Plage horaire nuit (20h-7h)
  const isNightHours = hours >= 20 || hours < 7;

  // Dimanche
  const isSunday = day === 0;

  // Jour férié français
  const isHoliday = isFrenchHoliday(date);

  // Debug logging
  const result = isNightHours || isSunday || isHoliday;
  if (result) {
    console.log('[PRICING] Tarif nuit détecté:', {
      date: date.toISOString(),
      localHours: hours,
      localDay: day,
      dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][day],
      isNightHours,
      isSunday,
      isHoliday,
    });
  }

  return result;
}

/**
 * Détermine le bracket de distance pour le tarif CA
 * Basé sur le total A/R: CA_out + TP + CA_return
 */
export function getDistanceBracket(totalDistanceRoundTrip: number): keyof typeof DAY_RATES.CA_RATES {
  if (totalDistanceRoundTrip <= 25) return '0-25';
  if (totalDistanceRoundTrip <= 50) return '25-50';
  if (totalDistanceRoundTrip <= 75) return '50-75';
  if (totalDistanceRoundTrip <= 100) return '75-100';
  return '100+';
}

/**
 * Structure de debug AMÉLIORÉE - Affichage clair et compréhensible
 * Format lisible pour comprendre facilement le calcul du prix
 */
export interface PricingDebugInfo {
  // ═══════════════════════════════════════════════════════════════
  // 1. HORAIRE ET TARIFICATION
  // ═══════════════════════════════════════════════════════════════
  horaireTarification: {
    typeApplique: 'JOUR' | 'NUIT';
    explicationSimple: string; // Ex: "Tarif JOUR car 14h00 le Lundi"
    details: {
      heureReservation: string; // Ex: "14:00"
      jourSemaine: string; // Ex: "Lundi"
      estHeureDeNuit: boolean; // 20h-7h
      estDimanche: boolean;
      estJourFerie: boolean;
    };
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. DISTANCES DU TRAJET
  // ═══════════════════════════════════════════════════════════════
  distances: {
    depotVersDepart: number; // km - Dépôt → Lieu de prise en charge
    trajetClient: number; // km - Prise en charge → Destination (LE CLIENT EST DANS LA VOITURE)
    destinationVersDepot: number; // km - Destination → Retour dépôt
    distanceTotale: number; // km - Total aller-retour
    explicationSimple: string; // Ex: "12km + 35km + 15km = 62km au total"
  };

  // ═══════════════════════════════════════════════════════════════
  // 3. GRILLE TARIFAIRE APPLIQUÉE
  // ═══════════════════════════════════════════════════════════════
  grilleTarifaire: {
    palierDistance: string; // Ex: "50-75 km"
    explicationPalier: string; // Ex: "Distance totale (62km) → palier 50-75km"
    tarifsAppliques: {
      prixKmDeplacement: number; // €/km pour trajets dépôt (CA)
      prixKmClient: number; // €/km pour trajet client (TP)
    };
  };

  // ═══════════════════════════════════════════════════════════════
  // 4. CALCUL DÉTAILLÉ (étape par étape)
  // ═══════════════════════════════════════════════════════════════
  calculDetaille: {
    etapes: Array<{
      numero: number;
      description: string; // Description claire en français
      calcul: string; // Ex: "12 km × 1,10 €/km"
      montant: number; // Résultat en €
    }>;
    sousTotalAvantPeages: number;
  };

  // ═══════════════════════════════════════════════════════════════
  // 5. PÉAGES (uniquement quand client dans véhicule)
  // ═══════════════════════════════════════════════════════════════
  peages: {
    concerne: boolean; // Y a-t-il des péages ?
    explication: string; // Ex: "Péages A40 sur trajet client: 8,90€"
    montantUnitaire: number; // Coût aller simple
    multiplicateur: number; // 1 pour A/S, 2 pour A/R
    montantTotal: number; // Montant final inclus
    tvaAppliquee: string; // "20%"
    note: string; // "Les péages des trajets chauffeur seul ne sont pas facturés au client"
  };

  // ═══════════════════════════════════════════════════════════════
  // 6. FORFAIT AGGLOMÉRATION (si applicable)
  // ═══════════════════════════════════════════════════════════════
  forfaitAgglomeration: {
    applique: boolean;
    explication: string; // Ex: "Distance ≤ 25km → forfait agglomération 33€"
    seuil: number; // 25 km
    prixForfait: number | null;
  };

  // ═══════════════════════════════════════════════════════════════
  // 7. TVA DÉTAILLÉE
  // ═══════════════════════════════════════════════════════════════
  tvaDetails: {
    tvaTransport: { taux: string; montant: number }; // 10% sur le trajet
    tvaPeages: { taux: string; montant: number }; // 20% sur les péages
    tvaTotale: number;
    explication: string; // Ex: "TVA transport (10%): 5,80€ + TVA péages (20%): 1,78€"
  };

  // ═══════════════════════════════════════════════════════════════
  // 8. RÉSUMÉ FINAL (format lisible pour affichage)
  // ═══════════════════════════════════════════════════════════════
  resumeFinal: {
    lignes: string[]; // Résumé ligne par ligne
    prixFinalTTC: number;
    prixFinalHT: number;
  };
}

/**
 * Calcule le prix selon la logique détaillée
 * RÈGLE N°1 (NON NÉGOCIABLE): Toutes les estimations sont calculées en ALLER et RETOUR
 * par rapport au point de départ du chauffeur VTC (point de dépôt).
 * 
 * TVA DIFFÉRENCIÉE:
 * - 10% sur le transport (courses)
 * - 20% sur les péages d'autoroute
 * 
 * @param distanceCA_out Distance dépôt → pickup (km)
 * @param distanceTP Distance pickup → dropoff (km)
 * @param distanceCA_return Distance dropoff → dépôt (km) - TOUJOURS inclus
 * @param tripType 'one-way' ou 'round-trip' (affecte TP x2 et péages x2 pour A/R)
 * @param pickupTime Date/heure de prise en charge
 * @param tollCost Coût des péages (€ TTC) - UNIQUEMENT sur trajet client (pickup→dropoff)
 */
export function calculateTransferPrice(
  distanceCA_out: number,
  distanceTP: number,
  distanceCA_return: number,
  tripType: 'one-way' | 'round-trip',
  pickupTime: Date,
  tollCost: number = 0
): {
  totalTTC: number;
  totalHT: number;
  tva: number;
  breakdown: {
    costCA_out: number;
    costTP: number;
    costCA_return: number;
    tollCost: number;
    isForfaitAgglomeration: boolean;
    bracket: string;
    pricePerKmCA: number;
    pricePerKmTP: number;
  };
  isNightRate: boolean;
  debugInfo: PricingDebugInfo;
} {
  const hours = pickupTime.getHours();
  const dayOfWeek = pickupTime.getDay();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const isNightHours = hours >= 20 || hours < 7;
  const isSunday = dayOfWeek === 0;
  const isHoliday = isFrenchHoliday(pickupTime);

  const night = isNightHours || isSunday || isHoliday;
  const rates = night ? NIGHT_RATES : DAY_RATES;

  // ═══════════════════════════════════════════════════════════════
  // CALCULS DE BASE
  // ═══════════════════════════════════════════════════════════════

  // RÈGLE N°1: Le retour au dépôt est TOUJOURS inclus dans le calcul
  const totalDistanceRoundTrip = distanceCA_out + distanceTP + distanceCA_return;

  // Bracket pour déterminer le tarif CA
  const bracket = getDistanceBracket(totalDistanceRoundTrip);
  const pricePerKmCA = rates.CA_RATES[bracket];
  const pricePerKmTP = rates.TP_RATE;

  // Vérifier si on applique le forfait agglomération
  const isForfaitAgglomeration = totalDistanceRoundTrip <= FORFAIT_AGGLOMERATION.maxKm;

  let costCA_out = 0;
  let costTP = 0;
  let costCA_return = 0;
  let transportTTC = 0;

  const etapesCalcul: PricingDebugInfo['calculDetaille']['etapes'] = [];
  let etapeNum = 1;

  if (isForfaitAgglomeration) {
    // Forfait agglomération: prix fixe (≤ 25km A/R)
    const forfaitPrice = night ? FORFAIT_AGGLOMERATION.night.ttc : FORFAIT_AGGLOMERATION.day.ttc;
    transportTTC = forfaitPrice;

    etapesCalcul.push({
      numero: etapeNum++,
      description: `Forfait agglomération appliqué (≤ ${FORFAIT_AGGLOMERATION.maxKm} km)`,
      calcul: `Prix fixe ${night ? 'NUIT' : 'JOUR'}`,
      montant: forfaitPrice,
    });

    // Breakdown théorique pour admin
    costCA_out = distanceCA_out * pricePerKmCA;
    costTP = tripType === 'round-trip' ? distanceTP * pricePerKmTP * 2 : distanceTP * pricePerKmTP;
    costCA_return = distanceCA_return * pricePerKmCA;
  } else {
    // Tarification au km selon les brackets

    // Étape 1: Déplacement dépôt → lieu de prise en charge
    costCA_out = distanceCA_out * pricePerKmCA;
    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Déplacement: Dépôt → Lieu de prise en charge',
      calcul: `${distanceCA_out.toFixed(1)} km × ${pricePerKmCA.toFixed(2)} €/km`,
      montant: Math.round(costCA_out * 100) / 100,
    });

    // Étape 2: Trajet client (le client est dans la voiture)
    if (tripType === 'round-trip') {
      costTP = distanceTP * pricePerKmTP * 2;
      etapesCalcul.push({
        numero: etapeNum++,
        description: 'Trajet client (A/R): Prise en charge ↔ Destination × 2',
        calcul: `${distanceTP.toFixed(1)} km × ${pricePerKmTP.toFixed(2)} €/km × 2`,
        montant: Math.round(costTP * 100) / 100,
      });
    } else {
      costTP = distanceTP * pricePerKmTP;
      etapesCalcul.push({
        numero: etapeNum++,
        description: 'Trajet client: Prise en charge → Destination',
        calcul: `${distanceTP.toFixed(1)} km × ${pricePerKmTP.toFixed(2)} €/km`,
        montant: Math.round(costTP * 100) / 100,
      });
    }

    // Étape 3: Retour au dépôt (TOUJOURS inclus)
    costCA_return = distanceCA_return * pricePerKmCA;
    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Retour: Destination → Dépôt (toujours inclus)',
      calcul: `${distanceCA_return.toFixed(1)} km × ${pricePerKmCA.toFixed(2)} €/km`,
      montant: Math.round(costCA_return * 100) / 100,
    });

    transportTTC = costCA_out + costTP + costCA_return;
    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Sous-total transport',
      calcul: `${costCA_out.toFixed(2)}€ + ${costTP.toFixed(2)}€ + ${costCA_return.toFixed(2)}€`,
      montant: Math.round(transportTTC * 100) / 100,
    });
  }

  const sousTotalAvantPeages = transportTTC;

  // ═══════════════════════════════════════════════════════════════
  // PÉAGES (uniquement sur trajet client - pickup → dropoff)
  // ═══════════════════════════════════════════════════════════════

  // RÈGLE IMPORTANTE: Péages x1 pour A/S, x2 pour A/R
  // LES PÉAGES NE SONT COMPTÉS QUE LORSQUE LE CLIENT EST DANS LE VÉHICULE
  const multiplicateurPeage = tripType === 'round-trip' ? 2 : 1;
  const peageTotal = tollCost * multiplicateurPeage;

  let explicationPeage = '';
  if (tollCost > 0) {
    if (tripType === 'round-trip') {
      explicationPeage = `Péages trajet client: ${tollCost.toFixed(2)}€ × 2 (A/R) = ${peageTotal.toFixed(2)}€`;
    } else {
      explicationPeage = `Péages trajet client: ${tollCost.toFixed(2)}€`;
    }
    etapesCalcul.push({
      numero: etapeNum++,
      description: `Péages autoroute${tripType === 'round-trip' ? ' (×2 pour A/R)' : ''}`,
      calcul: explicationPeage,
      montant: peageTotal,
    });
  } else {
    explicationPeage = 'Aucun péage sur ce trajet';
  }

  // ═══════════════════════════════════════════════════════════════
  // CALCUL TVA DIFFÉRENCIÉE
  // ═══════════════════════════════════════════════════════════════

  // TVA Transport: 10%
  const transportHT = Math.round((transportTTC / (1 + TVA_RATE_TRANSPORT)) * 100) / 100;
  const tvaTransport = Math.round((transportTTC - transportHT) * 100) / 100;

  // TVA Péages: 20%
  const peageHT = Math.round((peageTotal / (1 + TVA_RATE_TOLL)) * 100) / 100;
  const tvaPeages = Math.round((peageTotal - peageHT) * 100) / 100;

  // Totaux
  const totalTTC = Math.round((transportTTC + peageTotal) * 100) / 100;
  const totalHT = Math.round((transportHT + peageHT) * 100) / 100;
  const tvaTotale = Math.round((tvaTransport + tvaPeages) * 100) / 100;

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCTION DU DEBUG INFO (format lisible)
  // ═══════════════════════════════════════════════════════════════

  // Explication horaire
  let explicationHoraire = '';
  if (night) {
    const raisons: string[] = [];
    if (isNightHours) raisons.push(`${hours}h (horaire de nuit: 20h-7h)`);
    if (isSunday) raisons.push('dimanche');
    if (isHoliday) raisons.push('jour férié');
    explicationHoraire = `Tarif NUIT appliqué car ${raisons.join(' + ')}`;
  } else {
    explicationHoraire = `Tarif JOUR appliqué: ${hours}h le ${dayNames[dayOfWeek]}`;
  }

  // Résumé final minimaliste
  const lignesResume: string[] = [
    ``,
    `ESTIMATION TARIFAIRE`,
    `─────────────────────────────────────────────────`,
    ``,
    `Réservation: ${dayNames[dayOfWeek]} à ${hours}h${pickupTime.getMinutes().toString().padStart(2, '0')}`,
    `Type de trajet: ${tripType === 'round-trip' ? 'Aller-Retour' : 'Aller Simple'}`,
    `Tarif appliqué: ${night ? 'NUIT' : 'JOUR'}`,
    ``,
    `DISTANCES:`,
    `  Dépôt vers départ client: ${distanceCA_out.toFixed(1)} km`,
    `  Trajet client: ${distanceTP.toFixed(1)} km${tripType === 'round-trip' ? ' × 2' : ''}`,
    `  Retour vers dépôt: ${distanceCA_return.toFixed(1)} km`,
    `  Total aller-retour: ${totalDistanceRoundTrip.toFixed(1)} km`,
    ``,
    `TARIFICATION (palier ${bracket}):`,
  ];

  if (isForfaitAgglomeration) {
    lignesResume.push(`  Forfait agglomération: ${night ? '47,50' : '33,00'}€ TTC`);
  } else {
    lignesResume.push(`  Déplacement: ${pricePerKmCA.toFixed(2)}€/km`);
    lignesResume.push(`  Trajet client: ${pricePerKmTP.toFixed(2)}€/km`);
  }

  lignesResume.push(``);
  lignesResume.push(`MONTANTS:`);
  lignesResume.push(`  Transport: ${transportTTC.toFixed(2)}€ TTC (TVA 10%)`);

  if (peageTotal > 0) {
    lignesResume.push(`  Péages: ${peageTotal.toFixed(2)}€ TTC (TVA 20%)`);
    lignesResume.push(`  Note: Péages uniquement sur trajet client`);
  }

  lignesResume.push(``);
  lignesResume.push(`─────────────────────────────────────────────────`);
  lignesResume.push(`TOTAL TTC: ${totalTTC.toFixed(2)}€`);
  lignesResume.push(`  dont TVA: ${tvaTotale.toFixed(2)}€`);
  lignesResume.push(`  HT: ${totalHT.toFixed(2)}€`);
  lignesResume.push(`─────────────────────────────────────────────────`);

  const debugInfo: PricingDebugInfo = {
    horaireTarification: {
      typeApplique: night ? 'NUIT' : 'JOUR',
      explicationSimple: explicationHoraire,
      details: {
        heureReservation: `${hours}:${pickupTime.getMinutes().toString().padStart(2, '0')}`,
        jourSemaine: dayNames[dayOfWeek],
        estHeureDeNuit: isNightHours,
        estDimanche: isSunday,
        estJourFerie: isHoliday,
      },
    },
    distances: {
      depotVersDepart: distanceCA_out,
      trajetClient: distanceTP,
      destinationVersDepot: distanceCA_return,
      distanceTotale: totalDistanceRoundTrip,
      explicationSimple: `${distanceCA_out.toFixed(1)}km + ${distanceTP.toFixed(1)}km + ${distanceCA_return.toFixed(1)}km = ${totalDistanceRoundTrip.toFixed(1)}km`,
    },
    grilleTarifaire: {
      palierDistance: bracket,
      explicationPalier: `Distance totale (${totalDistanceRoundTrip.toFixed(1)}km) → palier ${bracket}`,
      tarifsAppliques: {
        prixKmDeplacement: pricePerKmCA,
        prixKmClient: pricePerKmTP,
      },
    },
    calculDetaille: {
      etapes: etapesCalcul,
      sousTotalAvantPeages: Math.round(sousTotalAvantPeages * 100) / 100,
    },
    peages: {
      concerne: tollCost > 0,
      explication: explicationPeage,
      montantUnitaire: tollCost,
      multiplicateur: multiplicateurPeage,
      montantTotal: peageTotal,
      tvaAppliquee: '20%',
      note: 'Les péages des trajets chauffeur seul (dépôt ↔ client) ne sont PAS facturés',
    },
    forfaitAgglomeration: {
      applique: isForfaitAgglomeration,
      explication: isForfaitAgglomeration
        ? `Distance ≤ ${FORFAIT_AGGLOMERATION.maxKm}km → forfait ${night ? '47,50' : '33,00'}€`
        : `Distance > ${FORFAIT_AGGLOMERATION.maxKm}km → calcul au km`,
      seuil: FORFAIT_AGGLOMERATION.maxKm,
      prixForfait: isForfaitAgglomeration
        ? (night ? FORFAIT_AGGLOMERATION.night.ttc : FORFAIT_AGGLOMERATION.day.ttc)
        : null,
    },
    tvaDetails: {
      tvaTransport: { taux: '10%', montant: tvaTransport },
      tvaPeages: { taux: '20%', montant: tvaPeages },
      tvaTotale: tvaTotale,
      explication: peageTotal > 0
        ? `TVA transport (10%): ${tvaTransport.toFixed(2)}€ + TVA péages (20%): ${tvaPeages.toFixed(2)}€`
        : `TVA transport (10%): ${tvaTransport.toFixed(2)}€`,
    },
    resumeFinal: {
      lignes: lignesResume,
      prixFinalTTC: totalTTC,
      prixFinalHT: totalHT,
    },
  };

  // Log debug lisible pour server-side
  console.log('\n' + lignesResume.join('\n') + '\n');

  return {
    totalTTC,
    totalHT,
    tva: tvaTotale,
    breakdown: {
      costCA_out: Math.round(costCA_out * 100) / 100,
      costTP: Math.round(costTP * 100) / 100,
      costCA_return: Math.round(costCA_return * 100) / 100,
      tollCost: peageTotal,
      isForfaitAgglomeration,
      bracket,
      pricePerKmCA,
      pricePerKmTP,
    },
    isNightRate: night,
    debugInfo,
  };
}



