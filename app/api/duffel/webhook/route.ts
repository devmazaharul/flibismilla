// app/api/duffel/webhook/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { Duffel } from "@duffel/api";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import { sendTicketIssuedEmail } from "@/app/emails/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || "",
});

// ----------------------------------------------------------------
// 🔒 Verify Duffel Signature
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
// 🔍 Fetch Full Order from Duffel API
// ----------------------------------------------------------------
async function fetchOrder(orderId: string): Promise<any | null> {
  try {
    const res = await duffel.orders.get(orderId);
    return res.data;
  } catch (err: any) {
    console.error(`❌ Duffel fetch failed [${orderId}]:`, err.message);
    return null;
  }
}

// ----------------------------------------------------------------
// 🛠️ Build Email Data
// bookingDoc → DB (contact, passengers)
// order → Duffel API (slices, documents, PNR)
// ----------------------------------------------------------------
function buildEmailData(
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
// 📧 Ticket Issue + Email Handler
// ----------------------------------------------------------------
async function handleTicketIssuance(
  bookingId: string,
  duffelOrderId: string
): Promise<boolean> {
  // 1. Fresh DB read
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.log(`ℹ️ Booking gone: ${bookingId}`);
    return false;
  }
  if (booking.emailSent) {
    console.log(`ℹ️ Email already sent: ${bookingId}`);
    return true;
  }

  // 2. Fetch full order from Duffel
  const order = await fetchOrder(duffelOrderId);
  if (!order) {
    console.error(`❌ Cannot fetch order: ${duffelOrderId}`);
    return false;
  }

  // 3. Check documents
  const docs = (order.documents || [])
    .filter((doc: any) => doc.url)
    .map((doc: any) => ({
      unique_identifier: doc.unique_identifier || "",
      type: doc.type || "electronic_ticket",
      url: doc.url || "",
    }));

  if (docs.length === 0) {
    console.log(`ℹ️ No documents yet: ${duffelOrderId}`);
    // PNR sync only
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        pnr: order.booking_reference || booking.pnr,
        updatedAt: new Date(),
      },
    });
    return false;
  }

  // 4. DB update FIRST
  await Booking.findByIdAndUpdate(bookingId, {
    $set: {
      status: "issued",
      pnr: order.booking_reference || booking.pnr,
      documents: docs,
      emailSent: true,
      updatedAt: new Date(),
    },
  });

  // 5. Send Email
  try {
    const emailData = buildEmailData(booking, order, docs);
    await sendTicketIssuedEmail(emailData);
    console.log(
      `✅ Email sent | PNR: ${order.booking_reference} | To: ${booking.contact?.email}`
    );
    return true;
  } catch (emailErr) {
    console.error("❌ Email failed:", emailErr);
    await Booking.findByIdAndUpdate(bookingId, {
      $set: { emailSent: false },
    });
    return false;
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

    // Signature Verify
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

    // Parse Event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data: rawData } = event;

    // ─── data.object extract ───
    // Duffel sends: { data: { object: { ... } } }
    const data = rawData?.object ?? rawData ?? {};

    console.log(`🔔 [${type}] | Raw data keys: ${Object.keys(data).join(", ") || "empty"}`);

    await dbConnect();

    switch (type) {
      // ══════════════════════════════════════════════════
      // ✅ order.created
      //
      // ACTUAL PAYLOAD:
      // data.object = { id: "ord_xxx", offer_id: "off_xxx" }
      //
      // ❌ slices, documents, booking_reference নেই!
      // ✅ Duffel API call করে full data আনতে হবে
      // ══════════════════════════════════════════════════
      case "order.created": {
        const orderId = data.id;
        if (!orderId) {
          console.warn("⚠️ order.created: No order ID in payload");
          break;
        }

        // Find booking by duffelOrderId
        const booking = await Booking.findOne({ duffelOrderId: orderId });
        if (!booking) {
          console.warn(`⚠️ No booking for order: ${orderId}`);
          break;
        }

        // Fetch full order from Duffel API
        const order = await fetchOrder(orderId);
        if (!order) {
          console.error(`❌ Cannot fetch order: ${orderId}`);
          // Still update what we can
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { status: "held", updatedAt: new Date() },
          });
          break;
        }

        const hasTickets =
          order.documents && order.documents.length > 0;

        if (hasTickets) {
          // Instant issue (rare)
          console.log(`🎫 Instant issue | Order: ${orderId}`);
          await handleTicketIssuance(
            booking._id.toString(),
            orderId
          );
        } else {
          // 🕐 Hold Order — MAIN FLOW
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              status: "held",
              pnr: order.booking_reference || booking.pnr,
              ...(order.payment_status?.payment_required_by && {
                paymentDeadline: new Date(
                  order.payment_status.payment_required_by
                ),
              }),
              updatedAt: new Date(),
            },
          });

          console.log(
            `🕐 HELD | PNR: ${order.booking_reference} | Deadline: ${order.payment_status?.payment_required_by || "N/A"}`
          );
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ order.creation_failed
      //
      // data.object = { id: "ord_xxx" }
      // ══════════════════════════════════════════════════
      case "order.creation_failed": {
        const orderId = data.id || data.order_id;
        if (!orderId) break;

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: "failed",
              adminNotes: `❌ Order creation failed.\nReason: ${data?.failure_reason || data?.message || "Unknown"}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) console.log(`❌ Order creation failed | ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // 💰 air.payment.succeeded
      //
      // 🎯 MAIN TRIGGER — Admin issue করলে এটা আসে
      //
      // ACTUAL PAYLOAD:
      // data.object = { payment_id: "pay_xxx" }
      //
      // ❌ order_id নেই!
      // ❌ amount নেই!
      // ❌ currency নেই!
      //
      // ✅ payment_id দিয়ে DB-তে booking খুঁজবো
      // ✅ booking.duffelOrderId দিয়ে full order আনবো
      // ══════════════════════════════════════════════════
      case "air.payment.succeeded": {
        const paymentId = data.payment_id || data.id;

        if (!paymentId) {
          console.warn("⚠️ air.payment.succeeded: No payment_id in payload");
          break;
        }

        console.log(`💰 Payment succeeded | Payment: ${paymentId}`);

        // ─── Find booking by payment_id ───
        // Issue API-তে payment_id save করা হয়
        let booking = await Booking.findOne({ payment_id: paymentId });

        // Race condition: Issue API হয়তো এখনো DB update করেনি
        if (!booking) {
          console.log(`⏳ Booking not found by payment_id. Waiting 3s...`);
          await new Promise((r) => setTimeout(r, 3000));
          booking = await Booking.findOne({ payment_id: paymentId });
        }

        // Still not found? Try idempotency_key
        if (!booking && event.idempotency_key) {
          booking = await Booking.findOne({
            payment_id: event.idempotency_key,
          });
        }

        if (!booking) {
          console.warn(
            `⚠️ No booking found for payment: ${paymentId}. Maybe payment was created outside this system.`
          );
          break;
        }

        const duffelOrderId = booking.duffelOrderId;

        if (!duffelOrderId) {
          console.error(`❌ Booking has no duffelOrderId: ${booking._id}`);
          break;
        }

        // Update payment status
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            paymentStatus: "captured",
            payment_id: paymentId,
            updatedAt: new Date(),
          },
        });

        console.log(`💰 Payment captured | Order: ${duffelOrderId}`);

        // ─── Wait for airline to generate ticket ───
        console.log(`⏳ Waiting 3s for ticket generation...`);
        await new Promise((r) => setTimeout(r, 3000));

        // Attempt 1
        const sent1 = await handleTicketIssuance(
          booking._id.toString(),
          duffelOrderId
        );

        if (!sent1) {
          // Docs not ready — wait more
          console.log(`⏳ Docs not ready. Waiting 5s more...`);
          await new Promise((r) => setTimeout(r, 5000));

          // Attempt 2
          const sent2 = await handleTicketIssuance(
            booking._id.toString(),
            duffelOrderId
          );

          if (!sent2) {
            // Still no docs — 
            console.log(
              `⚠️ Docs still not ready after 8s. Waiting for air.order.changed.`
            );
            await Booking.findByIdAndUpdate(booking._id, {
              $set: {
                adminNotes: `💰 Payment OK. ⏳ Waiting for ticket from airline.\nPayment: ${paymentId}`,
              },
            });
          }
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ air.payment.failed
      //
      // data.object = { payment_id: "pay_xxx" }
      // ══════════════════════════════════════════════════
      case "air.payment.failed": {
        const paymentId = data.payment_id || data.id;
        if (!paymentId) break;

        // Find by payment_id
        let booking = await Booking.findOne({ payment_id: paymentId });

        // Retry
        if (!booking) {
          await new Promise((r) => setTimeout(r, 2000));
          booking = await Booking.findOne({ payment_id: paymentId });
        }

        if (booking) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              paymentStatus: "failed",
              adminNotes: `❌ Payment failed.\nPayment: ${paymentId}\nReason: ${data?.failure_reason || "Unknown"}`,
              updatedAt: new Date(),
            },
          });
          console.log(`❌ Payment failed | Payment: ${paymentId}`);
        } else {
          console.warn(`⚠️ No booking for failed payment: ${paymentId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // ⏳ air.payment.pending
      // ══════════════════════════════════════════════════
      case "air.payment.pending": {
        const paymentId = data.payment_id || data.id;
        if (!paymentId) break;

        let booking = await Booking.findOne({ payment_id: paymentId });
        if (!booking) {
          await new Promise((r) => setTimeout(r, 2000));
          booking = await Booking.findOne({ payment_id: paymentId });
        }

        if (booking) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              paymentStatus: "pending",
              payment_id: paymentId,
              updatedAt: new Date(),
            },
          });
          console.log(`⏳ Payment pending | Payment: ${paymentId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // 🚫 air.payment.cancelled
      // ══════════════════════════════════════════════════
      case "air.payment.cancelled": {
        const paymentId = data.payment_id || data.id;
        if (!paymentId) break;

        let booking = await Booking.findOne({ payment_id: paymentId });
        if (!booking) {
          await new Promise((r) => setTimeout(r, 2000));
          booking = await Booking.findOne({ payment_id: paymentId });
        }

        if (booking) {
          await Booking.findByIdAndUpdate(booking._id, {
            $set: {
              paymentStatus: "failed",
              adminNotes: `🚫 Payment cancelled.\nPayment: ${paymentId}`,
              updatedAt: new Date(),
            },
          });
          console.log(`🚫 Payment cancelled | Payment: ${paymentId}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // 🔄 air.order.changed
      //
      // FALLBACK — payment.succeeded-এ docs না আসলে এখানে handle
      //
      // data.object structure unknown — try multiple fields
      // ══════════════════════════════════════════════════
      case "air.order.changed": {
        const orderId = data.order_id || data.id;
        if (!orderId) {
          console.warn("⚠️ air.order.changed: No order ID");
          break;
        }

        const booking = await Booking.findOne({ duffelOrderId: orderId });
        if (!booking) {
          console.warn(`⚠️ No booking for changed order: ${orderId}`);
          break;
        }

        if (!booking.emailSent) {
          console.log(`🎯 air.order.changed → Attempting issuance...`);
          await handleTicketIssuance(
            booking._id.toString(),
            orderId
          );
        } else {
          // Refresh documents
          const order = await fetchOrder(orderId);
          if (order?.documents?.length > 0) {
            const docs = order.documents.map((doc: any) => ({
              unique_identifier: doc.unique_identifier || "",
              type: doc.type || "",
              url: doc.url || "",
            }));

            await Booking.findByIdAndUpdate(booking._id, {
              $set: {
                documents: docs,
                pnr: order.booking_reference || booking.pnr,
                updatedAt: new Date(),
              },
            });
          }
          console.log(`ℹ️ Order changed, email already sent | PNR: ${booking.pnr}`);
        }
        break;
      }

      // ══════════════════════════════════════════════════
      // 📋 order_cancellation.created
      //
      // ACTUAL PAYLOAD:
      // data.object = { id: "ore_xxx", order_id: "ord_xxx" }
      // ══════════════════════════════════════════════════
      case "order_cancellation.created": {
        const orderId = data.order_id;
        if (!orderId) break;

        await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              adminNotes: `📋 Cancellation requested. Waiting for airline.`,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`📋 Cancel requested | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // ❌ order_cancellation.confirmed
      //
      // ACTUAL PAYLOAD:
      // data.object = { id: "ore_xxx", order_id: "ord_xxx" }
      // ══════════════════════════════════════════════════
      case "order_cancellation.confirmed": {
        const orderId = data.order_id;
        if (!orderId) break;

        // Fetch full order to get refund details
        const order = await fetchOrder(orderId);

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "refunded",
              adminNotes: `❌ Cancellation confirmed.${order ? `\nRefund Amount: ${order.total_amount || "N/A"} ${order.total_currency || ""}` : ""}`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) console.log(`❌ Cancel confirmed | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // ⚠️ order.airline_initiated_change_detected
      // ══════════════════════════════════════════════════
      case "order.airline_initiated_change_detected": {
        const orderId = data.id || data.order_id;
        if (!orderId) break;

        // Fetch full order for change details
        const order = await fetchOrder(orderId);

        const result = await Booking.findOneAndUpdate(
          { duffelOrderId: orderId },
          {
            $set: {
              airlineInitiatedChanges: order || data,
              adminNotes: `⚠️ ALERT: Airline schedule change!\nCheck dashboard.`,
              updatedAt: new Date(),
            },
          }
        );

        if (result) console.log(`⚠️ Airline change | Order: ${orderId}`);
        break;
      }

      // ══════════════════════════════════════════════════
      // 🏓 ping.triggered
      //
      // ACTUAL PAYLOAD:
      // data = {} (empty)
      // ══════════════════════════════════════════════════
      case "ping.triggered": {
        console.log("🏓 Ping OK");
        break;
      }

      // ══════════════════════════════════════════════════
      // 🔕 Ignored
      // ══════════════════════════════════════════════════
      case "air.airline_credit.created":
      case "air.airline_credit.spent":
      case "air.airline_credit.invalidated":
      case "stays.booking_creation_failed":
      case "stays.booking.created":
      case "stays.booking.cancelled":
      case "assistant.conversation.updated": {
        console.log(`🔕 Skipped: ${type}`);
        break;
      }

      default: {
        console.log(`❓ Unknown: ${type}`);
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