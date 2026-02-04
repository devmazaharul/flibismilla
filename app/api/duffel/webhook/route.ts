import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";

export const runtime = "nodejs";          // ensure Node.js runtime (for crypto)
export const dynamic = "force-dynamic";   // no caching for webhooks

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get("x-duffel-signature") ||
      req.headers.get("X-Duffel-Signature");

    if (!signatureHeader) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("DUFFEL_WEBHOOK_SECRET is missing");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 },
      );
    }

    // ----------------------------------------------------------------
    // 1) Signature verification (Duffel style: t=timestamp,v1=hash)
    // ----------------------------------------------------------------
    const parts = signatureHeader.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!tPart || !v1Part) {
      return NextResponse.json({ message: "Invalid signature format" }, { status: 400 });
    }

    const timestamp = tPart.split("=", 2)[1];
    const receivedHash = v1Part.split("=", 2)[1];

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    // Optional: timestamp freshness check (e.g. 5 minutes)
    const maxAgeSeconds = 5 * 60;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const tsSeconds = Number(timestamp);

    if (!Number.isFinite(tsSeconds) || tsSeconds < nowSeconds - maxAgeSeconds) {
      console.warn("Duffel webhook timestamp too old – possible replay attack");
      return NextResponse.json({ message: "Stale webhook" }, { status: 400 });
    }

    // ----------------------------------------------------------------
    // 2) Parse event & connect DB
    // ----------------------------------------------------------------
    await dbConnect();

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse Duffel webhook JSON:", e);
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data } = event as { type: string; data: any };

    if (!type || !data) {
      return NextResponse.json(
        { message: "Invalid event payload (missing type or data)" },
        { status: 400 },
      );
    }

    const targetOrderId = data.order_id || data.id;
    console.log(`🔔 Duffel webhook: ${type} | Target Order: ${targetOrderId}`);

    // ----------------------------------------------------------------
    // 3) Handle specific event types
    // ----------------------------------------------------------------
    switch (type) {
      // data is an Order object
      case "order.tickets_issued": {
        const tickets =
          data.documents?.map((doc: any) => ({
            unique_identifier: doc.unique_identifier,
            type: doc.type,
            url: doc.url,
          })) || [];

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, // data.id is the Order ID
          {
            $set: {
              status: "issued",
              documents: tickets,
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      // data is an Order object created with pay_later
      case "order.created": {
        const updateData: any = { status: "held" };

        // In Order resource, payment deadline is under payment_status
        const paymentRequiredBy = data.payment_status?.payment_required_by;
        if (paymentRequiredBy) {
          updateData.paymentDeadline = new Date(paymentRequiredBy);
        }

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, // Order ID
          { $set: updateData },
        );
        break;
      }

      // Payment succeeded event: data.order_id is present
      case "air.payment.succeeded": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              status: "paid",
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      // Payment failed event: data.order_id is present
      case "air.payment.failed": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              status: "failed",
              adminNotes: `Auto: Payment failed. Reason: ${
                data.error_message || "Unknown"
              }`,
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      // Order cancellation created: data.order_id
      case "order_cancellation.created": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      // Order cancellation confirmed: data.order_id
      case "order.cancellation.confirmed": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      // Airline initiated schedule change: data.order_id
      case "order.airline_initiated_change_detected": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          {
            $set: {
              airlineInitiatedChanges: data,
              adminNotes:
                "Auto: Flight schedule changed by airline. Check Dashboard.",
              updatedAt: new Date(),
            },
          },
        );
        break;
      }

      case "order.creation_failed": {
        console.warn("Duffel webhook: order.creation_failed", data);
        break;
      }

      default: {
        console.log(`ℹ️ Unhandled Duffel event type: ${type}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Duffel Webhook Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}