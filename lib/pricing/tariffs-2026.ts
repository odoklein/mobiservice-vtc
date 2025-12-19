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

  return isNightHours || isSunday || isHoliday;
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
 * Calcule le prix selon la logique détaillée
 * @param distanceCA_out Distance dépôt → pickup (km)
 * @param distanceTP Distance pickup → dropoff (km)
 * @param distanceCA_return Distance dropoff → dépôt (km) (0 si A/S)
 * @param tripType 'one-way' ou 'round-trip'
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
  };
  isNightRate: boolean;
} {
  const night = isNightRate(pickupTime);
  const rates = night ? NIGHT_RATES : DAY_RATES;

  // Total distance A/R (toujours calculé en A/R pour déterminer le bracket)
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

  if (isForfaitAgglomeration) {
    // Forfait agglomération: prix fixe
    totalTTC = night ? FORFAIT_AGGLOMERATION.night.ttc : FORFAIT_AGGLOMERATION.day.ttc;
    // Breakdown masqué mais conservé pour admin
    costCA_out = distanceCA_out * pricePerKmCA;
    costTP = distanceTP * pricePerKmTP;
    costCA_return = distanceCA_return * pricePerKmCA;
  } else {
    // Tarification au km selon les brackets
    costCA_out = distanceCA_out * pricePerKmCA;
    costTP = distanceTP * pricePerKmTP;
    costCA_return = tripType === 'round-trip' ? distanceCA_return * pricePerKmCA : 0;

    totalTTC = costCA_out + costTP + costCA_return;
  }

  // Ajouter les péages
  // Péages: x1 pour A/S, x2 pour A/R
  const finalTollCost = tripType === 'round-trip' ? tollCost * 2 : tollCost;
  totalTTC += finalTollCost;

  // Calcul HT et TVA
  const totalHT = Math.round((totalTTC / (1 + TVA_RATE)) * 100) / 100;
  const tva = Math.round((totalTTC - totalHT) * 100) / 100;

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
    },
    isNightRate: night,
  };
}

