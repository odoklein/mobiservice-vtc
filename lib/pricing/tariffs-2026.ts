// Grille Tarifaire 2026 - Règles détaillées selon message client
// CA = Coût Additionnel (dépôt → pickup ou dropoff → dépôt)
// TP = Trajet Principal (pickup → dropoff)
// A/S = Aller Simple
// A/R = Aller Retour

import { isFrenchHoliday } from '../holidays';

export const TVA_RATE = 0.10; // 10%

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
 * Structure de debug détaillée pour comprendre le calcul du prix
 */
export interface PricingDebugInfo {
  // 1. Détermination tarif jour/nuit
  rateType: {
    isNight: boolean;
    reason: string;
    details: {
      pickupTime: string;
      hour: number;
      dayOfWeek: string;
      isNightHours: boolean;
      isSunday: boolean;
      isHoliday: boolean;
    };
  };
  
  // 2. Distances
  distances: {
    ca_out: number;
    tp: number;
    ca_return: number;
    totalRoundTrip: number;
    explanation: string;
  };
  
  // 3. Bracket / palier tarifaire
  bracket: {
    value: string;
    reason: string;
    thresholds: string;
  };
  
  // 4. Tarifs appliqués
  rates: {
    pricePerKmCA: number;
    pricePerKmTP: number;
    rateTableUsed: 'DAY_RATES' | 'NIGHT_RATES';
    allCARates: Record<string, number>;
  };
  
  // 5. Calcul détaillé
  calculation: {
    steps: Array<{
      step: number;
      description: string;
      formula: string;
      result: number;
    }>;
    subtotalBeforeTolls: number;
    tollCalculation: string;
    finalTotal: number;
  };
  
  // 6. Forfait agglomération
  forfaitAgglomeration: {
    applied: boolean;
    reason: string;
    threshold: number;
    forfaitPrice: number | null;
  };
  
  // 7. Résumé final
  summary: string[];
}

