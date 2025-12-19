import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { sql } from 'drizzle-orm';
import { adminBookingCreateSchema } from '@/lib/validations/admin-booking';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

export async function GET(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const allBookings = await db
            .select()
            .from(bookings)
            .orderBy(sql`${bookings.createdAt} DESC`);

        return NextResponse.json({
            success: true,
            bookings: allBookings,
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const admin = await getAdminFromRequest();

    if (!admin) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = adminBookingCreateSchema.parse(body);

        // Calculate TVA if not provided (default 10%)
        const totalPriceTTC = validated.totalPrice;
        const totalPriceHT =
            validated.totalPriceHT || (Math.round((Number(totalPriceTTC) / 1.1) * 100) / 100).toString();
        const tvaAmount =
            validated.tvaAmount || (Math.round((Number(totalPriceTTC) - Number(totalPriceHT)) * 100) / 100).toString();

        const [booking] = await db
            .insert(bookings)
            .values({
                userId: null,

                guestName: validated.guestName,
                guestEmail: validated.guestEmail,
                guestPhone: validated.guestPhone,

                pickupAddress: validated.pickupAddress,
                pickupLat: validated.pickupLat,
                pickupLng: validated.pickupLng,
                dropoffAddress: validated.dropoffAddress,
                dropoffLat: validated.dropoffLat,
                dropoffLng: validated.dropoffLng,

                pickupDate: validated.pickupDate,
                pickupTime: validated.pickupTime,

                passengers: validated.passengers,
                luggage: validated.luggage,

                serviceType: validated.serviceType,
                tripType: validated.tripType,

                distance: validated.distance,
                duration: validated.duration,
                hours: validated.hours,

                distanceCA: validated.distanceCA,
                distanceTP: validated.distanceTP,
                distanceReturn: validated.distanceReturn,

                isNightRate: validated.isNightRate ?? false,
                rateType: validated.rateType,

                isForfait: validated.isForfait ?? false,
                forfaitName: validated.forfaitName,
                forfaitHours: validated.forfaitHours,
                forfaitMaxKm: validated.forfaitMaxKm,

                baseFare: validated.baseFare,
                distanceCharge: validated.distanceCharge,
                hourlyCharge: validated.hourlyCharge,
                waitingCharge: validated.waitingCharge,
                forfaitDiscount: validated.forfaitDiscount,

                totalPriceHT,
                totalPriceTTC: validated.totalPriceTTC || totalPriceTTC,
                tvaAmount,
                tvaRate: validated.tvaRate || '10.00',

                basePrice: validated.basePrice,
                totalPrice: validated.totalPrice,
                currency: validated.currency || 'EUR',

                priceBreakdown: validated.priceBreakdown,
                notes: validated.notes,
                specialRequests: validated.specialRequests,

                status: validated.status || 'pending',
                paymentStatus: validated.paymentStatus || 'pending',
                paymentMethod: validated.paymentMethod || 'stripe',

                cgvAccepted: validated.cgvAccepted ?? false,
                cgvAcceptedAt: validated.cgvAcceptedAt,
            })
            .returning();

        // Send email notification to driver
        if (process.env.RESEND_API_KEY && DRIVER.email && booking.guestEmail) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [DRIVER.email],
                    subject: `🚗 Nouvelle réservation #${booking.id} - ${booking.guestName || 'Client'}`,
                    html: `<!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0; font-size: 28px;">MobiService VTC</h1>
                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Nouvelle réservation (Admin)</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold; color: #0A0A0A; margin: 0 0 24px 0;">
                  🚗 Nouvelle réservation #${booking.id}
                </p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">👤 Client</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Nom :</strong> ${booking.guestName || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Email :</strong> ${booking.guestEmail || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Téléphone :</strong> ${booking.guestPhone || 'N/A'}</p>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">📍 Trajet</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Date :</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Heure :</strong> ${booking.pickupTime || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Départ :</strong> ${booking.pickupAddress || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Arrivée :</strong> ${booking.dropoffAddress || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Type :</strong> ${booking.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Passagers :</strong> ${booking.passengers || 1}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Bagages :</strong> ${booking.luggage || 0}</p>
                </div>

                <div style="background: #e8f8e7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">💰 Montant</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0A0A0A;">${booking.totalPrice || booking.totalPriceTTC || '0'}€ TTC</p>
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚠️ Statut :</strong> ${booking.status || 'pending'}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">
                    <strong>💳 Paiement :</strong> ${booking.paymentStatus || 'pending'}
                  </p>
                </div>

                ${booking.notes ? `
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">📝 Notes</p>
                  <p style="margin: 0; font-size: 14px; color: #333;">${booking.notes}</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/bookings/${booking.id}" 
                     style="display: inline-block; background: #00FF88; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Voir la réservation
                  </a>
                </div>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1; background: #f9f9f9;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
              </div>
            </div>
            </body>
            </html>
          `,
                });
                console.log(`[BOOKING-ADMIN] Driver notification email sent to ${DRIVER.email} for booking #${booking.id}`);
            } catch (emailError) {
                console.error('[BOOKING-ADMIN] Failed to send driver notification email:', emailError);
                // Don't fail the booking creation if email fails
            }
        }

        return NextResponse.json({
            success: true,
            booking,
        });
    } catch (error) {
        console.error('Error creating booking (admin):', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Erreur serveur' },
            { status: 400 }
        );
    }
}
