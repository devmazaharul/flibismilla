// app/api/stripe/create-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { Duffel } from '@duffel/api';

export const dynamic = 'force-dynamic';

// Env চেক
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // তোমার Stripe প্যাকেজ যদি এই ভার্সন সাপোর্ট না করে, as any রাখলে TS চুপ থাকবে
  apiVersion: '2024-06-20' as any,
});

// Duffel client (hold/expiry check করার জন্য)
const duffel =
  process.env.DUFFEL_ACCESS_TOKEN
    ? new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN })
    : null;

export async function POST(req: Request) {
  try {
    // ---------- 1) Body parse + validation ----------
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { bookingId } = body || {};

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // ---------- 2) DB থেকে Booking ----------
    await dbConnect();
    const booking: any = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Already finalised / invalid status হলে payment allow করো না
    if (['issued', 'cancelled', 'expired'].includes(booking.status)) {
      return NextResponse.json(
        { error: `This booking is ${booking.status} and cannot be paid.` },
        { status: 400 },
      );
    }

    // এই booking আগেই পুরোপুরি পেমেন্ট হয়ে গেলে আবার Intent বানাবে না
    if (['authorized', 'captured', 'refunded'].includes(booking.paymentStatus)) {
      return NextResponse.json(
        { error: 'This booking is already paid/authorized.' },
        { status: 400 },
      );
    }

    const now = new Date();

    // Local paymentDeadline থাকলে আগে সেটা check করো
    if (booking.paymentDeadline && booking.paymentDeadline < now) {
      booking.status = 'expired';
      await booking.save();
      return NextResponse.json(
        {
          error:
            'The payment deadline for this booking has passed. Please search again and create a new booking.',
        },
        { status: 400 },
      );
    }

    // ---------- Duffel order validity check (based on your sample object) ----------
    if (booking.duffelOrderId && duffel) {
      try {
        const res = await duffel.orders.get(booking.duffelOrderId);
        const order: any = res.data;

        // Cancelled?
        if (order.cancellation || order.cancelled_at) {
          booking.status = 'cancelled';
          await booking.save();
          return NextResponse.json(
            { error: 'This booking has been cancelled with the airline.' },
            { status: 400 },
          );
        }

        const nowIso = now.toISOString();
        const paymentStatus = order.payment_status || {};

        // তোমার object এ: payment_status.payment_required_by / price_guarantee_expires_at
        const paymentRequiredBy =
          (paymentStatus.payment_required_by as string | null) || null;
        const priceGuaranteeExpiresAt =
          (paymentStatus.price_guarantee_expires_at as string | null) || null;

        const expiresAt = paymentRequiredBy || priceGuaranteeExpiresAt;

        if (expiresAt && expiresAt < nowIso) {
          booking.status = 'expired';
          await booking.save();
          return NextResponse.json(
            {
              error:
                'This booking has expired with the airline. Please search again and create a new booking.',
            },
            { status: 400 },
          );
        }

        // তোমার sample order এ requires_instant_payment / payment_requirements নাই,
        // তাই এখানে সেগুলো নিয়ে আর কিছু করছি না।
      } catch (e) {
        console.error(
          'Failed to validate Duffel order before creating PaymentIntent:',
          e,
        );
        // চাইলে এখানে 502 ফেলে ব্লক করতে পারো, বা validation fail হলেও payment allow করতে পারো
        // return NextResponse.json({ error: 'Failed to validate airline booking' }, { status: 502 });
      }
    }

    // ---------- 3) Amount / currency ----------
    const amountNumber = booking.pricing?.total_amount;
    const currency: string = (booking.pricing?.currency || 'usd').toLowerCase();

    if (
      typeof amountNumber !== 'number' ||
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0
    ) {
      console.error('Invalid booking amount', { bookingId, amountNumber });
      return NextResponse.json(
        { error: 'Invalid booking amount on server' },
        { status: 500 },
      );
    }

    const amountInSmallestUnit = Math.round(amountNumber * 100); // cents

    // ---------- 4) Existing / New PaymentIntent হ্যান্ডেল ----------
    let paymentIntent: Stripe.PaymentIntent;

    if (booking.stripePaymentIntentId) {
      // পুরনো PaymentIntent থাকলে আগে ওটাই ট্রাই করো
      try {
        const existing = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId,
        );

        if (existing.status === 'succeeded' || existing.status === 'canceled') {
          // পুরনো usable না → নতুন PI বানাব
          paymentIntent = await stripe.paymentIntents.create({
            amount: amountInSmallestUnit,
            currency,
            metadata: {
              bookingId: String(booking.bookingReference),
            },
            automatic_payment_methods: { enabled: true },
          });
          booking.stripePaymentIntentId = paymentIntent.id;
          booking.paymentStatus = 'pending';
          await booking.save();
        } else {
          // usable intent → amount/currency match কিনা চেক করো
          if (
            existing.amount !== amountInSmallestUnit ||
            existing.currency !== currency
          ) {
            return NextResponse.json(
              { error: 'Existing payment amount/currency mismatch' },
              { status: 400 },
            );
          }
          paymentIntent = existing;
        }
      } catch (e) {
        console.warn(
          'Failed to retrieve existing PaymentIntent, creating new one',
          e,
        );

        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInSmallestUnit,
          currency,
          metadata: {
            bookingId: String(booking.bookingReference),
          },
          automatic_payment_methods: { enabled: true },
        });

        booking.stripePaymentIntentId = paymentIntent.id;
        booking.paymentStatus = 'pending';
        await booking.save();
      }
    } else {
      // কোনো পুরনো PI নাই → নতুন তৈরি করো
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency,
        metadata: {
          bookingId: String(booking.bookingReference),
        },
        automatic_payment_methods: { enabled: true },
      });

      booking.stripePaymentIntentId = paymentIntent.id;
      booking.paymentStatus = 'pending';
      await booking.save();
    }

    // Sensitive জিনিস (client_secret) পুরোটা লগ কোরো না
    console.log('Stripe PaymentIntent ready', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      bookingId: booking.bookingReference,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error('Stripe PaymentIntent error:', err);

    // এখানে instance না, imported Stripe থেকে error type চেক করবে
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Something went wrong while creating payment intent' },
      { status: 500 },
    );
  }
}