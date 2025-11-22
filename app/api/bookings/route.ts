import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/stripe';
import { completeBookingSchema } from '@/lib/validations/booking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the booking data
    const validatedData = completeBookingSchema.parse(body);

    // Create booking in database
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
        distance: validatedData.distance?.toString(),
        duration: validatedData.duration,
        basePrice: validatedData.basePrice.toString(),
        totalPrice: validatedData.totalPrice.toString(),
        notes: validatedData.notes,
        status: 'pending',
        paymentStatus: 'pending',
      })
      .returning();

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      bookingId: booking.id,
      amount: validatedData.totalPrice,
      customerEmail: validatedData.guestEmail,
      customerName: validatedData.guestName,
      metadata: {
        bookingId: booking.id.toString(),
        pickupAddress: validatedData.pickupAddress,
        dropoffAddress: validatedData.dropoffAddress,
        pickupDate: validatedData.pickupDate.toISOString(),
        pickupTime: validatedData.pickupTime,
      },
    });

    // Update booking with Stripe session ID
    await db
      .update(bookings)
      .set({ stripeSessionId: session.id })
      .where(eq(bookings.id, booking.id));

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      sessionId: session.id,
      checkoutUrl: session.url,
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

