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
    // 3. Event Processing
    // ----------------------------------------------------------------
await dbConnect();
    
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data: rawData } = event;
    // Duffel sometimes wraps data in 'object'
    const data = rawData?.object ? rawData.object : rawData;

    console.log(`🔔 Webhook Logic: ${type} | ID: ${data.id}`);

    // ----------------------------------------------------------------
    // 🔄 Step 3: Handle All Selected Events
    // ----------------------------------------------------------------
    switch (type) {

      // ====================================================
      // 1. ORDER CREATED (Covers both Issued & Held)
      // ====================================================
      case "order.created": {
        const orderId = data.id;
        
        // 🔍 Check if tickets exist in the payload
        const hasTickets = data.documents && data.documents.length > 0;

        // Map tickets if available
        const tickets = hasTickets ? data.documents.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url,
        })) : [];

        // Decide Status: 'issued' if tickets exist, otherwise 'held'
        const newStatus = hasTickets ? "issued" : "held";

        const booking = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: newStatus,
              documents: tickets,
              pnr: data.synced_at ? data.booking_reference : null,
              updatedAt: new Date(),
              adminNotes: `Auto: Order Created (${newStatus})`,
              // If it's held, update the deadline
              ...(newStatus === "held" && data.payment_status?.payment_required_by && {
                 paymentDeadline: new Date(data.payment_status.payment_required_by)
              })
            },
          },
          { new: true }
        );

        // Send Email ONLY if Issued
        if (booking && newStatus === "issued") {
          try {
            await sendTicketIssuedEmail(booking);
            console.log(`📧 Ticket email sent for PNR: ${booking.bookingReference}`);
          } catch (err) {
            console.error("❌ Email Error:", err);
          }
        }
        break;
      }

      // ====================================================
      // 2. ORDER FAILED
      // ====================================================
      case "order.creation_failed": {
         // Usually happens if payment fails during creation or inventory lost
         // Try to find by Offer ID (since Order ID might not exist yet) or Metadata
         // For now, we log it. It's hard to update DB without an Order ID.
         console.warn(`⚠️ Order Creation Failed!`);
         break;
      }

      // ====================================================
      // 3. PAYMENT EVENTS (Success, Pending, Failed)
      // ====================================================
      case "air.payment.succeeded":
      case "payment.succeeded": {
        const orderId = data.order_id; // Payment links to Order ID
        
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "succeeded", // 'authorized' or 'captured' logic can be here
              payment_id: data.id,
              updatedAt: new Date(),
              adminNotes: `Auto: Payment Succeeded (${data.amount} ${data.currency})`
            }
          }
        );
        break;
      }

      case "air.payment.failed":
      case "payment.failed": {
        const orderId = data.order_id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "failed",
              updatedAt: new Date(),
              adminNotes: `⚠️ Auto: Payment Failed!`
            }
          }
        );
        break;
      }
      
      case "payment.created":
      case "air.payment.pending": {
         const orderId = data.order_id;
         await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "pending",
              payment_id: data.id,
              updatedAt: new Date(),
            }
          }
        );
        break;
      }

      // ====================================================
      // 4. SCHEDULE CHANGES (Crucial)
      // ====================================================
      case "order.airline_initiated_change_detected": {
        const orderId = data.id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              airlineInitiatedChanges: data,
              adminNotes: "⚠️ ALERT: Schedule Change Detected!",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      // ====================================================
      // 5. CANCELLATIONS
      // ====================================================
      case "order_cancellation.confirmed":
      case "order.cancelled": {
        const orderId = data.order_id || data.id;
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: "cancelled",
              adminNotes: "Auto: Order Cancelled via Duffel",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      case "order_cancellation.created": {
         const orderId = data.order_id;
         await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              adminNotes: `Auto: Cancellation Request Initiated (ID: ${data.id})`,
              updatedAt: new Date(),
            },
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