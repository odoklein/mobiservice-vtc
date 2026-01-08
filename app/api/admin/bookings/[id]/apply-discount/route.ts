import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

// POST /api/admin/bookings/[id]/apply-discount - Driver applies a discount
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);
        const body = await request.json();
        const { discountPercentage } = body;

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid booking ID' },
                { status: 400 }
            );
        }

        // Validate discount percentage
        const validDiscounts = [5, 8, 12];
        if (!validDiscounts.includes(discountPercentage)) {
            return NextResponse.json(
                { success: false, error: 'Invalid discount percentage. Must be 5, 8, or 12.' },
                { status: 400 }
            );
        }

        // Fetch current booking
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Calculate original price (before any previous discount)
        const originalPriceTTC = parseFloat(booking.totalPriceTTC);
        let basePrice = originalPriceTTC;

        // If there was a previous discount, calculate original price
        if (booking.discountAmount) {
            basePrice = originalPriceTTC + parseFloat(booking.discountAmount);
        }

        // Calculate new discount
        const discountAmount = (basePrice * discountPercentage) / 100;
        const newPriceTTC = basePrice - discountAmount;
        const newPriceHT = newPriceTTC / 1.10; // Remove 10% TVA
        const newTVA = newPriceTTC - newPriceHT;

        // Update booking with discount
        await db
            .update(bookings)
            .set({
                discountPercentage: discountPercentage,
                discountAmount: discountAmount.toFixed(2),
                totalPriceTTC: newPriceTTC.toFixed(2),
                totalPriceHT: newPriceHT.toFixed(2),
                tvaAmount: newTVA.toFixed(2),
                totalPrice: newPriceTTC.toFixed(2), // Legacy field
                status: 'quote_modified',
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        // Send email to customer with modified quote
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const quoteUrl = `${appUrl}/quote/${bookingId}`;

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: `🎉 Remise de ${discountPercentage}% sur votre Devis - MobiService VTC`,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">🎉 Offre Spéciale</p>
              </div>
              <div style="padding: 32px;">
                <div style="text-align: center; margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #5CD85A 0%, #4BC449 100%); border-radius: 12px;">
                  <p style="font-size: 48px; margin: 0;">🎁</p>
                  <p style="font-size: 28px; font-weight: bold; color: #0A0A0A; margin: 8px 0 0 0;">-${discountPercentage}%</p>
                  <p style="color: #0A0A0A; margin: 4px 0 0 0;">de remise sur votre devis !</p>
                </div>
                
                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                <p>Bonne nouvelle ! Une remise exceptionnelle de <strong>${discountPercentage}%</strong> a été appliquée à votre devis.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Récapitulatif</p>
                  <p style="margin: 4px 0;"><strong>Trajet :</strong> ${booking.pickupAddress} → ${booking.dropoffAddress}</p>
                  <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR') : ''}</p>
                </div>
                
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; border: 2px solid #e0e0e0;">
                  <p style="text-decoration: line-through; color: #999; margin: 0;">${basePrice.toFixed(2)}€</p>
                  <p style="font-size: 36px; font-weight: bold; color: #5CD85A; margin: 8px 0;">${newPriceTTC.toFixed(2)}€ TTC</p>
                  <p style="color: #5CD85A; font-weight: bold; margin: 0;">Vous économisez ${discountAmount.toFixed(2)}€</p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${quoteUrl}" 
                     style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                    Accepter cette offre
                  </a>
                </div>
                
                <p style="text-align: center; color: #666; font-size: 14px;">
                  Cette offre est valable pendant 5 jours.
                </p>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
              </div>
            </div>
          `,
                });
            } catch (emailError) {
                console.error('Error sending discount email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Discount of ${discountPercentage}% applied successfully`,
            newPrice: {
                totalPriceTTC: newPriceTTC.toFixed(2),
                totalPriceHT: newPriceHT.toFixed(2),
                tvaAmount: newTVA.toFixed(2),
                discountAmount: discountAmount.toFixed(2),
                discountPercentage,
            },
        });
    } catch (error) {
        console.error('Error applying discount:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to apply discount' },
            { status: 500 }
        );
    }
}
