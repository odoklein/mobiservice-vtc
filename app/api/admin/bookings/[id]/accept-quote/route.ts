import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { Resend } from 'resend';
import { DRIVER, CONTACT } from '@/lib/constants';

/**
 * POST /api/admin/bookings/[id]/accept-quote
 * 
 * Driver accepts a quote request, optionally with a discount.
 * This is the ONLY way to confirm a quote - the client cannot accept directly.
 * 
 * Body:
 * - discountPercentage?: number (5, 8, or 12)
 * - notes?: string (internal admin notes)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
        }

        const body = await request.json().catch(() => ({}));
        const { discountPercentage, notes } = body;

        // Fetch booking
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!booking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        // Check if booking can be accepted (must be in quote_pending or quote_sent status)
        const acceptableStatuses = ['quote_pending', 'quote_sent', 'quote_modified'];
        if (!acceptableStatuses.includes(booking.status)) {
            return NextResponse.json(
                { message: `Cette demande ne peut pas être acceptée. Statut actuel: ${booking.status}` },
                { status: 400 }
            );
        }

        const now = new Date();
        let finalPriceTTC = parseFloat(booking.totalPriceTTC);
        let finalPriceHT = parseFloat(booking.totalPriceHT);
        let finalTVA = parseFloat(booking.tvaAmount || '0');
        let discountAmount: number | null = null;
        let appliedDiscount: number | null = null;

        // Apply discount if provided
        if (discountPercentage) {
            const validDiscounts = [5, 8, 12];
            if (!validDiscounts.includes(discountPercentage)) {
                return NextResponse.json(
                    { message: 'Remise invalide. Doit être 5, 8 ou 12%' },
                    { status: 400 }
                );
            }

            // Calculate original price (before any previous discount)
            let basePrice = finalPriceTTC;
            if (booking.discountAmount) {
                basePrice = finalPriceTTC + parseFloat(booking.discountAmount);
            }

            // Calculate new discount
            discountAmount = (basePrice * discountPercentage) / 100;
            finalPriceTTC = basePrice - discountAmount;
            finalPriceHT = finalPriceTTC / 1.10; // Remove 10% TVA
            finalTVA = finalPriceTTC - finalPriceHT;
            appliedDiscount = discountPercentage;
        }

        // Update booking to confirmed
        const [updatedBooking] = await db
            .update(bookings)
            .set({
                status: 'confirmed',
                adminConfirmedBy: admin.adminId,
                adminConfirmedAt: now,
                confirmedAt: now,
                adminNotes: notes || booking.adminNotes,
                discountPercentage: appliedDiscount,
                discountAmount: discountAmount?.toFixed(2) || booking.discountAmount,
                totalPriceTTC: finalPriceTTC.toFixed(2),
                totalPriceHT: finalPriceHT.toFixed(2),
                tvaAmount: finalTVA.toFixed(2),
                totalPrice: finalPriceTTC.toFixed(2), // Legacy field
                updatedAt: now,
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        console.log(`[QUOTE ACCEPTED] Booking ${bookingId} accepted by admin ${admin.adminId}${appliedDiscount ? ` with ${appliedDiscount}% discount` : ''}`);

        // Send confirmation email to customer - THIS IS THE ONLY EMAIL SENT
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                const discountHtml = appliedDiscount ? `
                    <div style="background: linear-gradient(135deg, #5CD85A 0%, #4BC449 100%); color: #0A0A0A; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px;">🎁 Remise exceptionnelle appliquée</p>
                        <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold;">-${appliedDiscount}%</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px;">Vous économisez ${discountAmount?.toFixed(2)}€</p>
                    </div>
                ` : '';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: '✅ Réservation Confirmée - MobiService VTC',
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
                            <!-- Header with Price (Step 2 Style) -->
                            <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); padding: 40px 32px; text-align: left; position: relative;">
                                <div style="display: flex; justify-content:建设; align-items: flex-start;">
                                    <div style="flex: 1;">
                                        <p style="color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; margin: 0 0 8px 0;">Réservation Confirmée</p>
                                        <h2 style="color: #5CD85A; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">${finalPriceTTC.toFixed(2)}€</h2>
                                        <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 8px 0 0 0;">TTC • TVA incluse</p>
                                    </div>
                                    <div style="background: ${booking.isNightRate ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${booking.isNightRate ? '#a5b4fc' : '#fcd34d'}; padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 600; border: 1px solid ${booking.isNightRate ? 'rgba(165, 180, 252, 0.3)' : 'rgba(252, 211, 77, 0.3)'};">
                                        ${booking.isNightRate ? '🌙 Tarif nuit' : '☀️ Tarif jour'}
                                    </div>
                                </div>
                            </div>
                            
                            <div style="padding: 32px; background: white;">
                                <!-- Route Visualization -->
                                <div style="position: relative; margin-bottom: 32px;">
                                    <div style="position: absolute; left: 15px; top: 20px; bottom: 20px; width: 2px; background: linear-gradient(to bottom, #5CD85A, #f87171);"></div>
                                    
                                    <div style="display: flex; align-items: flex-start; margin-bottom: 24px;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #5CD85A; display: flex; align-items: center; justify-content: center; z-index: 1; flex-shrink: 0;">
                                            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                                        </div>
                                        <div style="margin-left: 16px;">
                                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Départ</p>
                                            <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 15px; font-weight: 500;">${booking.pickupAddress}</p>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; align-items: flex-start;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f87171; display: flex; align-items: center; justify-content: center; z-index: 1; flex-shrink: 0;">
                                            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                                        </div>
                                        <div style="margin-left: 16px;">
                                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Arrivée</p>
                                            <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 15px; font-weight: 500;">${booking.dropoffAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Info Grid -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                                    <div style="background: #f1f5f9; padding: 16px; border-radius: 16px; text-align: center;">
                                        <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Date</p>
                                        <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 14px; font-weight: 700;">${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}</p>
                                    </div>
                                    <div style="background: #f1f5f9; padding: 16px; border-radius: 16px; text-align: center;">
                                        <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase;">Heure</p>
                                        <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 14px; font-weight: 700;">${booking.pickupTime}</p>
                                    </div>
                                </div>

                                ${appliedDiscount ? `
                                    <div style="background: #ecfdf5; border: 1px dashed #10b981; border-radius: 16px; padding: 16px; margin-bottom: 32px; text-align: center;">
                                        <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">🎁 Remise de ${appliedDiscount}% appliquée !</p>
                                        <p style="margin: 4px 0 0 0; color: #047857; font-size: 12px;">Vous économisez ${discountAmount?.toFixed(2)}€ sur ce trajet.</p>
                                    </div>
                                ` : ''}

                                <!-- Chauffeur Card -->
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
                                    <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; font-weight: 700;">Votre Chauffeur</h3>
                                    <div style="display: flex; align-items: center;">
                                        <div style="width: 48px; height: 48px; background: #5CD85A; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0A0A0A; font-weight: bold; font-size: 20px;">
                                            ${DRIVER.name.charAt(0)}
                                        </div>
                                        <div style="margin-left: 16px;">
                                            <p style="margin: 0; color: #0f172a; font-size: 15px; font-weight: 600;">${DRIVER.name}</p>
                                            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 13px;">Sera présent pour votre trajet</p>
                                        </div>
                                    </div>
                                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">Le chauffeur vous contactera avant le jour du trajet pour coordonner la prise en charge.</p>
                                        <a href="tel:${CONTACT.phone}" style="display: inline-block; margin-top: 12px; color: #0f172a; text-decoration: none; font-weight: 700; font-size: 14px; background: white; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                            📞 Appeler : ${CONTACT.phone}
                                        </a>
                                    </div>
                                </div>

                                <!-- Action CTA -->
                                <div style="text-align: center;">
                                    <a href="${appUrl}/quote/${booking.id}" style="display: block; background: #0f172a; color: white; padding: 18px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 16px; margin-bottom: 24px;">
                                        Suivre ma réservation en temps réel
                                    </a>
                                    <p style="margin: 0; color: #64748b; font-size: 13px;">Paiement à bord auprès du chauffeur (Espèces ou CB)</p>
                                </div>
                            </div>
                            
                            <div style="padding: 24px; text-align: center; background: #f1f5f9; color: #94a3b8; font-size: 12px;">
                                <p style="margin: 0;">MobiService VTC — 74 Haute-Savoie</p>
                                <p style="margin: 4px 0 0 0;">Besoin d'aide ? Contactez-nous à <a href="mailto:${CONTACT.email}" style="color: #64748b;">${CONTACT.email}</a></p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[EMAIL] Confirmation email sent to ${booking.guestEmail}`);
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: appliedDiscount
                ? `Demande acceptée avec ${appliedDiscount}% de remise`
                : 'Demande acceptée',
            booking: updatedBooking,
            finalPrice: {
                totalPriceTTC: finalPriceTTC.toFixed(2),
                totalPriceHT: finalPriceHT.toFixed(2),
                tvaAmount: finalTVA.toFixed(2),
                discountPercentage: appliedDiscount,
                discountAmount: discountAmount?.toFixed(2),
            },
        });
    } catch (error) {
        console.error('Error accepting quote:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
