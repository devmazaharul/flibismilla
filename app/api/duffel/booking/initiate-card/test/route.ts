import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { isAdmin } from '@/app/api/lib/auth';

// ⚠️ MOCK MODE ACTIVATED
// This is a simulation API for testing frontend logic without real Duffel access.

export async function POST(req: Request) {
  // ১. অ্যাডমিন চেক (এটা ঠিক রাখা হলো রিয়ালিজমের জন্য)
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { bookingId, cvv } = body;

    // ২. ইনপুট ভ্যালিডেশন
    if (!bookingId || !cvv) {
      return NextResponse.json(
        { success: false, message: "Booking ID and CVV are required" },
        { status: 400 }
      );
    }

    // ৩. কৃত্রিম লোডিং (Simulating Network Delay)
    // রিয়েল লাইফে Duffel-এ হিট করতে ২-৩ সেকেন্ড সময় লাগে, তাই আমরা ৩ সেকেন্ড ওয়েট করছি
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ৪. Simulation Logic based on CVV
    console.log(`🧪 SIMULATION MODE: Testing with CVV ${cvv}`);

    // --- SCENARIO 1: DIRECT SUCCESS (No OTP) ---
    // CVV '123' দিলে সরাসরি সাকসেস হবে
    if (cvv === '123') {
      return NextResponse.json({
        success: true,
        action: "PROCEED_TO_PAY",
        card_id: "tok_mock_direct_success_123",
        message: "Card accepted immediately (Mock)."
      });
    }

    // --- SCENARIO 2: 3D SECURE REQUIRED (OTP) ---
    // CVV '456' দিলে ফ্রন্টেন্ডে পপআপ শো করার কমান্ড পাঠাবে
    else if (cvv === '456') {
      return NextResponse.json({
        success: true,
        action: "SHOW_3DS_POPUP",
        
        // এটি একটি ফেইক কার্ড আইডি
        card_id: "tok_mock_3ds_required_456",
        
        // এটি একটি ফেইক ক্লায়েন্ট টোকেন।
        // নোট: রিয়েল Duffel SDK এই ফেইক টোকেন দিয়ে কাজ করবে না, এরর দিবে।
        // কিন্তু আপনার ফ্রন্টেন্ড লজিক (স্টেট চেঞ্জ, পপআপ ওপেন হওয়া) টেস্ট হবে।
        client_token: "mock_client_token_eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...", 
        
        payment_intent_id: "pit_mock_intent_789",
        message: "Security check required (Mock 3DS)."
      });
    }

    // --- SCENARIO 3: FAILURE / DECLINED ---
    // CVV '000' দিলে এরর দিবে
    else if (cvv === '000') {
      return NextResponse.json({
        success: false,
        message: "Card declined by bank (Mock Error). Check funds."
      }, { status: 402 });
    }

    // --- DEFAULT: DIRECT SUCCESS ---
    // অন্য যেকোনো CVV দিলে ডিফল্ট সাকসেস
    else {
      return NextResponse.json({
        success: true,
        action: "PROCEED_TO_PAY",
        card_id: `tok_mock_generic_${cvv}`,
        message: "Card accepted (Default Mock)."
      });
    }

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Simulation Server Error" },
      { status: 500 }
    );
  }
}