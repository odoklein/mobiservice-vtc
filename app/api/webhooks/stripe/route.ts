import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = parseInt(session.client_reference_id || '0');

        if (bookingId) {
          // Update booking status
          await db
            .update(bookings)
            .set({
              paymentStatus: 'paid',
              status: 'confirmed',
              confirmedAt: new Date(),
              stripePaymentIntentId: session.payment_intent as string,
            })
            .where(eq(bookings.id, bookingId));

          // TODO: Send confirmation email to customer and driver
          console.log(`Booking ${bookingId} confirmed and paid`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = parseInt(session.client_reference_id || '0');

        if (bookingId) {
          await db
            .update(bookings)
            .set({
              status: 'cancelled',
              paymentStatus: 'pending',
            })
            .where(eq(bookings.id, bookingId));

          console.log(`Booking ${bookingId} expired`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Handle refund
        console.log('Charge refunded:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

