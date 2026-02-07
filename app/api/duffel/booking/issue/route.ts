import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { isAdmin } from '@/app/api/lib/auth';

export const dynamic = 'force-dynamic';

// Duffel client
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

// --- Rate Limiter Helper ---
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

function isRateLimited(ip: string) {
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - clientData.startTime > windowMs) {
    clientData.count = 1;
    clientData.startTime = now;
  } else {
    clientData.count++;
  }

  rateLimitMap.set(ip, clientData);
  return clientData.count > maxRequests;
}

// --- Main POST API Handler ---
export async function POST(req: Request) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  let bookingIdForError: string | null = null;

  try {
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many attempts. Please wait 1 minute.',
        },
        { status: 429 },
      );
    }

    // Body parse
    const body = await req.json();
    const { bookingId, paymentMethod } = body as {
      bookingId?: string;
      // frontend থেকে যা পাঠাবে (UI তে use করার জন্য),
      // Duffel-এ সবসময় balance দিয়েই পেমেন্ট হবে
      paymentMethod?: 'balance' | 'card' | 'stripe';
    };

    bookingIdForError = bookingId || null;

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking ID or Payment Method is missing',
        },
        { status: 400 },
      );
    }

    await dbConnect();
    const booking: any = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found in database',
        },
        { status: 404 },
      );
    }

    // Retry Guard
    if ((booking.retryCount || 0) >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Maximum retry limit reached. Please contact support.',
        },
        { status: 403 },
      );
    }

    // Duffel Order Details
    let orderDetails: any;
    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      orderDetails = res.data;

      console.log('Duffel order debug:', {
        id: orderDetails.id,
        type: orderDetails.type, // e.g. 'hold'
        payment_status: orderDetails.payment_status,
      });
    } catch (err) {
      console.error('Duffel Connection Error:', err);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect with Duffel API.',
        },
        { status: 502 },
      );
    }

    // Booking already cancelled by airline
    if (orderDetails.cancellation || orderDetails.cancelled_at) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
      return NextResponse.json(
        {
          success: false,
          message: 'Airline cancelled this booking.',
        },
        { status: 400 },
      );
    }

    // Expired order check based on payment_status
    const paymentStatusObj = orderDetails.payment_status || {};
    const nowIso = new Date().toISOString();

    const paymentRequiredBy =
      (paymentStatusObj.payment_required_by as string | null) || null;
    const priceGuaranteeExpiresAt =
      (paymentStatusObj.price_guarantee_expires_at as string | null) || null;

    const expiresAt = paymentRequiredBy || priceGuaranteeExpiresAt;

    if (expiresAt && expiresAt < nowIso) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'expired' });

      return NextResponse.json(
        {
          success: false,
          message:
            'This booking has expired with the airline. Please search again and create a new booking.',
        },
        { status: 400 },
      );
    }

    // If order already issued in Duffel
    if (orderDetails.documents?.length > 0) {
      const formattedDocs = orderDetails.documents.map((doc: any) => ({
        unique_identifier: doc.unique_identifier,
        type: doc.type,
        url: doc.url,
      }));

      const updated = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'issued',
          pnr: orderDetails.booking_reference,
          documents: formattedDocs,
        },
        { new: true },
      );

      return NextResponse.json({
        success: true,
        message: 'Ticket is already issued!',
        data: updated,
      });
    }

    // Payment payload from Duffel order
    const amountToPay = orderDetails.total_amount;
    const currency = orderDetails.total_currency;

    if (!amountToPay || !currency) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order amount or currency missing from Duffel.',
        },
        { status: 400 },
      );
    }

    // সবসময়ই Duffel balance ব্যবহার করছি
    const paymentPayload: any = {
      order_id: booking.duffelOrderId,
      payment: {
        amount: amountToPay,
        currency,
        type: 'balance',
      },
    };

    console.log(
      `Charging ${amountToPay} ${currency} via Duffel balance (frontend method: ${paymentMethod})...`,
    );

    // Duffel payment create
    const paymentResponse = await duffel.payments.create(paymentPayload);
    const payment = paymentResponse.data as any;

    console.log('Duffel Payment Response:', payment);

    if (!payment) {
      throw new Error('No payment data returned from Duffel.');
    }

    if (payment.status !== 'succeeded') {
      const reason =
        payment.failure_reason ||
        `Payment not succeeded (status: ${payment.status})`;
      throw new Error(reason);
    }

    // Payment succeeded – wait for docs
    console.log('Payment succeeded. Waiting for Airline PDF generation...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedOrder = await duffel.orders.get(booking.duffelOrderId);
    const pdfDocuments =
      updatedOrder.data.documents?.map((doc: any) => ({
        unique_identifier: doc.unique_identifier,
        type: doc.type,
        url: doc.url,
      })) || [];

    const now = new Date();

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'issued',
        pnr: updatedOrder.data.booking_reference,
        documents: pdfDocuments,
        retryCount: 0,
        lastRetryAt: now,
        adminNotes: `Ticket issued via Duffel balance (frontend: ${paymentMethod}) at ${now.toLocaleString()}`,
        paymentStatus: 'captured',
        payment_id: payment.id, // Duffel payment id save
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: 'Ticket Issued Successfully!',
      data: updatedBooking,
    });
  } catch (error: any) {
    // More detailed logging for debugging
    console.error('Payment Error (raw):', {
      message: error?.message,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data,
    });

    let errorMessage =
      'Payment processing failed. Please try again or contact support.';
    let statusCode = 400;

    const httpStatus = error?.response?.status;
    const duffelErrors = error?.response?.data?.errors;
    const duffelFirstError = Array.isArray(duffelErrors)
      ? duffelErrors[0]
      : null;

    if (duffelFirstError) {
      const duffelMsg =
        duffelFirstError.message || duffelFirstError.title || '';
      const duffelCode =
        duffelFirstError.code || duffelFirstError.type || '';

      // Common Duffel errors → human-friendly message
      if (
        duffelCode === 'order_requires_instant_payment' ||
        /requires_instant_payment=true/i.test(duffelMsg)
      ) {
        errorMessage =
          'This order must be paid instantly with the airline and cannot be paid later. Please create a new booking and pay at the time of booking.';
      } else if (
        duffelCode === 'order_expired' ||
        /expired/i.test(duffelMsg)
      ) {
        errorMessage =
          'This booking has expired with the airline. Please search again and create a new booking.';
      } else {
        // Default: Duffel এর message use করি
        errorMessage = duffelMsg || errorMessage;
      }

      statusCode = httpStatus || 400;
    } else if (httpStatus && httpStatus >= 500) {
      // Duffel 5xx / upstream issues
      errorMessage =
        'Airline payment service is temporarily unavailable. Please try again later.';
      statusCode = 502;
    } else if (error?.message) {
      // Local/JS error
      errorMessage = error.message;
    }

    if (bookingIdForError) {
      try {
        await Booking.findByIdAndUpdate(bookingIdForError, {
          $inc: { retryCount: 1 },
          lastRetryAt: new Date(),
          adminNotes: `Payment Failed: ${errorMessage}`,
          paymentStatus: 'failed',
        });
      } catch (dbErr) {
        console.error('Failed to update retryCount/adminNotes:', dbErr);
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode },
    );
  }
}