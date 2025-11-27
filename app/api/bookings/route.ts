import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { completeBookingSchema } from '@/lib/validations/booking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the booking data
    const validatedData = completeBookingSchema.parse(body);

    // Calculate TVA if not provided
    const totalPriceTTC = validatedData.totalPrice;
    const totalPriceHT = validatedData.totalPriceHT || Math.round((totalPriceTTC / 1.10) * 100) / 100;
    const tvaAmount = validatedData.tvaAmount || Math.round((totalPriceTTC - totalPriceHT) * 100) / 100;

    // Create booking in database with 2025/2026 pricing
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
        
        // Trip metrics
        distance: validatedData.distance?.toString(),
        duration: validatedData.duration,
        hours: validatedData.hours,
        
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

    // Mock payment - simulate successful payment
    // In production, this would redirect to Stripe Checkout
    const mockSessionId = `mock_session_${Date.now()}_${booking.id}`;
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update booking with mock session ID and mark as paid
    await db
      .update(bookings)
      .set({ 
        stripeSessionId: mockSessionId,
        paymentStatus: 'paid',
        status: 'confirmed',
        confirmedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Return success URL for mock payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutUrl = `${appUrl}/reservation/success?session_id=${mockSessionId}&booking_id=${booking.id}`;

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      sessionId: mockSessionId,
      checkoutUrl: checkoutUrl,
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

