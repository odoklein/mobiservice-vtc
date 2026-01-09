import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { adminBookingRejectSchema } from '@/lib/validations/admin-booking';
import { Resend } from 'resend';

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
        const { reason, notes } = adminBookingRejectSchema.parse(body);

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

        // Check if booking can be rejected (quote_pending, quote_sent, quote_modified, verified, pending)
        const rejectableStatuses = ['quote_pending', 'quote_sent', 'quote_modified', 'verified', 'pending'];
        if (!rejectableStatuses.includes(booking.status)) {
            return NextResponse.json(
                { message: `Cette demande ne peut pas être refusée. Statut actuel: ${booking.status}` },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update booking to cancelled with rejection reason
        const [updatedBooking] = await db
            .update(bookings)
            .set({
                status: 'refused',
                rejectionReason: reason,
                adminNotes: notes || booking.adminNotes,
                updatedAt: now,
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        console.log(`[REJECTED] Booking ${bookingId} rejected by admin ${admin.adminId}`);

        // Send rejection email to customer
        if (process.env.RESEND_API_KEY && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [booking.guestEmail],
                    subject: 'Réservation non disponible - MobiService VTC',
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                                <p style="color: white; margin: 8px 0 0 0;">Réservation non disponible</p>
                            </div>
                            <div style="padding: 32px;">
                                <div style="text-align: center; margin: 24px 0; padding: 24px; background: #ffebee; border-radius: 12px; border-left: 4px solid #f44336;">
                                    <p style="font-size: 48px; margin: 0;">⚠️</p>
                                    <p style="font-size: 20px; font-weight: bold; margin: 8px 0 0 0; color: #c62828;">Réservation non disponible</p>
                                </div>
                                <p>Bonjour <strong>${booking.guestName}</strong>,</p>
                                <p>Nous sommes désolés, mais nous ne pouvons malheureusement pas confirmer votre réservation pour les raisons suivantes :</p>
                                
                                <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f44336;">
                                    <p style="margin: 0; font-weight: bold; color: #c62828;">Raison :</p>
                                    <p style="margin: 8px 0 0 0; color: #333;">${reason}</p>
                                </div>
                                
                                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <p style="margin: 0 0 12px 0; font-weight: bold;">📋 Détails de la réservation</p>
                                    <p style="margin: 4px 0;"><strong>N°</strong> ${booking.id}</p>
                                    <p style="margin: 4px 0;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                                    <p style="margin: 4px 0;"><strong>Heure :</strong> ${booking.pickupTime}</p>
                                    <p style="margin: 4px 0;"><strong>Départ :</strong> ${booking.pickupAddress}</p>
                                    <p style="margin: 4px 0;"><strong>Arrivée :</strong> ${booking.dropoffAddress}</p>
                                </div>
                                
                                <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 24px 0;">
                                    <p style="margin: 0; font-weight: bold; color: #1565c0;">💡 Que faire maintenant ?</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #1565c0;">
                                        Nous vous invitons à créer une nouvelle réservation avec des dates ou horaires différents. 
                                        N'hésitez pas à nous contacter si vous avez des questions.
                                    </p>
                                </div>
                                
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reservation" 
                                       style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                        Créer une nouvelle réservation
                                    </a>
                                </div>
                            </div>
                            <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1;">
                                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
                                <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">Pour toute question, contactez-nous à ${fromEmail}</p>
                            </div>
                        </div>
                    `,
                });
                console.log(`[EMAIL] Rejection email sent to ${booking.guestEmail}`);
            } catch (emailError) {
                console.error('Email error:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Réservation refusée avec succès',
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
