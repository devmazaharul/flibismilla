// app/api/dashboard/bookings/issue-ticket/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { isAdmin } from '@/app/api/lib/auth';

export const dynamic = 'force-dynamic';

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

// ─── Rate Limiter ───
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

function isRateLimited(ip: string): boolean {
  const WINDOW = 60 * 1000;
  const MAX = 5;
  const now = Date.now();
  const data = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - data.startTime > WINDOW) {
    data.count = 1;
    data.startTime = now;
  } else {
    data.count++;
  }

  rateLimitMap.set(ip, data);
  return data.count > MAX;
}

// ─── Types ───
type ClientPayWith = 'balance' | 'stripe';
const VALID_METHODS: ClientPayWith[] = ['balance', 'stripe'];

// ─── Main Handler ───
export async function POST(req: Request) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  let bookingIdForError: string | null = null;

  try {
    // Rate Limit
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Wait 1 minute.' },
        { status: 429 }
      );
    }

    // Parse Body
    const body = await req.json();
    const { bookingId, paymentMethod = 'balance' } = body as {
      bookingId?: string;
      paymentMethod?: string;
    };

    bookingIdForError = bookingId || null;

    // ─── Validation ───
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required.' },
        { status: 400 }
      );
    }

    if (!VALID_METHODS.includes(paymentMethod as ClientPayWith)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid payment method: "${paymentMethod}". Use: balance or stripe`,
        },
        { status: 400 }
      );
    }

    const method = paymentMethod as ClientPayWith;

    await dbConnect();

    // ─── Find Booking ───
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found.' },
        { status: 404 }
      );
    }

    if (!booking.duffelOrderId) {
      return NextResponse.json(
        { success: false, message: 'No Duffel order linked to this booking.' },
        { status: 400 }
      );
    }

    // ─── Already Issued ───
    if (booking.status === 'issued' && booking.emailSent) {
      return NextResponse.json(
        { success: false, message: 'Ticket already issued and email sent.' },
        { status: 400 }
      );
    }

    // ─── Retry Guard ───
    if ((booking.retryCount || 0) >= 5) {
      return NextResponse.json(
        { success: false, message: 'Max retry limit (5) reached. Contact support.' },
        { status: 403 }
      );
    }

    // ─── Fetch Duffel Order ───
    let order: any;
    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      order = res.data;
    } catch (err: any) {
      console.error('❌ Duffel fetch error:', err.message);
      return NextResponse.json(
        { success: false, message: 'Failed to connect with Duffel API.' },
        { status: 502 }
      );
    }

    // ─── Cancelled ───
    if (order.cancellation || order.cancelled_at) {
      await Booking.findByIdAndUpdate(bookingId, {
        $set: { status: 'cancelled', updatedAt: new Date() },
      });
      return NextResponse.json(
        { success: false, message: 'Airline cancelled this booking.' },
        { status: 400 }
      );
    }

    // ─── Expired ───
    const expiresAt =
      order.payment_status?.payment_required_by ||
      order.payment_status?.price_guarantee_expires_at;

    if (expiresAt && new Date(expiresAt) < new Date()) {
      await Booking.findByIdAndUpdate(bookingId, {
        $set: { status: 'expired', updatedAt: new Date() },
      });
      return NextResponse.json(
        { success: false, message: 'Booking expired. Create a new one.' },
        { status: 400 }
      );
    }

    // ─── Already Has Documents ───
    if (order.documents && order.documents.length > 0) {
      const docs = order.documents.map((doc: any) => ({
        unique_identifier: doc.unique_identifier || '',
        type: doc.type || '',
        url: doc.url || '',
      }));

      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          status: 'issued',
          pnr: order.booking_reference || booking.pnr,
          documents: docs,
          paymentStatus: 'captured',
          clientPayWith: method,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Ticket already issued. Email will be sent via webhook.',
        alreadyIssued: true,
      });
    }

    // ─── Amount ───
    const amountToPay = order.total_amount;
    const currency = order.total_currency;

    if (!amountToPay || !currency) {
      return NextResponse.json(
        { success: false, message: 'Amount or currency missing from Duffel.' },
        { status: 400 }
      );
    }

    // ════════════════════════════════════════════════
    // 💳 PAYMENT — সবসময় Duffel Balance দিয়ে pay হবে
    //
    // "balance" → Admin সরাসরি Duffel balance দিয়ে দিচ্ছে
    // "stripe"  → Customer আগেই Stripe দিয়ে pay করেছে,
    //             এখন Admin confirm করে Duffel balance দিয়ে
    //             airline-কে pay করছে
    //
    // দুইটাতেই Duffel API call একই — শুধু TRACK আলাদা
    // ════════════════════════════════════════════════

    const paymentLabel =
      method === 'stripe'
        ? 'Stripe (Customer paid) → Duffel Balance (Airline paid)'
        : 'Duffel Balance (Direct)';

    console.log(`💳 ${paymentLabel}`);
    console.log(`📋 Amount: ${amountToPay} ${currency} | Order: ${booking.duffelOrderId}`);

    // Duffel payment — সবসময় balance
    const paymentRes = await duffel.payments.create({
      order_id: booking.duffelOrderId,
      payment: {
        amount: amountToPay,
        currency: currency,
        type: 'balance', // সবসময় balance — Duffel-এ card নেই
      },
    });

    const payment = paymentRes.data as any;

    if (!payment || payment.status !== 'succeeded') {
      throw new Error(
        payment?.failure_reason ||
          `Payment failed (status: ${payment?.status || 'unknown'})`
      );
    }

    console.log(`✅ Payment succeeded | ID: ${payment.id}`);

    // ════════════════════════════════════════════════
    // 📝 DB UPDATE
    //
    // ❌ status='issued' করবো না — Webhook করবে
    // ❌ email পাঠাবো না — Webhook পাঠাবে
    // ✅ clientPayWith — track করবো কিভাবে pay হলো
    // ✅ adminNotes — details লিখবো
    // ════════════════════════════════════════════════

    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Build detailed admin note
    const adminNote = [
      `✅ Payment Captured`,
      `──────────────────────`,
      `Method: ${method === 'stripe' ? '💳 Stripe → Duffel Balance' : '💰 Duffel Balance (Direct)'}`,
      `Amount: ${amountToPay} ${currency}`,
      `Duffel Payment ID: ${payment.id}`,
      `Order ID: ${booking.duffelOrderId}`,
      `PNR: ${order.booking_reference || booking.pnr || 'N/A'}`,
      `Time: ${timeStr}`,
      method === 'stripe'
        ? `Note: Customer already paid via Stripe. Airline paid from Duffel balance.`
        : `Note: Paid directly from Duffel balance.`,
    ].join('\n');

    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        paymentStatus: 'captured',
        payment_id: payment.id,
        clientPayWith: method, // ✅ "balance" বা "stripe"
        retryCount: 0,
        lastRetryAt: now,
        adminNotes: adminNote,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        method === 'stripe'
          ? 'Stripe payment confirmed & airline paid. Ticket issuing...'
          : 'Duffel balance payment done. Ticket issuing...',
      paymentId: payment.id,
      clientPayWith: method,
      amount: amountToPay,
      currency,
    });
  } catch (error: any) {
    console.error('❌ Issue Error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    // ─── Error Mapping ───
    let errorMessage = 'Payment failed. Try again.';
    let statusCode = 400;

    const duffelErrors = error?.response?.data?.errors;
    const firstError = Array.isArray(duffelErrors) ? duffelErrors[0] : null;

    if (firstError) {
      const code = firstError.code || firstError.type || '';
      const msg = firstError.message || firstError.title || '';

      const map: Record<string, string> = {
        order_requires_instant_payment:
          'Instant payment required. Create a new booking.',
        order_expired: 'Booking expired. Create a new booking.',
        insufficient_balance:
          'Duffel balance insufficient. Top up your account.',
        order_already_paid: 'This order is already paid.',
        order_not_found: 'Order not found in Duffel.',
        validation_error: msg || 'Invalid payment data.',
      };

      if (map[code]) {
        errorMessage = map[code];
      } else if (/instant_payment/i.test(msg)) {
        errorMessage = map.order_requires_instant_payment;
      } else if (/expired/i.test(msg)) {
        errorMessage = map.order_expired;
      } else if (/insufficient.*balance/i.test(msg)) {
        errorMessage = map.insufficient_balance;
      } else if (/already.*paid/i.test(msg)) {
        errorMessage = map.order_already_paid;
      } else if (msg) {
        errorMessage = msg;
      }

      statusCode = error?.response?.status || 400;

      // Expired → DB update
      if (code === 'order_expired' || /expired/i.test(msg)) {
        if (bookingIdForError) {
          await Booking.findByIdAndUpdate(bookingIdForError, {
            $set: { status: 'expired' },
          }).catch(() => {});
        }
      }
    } else if (error?.response?.status >= 500) {
      errorMessage = 'Airline system unavailable. Try later.';
      statusCode = 502;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Retry count update
    if (bookingIdForError) {
      try {
        await Booking.findByIdAndUpdate(bookingIdForError, {
          $inc: { retryCount: 1 },
          $set: {
            lastRetryAt: new Date(),
            paymentStatus: 'failed',
            adminNotes: `❌ Payment Failed\n──────────────────────\nError: ${errorMessage}\nTime: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
          },
        });
      } catch {}
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}