// app/api/stripe/create-intent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

export const dynamic = 'force-dynamic';

// ================================================================
// ENV VALIDATION
// ================================================================

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

if (!STRIPE_SECRET) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set in environment variables',
  );
}

// ================================================================
// CLIENT INITIALIZATION
// ================================================================

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2024-06-20' as any,
  maxNetworkRetries: 2,
});

const duffel = DUFFEL_TOKEN
  ? new Duffel({ token: DUFFEL_TOKEN })
  : null;

// ================================================================
// ZERO-DECIMAL CURRENCIES
// Stripe expects amounts in smallest unit for most currencies
// (e.g., cents for USD). But some currencies have no decimal
// sub-unit — for these, amount is passed as-is.
//
// Full list: https://stripe.com/docs/currencies#zero-decimal
// ================================================================

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf',
  'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd',
  'vuv', 'xaf', 'xof', 'xpf',
]);

/**
 * Convert a decimal amount to Stripe's smallest-unit format.
 *
 * Examples:
 *   toStripeAmount(150.50, 'usd') → 15050  (cents)
 *   toStripeAmount(1500, 'jpy')   → 1500   (yen, no sub-unit)
 *   toStripeAmount(99.99, 'gbp')  → 9999   (pence)
 */
function toStripeAmount(
  amount: number,
  currency: string,
): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

// ================================================================
// HELPERS
// ================================================================

function errorResponse(
  message: string,
  status: number,
  code?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status },
  );
}

/**
 * Check if a PaymentIntent is in a reusable state.
 * Succeeded/canceled intents cannot be reused.
 */
function isReusableIntent(
  intent: Stripe.PaymentIntent,
): boolean {
  return !['succeeded', 'canceled'].includes(
    intent.status,
  );
}

// ================================================================
// RATE LIMITER (per-IP, 10 requests/min)
// Prevents abuse of PaymentIntent creation.
// ================================================================

const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

