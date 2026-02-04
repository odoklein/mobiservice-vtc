import { z } from 'zod';

export const bookingStepOneSchema = z.object({
  pickupAddress: z.string().min(5, 'Adresse de départ requise'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(5, 'Adresse d\'arrivée requise'),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  pickupDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val))
  ]).refine((date) => !isNaN(date.getTime()), {
    message: 'Date de prise en charge requise',
  }),
  pickupTime: z.string().min(1, 'Heure de prise en charge requise'),
  maxArrivalTime: z.string().optional(), // Heure maximale d'arrivée (HH:mm) - optionnel
  passengers: z.number().min(1).max(4, 'Maximum 4 passagers'),
  adults: z.number().min(1).max(4).default(1),
  children: z.number().min(0).max(4).default(0),
  childAge: z.number().min(1).max(10).optional(), // Âge de l'enfant (- de 10 ans)
  babies: z.number().min(0).max(4).default(0),
  luggage: z.number().min(0).max(5, 'Maximum 5 bagages'),
  serviceType: z.enum(['transfer', 'hourly']), // Only Point à Point and Mise à Disposition
  tripType: z.enum(['one-way', 'round-trip']).default('one-way'),
  hours: z.number().min(1).max(8).optional(), // For hourly/forfait bookings (1-8h, paliers 30 min)
  waitingMinutes: z.number().min(0).max(480).optional(), // For round-trip MAD (waiting duration)
});

export const bookingStepTwoSchema = z.object({
  // Distance segments (CA/TP system)
  distanceCA: z.number().optional(), // Depot → Pickup
  distanceTP: z.number().optional(), // Pickup → Dropoff
  distanceReturn: z.number().optional(), // Dropoff → Depot (TOUJOURS inclus - règle n°1)

  // Legacy distance (for backward compatibility)
  distance: z.number().optional(),
  duration: z.number().optional(),

  // Pricing - 2025/2026 Tariff Grid
  isNightRate: z.boolean().optional(),
  rateType: z.string().optional(),

  // Forfait info
  isForfait: z.boolean().optional(),
  forfaitName: z.string().optional(),

  // Price breakdown
  baseFare: z.number().optional(),
  distanceCharge: z.number().optional(),
  hourlyCharge: z.number().optional(),
  waitingCharge: z.number().optional(),
  forfaitDiscount: z.number().optional(),

  // Final prices
  totalPriceHT: z.number().min(0).optional(),
  totalPriceTTC: z.number().min(0).optional(),
  tvaAmount: z.number().optional(),

  // Legacy fields
  basePrice: z.number().min(0),
  totalPrice: z.number().min(0),

  // Notes
  notes: z.string().optional(),

  // Full breakdown as object
  breakdown: z.object({
    baseFare: z.number().optional(),
    distanceCharge: z.number().optional(),
    hourlyCharge: z.number().optional(),
    waitingCharge: z.number().optional(),
    forfaitApplied: z.boolean().optional(),
    forfaitDiscount: z.number().optional(),
    forfaitName: z.string().optional(),
  }).optional(),
});

export const bookingStepThreeSchema = z.object({
  guestName: z.string().min(2, 'Nom complet requis'),
  guestEmail: z.string().email('Email valide requis'),
  guestPhone: z.string().min(10, 'Numéro de téléphone valide requis'),
  cgvAccepted: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les CGV et la grille tarifaire" })
  }),
  acceptTerms: z.boolean().optional(), // Legacy field
  paymentMethod: z.enum(['cash', 'card']).default('card'),
});

// Card details schema for mock payment
export const cardDetailsSchema = z.object({
  cardHolder: z.string().min(2, 'Nom du titulaire requis'),
  cardNumber: z.string()
    .min(13, 'Numéro de carte invalide')
    .max(19, 'Numéro de carte invalide')
    .refine((val) => /^[\d\s]+$/.test(val), 'Numéro de carte invalide'),
  expiry: z.string()
    .regex(/^\d{2}\/\d{2}$/, 'Format MM/YY requis'),
  cvv: z.string()
    .min(3, 'CVV invalide')
    .max(4, 'CVV invalide')
    .regex(/^\d+$/, 'CVV invalide'),
});

export const completeBookingSchema = bookingStepOneSchema
  .merge(bookingStepTwoSchema)
  .merge(bookingStepThreeSchema);

export type BookingStepOneData = z.infer<typeof bookingStepOneSchema>;
export type BookingStepTwoData = z.infer<typeof bookingStepTwoSchema>;
export type BookingStepThreeData = z.infer<typeof bookingStepThreeSchema>;
export type CompleteBookingData = z.infer<typeof completeBookingSchema>;
export type CardDetails = z.infer<typeof cardDetailsSchema>;


