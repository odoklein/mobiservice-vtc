import { db } from '@/lib/db';
import { otpVerifications } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from './resend';

/**
 * Interface pour les paramètres d'envoi d'email OTP
 */
interface SendOTPEmailParams {
    to: string;
    guestName: string;
    otpCode: string;
    bookingId: number;
}

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

/**
 * Envoie un email avec le code OTP au client pour accéder au devis
 */
export async function sendOTPEmail(params: SendOTPEmailParams): Promise<void> {
    const { to, guestName, otpCode, bookingId } = params;

    const devisUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/estimate/${bookingId}?email=${encodeURIComponent(to)}&otp=${otpCode}`;

    const subject = `Votre code pour accéder au devis - Réservation #${bookingId}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de vérification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #00FF88; margin: 0; font-size: 28px;">MobiService VTC</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0;">Votre code de vérification</p>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin-top: 0;">Bonjour <strong>${guestName}</strong>,</p>
        
        <p>Vous avez demandé à consulter votre devis pour la réservation <strong>#${bookingId}</strong>.</p>

        <div style="background: #f5f5f5; border-left: 4px solid #00FF88; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Votre code de vérification :</p>
            <div style="font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otpCode}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Ce code expire dans 10 minutes</p>
        </div>

        <p>Vous pouvez également cliquer sur le bouton ci-dessous pour accéder directement à votre devis :</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${devisUrl}" style="display: inline-block; background: #00FF88; color: #000000; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Voir mon devis
            </a>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #856404;">
                <strong>⚠️ Sécurité :</strong> Si vous n'avez pas demandé ce code, ignorez cet email. Ne partagez jamais votre code de vérification.
            </p>
        </div>

        <p style="margin-bottom: 0;">
            Cordialement,<br>
            <strong>L'équipe MobiService VTC</strong>
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>MobiService VTC - Transport premium en Haute-Savoie</p>
        <p>📞 +33 (0)6 07 72 50 07 | 📧 contact@mobiservice-vtc.fr</p>
        <p style="margin-top: 15px;">
            <a href="http://www.mobiservice-vtc.fr" style="color: #00FF88; text-decoration: none;">www.mobiservice-vtc.fr</a>
        </p>
    </div>
</body>
</html>
    `;

    const text = `
Bonjour ${guestName},

Vous avez demandé à consulter votre devis pour la réservation #${bookingId}.

Votre code de vérification : ${otpCode}
Ce code expire dans 10 minutes.

Vous pouvez également accéder directement à votre devis en cliquant sur ce lien :
${devisUrl}

Si vous n'avez pas demandé ce code, ignorez cet email.

Cordialement,
L'équipe MobiService VTC

---
MobiService VTC - Transport premium en Haute-Savoie
+33 (0)6 07 72 50 07 | contact@mobiservice-vtc.fr
www.mobiservice-vtc.fr
    `;

    await sendEmail({
        to,
        subject,
        html,
        text,
    });
}

