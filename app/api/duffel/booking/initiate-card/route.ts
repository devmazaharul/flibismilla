import { NextResponse } from 'next/server';
import axios from 'axios';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

import { isAdmin } from '@/app/api/lib/auth';
import { decrypt } from '../utils';

export const dynamic = 'force-dynamic';


// --- 2. Rate Limiter Helper ---
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

function isRateLimited(ip: string) {
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, startTime: now };

    if (now - clientData.startTime > windowMs) {
        clientData.count = 1;
        clientData.startTime = now;
    } else {
        clientData.count++;
    }

    rateLimitMap.set(ip, clientData);
    return clientData.count > maxRequests;
}


// Duffel SDK Initialize
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

export async function POST(req: Request) {
  // ১. অ্যাডমিন অথেনটিকেশন
  const auth = await isAdmin();
  if (!auth.success) return auth.response;


          const ip =
              req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
  
          if (isRateLimited(ip)) {
              return NextResponse.json(
                  {
                      success: false,
                      message: 'Too many attempts. Please wait 1 minute.',
                  },
                  { status: 429 },
              );
          }


  try {
    const body = await req.json();
    const { bookingId, cvv } = body as { bookingId?: string; cvv?: string };

    // ২. ইনপুট ভ্যালিডেশন
    if (!bookingId || !cvv) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and CVV are required' },
        { status: 400 },
      );
    }

    // ৩. ডাটাবেস কানেকশন ও বুকিং খোঁজা
    await dbConnect();
    const booking: any = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 },
      );
    }

    if (!booking.paymentInfo?.cardNumber) {
      return NextResponse.json(
        { success: false, message: 'No card attached to this booking' },
        { status: 400 },
      );
    }

    // ৪. কার্ড ডিক্রিপশন
    let cardInfo: {
      number: string;
      cvc: string;
      expMonth: string;
      expYear: string;
      name: string;
      address: any;
    };

    try {
      const decryptedNumber = decrypt(booking.paymentInfo.cardNumber);
      const [expMonth, expYearShort] = (booking.paymentInfo.expiryDate || '').split('/');
      const expYearFull =
        expYearShort && expYearShort.length === 2 ? `20${expYearShort}` : expYearShort;

      if (!decryptedNumber || !expMonth || !expYearFull) {
        throw new Error('Invalid card data');
      }

      cardInfo = {
        number: decryptedNumber,
        cvc: cvv,
        expMonth,
        expYear: expYearFull,
        name: booking.paymentInfo.cardName,
        address: booking.paymentInfo.billingAddress || {},
      };
    } catch (err) {
      console.error('Decryption Error:', err);
      return NextResponse.json(
        { success: false, message: 'Failed to decrypt card data' },
        { status: 500 },
      );
    }

    // ৫. Duffel কার্ড টোকেনাইজেশন (vault host: api.duffel.cards)
    console.log('💳 Tokenizing card with Duffel (vault host)...');

    const tokenResponse = await axios.post(
      'https://api.duffel.cards/payments/cards',
      {
        data: {
          number: cardInfo.number,
          cvc: cardInfo.cvc,
          expiry_month: cardInfo.expMonth,
          expiry_year: cardInfo.expYear,
          name: cardInfo.name,
          address_line_1: cardInfo.address.street || null,
          address_city: cardInfo.address.city || null,
          address_country_code: cardInfo.address.country || 'US', // চাইলে BD করবে
          address_postal_code: cardInfo.address.zipCode || null,
          multi_use: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
        },
            timeout: 8000,

      },
    );

    const cardData = tokenResponse.data.data;
    const cardId: string = cardData.id;

    // three_d_secure_usage v2 এ string অথবা object হতে পারে
    const threeDS = cardData.three_d_secure_usage as any;
    const requires3DS =
      typeof threeDS === 'string'
        ? threeDS === 'required'
        : !!threeDS?.required;

    console.log('✅ Card Tokenized:', cardId, '| 3DS usage:', threeDS);

    // ৬. চার্জের পরিমাণ
    const amountToCharge: number | undefined = booking.pricing?.total_amount;
    const currency: string = booking.pricing?.currency || 'USD';

    if (!amountToCharge) {
      return NextResponse.json(
        { success: false, message: 'No amount found for this booking' },
        { status: 400 },
      );
    }

    // CASE A: 3DS REQUIRED
    if (requires3DS) {
      try {
        console.log('🔒 3DS Required. Creating Payment Intent...');

        const paymentIntent = await duffel.paymentIntents.create({
          amount: amountToCharge.toString(),
          currency,
        } as any);

        // B. Intent Confirm করার চেষ্টা (Axios দিয়ে v2 endpoint)
        try {
          await axios.post(
            `https://api.duffel.com/payments/payment_intents/${paymentIntent.data.id}/actions/confirm`,
            {
              data: {
                payment_method: {
                  type: 'card',
                  card_id: cardId,
                },
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
                'Duffel-Version': 'v2',
                'Content-Type': 'application/json',
              },
            },
          );

          // খুব রেয়ার কেস: OTP ছাড়াই কনফার্ম হলে
          return NextResponse.json({
            success: true,
            action: 'PROCEED_TO_PAY',
            card_id: cardId,
            message: 'Card accepted without OTP challenge.',
          });
        } catch (confirmError: any) {
          console.warn(
            'Payment Intent Confirm error (expected for 3DS):',
            confirmError?.response?.data || confirmError?.message,
          );

          const updatedIntent = await duffel.paymentIntents.get(
            paymentIntent.data.id,
          );

          if (updatedIntent.data.status === 'requires_action') {
            return NextResponse.json({
              success: true,
              action: 'SHOW_3DS_POPUP',
              card_id: cardId,
              client_token: updatedIntent.data.client_token,
              payment_intent_id: updatedIntent.data.id,
              message: 'OTP verification required.',
            });
          }

          throw confirmError;
        }
      } catch (intentError: any) {
        console.error(
          'Payment Intent Creation/3DS Failed:',
          intentError?.response?.data || intentError?.message,
        );
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to initiate 3DS security check.',
            debug: intentError?.message,
          },
          { status: 400 },
        );
      }
    }

    // CASE B: 3DS না লাগলে
    return NextResponse.json({
      success: true,
      action: 'PROCEED_TO_PAY',
      card_id: cardId,
      message: 'Card secure. Proceeding to charge.',
    });
  } catch (error: any) {
    // Duffel এর error extra ইনফো
    const status = error?.response?.status;
    const errBody = error?.response?.data;
    const firstErr = errBody?.errors?.[0];

    console.error(
      'Initiate Card API Error:',
      JSON.stringify(errBody || error?.message, null, 2)
    );

    // Duffel বলছে: feature unavailable
    if (
      status === 403 &&
      firstErr?.code === 'unavailable_feature'
    ) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAVAILABLE_FEATURE',
          message:
            'Duffel card vault / card payments feature is not enabled for this account. Please contact help@duffel.com to enable payments.',
          duffel_message: firstErr?.message,
        },
        { status: 403 },
      );
    }

    // অন্য Duffel ভ্যালিডেশন এরর
    if (status && firstErr) {
      return NextResponse.json(
        {
          success: false,
          code: firstErr.code || 'DUFFEL_ERROR',
          title: firstErr.title,
          message: firstErr.message,
          documentation_url: firstErr.documentation_url,
        },
        { status },
      );
    }

    // জেনেরিক fallback
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message:
          error?.message || 'Failed to process card information',
      },
      { status: 500 },
    );
  }
}