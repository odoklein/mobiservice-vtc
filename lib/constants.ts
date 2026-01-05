// Brand constants
export const BRAND = {
  name: 'MobiService VTC',
  tagline: "L'Excellence du Transport Privé avec Chauffeur",
  description: 'Pour tous vos déplacements professionnels et/ou personnels, votre chauffeur privé en Haute-Savoie saura vous accompagner en répondant à vos attentes.',
};

// VTC Depot Location - Point de départ pour tous les calculs de tarification
export const VTC_DEPOT = {
  address: '4 rue des artisans, 74300 Cluses',
  lat: 46.0624, // Coordonnées approximatives
  lng: 6.5813,  // Coordonnées approximatives
  city: 'Cluses',
  postalCode: '74300',
  country: 'France',
};

// Driver info
export const DRIVER = {
  name: 'Patrice',
  email: process.env.DRIVER_EMAIL || 'contact@mobiservice-vtc.fr',
  age: 55,
  city: 'Haute-Savoie',
  experience: '15+ ans d\'expérience',
  bio: 'Chauffeur professionnel avec plus de 15 ans d\'expérience dans le transport de personnes. Discrétion, ponctualité et confort sont mes maîtres-mots.',
};

// Core values
export const VALUES = [
  {
    title: 'Sérénité',
    description: 'Un trajet en toute tranquillité, sans stress ni imprévu, MobiService VTC saura répondre à votre attente.',
    icon: '🧘',
  },
  {
    title: 'Confidentialité',
    description: 'Dans une éthique de respect et de confidentialité, nous nous engageons à préserver la vie privée et les conversations de notre clientèle.',
    icon: '🔒',
  },
  {
    title: 'Écologie',
    description: 'Véhicule premium, 100% électrique (zéro émission) pour réduire notre empreinte carbone au maximum en préservant notre environnement par un transport éco-responsable.',
    icon: '🌱',
  },
  {
    title: 'Expérience',
    description: 'Plus de 15 années d\'expertise et d’écoute au service de votre confort pour une réelle expérience à voyager en toute tranquillité.',
    icon: '⭐',
  },
];

// Service types
export const SERVICES = [
  {
    id: 'transfer',
    name: 'Transfert Aller Simple (A/S) et Aller Retour (A/R)',
    description: 'Transfert direct de votre point de départ à votre destination',
    icon: '🚗',
    priceInfo: 'À partir de 33€ TTC',
    illustration: '/illustrations/coursenormal.png',
  },
  {
    id: 'hourly',
    name: 'Transfert Forfaitaire',
    description: 'Chauffeur à disposition pour vos déplacements multiples. Forfaits de 2H à 8H disponibles, de jour comme de nuit.',
    icon: '⏰',
    priceInfo: 'Demandez votre réservation',
    illustration: '/illustrations/coursemad.png',
  },
];


