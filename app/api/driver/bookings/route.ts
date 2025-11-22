import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET all bookings for driver (protected route - add auth later)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for driver
    // For now, return all bookings

    const allBookings = await db.query.bookings.findMany({
      orderBy: (bookings, { desc }) => [desc(bookings.pickupDate)],
    });

    return NextResponse.json({
      success: true,
      bookings: allBookings,
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

