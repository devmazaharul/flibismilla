import { NextRequest, NextResponse } from 'next/server';
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    // ১. ID Validation
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Booking ID format' },
        { status: 400 },
      );
    }

    // ২. Database Connection & Fetch
    await dbConnect();
    let booking: any = await Booking.findById(id).lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 },
      );
    }

    if (!booking.duffelOrderId) {
      return NextResponse.json(
        { success: false, message: 'No Duffel Order ID found' },
        { status: 400 },
      );
    }

    // ৩. Duffel API Fetch & Database Sync
    let duffelOrder: any;
    let finalDocuments = booking.documents || [];
    let finalPNR = booking.pnr || null;
    let finalBooking = booking;

    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      duffelOrder = res.data;

      const newDocuments = duffelOrder.documents || [];
      const newPNR = duffelOrder.booking_reference || booking.pnr;

      const cancellation = duffelOrder.cancellation || null;
      const isCancelledRemote =
        !!cancellation || !!duffelOrder.cancelled_at;

      const updates: any = {};
      let needsUpdate = false;

      // 🔴 Cancellation handling
      if (isCancelledRemote) {
        const cancelledAtRemote =
          duffelOrder.cancelled_at ||
          cancellation?.cancelled_at ||
          new Date().toISOString();

        updates.status = 'cancelled';

        const notePrefix = `Auto-Sync: Cancelled on Duffel at ${cancelledAtRemote}`;
        if (!booking.adminNotes) {
          updates.adminNotes = notePrefix;
        } else if (!booking.adminNotes.includes('Cancelled on Duffel')) {
          updates.adminNotes = `${booking.adminNotes}\n${notePrefix}`;
        }

        // paymentStatus: refunded / failed
        if (
          (cancellation?.refund_amount &&
            Number(cancellation.refund_amount) > 0) ||
          cancellation?.refunded_at
        ) {
          updates.paymentStatus = 'refunded';
        } else if (
          booking.paymentStatus === 'pending' ||
          booking.paymentStatus === 'authorized' ||
          !booking.paymentStatus
        ) {
          updates.paymentStatus = 'failed';
        }

        // cancellation details log
        updates.airlineInitiatedChanges = {
          ...(booking.airlineInitiatedChanges || {}),
          cancellation: {
            id: cancellation?.id || null,
            cancelled_at: cancelledAtRemote,
            refund_amount: cancellation?.refund_amount || null,
            refund_currency: cancellation?.refund_currency || null,
            penalty_amount: cancellation?.penalty_amount || null,
            penalty_currency: cancellation?.penalty_currency || null,
            refunded_at: cancellation?.refunded_at || null,
            raw: cancellation || null,
          },
        };

        // documents/pnr sync (tickets historically keep)
        if (newDocuments.length > 0) {
          updates.documents = newDocuments;
          updates.pnr = newPNR;
        }

        needsUpdate = true;
      } else {
        // 🔵 Not cancelled: documents → issued, paymentStatus sync
        if (newDocuments.length > 0) {
          updates.documents = newDocuments;
          updates.pnr = newPNR;

          if (booking.status !== 'issued') {
            updates.status = 'issued';
          }
          if (booking.paymentStatus !== 'captured') {
            updates.paymentStatus = 'captured';
          }

          needsUpdate = true;
        }
        // চাইলে এখানে payment_status.paid_at / awaiting_payment ইত্যাদি থেকে held/pending update করতে পারো
      }

      if (needsUpdate) {
        finalBooking = await Booking.findByIdAndUpdate(
          id,
          {
            $set: updates,
            $currentDate: { updatedAt: true },
          },
          { new: true },
        ).lean();

        finalDocuments = finalBooking.documents || newDocuments;
        finalPNR = finalBooking.pnr;
      } else {
        finalDocuments = newDocuments.length > 0 ? newDocuments : finalDocuments;
        finalPNR = newPNR || finalPNR;
      }
    } catch (error: any) {
      console.error(
        '⚠️ Duffel Sync Failed in details API, serving from Database:',
        error.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to sync with airline, but fetching local record.',
          debug: error.message,
          data: {
            id: booking._id,
            pnr: finalPNR,
            documents: finalDocuments,
            status: booking.status,
            note: 'Shown from Local Database due to API Error',
          },
        },
        { status: 502 },
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
          zipCode: billingAddress?.zipCode || null,
        };
      } catch (e) {
        console.error('Payment Processing Error:', e);
        securePaymentInfo = { error: 'Payment Data Error' };
      }
    }

    // ৫. Flight Segments
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

    // ৬. Passengers + Ticket mapping (FIXED)
    const docsForMapping: any[] =
      (duffelOrder.documents && duffelOrder.documents.length > 0
        ? duffelOrder.documents
        : finalDocuments) || [];

    const passengers = duffelOrder.passengers.map((p: any) => {
      // প্রথমে passenger_ids / passenger.id এর উপর ভিত্তি করে ডকুমেন্ট খুঁজি
      const ticketDoc =
        docsForMapping.find((doc: any) => {
          const matchesPassenger =
            (doc.passenger_ids &&
              Array.isArray(doc.passenger_ids) &&
              doc.passenger_ids.includes(p.id)) ||
            (doc.passenger && doc.passenger.id === p.id);

          if (!matchesPassenger) return false;

          // type থাকলে electronic_ticket/e_ticket প্রাধান্য, না থাকলে যে কোনোটাই চলবে
          if (!doc.type) return true;
          return (
            doc.type === 'electronic_ticket' ||
            doc.type === 'e_ticket' ||
            doc.type === 'ticket'
          );
        }) ||
        // যদি একটাও match না পায়, কিন্তু কেবল একটাই ডকুমেন্ট থাকে, সেটাই use করি
        (docsForMapping.length === 1 ? docsForMapping[0] : null);

      let ticketNumber = 'Not Issued';
      if (ticketDoc?.unique_identifier) {
        ticketNumber = ticketDoc.unique_identifier;
      }

      let infantInfo = null;
      if (p.infant_passenger_id) {
        const infant = duffelOrder.passengers.find(
          (i: any) => i.id === p.infant_passenger_id,
        );
        infantInfo = infant
          ? `${infant.given_name} ${infant.family_name}`
          : null;
      }

      return {
        id: p.id,
        type: p.type,
        fullName: `${p.given_name} ${p.family_name}`,
        gender: p.gender || 'N/A',
        dob: p.born_on,
        ticketNumber,
        carryingInfant: infantInfo,
      };
    });

    // ৭. Finance
    const financialOverview = {
      basePrice: duffelOrder.base_amount,
      tax: duffelOrder.tax_amount,
      duffelTotal: duffelOrder.total_amount,
      yourMarkup: booking.pricing?.markup || 0,
      clientTotal:
        booking.pricing?.total_amount || duffelOrder.total_amount,
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
      'cancel',
    );
    const changePolicy = getPolicyInfo(
      conditions.change_before_departure,
      'change',
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

    // ৯. Response অবজেক্ট
    const fullDetails = {
      id: booking._id,
      bookingRef: booking.bookingReference,
      duffelOrderId: booking.duffelOrderId,
      pnr: finalPNR,
      documents: finalDocuments,
      status: finalBooking.status,
      paymentStatus: finalBooking.paymentStatus,
      adminNotes: finalBooking.adminNotes || null,
      availableActions: availableActions,
      policies,
      tripType,
      segments: flightSegments,
      contact: booking.contact,
      passengers,
      finance: financialOverview,
      paymentSource: securePaymentInfo,
      timings: {
        deadline: finalBooking.paymentDeadline || null,
      },
    };

    return NextResponse.json({ success: true, data: fullDetails });
  } catch (error: any) {
    console.error('Details API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: error.message,
      },
      { status: 500 },
    );
  }
}