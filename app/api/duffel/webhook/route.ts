// app/api/duffel/webhook/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import { sendTicketIssuedEmail } from "@/app/emails/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ----------------------------------------------------------------
// 🛠️ HELPER: Build Email Data
// ----------------------------------------------------------------
function buildBookingDataFromOrder(
  bookingDoc: any,
  order: any,
  documents: { url: string; unique_identifier: string; type: string }[]
) {
  const slices = order.slices || [];
  const firstSlice = slices[0];
  const firstSegment = firstSlice?.segments?.[0];

  const originName =
    firstSlice?.origin?.city_name ||
    firstSlice?.origin?.iata_code ||
    "Origin";
  const destinationName =
    firstSlice?.destination?.city_name ||
    firstSlice?.destination?.iata_code ||
    "Destination";

  return {
    pnr: order.booking_reference,
    contact: {
      email: bookingDoc.contact?.email || "",
      phone: bookingDoc.contact?.phone || "",
    },
    passengers: bookingDoc.passengers || [],
    flightDetails: {
      airline:
        firstSegment?.operating_carrier?.name ||
        order.owner?.name ||
        "Airline",
      route: `${originName} - ${destinationName}`,
      departureDate:
        firstSegment?.departing_at ||
        order.created_at ||
        new Date().toISOString(),
    },
    documents,
  };
}

// ----------------------------------------------------------------
// 🔒 HELPER: Verify Duffel Signature
// ----------------------------------------------------------------
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const timestampMatch = signature.match(/t=([^,]+)/);
  const hashMatch = signature.match(/v2=([^,]+)/);

  const timestamp = timestampMatch?.[1]?.trim();
  const receivedHash = hashMatch?.[1]?.trim();

  if (!timestamp || !receivedHash) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedHash);
  const expectedBuffer = Buffer.from(expectedHash);

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

// ----------------------------------------------------------------
// 🔄 MAIN WEBHOOK HANDLER
// ----------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-duffel-signature") ||
      req.headers.get("X-Duffel-Signature");

    // 1️⃣ Signature Verify
    if (!signature) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET missing in env");
      return NextResponse.json({ message: "Server config error" }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature, secret)) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    // 2️⃣ Parse Event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data: rawData } = event;
    const data = rawData?.object ?? rawData;

    console.log(`🔔 Webhook: ${type} | ID: ${data?.id || data?.order_id || "N/A"}`);

    await dbConnect();

    // ====================================================
    // 📌 EVENT HANDLING - শুধু যা দরকার
    // ====================================================

    switch (type) {
      // ──────────────────────────────────────────────────
      // ✅ ORDER CREATED → Ticket থাকলে Email পাঠাও
      // ──────────────────────────────────────────────────
      case "order.created": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking found for order: ${orderId}`);
          break;
        }

        const hasTickets = data.documents?.length > 0;

        if (hasTickets) {
          // ✈️ Instant issue হয়েছে — Email পাঠাও
          const docs = data.documents.map((doc: any) => ({
            unique_identifier: doc.unique_identifier,
            type: doc.type,
            url: doc.url,
          }));

          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "issued",
              pnr: data.booking_reference,
              documents: docs,
              emailSent: true,
              updatedAt: new Date(),
            },
          });

          // Send Email
          try {
            const emailData = buildBookingDataFromOrder(booking, data, docs);
            await sendTicketIssuedEmail(emailData);
            console.log(`✅ Ticket email sent | PNR: ${data.booking_reference}`);
          } catch (emailErr) {
            console.error("❌ Email sending failed:", emailErr);
          }
        } else {
          // 🕐 Hold order — শুধু status update
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "held",
              pnr: data.booking_reference || booking.pnr,
              ...(data.payment_status?.payment_required_by && {
                paymentDeadline: new Date(data.payment_status.payment_required_by),
              }),
              updatedAt: new Date(),
            },
          });
          console.log(`🕐 Order held | ID: ${orderId}`);
        }
        break;
      }

      // ──────────────────────────────────────────────────
      // 🔄 ORDER UPDATED → নতুন ticket আসলে Email পাঠাও
      // ──────────────────────────────────────────────────
      case "order.updated": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) break;

        const hasTickets = data.documents?.length > 0;

        // যদি আগে email না গিয়ে থাকে এবং এখন ticket আছে
        if (hasTickets && !booking.emailSent) {
          const docs = data.documents.map((doc: any) => ({
            unique_identifier: doc.unique_identifier,
            type: doc.type,
            url: doc.url,
          }));

          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "issued",
              pnr: data.booking_reference || booking.pnr,
              documents: docs,
              emailSent: true,
              updatedAt: new Date(),
            },
          });

          try {
            const emailData = buildBookingDataFromOrder(booking, data, docs);
            await sendTicketIssuedEmail(emailData);
            console.log(`✅ Ticket email sent (via update) | PNR: ${data.booking_reference}`);
          } catch (emailErr) {
            console.error("❌ Email sending failed:", emailErr);
          }
        } else {
          // শুধু DB sync রাখো
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              pnr: data.booking_reference || booking.pnr,
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      // ──────────────────────────────────────────────────
      // ❌ ORDER CANCELLED
      // ──────────────────────────────────────────────────
      case "order_cancellation.confirmed": {
        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "refunded",
              adminNotes: `Cancelled. Refund: ${data.refund_amount || 0} ${data.refund_currency || ""}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`❌ Order cancelled | ID: ${data.order_id}`);
        }
        break;
      }

      // ──────────────────────────────────────────────────
      // ⚠️ AIRLINE SCHEDULE CHANGE
      // ──────────────────────────────────────────────────
      case "order.airline_initiated_change_detected": {
        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          {
            $set: {
              airlineInitiatedChanges: data,
              adminNotes: "⚠️ Airline schedule change detected!",
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`⚠️ Airline change detected | Order: ${data.id}`);
        }
        break;
      }

      // ──────────────────────────────────────────────────
      // 🏓 PING (Duffel connectivity test)
      // ──────────────────────────────────────────────────
      case "ping": {
        console.log("🏓 Ping received from Duffel");
        break;
      }

      // ──────────────────────────────────────────────────
      // বাকি সব IGNORE
      // ──────────────────────────────────────────────────
      default: {
        console.log(`ℹ️ Ignored event: ${type}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🔥 Webhook Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}