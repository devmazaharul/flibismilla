import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../utils';
import { isAdmin } from '@/app/api/lib/auth';

const duffelToken = process.env.DUFFEL_ACCESS_TOKEN;
const duffel = new Duffel({ token: duffelToken || '' });

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    // ১. ID Validation
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Booking ID format' },
        { status: 400 }
      );
    }

    // ২. Database Connection & Fetch
    await dbConnect();
    const booking: any = await Booking.findById(id).lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking.duffelOrderId) {
      return NextResponse.json(
        { success: false, message: 'No Duffel Order ID found' },
        { status: 400 }
      );
    }

    // ৩. Duffel API Fetch & Database Sync (Core Logic Changed Here)
    let duffelOrder;
    let finalDocuments = booking.documents || []; // Default: DB Documents
    let finalPNR = booking.pnr || null;           // Default: DB PNR

    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      duffelOrder = res.data;

      // 🟢 SYNC LOGIC: Duffel থেকে লেটেস্ট ডকুমেন্ট পেলে ডাটাবেস আপডেট হবে
      const newDocuments = duffelOrder.documents || [];
      const newPNR = duffelOrder.booking_reference;

      // যদি Duffel-এ ডকুমেন্ট থাকে এবং আমাদের ডাটাবেসের সাথে তথ্যের পার্থক্য থাকে, তবে আপডেট করবো
      if (newDocuments.length > 0) {
        
        // ১. ডাটাবেস আপডেট (Background Sync)
        await Booking.findByIdAndUpdate(id, {
          $set: {
            documents: newDocuments,
            pnr: newPNR,
            // যদি টিকেট ইস্যু হয়ে থাকে তবে স্ট্যাটাসও আপডেট করে দিচ্ছি সেফটির জন্য
            status: 'issued' 
          }
        });

        // ২. রেসপন্সের জন্য লেটেস্ট ডাটা সেট করা
        finalDocuments = newDocuments;
        finalPNR = newPNR;
      }

    } catch (error: any) {
      console.error('⚠️ Duffel Sync Failed, serving from Database:', error.message);

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to sync with airline, but fetching local record.',
          debug: error.message,
          // Fallback data structure (Limited)
          data: {
             id: booking._id,
             pnr: finalPNR,
             documents: finalDocuments,
             status: booking.status,
             note: "Shown from Local Database due to API Error"
          }
        },
        { status: 502 }
      );
    }

    // ৪. Payment Info (CVV ছাড়া)
    let securePaymentInfo = null;
    const paymentInfo = booking.paymentInfo;

    if (paymentInfo) {
      try {
        const { cardNumber, cardName, expiryDate, billingAddress } = paymentInfo;

        let decryptedCard = '****';
        if (cardNumber) {
          decryptedCard = decrypt(cardNumber);
        }

        securePaymentInfo = {
          holderName: cardName || 'N/A',
          cardNumber: decryptedCard,
          expiryDate: expiryDate || 'MM/YY',
          cvv: null, 
          billingAddress: billingAddress || {},
        };
      } catch (e) {
        console.error('Payment Processing Error:', e);
        securePaymentInfo = { error: 'Payment Data Error' };
      }
    }

    // ৫. Flight Segments 
    // (নোট: Segments বানানোর জন্য duffelOrder প্রয়োজন, তাই API কল বাধ্যতামূলক)
    const tripType = booking.flightDetails?.flightType || 'one_way';

    const flightSegments = duffelOrder.slices
      .map((slice: any, sliceIndex: number) => {
        let direction = 'Segment';
        if (tripType === 'one_way') direction = 'Outbound';
        else if (tripType === 'round_trip')
          direction = sliceIndex === 0 ? 'Outbound' : 'Inbound';
        else direction = `Flight ${sliceIndex + 1}`;

        return slice.segments.map((segment: any) => ({
          direction: direction,
          sliceIndex: sliceIndex,
          airline: segment.operating_carrier?.name || 'Airline',
          airlineCode: segment.operating_carrier?.iata_code,
          flightNumber: segment.operating_carrier_flight_number,
          aircraft: segment.aircraft?.name || 'Aircraft info unavailable',
          origin: segment.origin.iata_code,
          originCity: segment.origin.city_name,
          departingAt: segment.departing_at,
          destination: segment.destination.iata_code,
          destinationCity: segment.destination.city_name,
          arrivingAt: segment.arriving_at,
          duration: segment.duration,
          cabinClass:
            segment.passengers?.[0]?.cabin_class_marketing_name || 'Economy',
          baggage: segment.passengers?.[0]?.baggages?.[0]
            ? `${segment.passengers[0].baggages[0].quantity} PC (${
                segment.passengers[0].baggages[0].quantity * 23
              } KG)`
            : 'Check Airline Rule',
        }));
      })
      .flat();

    // ৬. Passengers (UPDATED: Using finalDocuments)
    // আমরা এখন 'finalDocuments' ব্যবহার করছি যা DB বা Duffel থেকে আসা সেরা ভার্সন
    const passengers = duffelOrder.passengers.map((p: any) => {
      const ticketDoc = finalDocuments.find(
        (doc: any) =>
          doc.type === 'electronic_ticket' &&
          doc.passenger_ids?.includes(p.id)
      );
      return {
        id: p.id,
        type: p.type,
        fullName: `${p.given_name} ${p.family_name}`,
        gender: p.gender || 'N/A',
        dob: p.dob,
        ticketNumber: ticketDoc
          ? ticketDoc.unique_identifier
          : 'Not Issued',
      };
    });

    // ৭. Finance
    const financialOverview = {
      basePrice: duffelOrder.base_amount,
      tax: duffelOrder.tax_amount,
      duffelTotal: duffelOrder.total_amount,
      yourMarkup: booking.pricing?.markup || 0,
      clientTotal: booking.pricing?.total_amount || duffelOrder.total_amount,
      currency: duffelOrder.total_currency,
    };

    // ৮. Policies
    const conditions =
      duffelOrder.conditions || duffelOrder.slices?.[0]?.conditions || {};
    const availableActions = duffelOrder.available_actions || [];

    const getPolicyInfo = (policyData: any, actionType: string) => {
      if (!policyData) {
        return availableActions.includes(actionType as any)
          ? { text: 'Check Fee', allowed: true }
          : { text: 'Not Allowed', allowed: false };
      }

      if (policyData.allowed === false) {
        return { text: 'Not Allowed', allowed: false };
      }

      if (policyData.penalty_amount) {
        return {
          text: `${policyData.penalty_amount} ${
            policyData.penalty_currency || ''
          }`,
          allowed: true,
        };
      }

      return { text: 'Free / Check', allowed: true };
    };

    const refundPolicy = getPolicyInfo(
      conditions.refund_before_departure,
      'cancel'
    );
    const changePolicy = getPolicyInfo(
      conditions.change_before_departure,
      'change'
    );

    const policies = {
      cancellation: {
        allowed: refundPolicy.allowed,
        penalty: refundPolicy.text,
        note: refundPolicy.allowed
          ? 'Refundable (Subject to penalty)'
          : 'Non-Refundable',
        timeline: '7-15 Working Days',
      },
      dateChange: {
        allowed: changePolicy.allowed,
        penalty: changePolicy.text,
        note: changePolicy.allowed
          ? 'Changeable (Subject to penalty)'
          : 'Non-Changeable',
        timeline: 'Instant',
      },
    };

    // ৯. Response অবজেক্ট (UPDATED: finalPNR & finalDocuments)
    const fullDetails = {
      id: booking._id,
      bookingRef: booking.bookingReference,
      duffelOrderId: booking.duffelOrderId,
      
      // ✅ DB বা Duffel থেকে আসা ফাইনাল PNR এবং Documents ব্যবহার হচ্ছে
      pnr: finalPNR, 
      documents: finalDocuments, 
      
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      adminNotes: booking.adminNotes || null,
      availableActions: availableActions,
      policies: policies,
      tripType: tripType,
      segments: flightSegments,
      contact: booking.contact,
      passengers: passengers,
      finance: financialOverview,
      paymentSource: securePaymentInfo,
    };

    return NextResponse.json({ success: true, data: fullDetails });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}