// Pricing - Grille Tarifaire 2026
export const PRICING = {
  // Day rate: 7h-20h (except Sun & Holidays)
  // Night rate: 20h-7h + Sundays & Holidays

  // Base hourly rate TTC
  hourlyBase: {
    day: { ht: 30, ttc: 33 },
    night: { ht: 43.18, ttc: 47.50 },
  },

  // Per km rates TTC
  perKm: {
    agglomeration: { day: 1.32, night: 1.90 }, // Forfait agglomération ≤ 25km A/R (~33€/47.50€)
    tpRate: { day: 1.32, night: 1.90 }, // Tarif TP constant
  },

  // Forfaits TTC
  forfaits: [
    { hours: 2, maxKm: 180, day: 232, night: 280, label: 'Forfait 2H / 180km' },
    { hours: 2.5, maxKm: 225, day: 290, night: 337.50, label: 'Forfait 2H30 / 225km' },
    { hours: 3, maxKm: 270, day: 348, night: 390, label: 'Forfait 3H / 270km' },
    { hours: 3.5, maxKm: 315, day: 406, night: 455, label: 'Forfait 3H30 / 315km' },
    { hours: 4, maxKm: 360, day: 464, night: 520, label: 'Forfait 4H / 360km' },
    { hours: 4.5, maxKm: 405, day: 522, night: 585, label: 'Forfait 4H30 / 405km' },
    { hours: 5, maxKm: 450, day: 580, night: 650, label: 'Forfait 5H / 450km' },
    { hours: 5.5, maxKm: 495, day: 638, night: 715, label: 'Forfait 5H30 / 495km' },
    { hours: 6, maxKm: 540, day: 660, night: 750, label: 'Forfait 6H / 540km' },
    { hours: 6.5, maxKm: 585, day: 715, night: 812.50, label: 'Forfait 6H30 / 585km' },
    { hours: 7, maxKm: 630, day: 735, night: 840, label: 'Forfait 7H / 630km' },
    { hours: 7.5, maxKm: 675, day: 787.50, night: 900, label: 'Forfait 7H30 / 675km' },
    { hours: 8, maxKm: 720, day: 840, night: 960, label: 'Forfait 8H / 720km' },
  ],

  // Extra hour beyond forfait TTC
  extraHour: { day: 116, night: 140 },

  // MDA (Mise à disposition) - 10 min free
  mda: { dayPerMin: 1.20, nightPerMin: 1.80, freeMinutes: 10 },

  // Airport transfers (estimated)
  airport: {
    geneva: { day: 116, night: 130 },
    lyonStExupery: { day: 232, night: 260 },
  },

  // TVA rate
  tvaRate: 0.10,

  // Minimum price
  minPriceTTC: 33, // 33€ minimum

  // Notes
  notes: [
    'Tarif jour: 7h00 à 20h00 (sauf Dim & JF)',
    'Tarif nuit: 20h00 à 7h00 + Dim & JF (24/24)',
    'Forfait agglomération: jusqu\'à 25 km A/R (33€ jour / 47,50€ nuit)',
    'Minimum de réservation: 33€ TTC',
    'Tous les trajets incluent le retour au dépôt (règle n°1)',
    'Péages inclus sur les prix estimés',
    'Devis valable 5 jours',
  ],
};

// Contact info
export const CONTACT = {
  phone: '+33 (0)6 07 72 50 07',
  email: 'contact@mobiservice-vtc.fr',
  whatsapp: '+33607725007',
  address: 'Haute-Savoie, France',
  depotOnly: '4 rue des artisans, 74300 Cluses',
};

// Vehicle info
export const VEHICLE = {
  make: 'Mercedes-Benz',
  model: 'Classe E Hybride',
  year: 2023,
  color: 'Noir',
  seats: 4,
  luggage: 3,
  features: [
    'Climatisation automatique',
    'Sièges cuir chauffants',
    'WiFi à bord',
    'Bouteilles d\'eau offertes',
    'Chargeurs USB',
    'Système audio premium',
  ],
};

// Navigation menu items
export const NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Services', href: '/services' }, // Keep as absolute path for now or consistent with app
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Contact', href: '/contact' },
];

// Popular departure locations (Haute-Savoie area)
export const POPULAR_LOCATIONS = [
  {
    name: 'Aéroport de Genève',
    address: 'Aéroport de Genève, Route de l\'Aéroport 21, 1215 Le Grand-Saconnex, Suisse',
    lat: 46.2380,
    lng: 6.1090,
    category: 'airport',
    icon: '✈️',
    isAirport: true,
  },
  {
    name: 'Aéroport Lyon Saint-Exupéry',
    address: 'Aéroport Lyon Saint-Exupéry, 69125 Colombier-Saugnieu, France',
    lat: 45.7256,
    lng: 5.0811,
    category: 'airport',
    icon: '✈️',
    isAirport: true,
  },
  {
    name: 'Gare d\'Annecy',
    address: 'Place de la Gare, 74000 Annecy, France',
    lat: 45.9023,
    lng: 6.1219,
    category: 'train',
    icon: '🚂',
  },
  {
    name: 'Chamonix-Mont-Blanc',
    address: 'Chamonix-Mont-Blanc, 74400, France',
    lat: 45.9237,
    lng: 6.8694,
    category: 'landmark',
    icon: '🏔️',
  },
  {
    name: 'Megève',
    address: 'Megève, 74120, France',
    lat: 45.8567,
    lng: 6.6175,
    category: 'landmark',
    icon: '⛷️',
  },
  {
    name: 'La Clusaz',
    address: 'La Clusaz, 74220, France',
    lat: 45.9044,
    lng: 6.4242,
    category: 'landmark',
    icon: '⛷️',
  },
];
