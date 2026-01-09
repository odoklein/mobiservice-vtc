import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, otpVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

// Generate a 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for cash payment verification
export async function POST(request: NextRequest) {
  const debugContext = {
    step: '',
    bookingId: '',
    hasEmail: false,
    hasResendKey: !!process.env.RESEND_API_KEY,
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Parse request body
    debugContext.step = 'PARSING_REQUEST_BODY';
    let body;
    try {
      body = await request.json();
      console.log('[OTP-DEBUG] [OK] Request body parsed successfully');
    } catch (parseError) {
      console.error('[OTP-DEBUG] [ERROR] Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          debug: {
            ...debugContext,
            errorType: 'INVALID_JSON',
            details: parseError instanceof Error ? parseError.message : String(parseError)
          }
        },
        { status: 400 }
      );
    }

    const { bookingId } = body;
    debugContext.bookingId = bookingId;

    // Step 2: Validate booking ID
    debugContext.step = 'VALIDATING_BOOKING_ID';
    if (!bookingId) {
      console.error('[OTP-DEBUG] [ERROR] Missing booking ID');
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID required',
          debug: {
            ...debugContext,
            errorType: 'MISSING_BOOKING_ID',
          }
        },
        { status: 400 }
      );
    }
    console.log(`[OTP-DEBUG] [OK] Booking ID validated: ${bookingId}`);

    // Step 3: Fetch the booking from database
    debugContext.step = 'FETCHING_BOOKING';
    let booking;
    try {
      booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });
      console.log(`[OTP-DEBUG] [OK] Database query executed for booking: ${bookingId}`);
    } catch (dbError) {
      console.error('[OTP-DEBUG] [ERROR] Database query failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while fetching booking',
          debug: {
            ...debugContext,
            errorType: 'DB_QUERY_ERROR',
            details: dbError instanceof Error ? dbError.message : String(dbError)
          }
        },
        { status: 500 }
      );
    }

    if (!booking) {
      console.error(`[OTP-DEBUG] [ERROR] Booking not found: ${bookingId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
          debug: {
            ...debugContext,
            errorType: 'BOOKING_NOT_FOUND',
          }
        },
        { status: 404 }
      );
    }
    console.log(`[OTP-DEBUG] [OK] Booking found: ${bookingId}, Email: ${booking.guestEmail}`);
    debugContext.hasEmail = !!booking.guestEmail;

    // Step 4: Validate email exists
    debugContext.step = 'VALIDATING_EMAIL';
    if (!booking.guestEmail) {
      console.error(`[OTP-DEBUG] [ERROR] No email address for booking: ${bookingId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'No email address found for this booking',
          debug: {
            ...debugContext,
            errorType: 'MISSING_EMAIL',
          }
        },
        { status: 400 }
      );
    }
    console.log(`[OTP-DEBUG] [OK] Email validated: ${booking.guestEmail}`);

    // Step 5: Generate OTP
    debugContext.step = 'GENERATING_OTP';
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`[OTP-DEBUG] [OK] OTP generated: ${otpCode} (expires: ${expiresAt.toISOString()})`);

    // Step 6: Save OTP to database
    debugContext.step = 'SAVING_OTP_TO_DB';
    try {
      await db.insert(otpVerifications).values({
        bookingId,
        code: otpCode,
        expiresAt,
        verified: false,
      });
      console.log(`[OTP-DEBUG] [OK] OTP saved to database for booking: ${bookingId}`);
    } catch (dbInsertError) {
      console.error('[OTP-DEBUG] [ERROR] Failed to save OTP to database:', dbInsertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while saving OTP',
          debug: {
            ...debugContext,
            errorType: 'DB_INSERT_ERROR',
            details: dbInsertError instanceof Error ? dbInsertError.message : String(dbInsertError)
          }
        },
        { status: 500 }
      );
    }

    // Step 7: Send email with Resend
    debugContext.step = 'SENDING_EMAIL';
    if (process.env.RESEND_API_KEY) {
      console.log(`[OTP-DEBUG] [SEND] Attempting to send email via Resend to: ${booking.guestEmail}`);

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        console.log(`[OTP-DEBUG] [SEND] Using from address: ${fromEmail}`);

        const { error, data } = await resend.emails.send({
          from: `MobiService VTC <${fromEmail}>`,
          to: [booking.guestEmail!],
          subject: 'Votre code de verification - MobiService VTC',
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
                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Code de verification</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 16px; color: #333;">Bonjour <strong>${booking.guestName}</strong>,</p>
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  Voici votre code de vérification pour confirmer votre demande sur MobiService VTC :
                </p>
                <div style="text-align: center; margin: 32px 0; padding: 32px; background: #0A0A0A; border-radius: 12px;">
                  <p style="color: rgba(255,255,255,0.7); margin: 0 0 12px 0; font-size: 14px;">Votre code de vérification</p>
                  <p style="color: #5CD85A; font-size: 48px; font-weight: bold; letter-spacing: 12px; margin: 0; font-family: monospace;">${otpCode}</p>
                  <p style="color: rgba(255,255,255,0.5); margin: 12px 0 0 0; font-size: 13px;">Ce code expire dans 10 minutes</p>
                </div>
                <p style="color: #666; text-align: center; font-size: 13px;">
                  Si vous n'avez pas demandé ce code, ignorez cet email.
                </p>
              </div>
              <div style="padding: 24px; text-align: center; border-top: 1px solid #e6ebf1; background: #f9f9f9;">
                <p style="color: #999; font-size: 12px; margin: 0;">MobiService VTC - Transport premium en Haute-Savoie</p>
              </div>
            </div>
            </body>
            </html>
          `,
        });

        if (error) {
          console.error('[OTP-DEBUG] [ERROR] Resend API returned error:', {
            error,
            recipient: booking.guestEmail,
            from: fromEmail,
          });
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to send email',
              debug: {
                ...debugContext,
                errorType: 'RESEND_API_ERROR',
                details: error,
                recipient: booking.guestEmail,
              }
            },
            { status: 500 }
          );
        } else {
          console.log(`[OTP-DEBUG] [OK] Email sent successfully via Resend`, {
            emailId: data?.id,
            recipient: booking.guestEmail,
          });
        }
      } catch (emailError) {
        console.error('[OTP-DEBUG] [ERROR] Email send exception:', {
          error: emailError,
          errorMessage: emailError instanceof Error ? emailError.message : String(emailError),
          errorStack: emailError instanceof Error ? emailError.stack : undefined,
          recipient: booking.guestEmail,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Email service error',
            debug: {
              ...debugContext,
              errorType: 'EMAIL_EXCEPTION',
              details: emailError instanceof Error ? emailError.message : String(emailError),
              recipient: booking.guestEmail,
            }
          },
          { status: 500 }
        );
      }
    } else {
      console.warn(`[OTP-DEBUG] [WARN] No RESEND_API_KEY configured - OTP not sent via email`);
      console.log(`[OTP-DEBUG] [MOCK] Would send OTP ${otpCode} to ${booking.guestEmail}`);
    }

    // Success response
    debugContext.step = 'COMPLETED';
    console.log(`[OTP-DEBUG] [OK] OTP process completed successfully for booking: ${bookingId}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('[OTP-DEBUG] [ERROR] UNEXPECTED ERROR:', {
      step: debugContext.step,
      bookingId: debugContext.bookingId,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send OTP',
        debug: {
          ...debugContext,
          errorType: 'UNEXPECTED_ERROR',
          details: error instanceof Error ? error.message : String(error),
        }
      },
      { status: 500 }
    );
  }
}
