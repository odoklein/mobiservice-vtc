import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { DRIVER } from '@/lib/constants';

// POST /api/quote/[id]/comment - Customer adds a comment to the quote
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id);
        const body = await request.json();
        const { comment } = body;

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid quote ID' },
                { status: 400 }
            );
        }

        if (!comment || comment.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Comment is required' },
                { status: 400 }
            );
        }

        // Fetch current booking
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Quote not found' },
                { status: 404 }
            );
        }

        // Update customer comment
        await db
            .update(bookings)
            .set({
                customerComment: comment.trim(),
                updatedAt: new Date(),
            })
            .where(eq(bookings.id, bookingId));

        // Notify driver of new comment
        if (process.env.RESEND_API_KEY && DRIVER.email) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                await resend.emails.send({
                    from: `MobiService VTC <${fromEmail}>`,
                    to: [DRIVER.email],
                    subject: `💬 Nouveau commentaire sur le devis #${bookingId}`,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A0A0A; padding: 32px; text-align: center;">
                <h1 style="color: #5CD85A; margin: 0;">MobiService VTC</h1>
                <p style="color: white; margin: 8px 0 0 0;">💬 Nouveau Commentaire</p>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; font-weight: bold;">Commentaire sur le devis #${bookingId}</p>
                <p><strong>Client :</strong> ${booking.guestName}</p>
                <p><strong>Téléphone :</strong> ${booking.guestPhone}</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #5CD85A;">
                  <p style="margin: 0; font-style: italic;">"${comment.trim()}"</p>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${appUrl}/admin/bookings/${bookingId}" 
                     style="display: inline-block; background: #5CD85A; color: #0A0A0A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Voir le devis
                  </a>
                </div>
              </div>
            </div>
          `,
                });
            } catch (emailError) {
                console.error('Error sending comment notification:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Comment added successfully',
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}
