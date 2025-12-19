import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

// Mock card payment processing
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bookingId, cardDetails } = body;

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: 'Booking ID required' },
                { status: 400 }
            );
        }

        // Validate card details
        if (!cardDetails?.cardNumber || !cardDetails?.expiry || !cardDetails?.cvv || !cardDetails?.cardHolder) {
            return NextResponse.json(
                { success: false, error: 'Tous les champs de la carte sont requis' },
                { status: 400 }
            );
        }

        const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');

        // Basic validations
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            return NextResponse.json({ success: false, error: 'Numéro de carte invalide' }, { status: 400 });
        }
        if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
            return NextResponse.json({ success: false, error: 'CVV invalide' }, { status: 400 });
        }

        const expiryMatch = cardDetails.expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!expiryMatch) {
            return NextResponse.json({ success: false, error: 'Format de date invalide (MM/YY)' }, { status: 400 });
        }

        const [, month, year] = expiryMatch;
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        if (parseInt(month) < 1 || parseInt(month) > 12) {
            return NextResponse.json({ success: false, error: 'Mois invalide' }, { status: 400 });
        }
        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            return NextResponse.json({ success: false, error: 'Carte expirée' }, { status: 400 });
        }

        // Simulate payment processing (1 second delay)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockSessionId = `card_${Date.now()}_${bookingId}`;
        const lastFourDigits = cardNumber.slice(-4);

        // Update booking
        await db
            .update(bookings)
            .set({
                status: 'confirmed',
                paymentStatus: 'paid',
                stripeSessionId: mockSessionId,
                confirmedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        console.log(`[PAYMENT] Card payment successful for booking ${bookingId}`);

        // Send confirmation email
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail!],
                    subject: '✅ Paiement confirmé - MobiService VTC',
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">🎉 Paiement Confirmé</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #e8f8e7; border-radius: 12px;">
                  <p style="font-size: 48px; margin: 0;">✓</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">Paiement réussi !</p>
                </div>
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Votre paiement a été effectué avec succès. Votre chauffeur vous attendra à l'adresse indiquée.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Détails</p>
                  <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}</p>
                  <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                  <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                  <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                </div>
                
                <div style="background: #d4edda; padding: 16px; border-radius: 8px; border-left: 4px solid #28a745;">
                  <p style="margin: 0; font-weight: bold;">💳 Payé : ${booking.totalPrice}€</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #155724;">Carte **** ${lastFourDigits}</p>
                </div>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC</p>
              </div>
            </div>
          `,
                });
                console.log(`[EMAIL] Payment confirmation sent to ${booking.guestEmail}`);
            } catch (emailError) {
                console.error('Email error:', emailError);
            }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        return NextResponse.json({
            success: true,
            message: 'Payment successful',
            sessionId: mockSessionId,
            lastFourDigits,
            redirectUrl: `${appUrl}/reservation/success?booking_id=${bookingId}&payment_method=card&session_id=${mockSessionId}`,
        });
    } catch (error) {
        console.error('Card payment error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur de paiement' },
            { status: 500 }
        );
    }
}
