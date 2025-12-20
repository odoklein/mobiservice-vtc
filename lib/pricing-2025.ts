// Pricing calculation utilities - Grille Tarifaire 2025/2026
// Système de tarification complexe avec CA (Coût Additionnel) et TP (Trajet Principal)
//
// ⚠️ OBSOLÈTE: Ce fichier n'est plus utilisé dans le codebase.
// La logique de tarification active se trouve dans lib/pricing/tariffs-2026.ts
// Conservé uniquement pour référence historique.

export interface PricingInput2025 {
  // Point de dépôt VTC (par défaut: 4 rue des artisans, 74300 Cluses)
  depotLat: number;
  depotLng: number;
  
  // Point de prise en charge client
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  
  // Destination finale
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  
  // Type de trajet
  tripType: 'one-way' | 'round-trip'; // Aller/Simple ou Aller/Retour
  
  // Date et heure de prise en charge (pour tarif jour/nuit)
  pickupDateTime: Date;
  
  // Informations passagers
  passengers: number;
  childrenUnder10?: number;
  luggage?: number;
  
  // Correspondance (train/avion)
  hasConnection?: boolean;
  connectionType?: 'train' | 'plane';
  maxArrivalTime?: string; // Format HH:MM
  
  // Péages
  tollCost?: number; // Coût péage aller simple (sera multiplié si A/R)
}

export interface PricingResult2025 {
  // Distances (en km)
  distanceCA: number; // Coût Additionnel: dépôt → prise en charge
  distanceTP: number; // Trajet Principal: prise en charge → destination
  distanceReturn: number; // Retour: destination → dépôt
  totalDistanceRoundTrip: number; // Distance totale aller-retour
  
  // Coûts détaillés (en EUR)
  costCA: number; // Coût additionnel (masqué dans l'affichage final)
  costTP: number; // Coût trajet principal
  costReturn: number; // Coût retour au dépôt
  
  // Péages
  tollCostTotal: number; // Péages (×1 pour A/S, ×2 pour A/R)
  
  // Tarification appliquée
  isNightRate: boolean;
  isForfaitAgglomeration: boolean;
  pricePerKmCA: number; // Prix au km pour le CA (variable selon tranche)
  pricePerKmTP: number; // Prix au km pour le TP (constant: 1.32 jour / 1.90 nuit)
  distanceBracket: string; // Ex: "25-50km", "50-75km", etc.
  
  // Prix final
  subtotalWithoutTolls: number; // Total hors péages
  totalTTC: number; // Total TTC incluant péages
  totalHT: number; // Total HT
  tva: number; // TVA 10%
  
  // Métadonnées
  rateType: string; // Ex: "Tarif jour (7h-20h)" ou "Tarif nuit (20h-7h + Dim/JF)"
  calculationDetails: string; // Formule de calcul pour transparence
}

// Constantes de configuration
const VTC_DEPOT = {
  address: '4 rue des artisans, 74300 Cluses',
  lat: 46.0624, // Coordonnées approximatives à confirmer
  lng: 6.5813,
  city: 'Cluses',
  postalCode: '74300',
};

const PRICING_CONFIG = {
  // TVA
  TVA_RATE: 0.10, // 10%
  
  // Forfait agglomération
  FORFAIT_AGGLOMERATION_THRESHOLD_KM: 25, // ≤ 25km A/R
  FORFAIT_AGGLOMERATION_DAY: 33.00, // 33€ TTC jour
  FORFAIT_AGGLOMERATION_NIGHT: 47.50, // 47,50€ TTC nuit
  
  // Tarifs JOUR (7h-20h sauf dimanche/jours fériés)
  DAY_RATES: {
    TP_RATE: 1.32, // Prix au km pour TP (constant)
    CA_RATES: {
      '0-25': 1.32,    // Forfait agglomération
      '25-50': 1.32,   // > 25km jusqu'à 50km
      '50-75': 1.10,   // > 50km jusqu'à 75km
      '75-100': 0.90,  // > 75km jusqu'à 100km
      '100+': 0.70,    // > 100km
    },
  },
  
  // Tarifs NUIT (20h-7h + dimanche/jours fériés)
  NIGHT_RATES: {
    TP_RATE: 1.90, // Prix au km pour TP (constant)
    CA_RATES: {
      '0-25': 1.90,    // Forfait agglomération
      '25-50': 1.70,   // > 25km jusqu'à 50km
      '50-75': 1.40,   // > 50km jusqu'à 75km
      '75-100': 1.10,  // > 75km jusqu'à 100km
      '100+': 0.70,    // > 100km
    },
  },
};

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * @returns distance en kilomètres
 */
function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Détermine si l'heure est en tarif nuit
 * Nuit: 20h-7h OU dimanche OU jour férié
 */
function isNightRate(date: Date): boolean {
  const hours = date.getHours();
  const day = date.getDay(); // 0 = dimanche
  
  // Vérifier plage horaire (20h-7h)
  const isNightHours = hours >= 20 || hours < 7;
  
  // Dimanche
  const isSunday = day === 0;
  
  // TODO: Ajouter vérification jours fériés français
  // const isHoliday = isFrenchHoliday(date);
  
  return isNightHours || isSunday;
}

