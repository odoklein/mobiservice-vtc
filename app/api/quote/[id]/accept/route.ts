import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

// POST /api/quote/[id]/accept - Customer accepts the quote
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid quote ID' },
                { status: 400 }
            );
        }

        // Fetch current booking
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Quote not found' },
                { status: 404 }
            );
        }

        // Check if quote can be accepted
        if (!['quote_sent', 'quote_modified'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'This quote cannot be accepted in its current state' },
                { status: 400 }
            );
        }

        // Update status to quote_accepted
        await db
            .update(bookings)
            .set({
                status: 'quote_accepted',
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        // Send confirmation email to customer
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: '✅ Devis Accepté - MobiService VTC',
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">✅ Devis Accepté</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #e8f8e7; border-radius: 12px;">
                  <p style="font-size: 48px; margin: 0;">🎉</p>
                  <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0;">Merci pour votre confiance !</p>
                </div>
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Votre devis a été accepté avec succès. Notre équipe va maintenant confirmer votre réservation.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Récapitulatif</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}</p>
                  <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                  <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                  <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                </div>
                
                <div style="background: #fff; padding: 20px; border: 2px solid #5CD85A; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Montant Total</p>
                  <p style="margin: 0; font-size: 32px; font-weight: bold; color: #0A0A0A;">${booking.totalPriceTTC}€ TTC</p>
                  ${booking.discountPercentage ? `<p style="margin: 8px 0 0 0; color: #5CD85A; font-weight: bold;">Remise de ${booking.discountPercentage}% appliquée</p>` : ''}
                </div>

                <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 24px 0;">
                  <p style="margin: 0; font-weight: bold; color: #1565c0;">📞 Prochaines étapes</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #1565c0;">Vous recevrez une confirmation finale sous peu. Le chauffeur vous contactera avant le jour J.</p>
                </div>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
              </div>
            </div>
          `,
                });
            } catch (emailError) {
                console.error('Error sending acceptance email:', emailError);
            }
        }

        // Notify driver
        if (process.env.RESEND_API_KEY && DRIVER.email) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [DRIVER.email],
                    subject: `✅ Devis #${bookingId} Accepté par ${booking.guestName}`,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">✅ Devis Accepté</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold;">Le client a accepté le devis #${bookingId}</p>
                <p><strong>Client :</strong> ${booking.guestName}</p>
                <p><strong>Téléphone :</strong> ${booking.guestPhone}</p>
                <p><strong>Email :</strong> ${booking.guestEmail}</p>
                <p><strong>Montant :</strong> ${booking.totalPriceTTC}€ TTC</p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${appUrl}/admin/bookings/${bookingId}" 
                     style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Confirmer la réservation
                  </a>
                </div>
              </div>
            </div>
          `,
                });
            } catch (emailError) {
                console.error('Error sending driver notification:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Quote accepted successfully',
        });
    } catch (error) {
        console.error('Error accepting quote:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to accept quote' },
            { status: 500 }
        );
    }
}
