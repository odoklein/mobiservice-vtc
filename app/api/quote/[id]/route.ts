import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/quote/[id] - Fetch quote details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid quote ID' },
                { status: 400 }
            );
        }

        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Quote not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            quote: {
                id: booking.id,
                status: booking.status,
                // Customer info
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                guestPhone: booking.guestPhone,
                // Trip details
                pickupAddress: booking.pickupAddress,
                dropoffAddress: booking.dropoffAddress,
                pickupDate: booking.pickupDate,
                pickupTime: booking.pickupTime,
                passengers: booking.passengers,
                luggage: booking.luggage,
                serviceType: booking.serviceType,
                tripType: booking.tripType,
                // Metrics
                distance: booking.distance,
                duration: booking.duration,
                // Pricing
                totalPriceHT: booking.totalPriceHT,
                totalPriceTTC: booking.totalPriceTTC,
                tvaAmount: booking.tvaAmount,
                tvaRate: booking.tvaRate,
                isNightRate: booking.isNightRate,
                rateType: booking.rateType,
                // Discount
                discountPercentage: booking.discountPercentage,
                discountAmount: booking.discountAmount,
                // Comments
                customerComment: booking.customerComment,
                adminNotes: booking.adminNotes,
                rejectionReason: booking.rejectionReason,
                // Timestamps
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching quote:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch quote' },
            { status: 500 }
        );
    }
}
