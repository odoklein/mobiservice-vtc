import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { completeBookingSchema } from '@/lib/validations/booking';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the booking data
    const validatedData = completeBookingSchema.parse(body);

    // Calculate TVA if not provided
    const totalPriceTTC = validatedData.totalPrice;
    const totalPriceHT = validatedData.totalPriceHT || Math.round((totalPriceTTC / 1.10) * 100) / 100;
    const tvaAmount = validatedData.tvaAmount || Math.round((totalPriceTTC - totalPriceHT) * 100) / 100;

    // Create booking in database with pending status
    const [booking] = await db
      .insert(bookings)
      .values({
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        pickupAddress: validatedData.pickupAddress,
        pickupLat: validatedData.pickupLat?.toString(),
        pickupLng: validatedData.pickupLng?.toString(),
        dropoffAddress: validatedData.dropoffAddress,
        dropoffLat: validatedData.dropoffLat?.toString(),
        dropoffLng: validatedData.dropoffLng?.toString(),
        pickupDate: validatedData.pickupDate,
        pickupTime: validatedData.pickupTime,
        passengers: validatedData.passengers,
        luggage: validatedData.luggage,
        serviceType: validatedData.serviceType,
        tripType: validatedData.tripType || 'one-way',

        // Trip metrics
        distance: validatedData.distance?.toString(),
        duration: validatedData.duration,
        hours: validatedData.hours,

        // 3-segment distances (CA/TP system)
        distanceCA: validatedData.distanceCA?.toString(),
        distanceTP: validatedData.distanceTP?.toString(),
        distanceReturn: validatedData.distanceReturn?.toString(),

        // Pricing - 2025/2026 Tariff Grid
        isNightRate: validatedData.isNightRate || false,
        rateType: validatedData.rateType,

        // Forfait info
        isForfait: validatedData.isForfait || false,
        forfaitName: validatedData.forfaitName || validatedData.breakdown?.forfaitName,

        // Price breakdown
        baseFare: validatedData.baseFare?.toString() || validatedData.breakdown?.baseFare?.toString(),
        distanceCharge: validatedData.distanceCharge?.toString() || validatedData.breakdown?.distanceCharge?.toString(),
        hourlyCharge: validatedData.hourlyCharge?.toString() || validatedData.breakdown?.hourlyCharge?.toString(),
        waitingCharge: validatedData.waitingCharge?.toString() || validatedData.breakdown?.waitingCharge?.toString(),
        forfaitDiscount: validatedData.forfaitDiscount?.toString() || validatedData.breakdown?.forfaitDiscount?.toString(),

        // Final prices (HT/TTC)
        totalPriceHT: totalPriceHT.toString(),
        totalPriceTTC: totalPriceTTC.toString(),
        tvaAmount: tvaAmount.toString(),
        tvaRate: '10.00',

        // Legacy fields
        basePrice: validatedData.basePrice.toString(),
        totalPrice: validatedData.totalPrice.toString(),

        // Full breakdown as JSON
        priceBreakdown: validatedData.breakdown,

        notes: validatedData.notes,
        status: 'pending',
        paymentStatus: 'pending',
      })
      .returning();

    // Send email notification to driver
    if (process.env.RESEND_API_KEY && DRIVER.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        await resend.emails.send({
          from: `MobiService VTC <${fromEmail}>`,
          to: [DRIVER.email],
          subject: `🚗 Nouvelle réservation #${booking.id} - ${validatedData.guestName}`,
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
                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Nouvelle réservation</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold; color: #0A0A0A; margin: 0 0 24px 0;">
                  🚗 Nouvelle réservation #${booking.id}
                </p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">👤 Client</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Nom :</strong> ${validatedData.guestName}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Email :</strong> ${validatedData.guestEmail}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Téléphone :</strong> ${validatedData.guestPhone}</p>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">📍 Trajet</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Date :</strong> ${validatedData.pickupDate ? new Date(validatedData.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Heure :</strong> ${validatedData.pickupTime}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Départ :</strong> ${validatedData.pickupAddress}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Arrivée :</strong> ${validatedData.dropoffAddress}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Type :</strong> ${validatedData.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Passagers :</strong> ${validatedData.passengers}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Bagages :</strong> ${validatedData.luggage}</p>
                  ${validatedData.distance ? `<p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Distance :</strong> ${validatedData.distance} km</p>` : ''}
                  ${validatedData.duration ? `<p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Durée estimée :</strong> ~${validatedData.duration} min</p>` : ''}
                </div>

                <div style="background: #e8f8e7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">💰 Montant</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0A0A0A;">${validatedData.totalPrice}€ TTC</p>
                  ${validatedData.rateType ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">${validatedData.rateType}</p>` : ''}
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚠️ Statut :</strong> ${booking.status === 'pending' ? 'En attente de confirmation' : booking.status}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">
                    <strong>💳 Paiement :</strong> ${booking.paymentStatus === 'pending' ? 'En attente' : booking.paymentStatus}
                  </p>
                </div>

                ${validatedData.notes ? `
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">📝 Notes</p>
                  <p style="margin: 0; font-size: 14px; color: #333;">${validatedData.notes}</p>
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
        console.log(`[BOOKING] Driver notification email sent to ${DRIVER.email} for booking #${booking.id}`);
      } catch (emailError) {
        console.error('[BOOKING] Failed to send driver notification email:', emailError);
        // Don't fail the booking creation if email fails
      }
    }

    // Return booking ID - payment will be handled by separate endpoints
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
      },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Fetch bookings for the email
    const userBookings = await db.query.bookings.findMany({
      where: (bookings, { eq }) => eq(bookings.guestEmail, email),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
    });

    return NextResponse.json({
      success: true,
      bookings: userBookings,
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
      },
      { status: 500 }
    );
  }
}

