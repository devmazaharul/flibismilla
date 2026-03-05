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
// 📧 HELPER: Issue + Email (Reusable)
// ----------------------------------------------------------------
async function handleTicketIssuance(booking: any, orderData: any) {
  // ✅ FIX: Double-check from fresh DB read (race condition prevent)
  const freshBooking = await Booking.findById(booking._id);
  if (!freshBooking || freshBooking.emailSent) {
    console.log(`ℹ️ Email already sent or booking gone. Skipping.`);
    return;
  }

  const docs = (orderData.documents || []).map((doc: any) => ({
    unique_identifier: doc.unique_identifier || "",
    type: doc.type || "electronic_ticket",
    url: doc.url || "",
  }));

  if (docs.length === 0) return;

  // Update DB first — emailSent: true set করো BEFORE sending
  // এতে duplicate email prevent হবে
  await Booking.findByIdAndUpdate(freshBooking._id, {
    $set: {
      status: "issued",
      pnr: orderData.booking_reference || freshBooking.pnr,
      documents: docs,
      emailSent: true,
      updatedAt: new Date(),
    },
  });

  // Then send email
  try {
    const emailData = buildBookingDataFromOrder(freshBooking, orderData, docs);
    await sendTicketIssuedEmail(emailData);
    console.log(`✅ Ticket email sent | PNR: ${orderData.booking_reference}`);
  } catch (emailErr) {
    console.error("❌ Email sending failed:", emailErr);
    // ⚠️ Email fail হলে emailSent false করে দাও — পরে retry করা যাবে
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
      console.error("❌ Invalid webhook signature");
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
      `🔔 Webhook: ${type} | ID: ${data?.id || data?.order_id || "N/A"}`
    );

    await dbConnect();

    switch (type) {
      // ═══════════════════════════════════════════════
      // ✅ ORDER CREATED
      // তোমার case: সবসময় HOLD হবে (documents থাকবে না)
      // ═══════════════════════════════════════════════
      case "order.created": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking found for order: ${orderId}`);
          break;
        }

        const hasTickets = data.documents?.length > 0;

        if (hasTickets) {
          // 🟢 Edge case: যদি কোনোভাবে instant issue হয়
          await handleTicketIssuance(booking, data);
        } else {
          // 🕐 তোমার MAIN FLOW: Hold Order
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
            `🕐 Order HELD | PNR: ${data.booking_reference} | Deadline: ${data.payment_status?.payment_required_by || "N/A"}`
          );
        }
        break;
      }

      // ═══════════════════════════════════════════════
      // 🔄 ORDER UPDATED
      // তোমার MAIN CASE: Admin payment করলে Duffel ticket
      // issue করে → এই event আসে documents সহ
      // ═══════════════════════════════════════════════
      case "order.updated": {
        const orderId = data.id;
        const booking = await Booking.findOne({ duffelOrderId: orderId });

        if (!booking) {
          console.warn(`⚠️ No booking found for updated order: ${orderId}`);
          break;
        }

        const hasTickets = data.documents?.length > 0;

        if (hasTickets && !booking.emailSent) {
          // 🎯 এটাই তোমার MAIN TRIGGER
          // Admin dashboard থেকে payment confirm → Duffel ticket issue করে
          // → এই webhook আসে → Email পাঠাও
          console.log(`🎯 Ticket detected in order.updated | Sending email...`);
          await handleTicketIssuance(booking, data);
        } else if (hasTickets && booking.emailSent) {
          // Email আগেই গেছে — শুধু documents update করো
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
          console.log(`ℹ️ Docs updated, email already sent | PNR: ${booking.pnr}`);
        } else {
          // Documents নেই — শুধু PNR sync
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              pnr: data.booking_reference || booking.pnr,
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      // ═══════════════════════════════════════════════
      // ❌ ORDER CANCELLED
      // ═══════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════
      // ⚠️ AIRLINE SCHEDULE CHANGE
      // ═══════════════════════════════════════════════
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
          console.log(`⚠️ Airline change | Order: ${data.id}`);
        }
        break;
      }

      // ═══════════════════════════════════════════════
      // 🏓 PING
      // ═══════════════════════════════════════════════
      case "ping": {
        console.log("🏓 Ping OK");
        break;
      }

      default: {
        console.log(`ℹ️ Ignored: ${type}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🔥 Webhook Fatal Error:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}