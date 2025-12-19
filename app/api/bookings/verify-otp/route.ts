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

    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentStatus: 'pending', // Cash payment pending until trip
        confirmedAt: now,
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

    console.log(`[CONFIRMED] Booking ${bookingId} confirmed (cash payment)`);

    // Send confirmation email with Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        await resend.emails.send({
          from: `MobiService VTC <${fromEmail}>`,
          to: [booking.guestEmail!],
          subject: '✅ Réservation confirmée - MobiService VTC',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">🎉 Réservation Confirmée</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #e8f8e7; border-radius: 12px;">
                  <p style="font-size: 48px; margin: 0;">✓</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">Réservation confirmée !</p>
                </div>
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Votre réservation est confirmée. Votre chauffeur vous attendra à l'adresse indiquée.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Détails</p>
                  <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}</p>
                  <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                  <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                  <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; font-weight: bold;">💵 Paiement en espèces : ${booking.totalPrice}€</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">Préparez le montant exact pour le chauffeur.</p>
                </div>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC</p>
              </div>
            </div>
          `,
        });
        console.log(`[EMAIL] Confirmation sent to ${booking.guestEmail}`);
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed',
      redirectUrl: `${appUrl}/reservation/success?booking_id=${bookingId}&payment_method=cash`,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
