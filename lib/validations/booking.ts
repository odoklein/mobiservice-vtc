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
  serviceType: z.enum(['transfer', 'airport', 'hourly', 'business']),
});

export const bookingStepTwoSchema = z.object({
  distance: z.number().optional(),
  duration: z.number().optional(),
  basePrice: z.number().min(0),
  totalPrice: z.number().min(0),
  notes: z.string().optional(),
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

