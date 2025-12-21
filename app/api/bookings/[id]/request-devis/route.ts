import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createOTPForBooking } from '@/lib/auth/estimate-auth';
import { sendOTPEmail } from '@/lib/email/otp';

/**
 * POST /api/bookings/[id]/request-devis
 * Génère un code OTP et l'envoie par email au client pour accéder au devis
 * 
 * Body attendu:
 * {
 *   "email": "client@example.com"
 * }
 * 
 * Retourne:
 * {
 *   "success": true,
 *   "message": "Code envoyé par email",
 *   "expiresIn": 600 (secondes)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

    // Validation du bookingId
    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de réservation invalide' 
        },
        { status: 400 }
      );
    }

    // Parser le body
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email invalide' 
        },
        { status: 400 }
      );
    }

    console.log(`[Request Devis] Demande OTP pour booking ${bookingId}, email: ${email}`);

    // Récupérer la réservation
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'email correspond à la réservation
    if (booking.guestEmail?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email incorrect',
          message: 'L\'email fourni ne correspond pas à cette réservation'
        },
        { status: 403 }
      );
    }

    // Générer le code OTP
    const otpCode = await createOTPForBooking(bookingId);

    // Envoyer l'email avec le code OTP
    try {
      await sendOTPEmail({
        to: email,
        guestName: booking.guestName || 'Client',
        otpCode,
        bookingId,
      });

      console.log(`[Request Devis] OTP envoyé à ${email}`);

      return NextResponse.json({
        success: true,
        message: 'Un code de vérification a été envoyé à votre adresse email',
        expiresIn: 600, // 10 minutes en secondes
      });

    } catch (emailError) {
      console.error('[Request Devis] Erreur lors de l\'envoi de l\'email:', emailError);
      
      // Si l'envoi d'email échoue, on retourne quand même le code en développement
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Mode développement: Code OTP généré',
          otpCode, // ⚠️ À ne PAS faire en production !
          expiresIn: 600,
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de l\'envoi de l\'email',
          message: 'Impossible d\'envoyer le code de vérification. Veuillez réessayer.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Request Devis] Erreur:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/[id]/request-devis
 * Retourne les informations sur la possibilité de demander un devis
 * (sans données sensibles)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la réservation existe
    const [booking] = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        guestName: bookings.guestName,
        // Ne pas exposer l'email complet
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: booking.status,
      canRequestDevis: ['verified', 'confirmed', 'completed'].includes(booking.status),
      guestName: booking.guestName,
    });

  } catch (error) {
    console.error('[Request Devis GET] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

