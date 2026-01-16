import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, otpVerifications, reviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { adminBookingUpdateSchema } from '@/lib/validations/admin-booking';

function parseBookingId(id: string): number | null {
    const bookingId = Number.parseInt(id, 10);
    return Number.isFinite(bookingId) ? bookingId : null;
}

export async function GET(
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

        return NextResponse.json({
            success: true,
            booking,
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function PUT(
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
        const updates = adminBookingUpdateSchema.parse(body);

        const [updatedBooking] = await db
            .update(bookings)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        if (!updatedBooking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function PATCH(
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
        const updates = adminBookingUpdateSchema.parse(body);

        const [updatedBooking] = await db
            .update(bookings)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        if (!updatedBooking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // First, check if the booking exists
        const [existingBooking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!existingBooking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        // Delete related records first to avoid foreign key constraint violations

        // Delete OTP verifications
        await db
            .delete(otpVerifications)
            .where(eq(otpVerifications.bookingId, bookingId));

        // Delete reviews
        await db
            .delete(reviews)
            .where(eq(reviews.bookingId, bookingId));

        // Now delete the booking
        const [deleted] = await db
            .delete(bookings)
            .where(eq(bookings.id, bookingId))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { message: 'Erreur lors de la suppression' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
