import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyOTP } from '@/lib/email/otp';

export async function POST(request: NextRequest) {
    try {
        const { bookingId, otp, token } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { message: 'ID de réservation requis' },
                { status: 400 }
            );
        }

        const bookingIdNum = parseInt(bookingId);

        // Find booking
        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingIdNum))
            .limit(1);

        if (!booking) {
            return NextResponse.json(
                { message: 'Réservation introuvable' },
                { status: 404 }
            );
        }

        //Check if already confirmed
        if (booking.confirmedViaEmail) {
            return NextResponse.json(
                { message: 'Réservation déjà confirmée' },
                { status: 400 }
            );
        }

        // Verify OTP if provided
        if (otp) {
            const isValid = await verifyOTP(bookingIdNum, otp);

            if (!isValid) {
                return NextResponse.json(
                    { message: 'Code OTP invalide ou expiré' },
                    { status: 400 }
                );
            }
        } else if (token) {
            // Verify token matches
            if (booking.confirmationToken !== token) {
                return NextResponse.json(
                    { message: 'Token invalide' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { message: 'OTP ou token requis' },
                { status: 400 }
            );
        }

        // Update booking as confirmed
        const [updatedBooking] = await db
            .update(bookings)
            .set({
                confirmedViaEmail: true,
                otpVerified: true,
                status: 'confirmed',
                confirmedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingIdNum))
            .returning();

        return NextResponse.json({
            success: true,
            message: 'Réservation confirmée avec succès',
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Error confirming booking:', error);
        return NextResponse.json(
            { message: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
