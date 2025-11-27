// Brand constants
export const BRAND = {
  name: 'MobiService VTC',
  tagline: 'Votre chauffeur premium en Haute-Savoie',
  description: 'Service de transport avec chauffeur privé premium en Haute-Savoie',
};

// Driver info
export const DRIVER = {
  name: 'Patrice',
  age: 55,
  city: 'Haute-Savoie',
  experience: '15+ ans d\'expérience',
  bio: 'Chauffeur professionnel avec plus de 15 ans d\'expérience dans le transport de personnes. Discrétion, ponctualité et confort sont mes maîtres-mots.',
};

// Core values
export const VALUES = [
  {
    title: 'Sérénité',
    description: 'Un trajet en toute tranquillité, sans stress ni imprévu',
    icon: '🧘',
  },
  {
    title: 'Confidentialité',
    description: 'Votre vie privée et vos conversations restent confidentielles',
    icon: '🔒',
  },
  {
    title: 'Écologie',
    description: 'Véhicule hybride premium pour réduire notre empreinte carbone',
    icon: '🌱',
  },
  {
    title: 'Expérience',
    description: '15+ ans d\'expertise au service de votre confort',
    icon: '⭐',
  },
];

// Service types
export const SERVICES = [
  {
    id: 'transfer',
    name: 'Transfert Point à Point',
    description: 'Transfert direct de votre point de départ à votre destination',
    icon: '🚗',
    priceInfo: 'À partir de 2€/km',
  },
  {
    id: 'airport',
    name: 'Transfert Aéroport',
    description: 'Service spécialisé vers/depuis les aéroports de Genève et Lyon Saint-Exupéry',
    icon: '✈️',
    priceInfo: 'Forfait à partir de 80€',
  },
  {
    id: 'hourly',
    name: 'Mise à Disposition',
    description: 'Chauffeur à disposition pour vos déplacements multiples',
    icon: '⏰',
    priceInfo: '65€/heure',
  },
  {
    id: 'business',
    name: 'Business & Événements',
    description: 'Transport professionnel pour vos rendez-vous d\'affaires et événements',
    icon: '💼',
    priceInfo: 'Devis personnalisé',
  },
];

// Pricing - Grille Tarifaire 2025/2026
export const PRICING = {
  // Day rate: 7h-20h (except Sun & Holidays)
  // Night rate: 20h-7h + Sundays & Holidays
  
  // Base hourly rate TTC
  hourlyBase: {
    day: { ht: 30, ttc: 33 },
    night: { ht: 42, ttc: 46.20 },
  },
  
  // Per km rates TTC
  perKm: {
    agglomeration: { day: 1.65, night: 2.20 }, // up to 24km
    horsAgglomeration: { day: 1.65, night: 2.20 }, // from 24km A/R
    horsAgglomerationOneWay: { day: 1.10, night: 1.65 }, // from 12km one way
  },
  
  // Forfaits TTC
  forfaits: [
    { hours: 3, maxKm: 270, day: 348, night: 390, label: 'Forfait 3H / 270km' },
    { hours: 4, maxKm: 360, day: 464, night: 520, label: 'Forfait 4H / 360km' },
    { hours: 5, maxKm: 450, day: 580, night: 650, label: 'Forfait 5H / 450km' },
    { hours: 6, maxKm: 540, day: 660, night: 750, label: 'Forfait 6H / 540km' },
    { hours: 7, maxKm: 630, day: 735, night: 812, label: 'Forfait 7H / 630km' },
    { hours: 8, maxKm: 720, day: 792, night: 880, label: 'Forfait 8H / 720km' },
  ],
  
  // Extra hour beyond forfait TTC
  extraHour: { day: 116, night: 130 },
  
  // MDA (Mise à disposition) - 10 min free
  mda: { dayPerMin: 1.20, nightPerMin: 1.80, freeMinutes: 10 },
  
  // Airport transfers (estimated)
  airport: {
    geneva: { day: 116, night: 130 },
    lyonStExupery: { day: 232, night: 260 },
  },
  
  // TVA rate
  tvaRate: 0.10,
  
  // Notes
  notes: [
    'Tarif jour: 7h00 à 20h00 (sauf Dim & JF)',
    'Tarif nuit: 20h00 à 7h00 + Dim & JF',
    'Forfait agglomération: jusqu\'à 24 km max (A/R)',
    'Hors frais de péage et mise à disposition',
    'Devis valable 5 jours',
  ],
};

// Contact info
export const CONTACT = {
  phone: '+33 6 12 34 56 78',
  email: 'patrice@mobiservice.fr',
  whatsapp: '+33612345678',
  address: 'Haute-Savoie, France',
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
  { label: 'Services', href: '/services' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Le Chauffeur', href: '/driver' },
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
  },
  {
    name: 'Aéroport Lyon Saint-Exupéry',
    address: 'Aéroport Lyon Saint-Exupéry, 69125 Colombier-Saugnieu, France',
    lat: 45.7256,
    lng: 5.0811,
    category: 'airport',
    icon: '✈️',
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
    name: 'Gare de Chamonix',
    address: 'Place de la Gare, 74400 Chamonix-Mont-Blanc, France',
    lat: 45.9237,
    lng: 6.8694,
    category: 'train',
    icon: '🚂',
  },
  {
    name: 'Annecy Centre',
    address: 'Annecy, 74000 Annecy, France',
    lat: 45.8992,
    lng: 6.1294,
    category: 'landmark',
    icon: '📍',
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

