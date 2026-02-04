import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import { sendTicketIssuedEmail } from "@/app/emails/email"; // ✅ আপনার দেওয়া পাথ

export const runtime = "nodejs";          // Crypto ব্যবহারের জন্য Node.js রানটাইম জরুরি
export const dynamic = "force-dynamic";   // ক্যাশ এড়ানোর জন্য

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    
    // ১. হেডার চেক করা
    const signatureHeader =
      req.headers.get("x-duffel-signature") ||
      req.headers.get("X-Duffel-Signature");

    if (!signatureHeader) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ DUFFEL_WEBHOOK_SECRET is missing in .env");
      return NextResponse.json({ message: "Server config error" }, { status: 500 });
    }

    // ----------------------------------------------------------------
    // 🛠️ FIX: Signature Parsing (Space Handling)
    // ----------------------------------------------------------------
    // Duffel হেডার পাঠাতে পারে এভাবে: "t=12345, v1=abcdef" (মাঝখানে স্পেস থাকে)
    // তাই split করার পর trim() করা খুব জরুরি।
    const parts = signatureHeader.split(",").map(part => part.trim());

    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!tPart || !v1Part) {
      console.error("❌ Invalid Signature Format:", signatureHeader);
      return NextResponse.json({ message: "Invalid signature format" }, { status: 400 });
    }

    const timestamp = tPart.substring(2); // 't=' এর পর থেকে
    const receivedHash = v1Part.substring(3); // 'v1=' এর পর থেকে

    // ----------------------------------------------------------------
    // 2. Hash Verification
    // ----------------------------------------------------------------
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
    // 3. Process Event & Database Update
    // ----------------------------------------------------------------
    await dbConnect();

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const { type, data } = event;
    const orderId = data?.order_id || data?.id; // ইভেন্ট ভেদে ID ভিন্ন হতে পারে

    console.log(`🔔 Webhook: ${type} | ID: ${orderId}`);

    switch (type) {
      
      // ✅ CASE 1: Ticket Issued (সফল বুকিং)
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
          { new: true } // আপডেটেড ডাটা রিটার্ন করবে
        );
        
        // 📧 ইমেইল পাঠানো হচ্ছে (ফিক্সড)
        if (booking) {
            try {
                // আপনার sendTicketIssuedEmail ফাংশনটি যদি শুধু booking অবজেক্ট নেয়:
                await sendTicketIssuedEmail(booking);
                
                // অথবা যদি (email, booking) এভাবে নেয়, তাহলে নিচের লাইনটি ব্যবহার করুন:
                // await sendTicketIssuedEmail(booking.contact.email, booking);
                
                console.log(`📧 Ticket email sent for PNR: ${booking.pnr}`);
            } catch (emailError) {
                console.error(`❌ Failed to send ticket email for PNR: ${booking.pnr}`, emailError);
            }
        }
        break;
      }

      // ✅ CASE 2: Order Created (Hold/Instant)
      case "order.created": {
        const updateData: any = {};
        
        // পেমেন্ট ডেডলাইন চেক এবং আপডেট
        if (data.payment_status?.payment_required_by) {
          updateData.paymentDeadline = new Date(data.payment_status.payment_required_by);
          // যদি আগে স্ট্যাটাস সেট না হয়ে থাকে, তবে held সেট করা
          updateData.status = "held";
        }
        
        // প্রাইস গ্যারান্টি চেক
        if (data.payment_status?.price_guarantee_expires_at) {
          updateData.priceExpiry = new Date(data.payment_status.price_guarantee_expires_at);
        }

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { $set: updateData }
        );
        break;
      }

      // ✅ CASE 3: Payment Deadline Changed (Airline Update) - খুব জরুরি!
      case "order.payment_required": {
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          {
            $set: {
              paymentDeadline: new Date(data.payment_status.payment_required_by),
              adminNotes: `Auto-Update: Airline updated payment deadline to ${data.payment_status.payment_required_by}`,
              updatedAt: new Date(),
            },
          }
        );
        break;
      }

      // ✅ CASE 4: Flight Schedule Change (Risk Alert)
      case "order.airline_initiated_change_detected": {
        const affectedBooking = await Booking.findOneAndUpdate(
          { duffelOrderId: data.id || data.order_id },
          {
            $set: {
              airlineInitiatedChanges: data, // পরিবর্তনের ডিটেইলস সেভ রাখা
              adminNotes: "⚠️ ALERT: Schedule Change Detected! Please Check Duffel.",
              updatedAt: new Date(),
            },
          }
        );
        
        // 📧 এডমিন বা ইউজারকে নোটিফাই করার জন্য (ফিউচার ইমপ্লিমেন্টেশন)
        // if (affectedBooking) await sendScheduleChangeEmail(affectedBooking);
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