// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { Duffel } from '@duffel/api';

export const dynamic = 'force-dynamic';

// ================================================================
// Stripe requires raw body for webhook signature verification.
// Next.js App Router provides this via req.text()
// ================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const duffel = process.env.DUFFEL_ACCESS_TOKEN
  ? new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN })
  : null;

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn(
    '⚠️ STRIPE_WEBHOOK_SECRET not set. Webhook signature verification disabled.',
  );
}

// ================================================================
// POST /api/stripe/webhook
//
// Handles Stripe webhook events. Primary handler for:
// - payment_intent.succeeded → Issue ticket via Duffel
// - payment_intent.payment_failed → Mark booking as failed
//
// This is the RELIABLE ticket issuance mechanism.
// Client-side issue call is just a backup.
//
// IMPORTANT: This endpoint must NOT have auth middleware.
// Stripe sends webhooks directly — no cookies/tokens.
// ================================================================

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  try {
    // ── 1. Verify Webhook Signature ──
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 },
      );
    }

    if (WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          WEBHOOK_SECRET,
        );
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 },
        );
      }
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn('⚠️ Webhook signature NOT verified (dev mode)');
    }
  } catch (err: any) {
    console.error('Webhook body parse error:', err.message);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  // ── 2. Handle Event Types ──
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        // Log but don't error on unhandled events
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Stripe expects 200 to stop retrying
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error(`Webhook handler error (${event.type}):`, err);

    // Return 500 so Stripe retries the webhook
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}

