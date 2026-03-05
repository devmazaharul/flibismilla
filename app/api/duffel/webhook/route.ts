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
function verifySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
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
// 📧 HELPER: Ticket Issue + Email (Reusable)
// ----------------------------------------------------------------
async function handleTicketIssuance(booking: any, orderData: any) {
  // Fresh DB read — race condition prevent
  const freshBooking = await Booking.findById(booking._id);
  if (!freshBooking || freshBooking.emailSent) {
    console.log(`ℹ️ Already handled or booking gone. Skip.`);
    return;
  }

  const docs = (orderData.documents || [])
    .filter((doc: any) => doc.url) // শুধু URL আছে এমন documents
    .map((doc: any) => ({
      unique_identifier: doc.unique_identifier || "",
      type: doc.type || "electronic_ticket",
      url: doc.url || "",
    }));

  if (docs.length === 0) {
    console.log(`ℹ️ No documents with URLs yet. Skip email.`);
    return;
  }

  // DB update FIRST — emailSent: true BEFORE sending
  await Booking.findByIdAndUpdate(freshBooking._id, {
    $set: {
      status: "issued",
      pnr: orderData.booking_reference || freshBooking.pnr,
      documents: docs,
      emailSent: true,
      updatedAt: new Date(),
    },
  });

  // Send Email
  try {
    const emailData = buildBookingDataFromOrder(freshBooking, orderData, docs);
    await sendTicketIssuedEmail(emailData);
    console.log(`✅ Email sent | PNR: ${orderData.booking_reference}`);
  } catch (emailErr) {
    console.error("❌ Email failed:", emailErr);
    // Fail হলে emailSent false → পরে retry possible
    await Booking.findByIdAndUpdate(freshBooking._id, {
      $set: { emailSent: false },
    });
  }
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
      return NextResponse.json(
        { message: "Missing signature" },
        { status: 401 }
      );
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET missing");
      return NextResponse.json(
        { message: "Server config error" },
        { status: 500 }
      );
    }

    if (!verifySignature(rawBody, signature, secret)) {
      console.error("❌ Invalid signature");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
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

    console.log(
      `🔔 Webhook: ${type} | ID: ${data?.id || data?.order_id || "N/A"} | Key: ${event.idempotency_key || "N/A"}`
    );

    await dbConnect();

    // ====================================================
    // 📌 EVENT HANDLING — Duffel Official Events Only
    // ====================================================

    switch (type) {
      // ══════════════════════════════════════════════════
      // ✅ order.created
      // Customer বুক করলে — Hold বা Instant Issue
      // ══════════════════════════════════════════════════
      case "order.created": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking for order: ${orderId}`);
          break;
        }

        const hasTickets = data.documents?.length > 0;

        if (hasTickets) {
          // Instant issue (rare for hold flow)
          console.log(`🎫 Instant issue detected | Order: ${orderId}`);
          await handleTicketIssuance(booking, data);
        } else {
          // 🕐 Hold Order — তোমার MAIN FLOW
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "held",
              pnr: data.booking_reference || booking.pnr,
              ...(data.payment_status?.payment_required_by && {
                paymentDeadline: new Date(
                  data.payment_status.payment_required_by
                ),
              }),
              updatedAt: new Date(),
            },
          });

          console.log(
            `🕐 HELD | PNR: ${data.booking_reference} | Deadline: ${data.payment_status?.payment_required_by || "N/A"}`
          );
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ order.creation_failed
      // Order create fail হলে
      // ══════════════════════════════════════════════════
      case "order.creation_failed": {
        const orderId = data.id || data.order_id;

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: "failed",
              adminNotes: `❌ Order creation failed in Duffel.\nReason: ${data.failure_reason || data.message || "Unknown"}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`❌ Order creation failed | ID: ${orderId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      //
      // 🎯 এটাই তোমার MAIN TRIGGER!
      // Admin payment করলে → Duffel ticket issue করে →
      // এই event আসে documents সহ → Email পাঠাও
      // ══════════════════════════════════════════════════
      case "air.order.changed": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking for changed order: ${orderId}`);
          break;
        }

        const hasTickets = data.documents?.length > 0;

        if (hasTickets && !booking.emailSent) {
          // 🎯 TICKET ISSUED! Email পাঠাও
          console.log(`🎯 Ticket detected in air.order.changed → Sending email...`);
          await handleTicketIssuance(booking, data);
        } else if (hasTickets && booking.emailSent) {
          // Email already sent — শুধু documents refresh
          const docs = data.documents.map((doc: any) => ({
            unique_identifier: doc.unique_identifier || "",
            type: doc.type || "",
            url: doc.url || "",
          }));

          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "issued",
              pnr: data.booking_reference || booking.pnr,
              documents: docs,
              updatedAt: new Date(),
            },
          });

          console.log(`ℹ️ Docs refreshed, email already sent | PNR: ${booking.pnr}`);
        } else {
          // No documents yet — শুধু PNR sync
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              pnr: data.booking_reference || booking.pnr,
              updatedAt: new Date(),
            },
          });

          console.log(`ℹ️ Order changed, no docs yet | Order: ${orderId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // 💰 air.payment.succeeded
      // Duffel balance থেকে payment successful
      // ══════════════════════════════════════════════════
      case "air.payment.succeeded": {
        const orderId = data.order_id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking for payment: ${orderId}`);
          break;
        }

        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            paymentStatus: "captured",
            payment_id: data.id || booking.payment_id,
            adminNotes:
              booking.adminNotes ||
              `💰 Payment succeeded: ${data.amount || ""} ${data.currency || ""}`,
            updatedAt: new Date(),
          },
        });

        console.log(
          `💰 Payment OK | Order: ${orderId} | Amount: ${data.amount || "?"} ${data.currency || ""}`
        );
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ air.payment.failed
      // Payment fail হলে
      // ══════════════════════════════════════════════════
      case "air.payment.failed": {
        const orderId = data.order_id;

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "failed",
              adminNotes: `❌ Payment failed via webhook.\nReason: ${data.failure_reason || data.message || "Unknown"}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`❌ Payment failed | Order: ${orderId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ⏳ air.payment.pending
      // Payment processing
      // ══════════════════════════════════════════════════
      case "air.payment.pending": {
        const orderId = data.order_id;

        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "pending",
              payment_id: data.id,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`⏳ Payment pending | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // 🚫 air.payment.cancelled
      // Payment cancel হলে
      // ══════════════════════════════════════════════════
      case "air.payment.cancelled": {
        const orderId = data.order_id;

        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              paymentStatus: "failed",
              adminNotes: `🚫 Payment cancelled via webhook.`,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`🚫 Payment cancelled | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // 📋 order_cancellation.created
      // Cancel request submitted
      // ══════════════════════════════════════════════════
      case "order_cancellation.created": {
        const orderId = data.order_id;

        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              adminNotes: `📋 Cancellation requested. Waiting for airline confirmation.`,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`📋 Cancel requested | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ order_cancellation.confirmed
      // Cancel confirmed by airline
      // ══════════════════════════════════════════════════
      case "order_cancellation.confirmed": {
        const orderId = data.order_id;

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "refunded",
              adminNotes: `❌ Cancellation confirmed.\nRefund: ${data.refund_amount || 0} ${data.refund_currency || ""}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`❌ Cancel confirmed | Order: ${orderId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ⚠️ order.airline_initiated_change_detected
      // Airline schedule/route change
      // ══════════════════════════════════════════════════
      case "order.airline_initiated_change_detected": {
        const orderId = data.id;

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              airlineInitiatedChanges: data,
              adminNotes: `⚠️ ALERT: Airline schedule change detected!\nCheck dashboard immediately.`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) {
          console.log(`⚠️ Airline change | Order: ${orderId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // 🏓 ping.triggered ← আগে ভুলে "ping" ছিল
      // Duffel connectivity test
      // ══════════════════════════════════════════════════
      case "ping.triggered": {
        console.log("🏓 Ping OK from Duffel");
        break;
      }

      // ══════════════════════════════════════════════════
      // 🔕 Ignored Events (Stays, Assistant, Credits)
      // ══════════════════════════════════════════════════
      case "air.airline_credit.created":
      case "air.airline_credit.spent":
      case "air.airline_credit.invalidated":
      case "stays.booking_creation_failed":
      case "stays.booking.created":
      case "stays.booking.cancelled":
      case "assistant.conversation.updated": {
        console.log(`🔕 Skipped (not relevant): ${type}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // ❓ Unknown Events
      // ══════════════════════════════════════════════════
      default: {
        console.log(`❓ Unknown event: ${type}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🔥 Webhook Fatal:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}