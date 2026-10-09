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
 * Paramètres de tarification utilisés par le moteur de transfert.
 * Par défaut ce sont les constantes ci-dessus ; côté serveur, elles sont remplacées par
 * les tarifs saisis dans l'administration (voir lib/pricing/transfer-config.ts).
 */
export interface TransferTariffConfig {
  dayRates: { tpRate: number; caRates: Record<keyof typeof DAY_RATES.CA_RATES, number> };
  nightRates: { tpRate: number; caRates: Record<keyof typeof DAY_RATES.CA_RATES, number> };
  forfaitAgglomeration: { day: number; night: number; thresholdKm: number };
  /** Mise à disposition (temps d'attente) : minutes gratuites puis € TTC par minute. */
  mda: { freeMinutes: number; day: number; night: number };
  /** Prix plancher d'une course (€ TTC). */
  minPrice: number;
}

/** Minutes d'attente gratuites (aligné sur la page publique « Tarifs » et l'administration). */
export const MDA_FREE_MINUTES = 10;
export const MDA_RATE_DAY = 1.20; // € TTC / minute
export const MDA_RATE_NIGHT = 1.80; // € TTC / minute

export const DEFAULT_TRANSFER_CONFIG: TransferTariffConfig = {
  dayRates: { tpRate: DAY_RATES.TP_RATE, caRates: { ...DAY_RATES.CA_RATES } },
  nightRates: { tpRate: NIGHT_RATES.TP_RATE, caRates: { ...NIGHT_RATES.CA_RATES } },
  forfaitAgglomeration: {
    day: FORFAIT_AGGLOMERATION.day.ttc,
    night: FORFAIT_AGGLOMERATION.night.ttc,
    thresholdKm: FORFAIT_AGGLOMERATION.maxKm,
  },
  mda: { freeMinutes: MDA_FREE_MINUTES, day: MDA_RATE_DAY, night: MDA_RATE_NIGHT },
  minPrice: 33,
};

