import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

// POST /api/quote/[id]/refuse - Customer refuses the quote
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);
        const body = await request.json().catch(() => ({}));
        const { reason } = body;

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

        // Check if quote can be refused
        if (!['quote_sent', 'quote_modified'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, error: 'This quote cannot be refused in its current state' },
                { status: 400 }
            );
        }

        // Update status to quote_refused
        await db
            .update(bookings)
            .set({
                status: 'quote_refused',
                customerComment: reason || booking.customerComment,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        // Send confirmation email to customer
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: 'Devis Refusé - MobiService VTC',
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
              </div>
              <div style="padding: 32px;">
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Nous avons bien pris en compte votre refus du devis #${bookingId}.</p>
                <p>Si vous avez des questions ou si vous souhaitez discuter d'autres options, n'hésitez pas à nous contacter.</p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${appUrl}/reservation" 
                     style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Demander un nouveau devis
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Merci de votre intérêt pour MobiService VTC.</p>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
              </div>
            </div>
          `,
                });
            } catch (emailError) {
                console.error('Error sending refusal email:', emailError);
            }
        }

        // Notify driver
        if (process.env.RESEND_API_KEY && DRIVER.email) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [DRIVER.email],
                    subject: `❌ Devis #${bookingId} Refusé par ${booking.guestName}`,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">❌ Devis Refusé</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold;">Le client a refusé le devis #${bookingId}</p>
                <p><strong>Client :</strong> ${booking.guestName}</p>
                <p><strong>Trajet :</strong> ${booking.pickupAddress} → ${booking.dropoffAddress}</p>
                <p><strong>Montant proposé :</strong> ${booking.totalPriceTTC}€ TTC</p>
                ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
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
            message: 'Quote refused successfully',
        });
    } catch (error) {
        console.error('Error refusing quote:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to refuse quote' },
            { status: 500 }
        );
    }
}
