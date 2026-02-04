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

    // 🛠️ FIX: Data Extraction Logic (Wrapper handling)
    const { type, data: item } = event;
    // Duffel এর ডাটা 'object' এর ভেতরে থাকে, সেটা চেক করে নেওয়া হচ্ছে
    const data = item?.object ? item.object : item;
    
    // 🛠️ FIX: ID Logic based on Event Type
    // Order ইভেন্টের জন্য ID হলো data.id
    // Cancellation/Payment ইভেন্টের জন্য ID হলো data.order_id
    let orderIdToUpdate = data.id;
    
    if (type.startsWith("order_cancellation") || type.startsWith("payment") || type.startsWith("refund")) {
        orderIdToUpdate = data.order_id;
    }

    console.log(`🔔 Webhook Verified: ${type} | Order: ${orderIdToUpdate}`);

    switch (type) {
      
      // ====================================================
      // ✅ SUCCESS FLOW
      // ====================================================
      case "order.tickets_issued": {
        // নোট: এখানে data.id ব্যবহার হবে কারণ এটি অর্ডার অবজেক্ট
        const tickets = data.documents?.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url,
        })) || [];

        const booking = await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, 
          {
            $set: {
              status: "issued",
              documents: tickets,
              updatedAt: new Date(),
            },
          },
          { new: true }
        );

        if (booking) {
          try {
            await sendTicketIssuedEmail(booking);
            console.log(`📧 Ticket email sent for PNR: ${booking.pnr}`);
          } catch (emailError) {
            console.error(`❌ Failed to send ticket email:`, emailError);
          }
        }
        break;
      }

      // ====================================================
      // ✅ PAYMENT FLOW (Added per request)
      // ====================================================
      case "payment.succeeded":
      case "air.payment.succeeded": { // Legacy/Alternative support

        const tickets = data.documents?.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url,
        })) || [];

        const booking = await Booking.findOneAndUpdate(
          { payment_id: data?.payment_id},
          {
            $set: {
              status: "issued",
              documents: tickets,
              updatedAt: new Date(),
                  adminNotes: `Auto: Payment succeeded via Duffel Payment ID: ${data.payment_id}`,
            },
          },
          { new: true }
        );

        if (booking) {
          try {
            await sendTicketIssuedEmail(booking);
            console.log(`📧 Ticket email sent for PNR: ${booking.pnr}`);
          } catch (emailError) {
            console.error(`❌ Failed to send ticket email:`, emailError);
          }
        }

        break;
      }

      case "payment.created": {
     
        console.log(`Payment created for order ${data.order_id}`);
         await Booking.findOneAndUpdate(
            { duffelOrderId: data.order_id },
            {
                $set: {
                    adminNotes: `Auto: Payment Created`,
                    updatedAt: new Date(),
                    payment_id:data?.id
                }
            }
        );
        break;
      }

      // ====================================================
      // ✅ ORDER MODIFICATIONS
      // ====================================================
      case "order.payment_required": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          {
            $set: {
              paymentDeadline: new Date(data.payment_status.payment_required_by),
              adminNotes: `Auto: Airline updated deadline to ${data.payment_status.payment_required_by}`,
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      case "order.airline_initiated_change_detected": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
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
      // ✅ CANCELLATION FLOW (Fixed Ignored Event)
      // ====================================================
      
      // 🛠️ FIX: Added order_cancellation.created
      case "order_cancellation.created": {
         // ক্যান্সেলেশন রিকোয়েস্ট তৈরি হয়েছে
         await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              // আমরা স্ট্যাটাস পুরোপুরি ক্যান্সেল করছি না যতক্ষণ না কনফার্ম হয়, 
              // তবে এডমিন নোট দিচ্ছি। অথবা চাইলে 'cancelled' করতে পারেন।
              adminNotes: `Auto: Cancellation Request Created (ID: ${data.id})`,
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      case "order.cancelled":
      case "order.cancellation.confirmed": 
      case "order_cancellation.confirmed": { // Covering all naming conventions
        await Booking.findOneAndUpdate(
          { duffelOrderId: orderIdToUpdate}, // Fallback logic
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      case "order.refunded": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          {
            $set: {
              status: "cancelled",
              adminNotes: "Auto: Order refunded via Duffel",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      default: {
        console.log(`ℹ️ Ignored Event: ${type}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Webhook Fatal Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}