export interface TransferPriceOptions {
  /**
   * Date/heure du retour (aller-retour uniquement). Le trajet retour est tarifé jour ou nuit
   * selon SA propre date : un aller de jour avec un retour de nuit donne un « tarif mixte ».
   * Sans cette date, le retour utilise le même tarif que l'aller.
   */
  returnTime?: Date | null;
  config?: TransferTariffConfig;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Nuit = 20h–7h, dimanche ou jour férié (calculé sur la date/heure donnée). */
function nightAt(d: Date): { night: boolean; isNightHours: boolean; isSunday: boolean; isHoliday: boolean } {
  const isNightHours = d.getHours() >= 20 || d.getHours() < 7;
  const isSunday = d.getDay() === 0;
  const isHoliday = isFrenchHoliday(d);
  return { night: isNightHours || isSunday || isHoliday, isNightHours, isSunday, isHoliday };
}

/**
 * Calcule le prix selon la logique détaillée
 * RÈGLE N°1 (NON NÉGOCIABLE): Toutes les estimations sont calculées en ALLER et RETOUR
 * par rapport au point de départ du chauffeur VTC (point de dépôt).
 *
 * TVA DIFFÉRENCIÉE:
 * - 10% sur le transport (courses)
 * - 20% sur les péages d'autoroute
 * - 20% sur la mise à disposition (MAD - temps d'attente)
 *
 * TARIF JOUR / NUIT:
 * - Aller simple : selon la date/heure de prise en charge.
 * - Aller-retour : l'aller (CA aller + TP aller) selon la date/heure de l'aller,
 *   le retour (TP retour + CA retour) selon la date/heure du retour.
 *
 * @param distanceCA_out Distance dépôt → pickup (km)
 * @param distanceTP Distance pickup → dropoff (km)
 * @param distanceCA_return Distance dropoff → dépôt (km) - TOUJOURS inclus
 * @param tripType 'one-way' ou 'round-trip' (affecte TP x2 et péages x2 pour A/R)
 * @param pickupTime Date/heure de prise en charge
 * @param tollCost Coût des péages (€ TTC) - UNIQUEMENT sur trajet client (pickup→dropoff), pour un sens
 * @param waitingMinutes Temps d'attente demandé (A/S et A/R) - minutes gratuites puis tarif à la minute
 */
export function calculateTransferPrice(
  distanceCA_out: number,
  distanceTP: number,
  distanceCA_return: number,
  tripType: 'one-way' | 'round-trip',
  pickupTime: Date,
  tollCost: number = 0,
  waitingMinutes: number = 0,
  options: TransferPriceOptions = {}
): {
  totalTTC: number;
  totalHT: number;
  tva: number;
  breakdown: {
    costCA_out: number;
    costTP: number;
    costCA_return: number;
    tollCost: number;
    madCost: number;
    isForfaitAgglomeration: boolean;
    bracket: string;
    pricePerKmCA: number;
    pricePerKmTP: number;
    rateOut: 'JOUR' | 'NUIT';
    rateReturn: 'JOUR' | 'NUIT';
    isMixedRate: boolean;
  };
  isNightRate: boolean;
  isNightRateReturn: boolean;
  isMixedRate: boolean;
  debugInfo: PricingDebugInfo;
} {
  const cfg = options.config ?? DEFAULT_TRANSFER_CONFIG;
  const isRoundTrip = tripType === 'round-trip';
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const out = nightAt(pickupTime);
  const hours = pickupTime.getHours();
  const dayOfWeek = pickupTime.getDay();
  const night = out.night;

  // Tarif du retour : sa propre date si elle est connue, sinon identique à l'aller
  const ret = isRoundTrip && options.returnTime ? nightAt(options.returnTime) : out;
  const nightReturn = ret.night;
  const isMixedRate = isRoundTrip && night !== nightReturn;

  const ratesOut = night ? cfg.nightRates : cfg.dayRates;
  const ratesRet = nightReturn ? cfg.nightRates : cfg.dayRates;

  // ═══════════════════════════════════════════════════════════════
  // CALCULS DE BASE
  // ═══════════════════════════════════════════════════════════════

  // RÈGLE N°1: Le retour au dépôt est TOUJOURS inclus dans le calcul
  const totalDistanceRoundTrip = distanceCA_out + distanceTP + distanceCA_return;

  // Le palier dépend uniquement de la distance totale ; il est commun à l'aller et au retour
  const bracket: keyof typeof DAY_RATES.CA_RATES = (() => {
    if (totalDistanceRoundTrip <= cfg.forfaitAgglomeration.thresholdKm) return '0-25';
    if (totalDistanceRoundTrip <= 50) return '25-50';
    if (totalDistanceRoundTrip <= 75) return '50-75';
    if (totalDistanceRoundTrip <= 100) return '75-100';
    return '100+';
  })();
  const pricePerKmCA = ratesOut.caRates[bracket]; // aller
  const pricePerKmCAReturn = ratesRet.caRates[bracket];
  const pricePerKmTP = ratesOut.tpRate; // aller
  const pricePerKmTPReturn = ratesRet.tpRate;

  const isForfaitAgglomeration = totalDistanceRoundTrip <= cfg.forfaitAgglomeration.thresholdKm;

  const etapesCalcul: PricingDebugInfo['calculDetaille']['etapes'] = [];
  let etapeNum = 1;
  const km = (n: number) => n.toFixed(1);
  const eur = (n: number) => n.toFixed(2);

  // Coûts (utilisés aussi pour l'affichage admin quand le forfait agglomération s'applique)
  const costCA_out = distanceCA_out * pricePerKmCA;
  const costTP = isRoundTrip ? distanceTP * pricePerKmTP + distanceTP * pricePerKmTPReturn : distanceTP * pricePerKmTP;
  const costCA_return = distanceCA_return * pricePerKmCAReturn;
  let transportTTC = 0;

  if (isForfaitAgglomeration) {
    // Forfait agglomération: prix fixe (≤ seuil km A/R)
    transportTTC = night ? cfg.forfaitAgglomeration.night : cfg.forfaitAgglomeration.day;
    etapesCalcul.push({
      numero: etapeNum++,
      description: `Forfait agglomération appliqué (≤ ${cfg.forfaitAgglomeration.thresholdKm} km)`,
      calcul: `Prix fixe ${night ? 'NUIT' : 'JOUR'}`,
      montant: transportTTC,
    });
  } else {
    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Déplacement: Dépôt → Lieu de prise en charge',
      calcul: `${km(distanceCA_out)} km × ${eur(pricePerKmCA)} €/km`,
      montant: round2(costCA_out),
    });

