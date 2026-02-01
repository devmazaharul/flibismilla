import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../utils';

// 1. Duffel Configuration
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

// --- 🛡️ 2. Rate Limiter Helper ---
const rateLimitMap = new Map();

function isRateLimited(ip: string) {
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5;      // Max 5 requests per minute
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

// --- 🚀 3. Main POST API Handler ---
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { bookingId, paymentMethod } = body; // paymentMethod: 'card' | 'balance'

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Booking ID or Payment Method is missing" },
        { status: 400 }
      );
    }

    await dbConnect();
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found in database" },
        { status: 404 }
      );
    }

    // 🛑 Retry Guard
    if ((booking.retryCount || 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum retry limit reached. Please contact support."
        },
        { status: 403 }
      );
    }

    let orderDetails;
    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      orderDetails = res.data as any;
      console.log(orderDetails);
    } catch (err) {
      console.error("Duffel Connection Error:", err);
      return NextResponse.json(
        { success: false, message: "Failed to connect with Duffel API." },
        { status: 502 }
      );
    }

    // Check if booking is cancelled by airline
    if (orderDetails.cancelled_at) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
      return NextResponse.json(
        { success: false, message: "Airline cancelled this booking." },
        { status: 400 }
      );
    }

    // If ticket already issued, return documents
    if (orderDetails.documents?.length > 0) {
      const formattedDocs = orderDetails.documents.map((doc: any) => ({
        unique_identifier: doc.unique_identifier,
        type: doc.type,
        url: doc.url
      }));

      await Booking.findByIdAndUpdate(bookingId, {
        status: 'issued',
        pnr: orderDetails.booking_reference,
        documents: formattedDocs,
        'paymentInfo.cvv': null
      });

      return NextResponse.json({
        success: true,
        message: "Ticket is already issued!",
        data: booking
      });
    }

    // 💰 5. Prepare Payment Payload
    const amountToPay = orderDetails.total_amount;
    const currency = orderDetails.total_currency;

    // Base payment payload
    const paymentPayload: any = {
      order_id: booking.duffelOrderId,
      payment: {
        amount: amountToPay,
        currency: currency,
        type: "balance" // Default payment type
      }
    };

    // 🔐 6. Payment Logic (Card vs Balance)
    if (paymentMethod === 'card') {
      console.log("Processing Card Payment...");

      // Check card data exists in database
      if (!booking.paymentInfo?.cardNumber) {
        return NextResponse.json(
          { success: false, message: "Card data missing in database" },
          { status: 400 }
        );
      }

      try {
        // Decrypt card number
        const decryptedCardNum = decrypt(booking.paymentInfo.cardNumber);

        // Format expiry date (MM/YY -> MM & YYYY)
        const [expMonth, expYearShort] = booking.paymentInfo.expiryDate.split('/');
        const expYearFull =
          expYearShort.length === 2 ? `20${expYearShort}` : expYearShort;

        // Update payment payload for card
        paymentPayload.payment.type = "card";
        paymentPayload.payment.card_details = {
          number: decryptedCardNum,
          cvv: booking.paymentInfo.cvv,
          exp_month: expMonth,
          exp_year: expYearFull,
          name: booking.paymentInfo.cardName,
        };

      } catch (decryptionError) {
        console.error("Decryption Failed:", decryptionError);
        return NextResponse.json(
          { success: false, message: "Failed to decrypt card info." },
          { status: 500 }
        );
      }
    } else {
      // Balance payment
      console.log("Processing Balance Payment...");
      paymentPayload.payment.type = "balance";
    }

    // ⚡ 7. Execute Payment
    console.log(`Charging ${amountToPay} ${currency} via ${paymentMethod}...`);

    const paymentResponse = await duffel.payments.create(paymentPayload);

    // ✅ 8. Success Handling
    if (paymentResponse.data) {
      console.log("Payment Successful! Fetching Documents...");

      // Re-fetch order to get ticket documents
      const updatedOrder = await duffel.orders.get(booking.duffelOrderId);

      // Format PDF documents
      const pdfDocuments =
        updatedOrder.data.documents?.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url || "abc.pdf"
        })) || [];

      // Update booking record
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'issued',
          pnr: updatedOrder.data.booking_reference,
          documents: pdfDocuments,

          // Security: remove CVV
          'paymentInfo.cvv': null,

          $set: {
            retryCount: 0,
            adminNotes: `Ticket Issued via ${paymentMethod} at ${new Date().toLocaleString()}`
          }
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Ticket Issued Successfully!",
        data: updatedBooking
      });
    }

  } catch (error: any) {
    console.error("Payment Failed:", JSON.stringify(error, null, 2));

    const errorMessage =
      error.errors?.[0]?.message || error.message || "Unknown Payment Error";

    // Increase retry count on failure
    try {
      const body = await req.json().catch(() => ({}));
      if (body.bookingId) {
        await Booking.findByIdAndUpdate(body.bookingId, {
          $inc: { retryCount: 1 },
          lastRetryAt: new Date(),
        });
      }
    } catch (e) { /* Ignore */ }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 400 }
    );
  }

  // Fallback
  return NextResponse.json(
    { success: false, message: "Internal Server Error" },
    { status: 500 }
  );
}
