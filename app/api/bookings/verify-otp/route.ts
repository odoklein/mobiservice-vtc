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
        status: 'quote_sent', // Changed from 'verified' to 'quote_sent'
        paymentStatus: 'pending',
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

    console.log(`[VERIFIED] Booking ${bookingId} phone verified. Quote sent.`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const quoteUrl = `${appUrl}/quote/${booking.id}`;

    // Send "Your Quote" email with Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        await resend.emails.send({
          from: `MobiService VTC <${fromEmail}>`,
          to: [booking.guestEmail!],
          subject: '📩 Demande reçue - MobiService VTC',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">📩 Demande de Devis Reçue</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #e8f8e7; border-radius: 12px;">
                  <p style="font-size: 48px; margin: 0;">✅</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">Demande bien reçue !</p>
                </div>
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Nous avons bien reçu votre demande de transport. Notre chauffeur va l'étudier et vous recevrez une confirmation par email sous 24h.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Récapitulatif de votre trajet</p>
                  <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                  <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                  <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                </div>
                
                <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px; margin: 24px 0; text-align: center;">
                   <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Montant Estimé</p>
                   <p style="margin: 0; font-size: 32px; font-weight: bold; color: #0A0A0A;">${booking.totalPrice}€ TTC</p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${quoteUrl}" 
                     style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Suivre ma demande
                  </a>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 14px;">
                  Vous recevrez un email de confirmation dès que votre chauffeur aura validé votre trajet.
                </p>

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

    // const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // ALREADY DECLARED ABOVE

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
      redirectUrl: `${appUrl}/quote/${bookingId}`, // Redirect to Quote Page
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
