import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { adminBookingApproveSchema } from '@/lib/validations/admin-booking';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

function parseBookingId(id: string): number | null {
    const bookingId = Number.parseInt(id, 10);
    return Number.isFinite(bookingId) ? bookingId : null;
}

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
        const bookingId = parseBookingId(id);
        if (!bookingId) {
            return NextResponse.json({ message: 'ID invalide' }, { status: 400 });
        }

        const body = await request.json();
        const { notes } = adminBookingApproveSchema.parse(body);

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

        // Check if booking is in verified status
        if (booking.status !== 'verified') {
            return NextResponse.json(
                { message: `Cette réservation ne peut pas être approuvée. Statut actuel: ${booking.status}` },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update booking to confirmed
        const [updatedBooking] = await db
            .update(bookings)
            .set({
                status: 'confirmed',
                adminConfirmedBy: admin.adminId,
                adminConfirmedAt: now,
                confirmedAt: now,
                adminNotes: notes || booking.adminNotes,
                updatedAt: now,
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        console.log(`[APPROVED] Booking ${bookingId} approved by admin ${admin.adminId}`);

        // Send confirmation email to customer
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: '🎉 Réservation confirmée - MobiService VTC',
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
                                <p>Votre réservation a été confirmée par notre équipe. Votre chauffeur vous attendra à l'adresse indiquée.</p>
                                
                                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Détails de votre réservation</p>
                                    <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                                    <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                                    <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                                    <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                                    <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                                    ${booking.passengers ? `<p style="margin: 4px 0;"><strong>Passagers :</strong> ${booking.passengers}</p>` : ''}
                                    ${booking.luggage ? `<p style="margin: 4px 0;"><strong>Bagages :</strong> ${booking.luggage}</p>` : ''}
                                </div>
                                
                                <div style="background: #e8f8e7; padding: 16px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0; font-weight: bold; color: #2e7d32;">✅ Confirmation</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #2e7d32;">Votre réservation est confirmée et prête pour le jour prévu.</p>
                                </div>
                                
                                ${booking.paymentMethod === 'cash' ? `
                                <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 24px 0;">
                                    <p style="margin: 0; font-weight: bold;">💵 Paiement en espèces : ${booking.totalPrice}€</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">Préparez le montant exact pour le chauffeur.</p>
                                </div>
                                ` : ''}
                                
                                ${booking.notes ? `
                                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">📝 Notes</p>
                                    <p style="margin: 0; font-size: 14px; color: #333;">${booking.notes}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[EMAIL] Confirmation email sent to ${booking.guestEmail}`);
            } catch (emailError) {
                console.error('Email error:', emailError);
            }
        }

        // Send notification to driver
        if (process.env.RESEND_API_KEY && DRIVER.email) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [DRIVER.email],
                    subject: `✅ Réservation #${booking.id} confirmée - ${booking.guestName}`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                                <p style="color: white; margin: 8px 0 0 0;">Réservation confirmée</p>
                            </div>
                            <div style="padding: 32px;">
                                <div style="background: #e8f8e7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                                    <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2e7d32;">✅ Réservation #${booking.id} confirmée</p>
                                </div>
                                
                                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 12px 0; font-weight: bold;">👤 Client</p>
                                    <p style="margin: 4px 0;"><strong>Nom :</strong> ${booking.guestName}</p>
                                    <p style="margin: 4px 0;"><strong>Email :</strong> ${booking.guestEmail}</p>
                                    <p style="margin: 4px 0;"><strong>Téléphone :</strong> ${booking.guestPhone || 'N/A'}</p>
                                </div>

                                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 12px 0; font-weight: bold;">📍 Trajet</p>
                                    <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                                    <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                                    <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                                    <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                                    ${booking.passengers ? `<p style="margin: 4px 0;"><strong>Passagers :</strong> ${booking.passengers}</p>` : ''}
                                    ${booking.luggage ? `<p style="margin: 4px 0;"><strong>Bagages :</strong> ${booking.luggage}</p>` : ''}
                                </div>

                                <div style="background: #e8f8e7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">💰 Montant</p>
                                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0A0A0A;">${booking.totalPrice}€ TTC</p>
                                    ${booking.paymentMethod === 'cash' ? '<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Paiement en espèces</p>' : ''}
                                </div>
                                
                                ${booking.notes ? `
                                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">📝 Notes</p>
                                    <p style="margin: 0; font-size: 14px; color: #333;">${booking.notes}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC</p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[EMAIL] Driver notification sent to ${DRIVER.email}`);
            } catch (emailError) {
                console.error('Driver email error:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Réservation approuvée avec succès',
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Error approving booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
