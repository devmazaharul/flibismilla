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

    if (!signature) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET is missing");
      return NextResponse.json({ message: "Server Config Error" }, { status: 500 });
    }

    // ----------------------------------------------------------------
    // 🛠️ FIX: v1 এর বদলে v2 খোঁজা হচ্ছে
    // ----------------------------------------------------------------
    // আপনার এরর লগে দেখাচ্ছে: t=...,v2=...
    const timestampMatch = signature.match(/t=([^,]+)/);
    const hashMatch = signature.match(/v2=([^,]+)/); // 👈 এখানে v1 কে v2 করা হয়েছে

    const timestamp = timestampMatch ? timestampMatch[1].trim() : null;
    const receivedHash = hashMatch ? hashMatch[1].trim() : null;

    if (!timestamp || !receivedHash) {
      console.error("❌ Invalid Signature Format (Expected v2):", signature);
      return NextResponse.json({ message: "Invalid signature format" }, { status: 400 });
    }

    // Hash Verification
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))) {
      console.error("❌ Hash Mismatch!");
      console.log("Header Hash (v2):", receivedHash);
      console.log("Calculated Hash:", expectedHash);
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    // ----------------------------------------------------------------
    // Event Processing
    // ----------------------------------------------------------------
    await dbConnect();

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data } = event;
    const targetOrderId = data?.order_id || data?.id;

    console.log(`🔔 Webhook Verified: ${type} | Order: ${targetOrderId}`);

    switch (type) {
      // ✅ CASE 1: Ticket Issued
      case "order.tickets_issued": {
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

      // ✅ CASE 2: Payment Deadline Changed
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

      // ✅ CASE 3: Schedule Change
      case "order.airline_initiated_change_detected": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id || data.order_id },
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

      // ✅ CASE 4: Cancellations
      case "order.cancelled":
      case "order.cancellation.confirmed": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id || data.order_id },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      // ✅ CASE 5: Refunded
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