    if (isRoundTrip) {
      etapesCalcul.push({
        numero: etapeNum++,
        description: `Trajet client aller (tarif ${night ? 'NUIT' : 'JOUR'})`,
        calcul: `${km(distanceTP)} km × ${eur(pricePerKmTP)} €/km`,
        montant: round2(distanceTP * pricePerKmTP),
      });
      etapesCalcul.push({
        numero: etapeNum++,
        description: `Trajet client retour (tarif ${nightReturn ? 'NUIT' : 'JOUR'})`,
        calcul: `${km(distanceTP)} km × ${eur(pricePerKmTPReturn)} €/km`,
        montant: round2(distanceTP * pricePerKmTPReturn),
      });
    } else {
      etapesCalcul.push({
        numero: etapeNum++,
        description: 'Trajet client: Prise en charge → Destination',
        calcul: `${km(distanceTP)} km × ${eur(pricePerKmTP)} €/km`,
        montant: round2(costTP),
      });
    }

    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Retour: Destination → Dépôt (toujours inclus)',
      calcul: `${km(distanceCA_return)} km × ${eur(pricePerKmCAReturn)} €/km`,
      montant: round2(costCA_return),
    });

    transportTTC = costCA_out + costTP + costCA_return;
    etapesCalcul.push({
      numero: etapeNum++,
      description: 'Sous-total transport',
      calcul: `${eur(costCA_out)}€ + ${eur(costTP)}€ + ${eur(costCA_return)}€`,
      montant: round2(transportTTC),
    });
  }

  // Prix plancher
  if (transportTTC < cfg.minPrice) transportTTC = cfg.minPrice;

  const sousTotalAvantPeages = transportTTC;

  // ═══════════════════════════════════════════════════════════════
  // PÉAGES (uniquement sur trajet client - pickup → dropoff)
  // ═══════════════════════════════════════════════════════════════

  // RÈGLE IMPORTANTE: Péages x1 pour A/S, x2 pour A/R
  // LES PÉAGES NE SONT COMPTÉS QUE LORSQUE LE CLIENT EST DANS LE VÉHICULE
  const multiplicateurPeage = isRoundTrip ? 2 : 1;
  const peageTotal = tollCost * multiplicateurPeage;

  let explicationPeage = '';
  if (tollCost > 0) {
    explicationPeage = isRoundTrip
      ? `Péages trajet client: ${eur(tollCost)}€ × 2 (A/R) = ${eur(peageTotal)}€`
      : `Péages trajet client: ${eur(tollCost)}€`;
    etapesCalcul.push({
      numero: etapeNum++,
      description: `Péages autoroute${isRoundTrip ? ' (×2 pour A/R)' : ''}`,
      calcul: explicationPeage,
      montant: peageTotal,
    });
  } else {
    explicationPeage = 'Aucun péage sur ce trajet';
  }

  // ═══════════════════════════════════════════════════════════════
  // MISE À DISPOSITION (MAD) - Temps d'attente (aller simple ET aller-retour)
  // Tarif jour/nuit selon l'heure de prise en charge.
  // ═══════════════════════════════════════════════════════════════

  let madTTC = 0;
  const free = cfg.mda.freeMinutes;
  if (waitingMinutes > 0) {
    const chargeableMinutes = Math.max(0, waitingMinutes - free);
    if (chargeableMinutes > 0) {
      const ratePerMinute = night ? cfg.mda.night : cfg.mda.day;
      madTTC = round2(chargeableMinutes * ratePerMinute);
      etapesCalcul.push({
        numero: etapeNum++,
        description: `Mise à disposition (temps d'attente)`,
        calcul: `Temps d'attente: ${waitingMinutes} min (${free} min gratuites) = ${chargeableMinutes} min × ${ratePerMinute.toFixed(2)}€/min = ${eur(madTTC)}€`,
        montant: madTTC,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CALCUL TVA DIFFÉRENCIÉE
  // ═══════════════════════════════════════════════════════════════

  // TVA Transport: 10%
  const transportHT = round2(transportTTC / (1 + TVA_RATE_TRANSPORT));
  const tvaTransport = round2(transportTTC - transportHT);

  // TVA Péages: 20%
  const peageHT = round2(peageTotal / (1 + TVA_RATE_TOLL));
  const tvaPeages = round2(peageTotal - peageHT);

  // TVA MAD: 20%
  const madHT = round2(madTTC / (1 + TVA_RATE_MDA));
  const tvaMAD = round2(madTTC - madHT);

  // Totaux
  const totalTTC = round2(transportTTC + peageTotal + madTTC);
  const totalHT = round2(transportHT + peageHT + madHT);
  const tvaTotale = round2(tvaTransport + tvaPeages + tvaMAD);

  // ═══════════════════════════════════════════════════════════════
  // EXPLICATIONS LISIBLES
  // ═══════════════════════════════════════════════════════════════

  const raisonsNuit = (n: ReturnType<typeof nightAt>, h: number) => {
    const raisons: string[] = [];
    if (n.isNightHours) raisons.push(`${h}h (horaire de nuit: 20h-7h)`);
    if (n.isSunday) raisons.push('dimanche');
    if (n.isHoliday) raisons.push('jour férié');
    return raisons.join(' + ');
  };

  let explicationHoraire = night
    ? `Tarif NUIT appliqué car ${raisonsNuit(out, hours)}`
    : `Tarif JOUR appliqué: ${hours}h le ${dayNames[dayOfWeek]}`;
  if (isRoundTrip && options.returnTime) {
    const rt = options.returnTime;
    explicationHoraire += isMixedRate
      ? ` · Retour (${dayNames[rt.getDay()]} ${rt.getHours()}h): tarif ${nightReturn ? 'NUIT' : 'JOUR'} → TARIF MIXTE`
      : ` · Retour (${dayNames[rt.getDay()]} ${rt.getHours()}h): même tarif`;
  }

  const rateLabel = (n: boolean) => (n ? 'NUIT' : 'JOUR');
  const lignesResume: string[] = [
    ``,
    `ESTIMATION TARIFAIRE`,
    `─────────────────────────────────────────────────`,
    ``,
    `Réservation: ${dayNames[dayOfWeek]} à ${hours}h${pickupTime.getMinutes().toString().padStart(2, '0')}`,
    `Type de trajet: ${isRoundTrip ? 'Aller-Retour' : 'Aller Simple'}`,
    isMixedRate
      ? `Tarif appliqué: MIXTE (aller ${rateLabel(night)}, retour ${rateLabel(nightReturn)})`
      : `Tarif appliqué: ${rateLabel(night)}`,
    ``,
    `DISTANCES:`,
    `  Dépôt vers départ client: ${km(distanceCA_out)} km`,
    `  Trajet client: ${km(distanceTP)} km${isRoundTrip ? ' × 2' : ''}`,
    `  Retour vers dépôt: ${km(distanceCA_return)} km`,
    `  Total aller-retour: ${km(totalDistanceRoundTrip)} km`,
    ``,
    `TARIFICATION (palier ${bracket}):`,
  ];

  if (isForfaitAgglomeration) {
    lignesResume.push(`  Forfait agglomération: ${eur(transportTTC)}€ TTC`);
  } else {
    lignesResume.push(`  Déplacement: ${eur(pricePerKmCA)}€/km`);
    lignesResume.push(`  Trajet client: ${eur(pricePerKmTP)}€/km`);
  }

  lignesResume.push(``);
  lignesResume.push(`MONTANTS:`);
  lignesResume.push(`  Transport: ${eur(transportTTC)}€ TTC (TVA 10%)`);
  if (peageTotal > 0) {
    lignesResume.push(`  Péages: ${eur(peageTotal)}€ TTC (TVA 20%)`);
    lignesResume.push(`  Note: Péages uniquement sur trajet client`);
  }
  if (madTTC > 0) lignesResume.push(`  Attente: ${eur(madTTC)}€ TTC (TVA 20%)`);
  lignesResume.push(``);
  lignesResume.push(`─────────────────────────────────────────────────`);
  lignesResume.push(`TOTAL TTC: ${eur(totalTTC)}€`);
  lignesResume.push(`  dont TVA: ${eur(tvaTotale)}€`);
  lignesResume.push(`  HT: ${eur(totalHT)}€`);
  lignesResume.push(`─────────────────────────────────────────────────`);

  const tvaParts = [`TVA transport (10%): ${eur(tvaTransport)}€`];
  if (peageTotal > 0) tvaParts.push(`TVA péages (20%): ${eur(tvaPeages)}€`);
  if (madTTC > 0) tvaParts.push(`TVA attente (20%): ${eur(tvaMAD)}€`);

  const debugInfo: PricingDebugInfo = {
    horaireTarification: {
      typeApplique: night ? 'NUIT' : 'JOUR',
      explicationSimple: explicationHoraire,
      details: {
        heureReservation: `${hours}:${pickupTime.getMinutes().toString().padStart(2, '0')}`,
        jourSemaine: dayNames[dayOfWeek],
        estHeureDeNuit: out.isNightHours,
        estDimanche: out.isSunday,
        estJourFerie: out.isHoliday,
      },
    },
    distances: {
      depotVersDepart: distanceCA_out,
      trajetClient: distanceTP,
      destinationVersDepot: distanceCA_return,
      distanceTotale: totalDistanceRoundTrip,
      explicationSimple: `${km(distanceCA_out)}km + ${km(distanceTP)}km + ${km(distanceCA_return)}km = ${km(totalDistanceRoundTrip)}km`,
    },
    grilleTarifaire: {
      palierDistance: bracket,
      explicationPalier: `Distance totale (${km(totalDistanceRoundTrip)}km) → palier ${bracket}`,
      tarifsAppliques: {
        prixKmDeplacement: pricePerKmCA,
        prixKmClient: pricePerKmTP,
      },
    },
    calculDetaille: {
      etapes: etapesCalcul,
      sousTotalAvantPeages: round2(sousTotalAvantPeages),
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
        ? `Distance ≤ ${cfg.forfaitAgglomeration.thresholdKm}km → forfait ${eur(transportTTC)}€`
        : `Distance > ${cfg.forfaitAgglomeration.thresholdKm}km → calcul au km`,
      seuil: cfg.forfaitAgglomeration.thresholdKm,
      prixForfait: isForfaitAgglomeration ? transportTTC : null,
    },
    tvaDetails: {
      tvaTransport: { taux: '10%', montant: tvaTransport },
      tvaPeages: { taux: '20%', montant: tvaPeages },
      tvaTotale: tvaTotale,
      explication: tvaParts.join(' + '),
    },
    resumeFinal: {
      lignes: lignesResume,
      prixFinalTTC: totalTTC,
      prixFinalHT: totalHT,
    },
  };

  console.log('\n' + lignesResume.join('\n') + '\n');

  return {
    totalTTC,
    totalHT,
    tva: tvaTotale,
    breakdown: {
      costCA_out: round2(costCA_out),
      costTP: round2(costTP),
      costCA_return: round2(costCA_return),
      tollCost: peageTotal,
      madCost: madTTC,
      isForfaitAgglomeration,
      bracket,
      pricePerKmCA,
      pricePerKmTP,
      rateOut: night ? 'NUIT' : 'JOUR',
      rateReturn: nightReturn ? 'NUIT' : 'JOUR',
      isMixedRate,
    },
    isNightRate: night,
    isNightRateReturn: nightReturn,
    isMixedRate,
    debugInfo,
  };
}
