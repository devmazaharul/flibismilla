import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import { sendTicketIssuedEmail } from "@/app/emails/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersList = req.headers;
    const signature = headersList.get("x-duffel-signature") || headersList.get("X-Duffel-Signature");

    // 1. Signature Check
    if (!signature) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET is missing");
      return NextResponse.json({ message: "Server Config Error" }, { status: 500 });
    }

    // ----------------------------------------------------------------
    // 🛠️ FIX: Robust Signature Parsing (Regex + v2 Support)
    // ----------------------------------------------------------------
    const timestampMatch = signature.match(/t=([^,]+)/);
    const hashMatch = signature.match(/v2=([^,]+)/);

    const timestamp = timestampMatch ? timestampMatch[1].trim() : null;
    const receivedHash = hashMatch ? hashMatch[1].trim() : null;

    if (!timestamp || !receivedHash) {
      console.error("❌ Invalid Signature Format (Expected v2):", signature);
      return NextResponse.json({ message: "Invalid signature format" }, { status: 400 });
    }

    // 2. Hash Verification
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))) {
      console.error("❌ Hash Mismatch!");
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

   // ----------------------------------------------------------------
    // 🔄 2. EVENT PROCESSING
    // ----------------------------------------------------------------
 await dbConnect();
    
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data: rawData } = event;
    // Duffel sometimes wraps the actual data inside an 'object' property
    const data = rawData?.object ? rawData.object : rawData;

    console.log(`🔔 Webhook Event: ${type} | ID: ${data.id}`);

    switch (type) {

      // ====================================================
      // CASE 1: ORDER CREATED (Issued or Held)
      // ====================================================
      case "order.created": {
        const orderId = data.id;

        // 🔍 Check existing booking
        const existingBooking = await Booking.findOne({ duffelOrderId: orderId });
        
        if (!existingBooking) {
          console.warn(`⚠️ Booking not found in DB for Order ID: ${orderId}`);
          break; 
        }

        // Idempotency: Already issued? Stop here.
        if (existingBooking.status === "issued") {
          console.log(`ℹ️ Booking ${orderId} is already ISSUED. Skipping.`);
          return NextResponse.json({ received: true });
        }

        // 📄 Ticket Documents Handling (Based on your Schema)
        const hasTickets = data.documents && data.documents.length > 0;
        
        let formattedDocuments = [];
        if (hasTickets) {
            formattedDocuments = data.documents.map((doc: any) => ({
                unique_identifier: doc.unique_identifier,
                type: doc.type,
                url: doc.url
            }));
        }

        // Determine Status (Enum: 'issued' | 'held')
        const newStatus = hasTickets ? "issued" : "held";

        // Update Database
        const updatedBooking = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: newStatus,
              documents: formattedDocuments, // Saving tickets
              pnr: data.synced_at ? data.booking_reference : existingBooking.pnr,
              
              // 🟢 Set Payment Deadline if it exists (For Hold Orders)
              ...(data.payment_status?.payment_required_by && {
                  paymentDeadline: new Date(data.payment_status.payment_required_by)
              }),

              updatedAt: new Date(),
              adminNotes: `Auto: Order Created (${newStatus}) via Webhook`
            },
          },
          { new: true }
        );

        // 📧 Send Email ONLY if Issued
        if (updatedBooking && newStatus === "issued") {
          try {
            await sendTicketIssuedEmail(updatedBooking);
            console.log(`✅ Ticket Email Sent for PNR: ${updatedBooking.pnr}`);
          } catch (err) {
            console.error("❌ Email Sending Failed:", err);
          }
        }
        break;
      }

      // ====================================================
      // CASE 2: PAYMENT SUCCEEDED
      // ====================================================
      case "air.payment.succeeded": {
        const orderId = data.order_id;

        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              // 🟢 Schema Enum Matches: 'captured' or 'authorized'. 
              // 'captured' is best for successful payments.
              paymentStatus: "captured", 
              
              payment_id: data.id,
              updatedAt: new Date(),
              adminNotes: `Auto: Payment Succeeded (${data.amount} ${data.currency})`
            }
          }
        );
        break;
      }

      // ====================================================
      // CASE 3: PAYMENT FAILED / CANCELLED
      // ====================================================
      case "air.payment.failed":
      case "air.payment.cancelled": {
        const orderId = data.order_id;
        
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              // 🟢 Schema Enum Match
              paymentStatus: "failed",
              updatedAt: new Date(),
              adminNotes: `⚠️ Auto: Payment Failed via Webhook`
            }
          }
        );
        break;
      }

      // ====================================================
      // CASE 4: PAYMENT PENDING
      // ====================================================
      case "payment.created":
      case "air.payment.pending": {
        const orderId = data.order_id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              // 🟢 Schema Enum Match
              paymentStatus: "pending",
              payment_id: data.id,
              updatedAt: new Date()
            }
          }
        );
        break;
      }

      // ====================================================
      // CASE 5: CANCELLATIONS (Confirmed)
      // ====================================================
      case "order_cancellation.confirmed": {
        const orderId = data.order_id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              // 🟢 Schema Enum Match
              status: "cancelled",
              // Refund logic: usually implies refunded
              paymentStatus: "refunded", 
              adminNotes: `Auto: Cancellation Confirmed. Refund: ${data.refund_amount} ${data.refund_currency}`,
              updatedAt: new Date()
            }
          }
        );
        break;
      }

      // ====================================================
      // CASE 6: SCHEDULE CHANGES
      // ====================================================
      case "order.airline_initiated_change_detected": {
        const orderId = data.id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              // 🟢 Saving the Mixed type object
              airlineInitiatedChanges: data,
              adminNotes: "⚠️ ALERT: Schedule Change Detected!",
              updatedAt: new Date(),
            }
          }
        );
        break;
      }

      default: {
        console.log(`ℹ️ Unhandled Event: ${type}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Webhook Fatal Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
