import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, otpVerifications } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { Resend } from 'resend';

// Verify OTP and confirm booking for cash payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, otpCode } = body;

    if (!bookingId || !otpCode) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and OTP code required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Verify OTP
    const [otpRecord] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.bookingId, bookingId),
          eq(otpVerifications.code, otpCode),
          eq(otpVerifications.verified, false),
          gte(otpVerifications.expiresAt, now)
        )
      )
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Code invalide ou expiré' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await db
      .update(otpVerifications)
      .set({ verified: true, verifiedAt: now })
      .where(eq(otpVerifications.id, otpRecord.id));

    // Update booking status to verified (awaiting admin approval)
    await db
      .update(bookings)
      .set({
        status: 'verified', // Changed from 'confirmed' - now requires admin approval
        paymentStatus: 'pending', // Cash payment pending until trip
        otpVerified: true,
      })
      .where(eq(bookings.id, bookingId));

    // Fetch updated booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log(`[VERIFIED] Booking ${bookingId} verified (awaiting admin approval)`);

    // Send "pending approval" email with Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        await resend.emails.send({
          from: `MobiService VTC <${fromEmail}>`,
          to: [booking.guestEmail!],
          subject: '✅ Réservation reçue - En attente de confirmation',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">📋 Réservation Reçue</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #fff3cd; border-radius: 12px; border-left: 4px solid #ffc107;">
                  <p style="font-size: 48px; margin: 0;">⏳</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">Réservation reçue !</p>
                </div>
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Votre réservation a été reçue avec succès. Notre équipe va l'examiner et vous confirmera sous peu.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Détails de votre réservation</p>
                  <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}</p>
                  <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                  <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                  <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                </div>
                
                <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 24px 0;">
                  <p style="margin: 0; font-weight: bold; color: #1565c0;">⏱️ En attente de confirmation</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #1565c0;">Vous recevrez un email de confirmation une fois que notre équipe aura validé votre réservation.</p>
                </div>
                
                ${booking.paymentMethod === 'cash' ? `
                <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; font-weight: bold;">💵 Paiement en espèces : ${booking.totalPrice}€</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">Préparez le montant exact pour le chauffeur.</p>
                </div>
                ` : ''}
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC</p>
              </div>
            </div>
          `,
        });
        console.log(`[EMAIL] Pending approval email sent to ${booking.guestEmail}`);
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      message: 'Booking verified - awaiting admin approval',
      redirectUrl: `${appUrl}/reservation/success?booking_id=${bookingId}&payment_method=cash&status=verified`,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