/**
 * Calcule le prix selon la logique détaillée
 * RÈGLE N°1 (NON NÉGOCIABLE): Toutes les estimations sont calculées en ALLER et RETOUR
 * par rapport au point de départ du chauffeur VTC (point de dépôt).
 * 
 * @param distanceCA_out Distance dépôt → pickup (km)
 * @param distanceTP Distance pickup → dropoff (km)
 * @param distanceCA_return Distance dropoff → dépôt (km) - TOUJOURS inclus
 * @param tripType 'one-way' ou 'round-trip' (affecte TP x2 et péages x2 pour A/R)
 * @param pickupTime Date/heure de prise en charge
 * @param tollCost Coût des péages (€ TTC) - x1 pour A/S, x2 pour A/R
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

  // Build rate type reason
  let rateReason = '';
  if (night) {
    const reasons: string[] = [];
    if (isNightHours) reasons.push(`heure: ${hours}h (20h-7h = tarif nuit)`);
    if (isSunday) reasons.push('dimanche');
    if (isHoliday) reasons.push('jour férié');
    rateReason = `Tarif NUIT appliqué car: ${reasons.join(' + ')}`;
  } else {
    rateReason = `Tarif JOUR appliqué (${hours}h, ${dayNames[dayOfWeek]}, pas de jour férié)`;
  }

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
  let totalTTC = 0;
  const calculationSteps: PricingDebugInfo['calculation']['steps'] = [];
  let stepNumber = 1;

  if (isForfaitAgglomeration) {
    // Forfait agglomération: prix fixe (≤ 25km A/R)
    const forfaitPrice = night ? FORFAIT_AGGLOMERATION.night.ttc : FORFAIT_AGGLOMERATION.day.ttc;
    totalTTC = forfaitPrice;
    
    calculationSteps.push({
      step: stepNumber++,
      description: 'Forfait agglomération appliqué',
      formula: `Distance A/R (${totalDistanceRoundTrip.toFixed(1)}km) ≤ ${FORFAIT_AGGLOMERATION.maxKm}km`,
      result: forfaitPrice,
    });
    
    // Breakdown masqué mais conservé pour admin (calcul théorique)
    costCA_out = distanceCA_out * pricePerKmCA;
    costTP = tripType === 'round-trip' ? distanceTP * pricePerKmTP * 2 : distanceTP * pricePerKmTP;
    costCA_return = distanceCA_return * pricePerKmCA;
  } else {
    // Tarification au km selon les brackets
    costCA_out = distanceCA_out * pricePerKmCA;
    calculationSteps.push({
      step: stepNumber++,
      description: 'CA aller (Dépôt → Départ)',
      formula: `${distanceCA_out.toFixed(1)}km × ${pricePerKmCA.toFixed(2)}€/km`,
      result: Math.round(costCA_out * 100) / 100,
    });
    
    // RÈGLE: En A/R client, le TP est doublé
    if (tripType === 'round-trip') {
      costTP = distanceTP * pricePerKmTP * 2;
      calculationSteps.push({
        step: stepNumber++,
        description: 'TP (Trajet Principal) × 2 pour A/R',
        formula: `${distanceTP.toFixed(1)}km × ${pricePerKmTP.toFixed(2)}€/km × 2`,
        result: Math.round(costTP * 100) / 100,
      });
    } else {
      costTP = distanceTP * pricePerKmTP;
      calculationSteps.push({
        step: stepNumber++,
        description: 'TP (Trajet Principal)',
        formula: `${distanceTP.toFixed(1)}km × ${pricePerKmTP.toFixed(2)}€/km`,
        result: Math.round(costTP * 100) / 100,
      });
    }
    
    // RÈGLE N°1: CA_retour est TOUJOURS inclus (même en A/S)
    costCA_return = distanceCA_return * pricePerKmCA;
    calculationSteps.push({
      step: stepNumber++,
      description: 'CA retour (Arrivée → Dépôt) - TOUJOURS inclus',
      formula: `${distanceCA_return.toFixed(1)}km × ${pricePerKmCA.toFixed(2)}€/km`,
      result: Math.round(costCA_return * 100) / 100,
    });

    totalTTC = costCA_out + costTP + costCA_return;
    calculationSteps.push({
      step: stepNumber++,
      description: 'Sous-total (CA_out + TP + CA_return)',
      formula: `${costCA_out.toFixed(2)}€ + ${costTP.toFixed(2)}€ + ${costCA_return.toFixed(2)}€`,
      result: Math.round(totalTTC * 100) / 100,
    });
  }

  const subtotalBeforeTolls = totalTTC;

  // Ajouter les péages
  // RÈGLE: Péages x1 pour A/S, x2 pour A/R
  const finalTollCost = tripType === 'round-trip' ? tollCost * 2 : tollCost;
  let tollCalculation = '';
  if (tollCost > 0) {
    if (tripType === 'round-trip') {
      tollCalculation = `${tollCost.toFixed(2)}€ × 2 (A/R) = ${finalTollCost.toFixed(2)}€`;
    } else {
      tollCalculation = `${tollCost.toFixed(2)}€ (A/S)`;
    }
    totalTTC += finalTollCost;
    calculationSteps.push({
      step: stepNumber++,
      description: `Péages${tripType === 'round-trip' ? ' (×2 pour A/R)' : ''}`,
      formula: tollCalculation,
      result: finalTollCost,
    });
  } else {
    tollCalculation = 'Aucun péage';
  }

  // Calcul HT et TVA
  const totalHT = Math.round((totalTTC / (1 + TVA_RATE)) * 100) / 100;
  const tva = Math.round((totalTTC - totalHT) * 100) / 100;

  // Build summary
  const summary: string[] = [
    `📍 Distance totale A/R: ${totalDistanceRoundTrip.toFixed(1)} km`,
    `🕐 ${night ? 'Tarif NUIT' : 'Tarif JOUR'} (${hours}h, ${dayNames[dayOfWeek]})`,
    `📊 Palier tarifaire: ${bracket} km`,
  ];
  
  if (isForfaitAgglomeration) {
    summary.push(`✅ Forfait agglomération: ${night ? '47.50' : '33.00'}€ TTC`);
  } else {
    summary.push(`💰 CA/km: ${pricePerKmCA.toFixed(2)}€ | TP/km: ${pricePerKmTP.toFixed(2)}€`);
    summary.push(`🧮 Calcul: CA(${costCA_out.toFixed(2)}€) + TP(${costTP.toFixed(2)}€) + Retour(${costCA_return.toFixed(2)}€)`);
  }
  
  if (finalTollCost > 0) {
    summary.push(`🛣️ Péages: +${finalTollCost.toFixed(2)}€`);
  }
  
  summary.push(`💵 TOTAL TTC: ${(Math.round(totalTTC * 100) / 100).toFixed(2)}€`);

  // Build debug info
  const debugInfo: PricingDebugInfo = {
    rateType: {
      isNight: night,
      reason: rateReason,
      details: {
        pickupTime: pickupTime.toISOString(),
        hour: hours,
        dayOfWeek: dayNames[dayOfWeek],
        isNightHours,
        isSunday,
        isHoliday,
      },
    },
    distances: {
      ca_out: distanceCA_out,
      tp: distanceTP,
      ca_return: distanceCA_return,
      totalRoundTrip: totalDistanceRoundTrip,
      explanation: `Dépôt→Départ (${distanceCA_out.toFixed(1)}km) + Trajet (${distanceTP.toFixed(1)}km) + Retour dépôt (${distanceCA_return.toFixed(1)}km) = ${totalDistanceRoundTrip.toFixed(1)}km`,
    },
    bracket: {
      value: bracket,
      reason: `Distance A/R totale (${totalDistanceRoundTrip.toFixed(1)}km) correspond au palier ${bracket}`,
      thresholds: '0-25km, 25-50km, 50-75km, 75-100km, 100+km',
    },
    rates: {
      pricePerKmCA,
      pricePerKmTP,
      rateTableUsed: night ? 'NIGHT_RATES' : 'DAY_RATES',
      allCARates: rates.CA_RATES,
    },
    calculation: {
      steps: calculationSteps,
      subtotalBeforeTolls: Math.round(subtotalBeforeTolls * 100) / 100,
      tollCalculation,
      finalTotal: Math.round(totalTTC * 100) / 100,
    },
    forfaitAgglomeration: {
      applied: isForfaitAgglomeration,
      reason: isForfaitAgglomeration 
        ? `Distance A/R (${totalDistanceRoundTrip.toFixed(1)}km) ≤ seuil (${FORFAIT_AGGLOMERATION.maxKm}km)`
        : `Distance A/R (${totalDistanceRoundTrip.toFixed(1)}km) > seuil (${FORFAIT_AGGLOMERATION.maxKm}km)`,
      threshold: FORFAIT_AGGLOMERATION.maxKm,
      forfaitPrice: isForfaitAgglomeration 
        ? (night ? FORFAIT_AGGLOMERATION.night.ttc : FORFAIT_AGGLOMERATION.day.ttc)
        : null,
    },
    summary,
  };

  // Log debug info for server-side debugging
  console.log('[PRICING DEBUG]', JSON.stringify(debugInfo, null, 2));

  return {
    totalTTC: Math.round(totalTTC * 100) / 100,
    totalHT,
    tva,
    breakdown: {
      costCA_out: Math.round(costCA_out * 100) / 100,
      costTP: Math.round(costTP * 100) / 100,
      costCA_return: Math.round(costCA_return * 100) / 100,
      tollCost: finalTollCost,
      isForfaitAgglomeration,
      bracket,
      pricePerKmCA,
      pricePerKmTP,
    },
    isNightRate: night,
    debugInfo,
  };
}



