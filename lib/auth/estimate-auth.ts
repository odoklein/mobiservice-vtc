import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { bookings, otpVerifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';

/**
 * Résultat de la vérification d'accès
 */
export interface AccessVerification {
  authorized: boolean;
  role: 'admin' | 'client' | 'none';
  reason?: string;
}

/**
 * Vérifie si l'utilisateur a accès à un devis/estimation
 * Supporte deux types d'authentification:
 * 1. Admin: via JWT token dans les cookies
 * 2. Client: via email/phone + OTP en query params
 * 
 * @param request - La requête Next.js
 * @param bookingId - L'ID de la réservation
 * @returns Résultat de la vérification d'accès
 */
export async function verifyEstimateAccess(
  request: NextRequest,
  bookingId: number
): Promise<AccessVerification> {
  // 1. Vérifier si c'est un admin
  const admin = await getAdminFromRequest();
  if (admin) {
    console.log(`[Auth] Accès admin vérifié pour le booking ${bookingId}`);
    return {
      authorized: true,
      role: 'admin',
    };
  }

  // 2. Vérifier l'authentification client
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const otp = searchParams.get('otp');
  const token = searchParams.get('token');

  // Récupérer la réservation
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return {
      authorized: false,
      role: 'none',
      reason: 'Réservation introuvable',
    };
  }

  // Vérifier l'accès via email + OTP
  if (email && otp) {
    const isAuthorized = await verifyClientByEmailOTP(bookingId, email, otp, booking);
    if (isAuthorized) {
      return {
        authorized: true,
        role: 'client',
      };
    }
  }

  // Vérifier l'accès via téléphone + token
  if (phone && token) {
    const isAuthorized = await verifyClientByPhoneToken(bookingId, phone, token, booking);
    if (isAuthorized) {
      return {
        authorized: true,
        role: 'client',
      };
    }
  }

  // Aucune authentification valide
  return {
    authorized: false,
    role: 'none',
    reason: 'Authentification requise. Veuillez fournir un email/téléphone et un code OTP valide.',
  };
}

/**
 * Vérifie l'accès client via email + OTP
 */
async function verifyClientByEmailOTP(
  bookingId: number,
  email: string,
  otp: string,
  booking: any
): Promise<boolean> {
  try {
    // Vérifier que l'email correspond à la réservation
    if (booking.guestEmail?.toLowerCase() !== email.toLowerCase()) {
      console.log(`[Auth] Email ${email} ne correspond pas à la réservation ${bookingId}`);
      return false;
    }

    // Vérifier l'OTP dans la base de données
    const [otpRecord] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.bookingId, bookingId),
          eq(otpVerifications.code, otp),
          eq(otpVerifications.verified, false)
        )
      )
      .limit(1);

    if (!otpRecord) {
      console.log(`[Auth] OTP invalide ou déjà utilisé pour le booking ${bookingId}`);
      return false;
    }

    // Vérifier l'expiration (10 minutes)
    const now = new Date();
    if (otpRecord.expiresAt < now) {
      console.log(`[Auth] OTP expiré pour le booking ${bookingId}`);
      return false;
    }

    // Marquer l'OTP comme vérifié
    await db
      .update(otpVerifications)
      .set({
        verified: true,
        verifiedAt: now,
      })
      .where(eq(otpVerifications.id, otpRecord.id));

    console.log(`[Auth] Accès client vérifié via email pour le booking ${bookingId}`);
    return true;

  } catch (error) {
    console.error('[Auth] Erreur lors de la vérification email/OTP:', error);
    return false;
  }
}

/**
 * Vérifie l'accès client via téléphone + token
 */
async function verifyClientByPhoneToken(
  bookingId: number,
  phone: string,
  token: string,
  booking: any
): Promise<boolean> {
  try {
    // Normaliser le numéro de téléphone (enlever espaces, tirets, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const normalizedBookingPhone = booking.guestPhone?.replace(/[\s\-\(\)]/g, '');

    // Vérifier que le téléphone correspond à la réservation
    if (normalizedBookingPhone !== normalizedPhone) {
      console.log(`[Auth] Téléphone ${phone} ne correspond pas à la réservation ${bookingId}`);
      return false;
    }

    // Pour l'instant, utiliser le même système OTP
    // Dans une vraie application, on pourrait avoir un système de token SMS différent
    const [otpRecord] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.bookingId, bookingId),
          eq(otpVerifications.code, token),
          eq(otpVerifications.verified, false)
        )
      )
      .limit(1);

    if (!otpRecord) {
      console.log(`[Auth] Token invalide ou déjà utilisé pour le booking ${bookingId}`);
      return false;
    }

    // Vérifier l'expiration
    const now = new Date();
    if (otpRecord.expiresAt < now) {
      console.log(`[Auth] Token expiré pour le booking ${bookingId}`);
      return false;
    }

    // Marquer comme vérifié
    await db
      .update(otpVerifications)
      .set({
        verified: true,
        verifiedAt: now,
      })
      .where(eq(otpVerifications.id, otpRecord.id));

    console.log(`[Auth] Accès client vérifié via téléphone pour le booking ${bookingId}`);
    return true;

  } catch (error) {
    console.error('[Auth] Erreur lors de la vérification téléphone/token:', error);
    return false;
  }
}

/**
 * Génère un code OTP à 6 chiffres
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Crée un nouvel OTP pour une réservation
 * 
 * @param bookingId - L'ID de la réservation
 * @returns Le code OTP généré
 */
export async function createOTPForBooking(bookingId: number): Promise<string> {
  try {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expire dans 10 minutes

    await db.insert(otpVerifications).values({
      bookingId,
      code: otp,
      expiresAt,
      verified: false,
    });

    console.log(`[Auth] OTP créé pour le booking ${bookingId}`);
    return otp;

  } catch (error) {
    console.error('[Auth] Erreur lors de la création de l\'OTP:', error);
    throw new Error('Impossible de créer le code de vérification');
  }
}

/**
 * Vérifie si un booking existe et retourne ses informations
 * 
 * @param bookingId - L'ID de la réservation
 * @returns Les informations de la réservation ou null
 */
export async function getBookingForEstimate(bookingId: number) {
  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    return booking || null;

  } catch (error) {
    console.error('[Auth] Erreur lors de la récupération du booking:', error);
    return null;
  }
}

