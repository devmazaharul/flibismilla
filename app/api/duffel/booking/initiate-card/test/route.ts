import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { isAdmin } from '@/app/api/lib/auth';

export const dynamic = 'force-dynamic';

// ⚠️ MOCK MODE
// Real Duffel integration ছাড়াই card-initiate ফ্লো টেস্ট করার জন্য pure simulation API

export async function POST(req: Request) {
  // ১. অ্যাডমিন চেক
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { bookingId, cvv } = body as {
      bookingId?: string;
      cvv?: string;
    };

    // ২. ইনপুট ভ্যালিডেশন
    if (!bookingId || !cvv) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Booking ID and CVV are required',
        },
        { status: 400 }
      );
    }

    const trimmedCvv = String(cvv).trim();

    // ৩. ডাটাবেস কানেকশন ও বুকিং খোঁজা
    await dbConnect();
    const booking: any = await Booking.findById(bookingId).lean();

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // যদি ইতোমধ্যে পেমেন্ট capture হয়ে থাকে, আবার চেষ্টা ব্লক করো
    if (booking.paymentStatus === 'captured') {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYMENT_ALREADY_CAPTURED',
          message: 'Payment has already been captured for this booking.',
        },
        { status: 400 }
      );
    }

    if (!booking.paymentInfo?.cardNumber) {
      return NextResponse.json(
        {
          success: false,
          code: 'NO_CARD_ON_BOOKING',
          message: 'No stored card is attached to this booking.',
        },
        { status: 400 }
      );
    }

    // ৪. কৃত্রিম লোডিং (Network delay simulation)
    // ১.৫–৩ সেকেন্ডের মধ্যে র‍্যান্ডম ডিলে
    const delay = 1500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(`🧪 SIMULATION MODE: Booking ${bookingId}, CVV=${trimmedCvv}`);

    // ৫. CVV ভিত্তিক সিনারিও ম্যাপ

    // --- SCENARIO 0: Invalid CVV format ---
    if (trimmedCvv.length < 3 || trimmedCvv.length > 4) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CVV_FORMAT',
          message: 'CVV must be 3 or 4 digits (Mock Validation).',
        },
        { status: 400 }
      );
    }

    // --- SCENARIO 1: DIRECT SUCCESS (No OTP) ---
    // CVV '123' দিলে সরাসরি সাকসেস হবে
    if (trimmedCvv === '123') {
      return NextResponse.json({
        success: true,
        action: 'PROCEED_TO_PAY',
        card_id: 'tok_mock_direct_success_123',
        message: 'Card accepted immediately (Mock, no 3DS required).',
        scenario: 'DIRECT_SUCCESS',
      });
    }

    // --- SCENARIO 2: 3D SECURE REQUIRED (OTP) ---
    // CVV '456' দিলে ফ্রন্টএন্ডে 3DS popup দেখানোর নির্দেশ যাবে
    if (trimmedCvv === '456') {
      return NextResponse.json({
        success: true,
        action: 'SHOW_3DS_POPUP',
        card_id: 'tok_mock_3ds_required_456',
        client_token:
          'mock_client_token_eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...', // শুধু ফ্রন্টএন্ড state টেস্টের জন্য
        payment_intent_id: 'pit_mock_intent_456',
        message: 'Security check required (Mock 3DS flow).',
        scenario: '3DS_REQUIRED',
      });
    }

    // --- SCENARIO 3: FAILURE / DECLINED ---
    // CVV '000' দিলে কৃত্রিম Declined (402)
    if (trimmedCvv === '000') {
      return NextResponse.json(
        {
          success: false,
          code: 'CARD_DECLINED',
          message: 'Card declined by bank (Mock Error). Check funds or try another card.',
          scenario: 'DECLINED',
        },
        { status: 402 }
      );
    }

    // --- SCENARIO 4: Invalid CVV (Bank level) ---
    // CVV '111' দিলে Invalid CVV (400)
    if (trimmedCvv === '111') {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CVV',
          message: 'The CVV you entered is invalid (Mock Error).',
          scenario: 'INVALID_CVV',
        },
        { status: 400 }
      );
    }

    // --- DEFAULT: DIRECT SUCCESS ---
    // অন্য যেকোনো CVV দিলে ডিফল্ট সাকসেস ধরা হবে
    return NextResponse.json({
      success: true,
      action: 'PROCEED_TO_PAY',
      card_id: `tok_mock_generic_${trimmedCvv}`,
      message: 'Card accepted (Default Mock scenario).',
      scenario: 'GENERIC_SUCCESS',
    });
  } catch (error: any) {
    console.error('Simulation /initiate-card error:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        code: 'SIMULATION_INTERNAL_ERROR',
        message: 'Simulation Server Error',
      },
      { status: 500 }
    );
  }
}