// ================================================================
// HANDLER: payment_intent.succeeded
//
// This is the PRIMARY ticket issuance trigger.
// Guaranteed by Stripe (retries up to 72 hours).
//
// Flow:
// 1. Find booking by metadata.bookingId or stripePaymentIntentId
// 2. Skip if already issued (idempotency)
// 3. Update payment status to 'captured'
// 4. Issue ticket via Duffel
// 5. Update booking status to 'issued'
// ================================================================

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const piId = paymentIntent.id;
  const metadata = paymentIntent.metadata || {};

  console.log('💳 Payment succeeded:', {
    piId,
    bookingId: metadata.bookingId,
    bookingRef: metadata.bookingRef,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  await dbConnect();

  // ── Find Booking ──
  // Try metadata first, fallback to PI ID search
  let booking: any = null;

  if (metadata.bookingId) {
    booking = await Booking.findById(metadata.bookingId);
  }

  if (!booking) {
    booking = await Booking.findOne({
      stripePaymentIntentId: piId,
    });
  }

  if (!booking) {
    console.error(
      `❌ Webhook: No booking found for PI ${piId} / metadata ${JSON.stringify(metadata)}`,
    );
    // Don't throw — Stripe would retry endlessly
    return;
  }

  // ── Idempotency: Skip if already issued ──
  if (booking.status === 'issued') {
    console.log(
      `✅ Booking ${booking.bookingReference} already issued. Skipping.`,
    );
    return;
  }

  // ── Skip if cancelled/expired ──
  if (['cancelled', 'expired'].includes(booking.status)) {
    console.warn(
      `⚠️ Payment received for ${booking.status} booking ${booking.bookingReference}. Needs manual review.`,
    );

    booking.adminNotes.push({
      note: `WARNING: Payment ${piId} succeeded but booking is ${booking.status}. Manual refund may be needed.`,
      addedBy: 'stripe-webhook',
      createdAt: new Date(),
    });
    await booking.save();
    return;
  }

  // ── Update Payment Status ──
  booking.paymentStatus = 'captured';
  booking.stripePaymentIntentId = piId;
  booking.clientPayWith = 'stripe';

  booking.adminNotes.push({
    note: `Stripe payment captured. PI: ${piId}, Amount: ${paymentIntent.amount} ${paymentIntent.currency}`,
    addedBy: 'stripe-webhook',
    createdAt: new Date(),
  });

  await booking.save();

  // ── Issue Ticket via Duffel ──
  if (!booking.duffelOrderId) {
    console.error(
      `❌ No duffelOrderId for booking ${booking.bookingReference}`,
    );
    booking.adminNotes.push({
      note: 'Payment captured but no Duffel order ID found. Manual ticket issuance required.',
      addedBy: 'stripe-webhook',
      createdAt: new Date(),
    });
    await booking.save();
    return;
  }

  if (!duffel) {
    console.error('❌ Duffel client not initialized');
    booking.adminNotes.push({
      note: 'Payment captured but Duffel client unavailable. Manual ticket issuance required.',
      addedBy: 'stripe-webhook',
      createdAt: new Date(),
    });
    await booking.save();
    return;
  }

  try {
    // Confirm payment with Duffel (balance payment)
    await duffel.payments.create({
      order_id: booking.duffelOrderId,
      payment: {
        type: 'balance',
        amount: String(booking.pricing.base_amount || booking.pricing.total_amount),
        currency: (booking.pricing.currency || 'USD').toUpperCase(),
      },
    });

    // Fetch updated order for documents
    const orderRes = await duffel.orders.get(booking.duffelOrderId);
    const order: any = orderRes.data;

    // Update booking
    booking.status = 'issued';
    booking.pnr = order.booking_reference || booking.pnr;

    if (order.documents && order.documents.length > 0) {
      booking.documents = order.documents
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
          unique_identifier: doc.unique_identifier || '',
          docType: doc.type || 'electronic_ticket',
          url: doc.url || '',
        }));
    }

    booking.adminNotes.push({
      note: `Ticket issued via webhook. PNR: ${booking.pnr}. Documents: ${booking.documents?.length || 0}`,
      addedBy: 'stripe-webhook',
      createdAt: new Date(),
    });

    await booking.save();

    console.log(
      `✅ Ticket issued for ${booking.bookingReference} (PNR: ${booking.pnr})`,
    );

    // TODO: Send confirmation email to customer
    // await sendTicketEmail(booking);

  } catch (duffelError: any) {
    console.error(
      `❌ Duffel ticket issuance failed for ${booking.bookingReference}:`,
      duffelError.message,
    );

    booking.adminNotes.push({
      note: `CRITICAL: Payment captured (${piId}) but Duffel issuance failed: ${duffelError.message}. MANUAL ISSUANCE REQUIRED.`,
      addedBy: 'stripe-webhook',
      createdAt: new Date(),
    });
    await booking.save();

    // Throw to make Stripe retry the webhook
    throw duffelError;
  }
}

// ================================================================
// HANDLER: payment_intent.payment_failed
// ================================================================

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
) {
  const piId = paymentIntent.id;
  const metadata = paymentIntent.metadata || {};

  console.log('❌ Payment failed:', {
    piId,
    bookingRef: metadata.bookingRef,
    error: paymentIntent.last_payment_error?.message,
  });

  await dbConnect();

  let booking: any = null;

  if (metadata.bookingId) {
    booking = await Booking.findById(metadata.bookingId);
  }

  if (!booking) {
    booking = await Booking.findOne({
      stripePaymentIntentId: piId,
    });
  }

  if (!booking) {
    console.warn(`No booking found for failed PI ${piId}`);
    return;
  }

  // Don't override terminal states
  if (['issued', 'cancelled'].includes(booking.status)) {
    return;
  }

  booking.paymentStatus = 'failed';

  const errorMsg =
    paymentIntent.last_payment_error?.message ||
    'Unknown payment error';

  booking.adminNotes.push({
    note: `Stripe payment failed. PI: ${piId}. Error: ${errorMsg}`,
    addedBy: 'stripe-webhook',
    createdAt: new Date(),
  });

  await booking.save();

  console.log(
    `Updated booking ${booking.bookingReference} paymentStatus to 'failed'`,
  );
}