import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminFromRequest } from '@/lib/auth/admin';

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
        const bookingId = parseInt(id);

        // Update booking as paid
        const [updatedBooking] = await db
            .update(bookings)
            .set({
                paymentStatus: 'paid',
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

        // TODO: Send confirmation email with invoice

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
            message: 'Paiement confirmé',
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