function isRateLimited(ip: string): boolean {
  const WINDOW_MS = 60_000;
  const MAX_REQUESTS = 10;
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ================================================================
// POST /api/stripe/create-intent
//
// Creates or retrieves a Stripe PaymentIntent for a booking.
//
// Flow:
// 1. Validate request body
// 2. Fetch booking from DB
// 3. Guard: status, payment, expiry checks
// 4. Validate with Duffel (if order exists)
// 5. Create or reuse PaymentIntent
// 6. Return clientSecret
//
// Request: { bookingId: string }
// Response: { success: true, clientSecret: string }
// ================================================================

export async function POST(req: NextRequest) {
  // ── Rate Limiting ──
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return errorResponse(
      'Too many requests. Please wait a moment.',
      429,
      'RATE_LIMITED',
    );
  }

  try {
    // ════════════════════════════════════════════
    // 1. PARSE & VALIDATE REQUEST
    // ════════════════════════════════════════════

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
    }

    const { bookingId } = body || {};

    if (!bookingId || typeof bookingId !== 'string') {
      return errorResponse(
        'bookingId is required and must be a string',
        400,
        'MISSING_BOOKING_ID',
      );
    }

    // ════════════════════════════════════════════
    // 2. FETCH BOOKING FROM DATABASE
    // ════════════════════════════════════════════

    await dbConnect();

    const booking: any = await Booking.findById(bookingId);

    if (!booking) {
      return errorResponse(
        'Booking not found',
        404,
        'BOOKING_NOT_FOUND',
      );
    }

    // ════════════════════════════════════════════
    // 3. GUARD: Status & Payment Checks
    // ════════════════════════════════════════════

    // ── Already finalized? ──
    const terminalStatuses = ['issued', 'cancelled', 'expired'];
    if (terminalStatuses.includes(booking.status)) {
      return errorResponse(
        `This booking is "${booking.status}" and cannot accept payment.`,
        400,
        'BOOKING_TERMINAL',
      );
    }

    // ── Already paid? ──
    const paidStatuses = ['authorized', 'captured', 'refunded'];
    if (paidStatuses.includes(booking.paymentStatus)) {
      return errorResponse(
        'Payment has already been processed for this booking.',
        400,
        'ALREADY_PAID',
      );
    }

    // ── Local payment deadline expired? ──
    const now = new Date();

    if (booking.paymentDeadline && new Date(booking.paymentDeadline) < now) {
      booking.status = 'expired';
      booking.adminNotes.push({
        note: 'Auto-expired: Payment deadline passed before PaymentIntent creation.',
        addedBy: 'stripe-create-intent',
        createdAt: now,
      });
      await booking.save();

      return errorResponse(
        'The payment deadline has passed. Please create a new booking.',
        400,
        'DEADLINE_EXPIRED',
      );
    }

    // ════════════════════════════════════════════
    // 4. DUFFEL ORDER VALIDATION
    //
    // Verify the airline reservation is still valid
    // before accepting payment. Prevents charging
    // customers for expired/cancelled flights.
    // ════════════════════════════════════════════

    if (booking.duffelOrderId && duffel) {
      try {
        const res = await duffel.orders.get(booking.duffelOrderId);
        const order: any = res.data;

        // ── Cancelled by airline? ──
        if (order.cancellation || order.cancelled_at) {
          booking.status = 'cancelled';
          booking.adminNotes.push({
            note: `Auto-cancelled: Airline cancelled the order (detected at payment time). cancelled_at: ${order.cancelled_at || 'N/A'}`,
            addedBy: 'stripe-create-intent',
            createdAt: now,
          });
          await booking.save();

          return errorResponse(
            'This booking has been cancelled by the airline. Please create a new booking.',
            400,
            'AIRLINE_CANCELLED',
          );
        }

        // ── Payment deadline expired on Duffel side? ──
        const paymentStatus = order.payment_status || {};
        const duffelDeadline =
          paymentStatus.payment_required_by ||
          paymentStatus.price_guarantee_expires_at ||
          null;

        if (duffelDeadline && new Date(duffelDeadline) < now) {
          booking.status = 'expired';
          booking.adminNotes.push({
            note: `Auto-expired: Duffel payment deadline passed (${duffelDeadline}).`,
            addedBy: 'stripe-create-intent',
            createdAt: now,
          });
          await booking.save();

          return errorResponse(
            'This airline reservation has expired. Please search again and create a new booking.',
            400,
            'DUFFEL_EXPIRED',
          );
        }
      } catch (duffelError: any) {
        // ── Duffel API failure ──
        // STRICT MODE: Block payment if we can't verify the order
        console.error(
          'Duffel validation failed before PaymentIntent creation:',
          duffelError.message,
        );

        return errorResponse(
          'Unable to verify your airline reservation. Please try again in a moment.',
          502,
          'DUFFEL_VALIDATION_FAILED',
        );
      }
    }

    // ════════════════════════════════════════════
    // 5. AMOUNT & CURRENCY PREPARATION
    // ════════════════════════════════════════════

    const rawAmount = booking.pricing?.total_amount;
    const currency = (
      booking.pricing?.currency || 'USD'
    ).toLowerCase();

    if (
      typeof rawAmount !== 'number' ||
      !Number.isFinite(rawAmount) ||
      rawAmount <= 0
    ) {
      console.error('Invalid booking amount:', {
        bookingId: booking._id,
        bookingRef: booking.bookingReference,
        rawAmount,
      });

      return errorResponse(
        'Invalid booking amount. Please contact support.',
        500,
        'INVALID_AMOUNT',
      );
    }

    // Minimum amount check (Stripe requires at least $0.50 USD equivalent)
    const MIN_AMOUNT = 0.5;
    if (rawAmount < MIN_AMOUNT) {
      return errorResponse(
        `Amount too small. Minimum is ${MIN_AMOUNT} ${currency.toUpperCase()}.`,
        400,
        'AMOUNT_TOO_SMALL',
      );
    }

    const stripeAmount = toStripeAmount(rawAmount, currency);

    // ════════════════════════════════════════════
    // 6. STRIPE METADATA
    //
    // Rich metadata helps with:
    // - Stripe Dashboard search & filtering
    // - Webhook event context
    // - Dispute resolution
    // - Financial reconciliation
    // ════════════════════════════════════════════

    const customerEmail = booking.contact?.email || '';
    const customerPhone = booking.contact?.phone || '';
    const route = booking.flightDetails?.route || 'N/A';
    const airline = booking.flightDetails?.airline || 'N/A';

    const metadata: Record<string, string> = {
      bookingId: String(booking._id),
      bookingRef: booking.bookingReference || '',
      customerEmail,
      customerPhone,
      route,
      airline,
      flightType: booking.flightDetails?.flightType || 'one_way',
      passengerCount: String(booking.passengers?.length || 1),
      isLiveMode: String(booking.isLiveMode === true),
      pnr: booking.pnr || '',
      duffelOrderId: booking.duffelOrderId || '',
      markup: String(booking.pricing?.markup || 0),
    };

    const description = `Flight: ${route} | ${airline} | Ref: ${booking.bookingReference}`;

    // ════════════════════════════════════════════
    // 7. CREATE OR REUSE PAYMENT INTENT
    //
    // Strategy:
    // - If existing PI: validate it's reusable + amounts match
    // - If existing PI is terminal: create new one
    // - If no PI exists: create new one
    //
    // Uses idempotencyKey to prevent duplicate PIs
    // from rapid double-clicks or network retries.
    // ════════════════════════════════════════════

    let paymentIntent: Stripe.PaymentIntent;

    // Idempotency key: unique per booking + amount combo
    // This ensures the same request doesn't create multiple PIs
    const idempotencyKey = `pi_${booking._id}_${stripeAmount}_${currency}`;

    if (booking.stripePaymentIntentId) {
      // ── TRY EXISTING PAYMENT INTENT ──
      try {
        const existing = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId,
        );

        if (isReusableIntent(existing)) {
          // ── Reusable: Verify amount/currency match ──
          if (
            existing.amount !== stripeAmount ||
            existing.currency !== currency
          ) {
            // Amount changed (e.g., markup updated) — cancel old, create new
            console.warn('Amount mismatch on existing PI, creating new one', {
              existingAmount: existing.amount,
              expectedAmount: stripeAmount,
              bookingRef: booking.bookingReference,
            });

            // Cancel the old one (best effort)
            try {
              await stripe.paymentIntents.cancel(
                existing.id,
                { cancellation_reason: 'abandoned' },
              );
            } catch {
              // Old PI may not be cancellable — that's OK
            }

            paymentIntent = await stripe.paymentIntents.create(
              {
                amount: stripeAmount,
                currency,
                metadata,
                description,
                receipt_email: customerEmail || undefined,
                automatic_payment_methods: { enabled: true },
              },
              { idempotencyKey: `${idempotencyKey}_v2_${Date.now()}` },
            );

            booking.stripePaymentIntentId = paymentIntent.id;
            booking.paymentStatus = 'pending';
            await booking.save();
          } else {
            // ── Amount matches: reuse existing PI ──
            // Update metadata in case booking details changed
            paymentIntent = await stripe.paymentIntents.update(
              existing.id,
              {
                metadata,
                description,
                receipt_email: customerEmail || undefined,
              },
            );
          }
        } else {
          // ── Terminal PI (succeeded/canceled): create new ──
          console.info(
            `Existing PI ${existing.id} is ${existing.status}, creating new one`,
          );

          paymentIntent = await stripe.paymentIntents.create(
            {
              amount: stripeAmount,
              currency,
              metadata,
              description,
              receipt_email: customerEmail || undefined,
              automatic_payment_methods: { enabled: true },
            },
            { idempotencyKey: `${idempotencyKey}_new_${Date.now()}` },
          );

          booking.stripePaymentIntentId = paymentIntent.id;
          booking.paymentStatus = 'pending';
          await booking.save();
        }
      } catch (retrieveError: any) {
        // ── Can't retrieve old PI: create fresh ──
        console.warn(
          'Failed to retrieve existing PaymentIntent, creating new:',
          retrieveError.message,
        );

        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: stripeAmount,
            currency,
            metadata,
            description,
            receipt_email: customerEmail || undefined,
            automatic_payment_methods: { enabled: true },
          },
          { idempotencyKey },
        );

        booking.stripePaymentIntentId = paymentIntent.id;
        booking.paymentStatus = 'pending';
        await booking.save();
      }
    } else {
      // ── NO EXISTING PI: Create fresh ──
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: stripeAmount,
          currency,
          metadata,
          description,
          receipt_email: customerEmail || undefined,
          automatic_payment_methods: { enabled: true },
        },
        { idempotencyKey },
      );

      booking.stripePaymentIntentId = paymentIntent.id;
      booking.paymentStatus = 'pending';
      await booking.save();
    }

    // ════════════════════════════════════════════
    // 8. RESPONSE
    // ════════════════════════════════════════════

    // Structured log (no secrets)
    // console.log('✅ Stripe PaymentIntent ready:', {
    //   piId: paymentIntent.id,
    //   piStatus: paymentIntent.status,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   bookingRef: booking.bookingReference,
    //   customerEmail: customerEmail || 'N/A',
    //   isReused: paymentIntent.id === booking.stripePaymentIntentId,
    // });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: rawAmount,
      currency: currency.toUpperCase(),
    });
  } catch (err: any) {
    console.error('❌ Stripe PaymentIntent creation failed:', err);

    // ── Stripe-specific errors ──
    if (err instanceof Stripe.errors.StripeError) {
      const stripeCode = err.code || 'stripe_error';
      const statusCode =
        err.statusCode && err.statusCode >= 400 && err.statusCode < 600
          ? err.statusCode
          : 400;

      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: stripeCode,
        },
        { status: statusCode },
      );
    }

    // ── MongoDB errors ──
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      return errorResponse(
        'Database error. Please try again.',
        500,
        'DATABASE_ERROR',
      );
    }

    // ── Generic fallback ──
    return errorResponse(
      'Something went wrong while creating payment. Please try again.',
      500,
      'INTERNAL_ERROR',
    );
  }
}