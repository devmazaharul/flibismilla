import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import { sendTicketIssuedEmail } from "@/app/emails/email";

export const runtime = "nodejs";          // Crypto লাইব্রেরির জন্য জরুরি
export const dynamic = "force-dynamic";   // ক্যাশিং বন্ধ রাখার জন্য

export async function POST(req: Request) {
  try {
    // ১. Raw Body নেওয়া (Signature Verification এর জন্য জরুরি)
    const rawBody = await req.text();
    
    // ২. হেডার চেক করা
    const signatureHeader =
      req.headers.get("x-duffel-signature") ||
      req.headers.get("X-Duffel-Signature");

    console.log("📨 Duffel Header:", signatureHeader);

    if (!signatureHeader) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET is missing in .env");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    // ----------------------------------------------------------------
    // 🛠️ FIX: Robust Signature Parsing (Regex)
    // ----------------------------------------------------------------
    // Duffel হেডার ফরম্যাট: "t=123, v1=hash" অথবা "t=123,v1=hash"
    // Regex স্পেস বা কমার পজিশন ইগনোর করে সঠিক ভ্যালু বের করবে।
    
    const timestampMatch = signatureHeader.match(/t=([^,]+)/);
    const hashMatch = signatureHeader.match(/v1=([^,]+)/);

    const timestamp = timestampMatch ? timestampMatch[1].trim() : null;
    const receivedHash = hashMatch ? hashMatch[1].trim() : null;

    if (!timestamp || !receivedHash) {
      console.error("❌ Parsing Failed. Header:", signatureHeader);
      return NextResponse.json({ message: "Invalid signature format" }, { status: 400 });
    }

    // ----------------------------------------------------------------
    // 3. Hash Verification (Security Check)
    // ----------------------------------------------------------------
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))) {
      console.error("❌ Hash Mismatch!");
      console.log("Expected:", expectedHash);
      console.log("Received:", receivedHash);
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    // ----------------------------------------------------------------
    // 4. Process Event & Update Database
    // ----------------------------------------------------------------
    await dbConnect();

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data } = event;
    const orderId = data?.order_id || data?.id;

    console.log(`🔔 Webhook Verified: ${type} | ID: ${orderId}`);

    switch (type) {
      
      // ✅ CASE 1: Ticket Issued (Success & Email)
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
          { new: true } // আপডেটেড ডাটা পাওয়ার জন্য
        );
        
        // 📧 ইমেইল পাঠানো (Email Trigger)
        if (booking) {
            try {
                // আপনার ইউটিলিটি ফাংশনটি কল করা হচ্ছে
                await sendTicketIssuedEmail(booking);
                console.log(`✅ Ticket email sent for PNR: ${booking.pnr}`);
            } catch (emailError) {
                console.error(`❌ Failed to send ticket email:`, emailError);
                // ইমেইল ফেইল করলেও ওয়েবুক সাকসেস রিটার্ন করবে, যাতে Duffel রিট্রাই না করে
            }
        }
        break;
      }

      // ✅ CASE 2: Order Created (Hold Setup)
      case "order.created": {
        const updateData: any = {};
        
        if (data.payment_status?.payment_required_by) {
          updateData.paymentDeadline = new Date(data.payment_status.payment_required_by);
          updateData.status = "held"; 
        }
        
        if (data.payment_status?.price_guarantee_expires_at) {
          updateData.priceExpiry = new Date(data.payment_status.price_guarantee_expires_at);
        }

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { $set: updateData }
        );
        break;
      }

      // ✅ CASE 3: Payment Deadline Changed (Airline Update)
      case "order.payment_required": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          {
            $set: {
              paymentDeadline: new Date(data.payment_status.payment_required_by),
              adminNotes: `Auto: Airline updated payment deadline to ${data.payment_status.payment_required_by}`,
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      // ✅ CASE 4: Schedule Change (Risk Alert)
      case "order.airline_initiated_change_detected": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id || data.order_id },
          {
            $set: {
              airlineInitiatedChanges: data,
              adminNotes: "⚠️ ALERT: Schedule Change Detected via Duffel!",
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      // ✅ CASE 5: Cancellations
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

      // ✅ CASE 6: Refunded
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
        console.log(`ℹ️ Unhandled Event: ${type}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 Webhook Fatal Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}