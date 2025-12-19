import { db } from '@/lib/db';
import { otpVerifications } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Save OTP to database with 10-minute expiry
 */
export async function saveOTP(bookingId: number, code: string) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(otpVerifications).values({
        bookingId,
        code,
        expiresAt,
        verified: false,
    });

    return { code, expiresAt };
}

/**
 * Verify OTP code for a booking
 */
export async function verifyOTP(bookingId: number, code: string): Promise<boolean> {
    const now = new Date();

    const [otpRecord] = await db
        .select()
        .from(otpVerifications)
        .where(
            and(
                eq(otpVerifications.bookingId, bookingId),
                eq(otpVerifications.code, code),
                eq(otpVerifications.verified, false),
                gte(otpVerifications.expiresAt, now)
            )
        )
        .limit(1);

    if (!otpRecord) {
        return false;
    }

    // Mark as verified
    await db
        .update(otpVerifications)
        .set({
            verified: true,
            verifiedAt: now,
        })
        .where(eq(otpVerifications.id, otpRecord.id));

    return true;
}

/**
 * Clean up expired OTP records (call this in a cron job)
 */
export async function cleanExpiredOTPs() {
    const now = new Date();

    await db
        .delete(otpVerifications)
        .where(
            and(
                eq(otpVerifications.verified, false),
                gte(now, otpVerifications.expiresAt)
            )
        );
}
