// Brand constants
export const BRAND = {
  name: 'MobiService VTC',
  tagline: 'Votre chauffeur premium à Lyon',
  description: 'Service de transport avec chauffeur privé premium',
};

// Driver info
export const DRIVER = {
  name: 'Patrice',
  age: 55,
  city: 'Lyon',
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
    description: 'Service spécialisé vers/depuis les aéroports Lyon Saint-Exupéry, Genève',
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

// Pricing
export const PRICING = {
  transfer: {
    baseFare: 10,
    perKm: 2,
    minPrice: 30,
  },
  airport: {
    lyonStExupery: 80,
    geneva: 150,
  },
  hourly: {
    perHour: 65,
    minHours: 2,
  },
};

// Contact info
export const CONTACT = {
  phone: '+33 6 12 34 56 78',
  email: 'patrice@mobiservice.fr',
  whatsapp: '+33612345678',
  address: 'Lyon, France',
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

// Popular departure locations (Lyon area)
export const POPULAR_LOCATIONS = [
  {
    name: 'Aéroport Lyon Saint-Exupéry',
    address: 'Aéroport Lyon Saint-Exupéry, 69125 Colombier-Saugnieu, France',
    lat: 45.7256,
    lng: 5.0811,
    category: 'airport',
    icon: '✈️',
  },
  {
    name: 'Aéroport de Genève',
    address: 'Aéroport de Genève, Route de l\'Aéroport 21, 1215 Le Grand-Saconnex, Suisse',
    lat: 46.2380,
    lng: 6.1090,
    category: 'airport',
    icon: '✈️',
  },
  {
    name: 'Gare de Lyon Part-Dieu',
    address: 'Gare de Lyon Part-Dieu, 5 Place Charles Béraudier, 69003 Lyon, France',
    lat: 45.7606,
    lng: 4.8604,
    category: 'train',
    icon: '🚂',
  },
  {
    name: 'Gare de Lyon Perrache',
    address: 'Gare de Lyon Perrache, 14 Cours de Verdun, 69002 Lyon, France',
    lat: 45.7325,
    lng: 4.8256,
    category: 'train',
    icon: '🚂',
  },
  {
    name: 'Place Bellecour',
    address: 'Place Bellecour, 69002 Lyon, France',
    lat: 45.7578,
    lng: 4.8328,
    category: 'landmark',
    icon: '📍',
  },
  {
    name: 'Hôtel de Ville de Lyon',
    address: 'Place de la Comédie, 69001 Lyon, France',
    lat: 45.7676,
    lng: 4.8350,
    category: 'landmark',
    icon: '🏛️',
  },
  {
    name: 'Confluence',
    address: 'Confluence, 69002 Lyon, France',
    lat: 45.7475,
    lng: 4.8186,
    category: 'landmark',
    icon: '📍',
  },
  {
    name: 'Vieux Lyon',
    address: 'Vieux Lyon, 69005 Lyon, France',
    lat: 45.7634,
    lng: 4.8277,
    category: 'landmark',
    icon: '🏛️',
  },
];

