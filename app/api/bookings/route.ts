import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { completeBookingSchema } from '@/lib/validations/booking';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';
import { recomputeBookingPrice, type ServerPrice } from '@/lib/pricing/booking-price';

// Échappe le texte saisi par le client avant insertion dans l'e-mail HTML du chauffeur
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the booking data
    const validatedData = completeBookingSchema.parse(body);

    // RÈGLE N°1: Le retour au dépôt est TOUJOURS inclus dans le calcul
    // Même pour un aller simple, le retour du véhicule est facturé
    // Ne pas modifier distanceReturn - il doit toujours être > 0

    // Recalculate the price server-side. It is the SAME calculation as the estimate shown to the
    // customer (lib/pricing/transfer-quote.ts: tolls, waiting time, day/night per leg, admin tariffs),
    // so the saved price equals the displayed price and cannot be tampered with.
    let serverCalculatedPrice: ServerPrice;
    try {
      serverCalculatedPrice = await recomputeBookingPrice(validatedData);
      const shown = validatedData.totalPriceTTC ?? validatedData.totalPrice;
      if (typeof shown === 'number' && Math.abs(shown - serverCalculatedPrice.totalPrice) > 0.01) {
        console.warn(
          `[BOOKING] Saved price ${serverCalculatedPrice.totalPrice}€ differs from the price displayed to the customer (${shown}€) — tariffs changed or inputs differ`
        );
      }
    } catch (priceError) {
      console.error('[BOOKING] Error recalculating price:', priceError);
      // Last resort (no coordinates and no measures): keep the client-provided price
      serverCalculatedPrice = {
        totalPrice: validatedData.totalPrice,
        totalPriceHT: validatedData.totalPriceHT || Math.round((validatedData.totalPrice / 1.10) * 100) / 100,
        tva: validatedData.tvaAmount || Math.round((validatedData.totalPrice - (validatedData.totalPriceHT || Math.round((validatedData.totalPrice / 1.10) * 100) / 100)) * 100) / 100,
        currency: 'EUR',
        isNightRate: validatedData.isNightRate || false,
        rateType: validatedData.rateType || '',
        isForfait: validatedData.isForfait || false,
        breakdown: validatedData.breakdown || {},
        source: 'browser-measures',
      };
    }
    // Distances measured server-side replace the browser's values
    const measured = serverCalculatedPrice.measures;

    // Use server-calculated price (more secure - prevents price manipulation)
    const totalPriceTTC = serverCalculatedPrice.totalPrice;
    const totalPriceHT = serverCalculatedPrice.totalPriceHT;
    const tvaAmount = serverCalculatedPrice.tva;

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
        returnDate: validatedData.returnDate ? new Date(validatedData.returnDate as string | Date) : null,
        returnTime: validatedData.returnTime || null,
        passengers: validatedData.passengers,
        luggage: validatedData.luggage,
        serviceType: validatedData.serviceType,
        tripType: validatedData.tripType || 'one-way',

        // Trip metrics
        distance: (measured?.distanceTP ?? validatedData.distance)?.toString(),
        duration: measured?.duration ?? validatedData.duration,
        hours: validatedData.hours,

        // 3-segment distances (CA/TP system)
        distanceCA: (measured?.distanceCA ?? validatedData.distanceCA)?.toString(),
        distanceTP: (measured?.distanceTP ?? validatedData.distanceTP)?.toString(),
        distanceReturn: (measured?.distanceReturn ?? validatedData.distanceReturn)?.toString(),

        // Pricing - 2025/2026 Tariff Grid (from server calculation)
        isNightRate: serverCalculatedPrice.isNightRate,
        rateType: serverCalculatedPrice.rateType,

        // Forfait info (from server calculation)
        isForfait: serverCalculatedPrice.isForfait || false,
        forfaitName: serverCalculatedPrice.breakdown?.forfaitName || validatedData.forfaitName,

        // Price breakdown (from server calculation)
        baseFare: serverCalculatedPrice.breakdown?.baseFare?.toString() || validatedData.baseFare?.toString(),
        distanceCharge: serverCalculatedPrice.breakdown?.distanceCharge?.toString() || validatedData.distanceCharge?.toString(),
        hourlyCharge: serverCalculatedPrice.breakdown?.hourlyCharge?.toString() || validatedData.hourlyCharge?.toString(),
        waitingCharge: serverCalculatedPrice.breakdown?.waitingCharge?.toString() || validatedData.waitingCharge?.toString(),
        forfaitDiscount: serverCalculatedPrice.breakdown?.forfaitDiscount?.toString() || validatedData.forfaitDiscount?.toString(),

        // Final prices (HT/TTC)
        totalPriceHT: totalPriceHT.toString(),
        totalPriceTTC: totalPriceTTC.toString(),
        tvaAmount: tvaAmount.toString(),
        tvaRate: '10.00',

        // Legacy fields (use server-calculated price)
        basePrice: totalPriceTTC.toString(),
        totalPrice: totalPriceTTC.toString(),

        // Full breakdown as JSON (from server calculation)
        priceBreakdown: serverCalculatedPrice.breakdown,

        notes: validatedData.notes,
        status: 'quote_sent', // Changed from 'pending' to 'quote_sent' for Devis workflow
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
          subject: `📄 Nouvelle demande de devis #${booking.id} - ${esc(validatedData.guestName)}`,
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
                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Nouvelle demande de devis</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold; color: #0A0A0A; margin: 0 0 24px 0;">
                  📄 Demande de devis #${booking.id}
                </p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">👤 Client</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Nom :</strong> ${esc(validatedData.guestName)}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Email :</strong> ${esc(validatedData.guestEmail)}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Téléphone :</strong> ${esc(validatedData.guestPhone)}</p>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 14px;">📍 Trajet</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Date :</strong> ${validatedData.pickupDate ? new Date(validatedData.pickupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Heure :</strong> ${validatedData.pickupTime}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Départ :</strong> ${esc(validatedData.pickupAddress)}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Arrivée :</strong> ${esc(validatedData.dropoffAddress)}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Type :</strong> ${validatedData.tripType === 'round-trip' ? 'Aller-Retour (A/R)' : 'Aller Simple (A/S)'}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Passagers :</strong> ${validatedData.passengers}</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Bagages :</strong> ${validatedData.luggage}</p>
                  ${(measured?.distanceTP ?? validatedData.distance) ? `<p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Distance :</strong> ${measured?.distanceTP ?? validatedData.distance} km</p>` : ''}
                  ${validatedData.duration ? `<p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Durée estimée :</strong> ~${validatedData.duration} min</p>` : ''}
                </div>

                <div style="background: #e8f8e7; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">💰 Estimation</p>
                  <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0A0A0A;">${totalPriceTTC}€ TTC</p>
                  ${serverCalculatedPrice.rateType ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">${esc(serverCalculatedPrice.rateType)}</p>` : ''}
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚠️ Statut :</strong> ${booking.status === 'quote_sent' ? 'Devis envoyé' : booking.status}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">
                    <strong>💳 Paiement :</strong> ${booking.paymentStatus === 'pending' ? 'En attente' : booking.paymentStatus}
                  </p>
                </div>

                ${validatedData.notes ? `
                <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">📝 Notes</p>
                  <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-line;">${esc(validatedData.notes)}</p>
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
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.guestEmail, email))
      .orderBy(desc(bookings.createdAt));

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

