import { z } from 'zod';

export const bookingStepOneSchema = z.object({
  pickupAddress: z.string().min(5, 'Adresse de départ requise'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(5, 'Adresse d\'arrivée requise'),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  pickupDate: z.date({
    required_error: 'Date de prise en charge requise',
  }),
  pickupTime: z.string().min(1, 'Heure de prise en charge requise'),
  passengers: z.number().min(1).max(4, 'Maximum 4 passagers'),
  luggage: z.number().min(0).max(5, 'Maximum 5 bagages'),
  serviceType: z.enum(['transfer', 'airport', 'hourly', 'business', 'mda']),
  hours: z.number().min(2).max(12).optional(), // For hourly/forfait bookings
  isRoundTrip: z.boolean().optional(), // For transfer pricing
});

export const bookingStepTwoSchema = z.object({
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
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
});

export const completeBookingSchema = bookingStepOneSchema
  .merge(bookingStepTwoSchema)
  .merge(bookingStepThreeSchema);

export type BookingStepOneData = z.infer<typeof bookingStepOneSchema>;
export type BookingStepTwoData = z.infer<typeof bookingStepTwoSchema>;
export type BookingStepThreeData = z.infer<typeof bookingStepThreeSchema>;
export type CompleteBookingData = z.infer<typeof completeBookingSchema>;

