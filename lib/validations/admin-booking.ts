import { z } from 'zod';

const dateLike = z.union([z.date(), z.string().transform((val) => new Date(val))]).refine(
  (date) => !isNaN(date.getTime()),
  { message: 'Date invalide' }
);

const decimalLike = z.union([z.number(), z.string()]).transform((val) => val.toString());

export const adminBookingCreateSchema = z.object({
  // Guest booking info
  guestName: z.string().min(2).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(6).optional(),

  // Trip details
  pickupAddress: z.string().min(5),
  pickupLat: decimalLike.optional(),
  pickupLng: decimalLike.optional(),
  dropoffAddress: z.string().min(5),
  dropoffLat: decimalLike.optional(),
  dropoffLng: decimalLike.optional(),
  pickupDate: dateLike,
  pickupTime: z.string().min(1),
  passengers: z.number().min(1).max(4).default(1),
  luggage: z.number().min(0).max(5).default(0),

  // Service type
  serviceType: z.enum(['transfer', 'airport', 'hourly', 'business', 'mda']),
  tripType: z.enum(['one-way', 'round-trip']).default('one-way'),

  // Trip metrics
  distance: decimalLike.optional(),
  duration: z.number().optional(),
  hours: z.number().optional(),
  distanceCA: decimalLike.optional(),
  distanceTP: decimalLike.optional(),
  distanceReturn: decimalLike.optional(),

  // Pricing
  isNightRate: z.boolean().optional(),
  rateType: z.string().optional(),

  // Forfait
  isForfait: z.boolean().optional(),
  forfaitName: z.string().optional(),
  forfaitHours: z.number().optional(),
  forfaitMaxKm: z.number().optional(),

  // Price breakdown
  baseFare: decimalLike.optional(),
  distanceCharge: decimalLike.optional(),
  hourlyCharge: decimalLike.optional(),
  waitingCharge: decimalLike.optional(),
  forfaitDiscount: decimalLike.optional(),

  // Final prices
  totalPriceHT: decimalLike.optional(),
  totalPriceTTC: decimalLike.optional(),
  tvaAmount: decimalLike.optional(),
  tvaRate: decimalLike.optional(),

  // Legacy fields
  basePrice: decimalLike,
  totalPrice: decimalLike,
  currency: z.string().optional(),

  priceBreakdown: z.any().optional(),
  notes: z.string().optional(),
  specialRequests: z.any().optional(),

  // Status
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
  paymentMethod: z.enum(['stripe', 'cash', 'other']).optional(),

  // Legal
  cgvAccepted: z.boolean().optional(),
  cgvAcceptedAt: dateLike.optional(),
});

export const adminBookingUpdateSchema = adminBookingCreateSchema
  .partial()
  .extend({
    // Extra fields we allow admins to patch
    confirmedViaEmail: z.boolean().optional(),
    otpVerified: z.boolean().optional(),
    confirmedAt: dateLike.optional().nullable(),
    startedAt: dateLike.optional().nullable(),
    completedAt: dateLike.optional().nullable(),
    documentsPdfPath: z.string().optional().nullable(),
    stripePaymentIntentId: z.string().optional().nullable(),
    stripeSessionId: z.string().optional().nullable(),
    confirmationToken: z.string().optional().nullable(),
  });

export type AdminBookingCreateInput = z.infer<typeof adminBookingCreateSchema>;
export type AdminBookingUpdateInput = z.infer<typeof adminBookingUpdateSchema>;