/**
 * Détermine la tranche kilométrique selon la distance totale A/R
 */
function getDistanceBracket(totalDistanceRoundTrip: number): string {
  if (totalDistanceRoundTrip <= 25) return '0-25';
  if (totalDistanceRoundTrip <= 50) return '25-50';
  if (totalDistanceRoundTrip <= 75) return '50-75';
  if (totalDistanceRoundTrip <= 100) return '75-100';
  return '100+';
}

/**
 * Calcule le prix selon la nouvelle grille tarifaire 2025-2026
 */
export function calculatePrice2025(input: PricingInput2025): PricingResult2025 {
  // 1. Calculer les distances
  const distanceCA = calculateDistanceKm(
    input.depotLat,
    input.depotLng,
    input.pickupLat,
    input.pickupLng
  );
  
  const distanceTP = calculateDistanceKm(
    input.pickupLat,
    input.pickupLng,
    input.dropoffLat,
    input.dropoffLng
  );
  
  const distanceReturn = calculateDistanceKm(
    input.dropoffLat,
    input.dropoffLng,
    input.depotLat,
    input.depotLng
  );
  
  // Distance totale en aller-retour (toujours calculée)
  const totalDistanceRoundTrip = distanceCA + distanceTP + distanceReturn;
  
  // 2. Déterminer tarif jour/nuit
  const isNight = isNightRate(input.pickupDateTime);
  const rates = isNight ? PRICING_CONFIG.NIGHT_RATES : PRICING_CONFIG.DAY_RATES;
  
  // 3. Déterminer la tranche kilométrique
  const bracket = getDistanceBracket(totalDistanceRoundTrip);
  
  // 4. Vérifier si forfait agglomération applicable
  const isForfaitAgglomeration = totalDistanceRoundTrip <= PRICING_CONFIG.FORFAIT_AGGLOMERATION_THRESHOLD_KM;
  
  let costCA = 0;
  let costTP = 0;
  let costReturn = 0;
  let subtotalWithoutTolls = 0;
  let pricePerKmCA = 0;
  let pricePerKmTP = rates.TP_RATE;
  let calculationDetails = '';
  
  // 5. Calculer le prix selon la logique
  if (isForfaitAgglomeration) {
    // FORFAIT AGGLOMÉRATION (≤ 25km A/R)
    subtotalWithoutTolls = isNight
      ? PRICING_CONFIG.FORFAIT_AGGLOMERATION_NIGHT
      : PRICING_CONFIG.FORFAIT_AGGLOMERATION_DAY;
    
    calculationDetails = `Forfait agglomération (≤25km A/R): ${subtotalWithoutTolls}€ TTC`;
  } else {
    // HORS AGGLOMÉRATION (> 25km A/R)
    // Récupérer le prix au km pour CA selon la tranche
    pricePerKmCA = rates.CA_RATES[bracket as keyof typeof rates.CA_RATES];
    
    // Calculer les coûts
    costCA = distanceCA * pricePerKmCA;
    costTP = distanceTP * pricePerKmTP;
    costReturn = distanceReturn * pricePerKmCA;
    
    subtotalWithoutTolls = costCA + costTP + costReturn;
    
    calculationDetails = 
      `CA (${distanceCA}km × ${pricePerKmCA}€) + ` +
      `TP (${distanceTP}km × ${pricePerKmTP}€) + ` +
      `Retour (${distanceReturn}km × ${pricePerKmCA}€) = ${subtotalWithoutTolls.toFixed(2)}€`;
  }
  
  // 6. Gérer les péages
  const tollMultiplier = input.tripType === 'round-trip' ? 2 : 1;
  const tollCostTotal = (input.tollCost || 0) * tollMultiplier;
  
  // 7. Calculer le total TTC
  const totalTTC = subtotalWithoutTolls + tollCostTotal;
  
  // 8. Calculer HT et TVA
  const totalHT = totalTTC / (1 + PRICING_CONFIG.TVA_RATE);
  const tva = totalTTC - totalHT;
  
  // 9. Type de tarif
  const rateType = isNight
    ? 'Tarif nuit (20h-7h + Dim/JF)'
    : 'Tarif jour (7h-20h sauf Dim/JF)';
  
  return {
    // Distances
    distanceCA,
    distanceTP,
    distanceReturn,
    totalDistanceRoundTrip,
    
    // Coûts détaillés
    costCA,
    costTP,
    costReturn,
    
    // Péages
    tollCostTotal,
    
    // Tarification
    isNightRate: isNight,
    isForfaitAgglomeration,
    pricePerKmCA,
    pricePerKmTP,
    distanceBracket: bracket,
    
    // Prix final
    subtotalWithoutTolls: Math.round(subtotalWithoutTolls * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    totalHT: Math.round(totalHT * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    
    // Métadonnées
    rateType,
    calculationDetails,
  };
}

/**
 * Formatage du prix en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Export des constantes pour utilisation ailleurs
 */
export { VTC_DEPOT, PRICING_CONFIG };
