import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { decrypt, encrypt, generateBookingReference } from './utils';
import Booking from '@/models/Booking.model';
import { format, parseISO } from 'date-fns';
import {
  sendBookingProcessingEmail,
  sendNewBookingAdminNotification,
} from '@/app/emails/email';
import { isAdmin } from '../../lib/auth';

// --- Type Definitions ---
interface PassengerInput {
  id: string;
  type: 'adult' | 'child' | 'infant_without_seat';
  title?: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dob: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
}

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

// --- 🛡️ Rate Limiter ---
const rateLimitMap = new Map<string, { count: number; startTime: number }>();
function isRateLimited(ip: string) {
  const windowMs = 60 * 1000;
  const maxRequests = 20;
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

// Phone validation (basic length + digits/+ only)
const validatePhoneNumber = (phone: string | undefined) => {
  if (!phone) return undefined;
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  if (!/^\+?[0-9]{10,17}$/.test(cleaned)) return undefined;
  return cleaned;
};

export async function POST(request: Request) {
  let newBookingId: string | null = null;
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429 },
    );
  }

  try {
    await dbConnect();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const { offer_id, contact, passengers, payment, flight_details, pricing } =
      body || {};

    // Basic required fields check (pricing সহ)
    if (!offer_id || !passengers || !payment || !flight_details || !pricing) {
      return NextResponse.json(
        { success: false, message: 'Missing required booking fields' },
        { status: 400 },
      );
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'At least one passenger is required',
          errorType: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 🛡️ STEP 0: OFFER VALIDATION + PRICE CHECK
    // ============================================================
    let validatedOffer: any;
    try {
      const offerCheck = await duffel.offers.get(offer_id);
      validatedOffer = offerCheck.data;
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: 'Offer expired or no longer available. Please search again.',
          errorType: 'OFFER_EXPIRED',
        },
        { status: 400 },
      );
    }

    // Optional chaining: কিছু offer এ payment_requirements নাও থাকতে পারে
    if (validatedOffer.payment_requirements?.requires_instant_payment) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This flight requires instant payment and cannot be held. Please use instant booking.',
          errorType: 'INSTANT_PAYMENT_REQUIRED',
        },
        { status: 400 },
      );
    }

    // Client amount validate + price mismatch guard
    const customerTotalAmount = Number(pricing.total_amount);
    if (
      !Number.isFinite(customerTotalAmount) ||
      customerTotalAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid total amount on client side',
          errorType: 'PRICE_INVALID',
        },
        { status: 400 },
      );
    }



// Client base fare (airline actual price without markup)
const clientBaseFare = Number(pricing.base_fare);
if (!Number.isFinite(clientBaseFare) || clientBaseFare <= 0) {
  return NextResponse.json(
    {
      success: false,
      message: 'Invalid base fare on client side',
      errorType: 'PRICE_INVALID',
    },
    { status: 400 },
  );
}

// Duffel offer price (যদি তোমার base_fare আসলে offer.total_amount হয়)
const offerAmount = Number(validatedOffer.total_amount);
// যদি তোমার UI তে base_fare = offer.base_amount পাঠাও, তাহলে উপরটা বাদ দিয়ে এটা ব্যবহার করবে:
// const offerAmount = Number(validatedOffer.base_amount);

if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
  return NextResponse.json(
    {
      success: false,
      message:
        'Invalid price information from airline. Please search again.',
      errorType: 'OFFER_INVALID',
    },
    { status: 400 },
  );
}


    // বেশি পার্থক্য থাকলে mismatch
    if (Math.abs(pricing.base_fare - offerAmount) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Price has changed or is inconsistent. Please refresh and search again.',
          errorType: 'PRICE_MISMATCH',
        },
        { status: 400 },
      );
    }
    // ============================================================

    // --- Route Logic Fix ---
    let finalRoute = flight_details.route;
    if (
      flight_details.flightType === 'round_trip' &&
      typeof finalRoute === 'string' &&
      !finalRoute.includes('|')
    ) {
      const parts = finalRoute.split('➝').map((s: string) => s.trim());
      if (parts.length === 2) {
        finalRoute = `${parts[0]} ➝ ${parts[1]} | ${parts[1]} ➝ ${parts[0]}`;
      }
    }

    // 🟢 Card encryption & booking ref
    const bookingRef = generateBookingReference();
    const encryptedCardNumber = encrypt(payment.cardNumber);

    // 🟢 DB: Create initial booking record
    const newBooking = await Booking.create({
      bookingReference: bookingRef,
      offerId: offer_id,
      contact,
      passengers: (passengers as PassengerInput[]).map((p) => ({
        ...p,
        passportCountry: p.passportCountry || 'US',
      })),
      flightDetails: {
        airline: flight_details.airline,
        flightNumber: flight_details.flightNumber,
        route: finalRoute,
        departureDate: flight_details.departureDate,
        arrivalDate: flight_details.arrivalDate,
        duration: flight_details.duration,
        flightType: flight_details.flightType,
        logoUrl: validatedOffer.owner?.logo_symbol_url || null,
      },
      pricing: {
        currency: pricing.currency || validatedOffer.total_currency || 'USD',
        total_amount: customerTotalAmount,
        markup: 0,
      },
      paymentInfo: {
        cardName: payment.cardName,
        cardNumber: encryptedCardNumber,
        expiryDate: payment.expiryDate,
        billingAddress: payment.billingAddress,
      },
      documents: [],
      airlineInitiatedChanges: null,
      status: 'processing',
      isLiveMode: false,
    });

    newBookingId = newBooking._id.toString();

    // 🟢 4. Duffel Passenger Payload (with AUTO TITLE + validation)
    const duffelPassengers = (passengers as PassengerInput[]).map((p) => {
      // DOB validation
      const birthDate = new Date(p.dob);
      if (Number.isNaN(birthDate.getTime())) {
        throw new Error(
          `Invalid date of birth for passenger ${p.firstName} ${p.lastName}`,
        );
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // 🔥 AUTO TITLE CALCULATION
      let autoTitle = 'mr'; // Default fallback
      if (p.gender === 'male') {
        autoTitle = 'mr';
      } else {
        if (age < 12) {
          autoTitle = 'miss';
        } else {
          autoTitle = 'ms';
        }
      }

      // ✅ PHONE VALIDATION
      const validPhone = validatePhoneNumber(p.phone || contact?.phone);

      const passengerData: any = {
        id: p.id,
        type: p.type,
        given_name: p.firstName,
        family_name: p.lastName,
        gender: p.gender === 'male' ? 'm' : 'f',
        title: autoTitle,
        born_on: p.dob,
        email: p.email || contact?.email,
        ...(validPhone && { phone_number: validPhone }),
      };

      if (p.passportNumber) {
        // Passport expiry validation (only format)
        if (p.passportExpiry) {
          const expDate = new Date(p.passportExpiry);
          if (Number.isNaN(expDate.getTime())) {
            throw new Error(
              `Invalid passport expiry date for passenger ${p.firstName} ${p.lastName}`,
            );
          }
        }

        passengerData.identity_documents = [
          {
            unique_identifier: `ID-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: 'passport',
            number: p.passportNumber,
            expires_on: p.passportExpiry,
            issuing_country_code: p.passportCountry || 'US',
          },
        ];
      }

      return passengerData;
    });

    // ============================================================
    // 🛡️ PASSENGER VALIDATION (CHILD & INFANT RULES)
    // ============================================================
    const adults = duffelPassengers.filter((p: any) => p.type === 'adult');
    const infants = duffelPassengers.filter(
      (p: any) => p.type === 'infant_without_seat',
    );

    if (adults.length === 0) {
      await Booking.findByIdAndUpdate(newBookingId, {
        status: 'failed',
        adminNotes: 'Validation: No Adult',
      });
      return NextResponse.json(
        {
          success: false,
          message:
            'Bookings cannot be made for children or infants without an adult.',
          errorType: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    if (infants.length > adults.length) {
      await Booking.findByIdAndUpdate(newBookingId, {
        status: 'failed',
        adminNotes: 'Validation: Infant Ratio',
      });
      return NextResponse.json(
        {
          success: false,
          message: `Not enough adults. You have ${infants.length} infants but only ${adults.length} adults.`,
          errorType: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }
    // ============================================================

    // Link infants to adults
    infants.forEach((infant: any, index: number) => {
      if (adults[index]) {
        adults[index].infant_passenger_id = infant.id;
      }
    });

    const finalDuffelPayload = duffelPassengers.map(
      ({ type, ...rest }: any) => rest,
    );

    // 🟢 5. Call Duffel API (pay_later order)
    let order;
    try {
      order = await duffel.orders.create({
        type: 'pay_later',
        selected_offers: [offer_id],
        passengers: finalDuffelPayload,
      });
    } catch (duffelError: any) {
      console.error(
        'Duffel Booking Error:',
        JSON.stringify(duffelError, null, 2),
      );

      const raw =
        duffelError?.response?.data ||
        duffelError?.meta ||
        duffelError ||
        {};
      const errorBody =
        raw.errors?.[0] || raw.error || raw.meta?.error || null;

      let errorMessage = 'Flight booking failed with airline.';
      const errCode =
        errorBody?.code || errorBody?.type || raw.code || undefined;

      if (errCode === 'offer_no_longer_available') {
        errorMessage =
          'This flight is no longer available at this price. Please search again.';
      } else if (
        errCode === 'instant_payment_required' ||
        errCode === 'offer_requires_instant_payment'
      ) {
        errorMessage =
          'This flight requires instant payment. Hold is not available.';
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      }

      if (newBookingId) {
        await Booking.findByIdAndUpdate(newBookingId, {
          status: 'failed',
          adminNotes: `Duffel Error Code: ${errCode} - ${errorMessage}`,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          code: errCode,
          errorType:
            errCode === 'offer_no_longer_available'
              ? 'OFFER_EXPIRED'
              : 'API_ERROR',
        },
        { status: 400 },
      );
    }

    // 🟢 6. Success: Update Database pricing/hold info
    const duffelActualCost = Number(order.data.total_amount);
    const calculatedMarkup = customerTotalAmount - duffelActualCost;

    await Booking.findByIdAndUpdate(newBookingId, {
      duffelOrderId: order.data.id,
      pnr: order.data.booking_reference,
      paymentDeadline: order.data.payment_status.payment_required_by,
      priceExpiry: order.data.payment_status.price_guarantee_expires_at,
      pricing: {
        currency: order.data.total_currency,
        total_amount: customerTotalAmount,
        markup: Number(calculatedMarkup.toFixed(2)),
        base_amount: duffelActualCost,
      },
      isLiveMode: order.data.live_mode,
      documents: order.data.documents || [],
      airlineInitiatedChanges: order.data.airline_initiated_changes || [],
      status: 'held',
      updatedAt: new Date(),
    });

    // 🟢 7. SEND EMAILS (customer + admin) – সম্পূর্ণ try/catch এ
    try {
      // Departure date safe parse
      let depDate: Date;
      if (typeof flight_details.departureDate === 'string') {
        depDate = parseISO(flight_details.departureDate);
      } else {
        depDate = new Date(flight_details.departureDate);
      }

      const emailDate = format(depDate, 'dd MMM, yyyy');

      const firstLeg = (finalRoute || '').split('|')[0] || finalRoute;
      const routeParts = (firstLeg || '').split('➝');

      const emailOrigin = routeParts[0]?.trim() || 'Origin';
      const emailDest =
        routeParts[routeParts.length - 1]?.trim() || 'Destination';

      const primaryPassenger =
        (passengers as PassengerInput[])[0] || ({} as PassengerInput);
      const primaryPassengerName =
        `${primaryPassenger.title || ''} ${primaryPassenger.firstName || ''} ${
          primaryPassenger.lastName || ''
        }`.trim() || 'Traveler';

      // Customer email (if email present)
      if (contact?.email) {
        await sendBookingProcessingEmail({
          to: contact.email,
          customerName: primaryPassengerName,
          bookingReference: order.data.booking_reference,
          origin: emailOrigin,
          destination: emailDest,
          flightDate: emailDate,
        });
      } else {
        console.warn(
          'No contact.email found, skipping booking processing email.',
        );
      }

      // Admin notification (always try to send, but safe fallbacks)
      await sendNewBookingAdminNotification({
        pnr: order.data.booking_reference,
        customerName:
          contact?.name ||
          primaryPassengerName ||
          'Traveler',
        customerPhone:
          contact?.phone ||
          primaryPassenger.phone ||
          'N/A',
        route: finalRoute,
        airline: flight_details.airline,
        flightDate: emailDate,
        totalAmount: customerTotalAmount,
        bookingId: newBookingId!,
      });
    } catch (emailError) {
      console.error('Failed to send booking emails:', emailError);
      // ইমেইল fail হলেও main response success থাকবে
    }

    return NextResponse.json({
      success: true,
      bookingId: newBookingId,
      reference: bookingRef,
      pnr: order.data.booking_reference,
      expiry: order.data.payment_status.payment_required_by,
    });
  } catch (error: any) {
    console.error('Global Booking Error:', error);

    // Duplicate key (e.g. bookingReference)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        {
          success: false,
          message: `Duplicate entry found for ${field}. Please try again.`,
          errorType: 'DUPLICATE_ERROR',
        },
        { status: 409 },
      );
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message,
      );
      return NextResponse.json(
        {
          success: false,
          message: messages[0],
          errorType: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    // Already-created booking কে failed mark করো
    if (newBookingId) {
      try {
        await Booking.findByIdAndUpdate(newBookingId, {
          status: 'failed',
          adminNotes: error.message || 'Unknown error',
        });
      } catch (e) {
        console.error('Failed to mark booking as failed:', e);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal Server Error',
        errorType: 'SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}




// --- 🔄 Smart Sync Function (Always Fresh Data + Status/Payment/Date Sync) ---
async function syncSingleBooking(booking: any) {
  // ১. Duffel Order ID না থাকলে সিঙ্ক করা সম্ভব না
  if (!booking.duffelOrderId) {
    return booking;
  }

  try {
    // ২. 🚀 Always Call Duffel API
    const response = await duffel.orders.get(booking.duffelOrderId);
    const orderData: any = response.data; // Duffel এর লেটেস্ট ডাটা

    const updates: any = {};
    let needsUpdate = false;
    const now = new Date();
    const nowIso = now.toISOString();

    // ✅ আগে থেকেই documents আছে কি না (Issued কিনা বোঝার জন্য)
    const hasRemoteDocs =
      Array.isArray(orderData.documents) && orderData.documents.length > 0;

    const isCancelledRemote =
      !!orderData.cancellation || !!orderData.cancelled_at;
    const cancellation = orderData.cancellation || null;

    // --- ৩. Status / PaymentStatus / Deadline Sync ---

    // 🟥 Case A: Cancellation Check (with details)
    if (isCancelledRemote) {
      // ১) Local status আপডেট
      if (booking.status !== 'cancelled') {
        updates.status = 'cancelled';

        const cancelledAtRemote =
          orderData.cancelled_at || cancellation?.cancelled_at || nowIso;

        updates.adminNotes =
          booking.adminNotes ||
          `Auto-Sync: Cancelled on Duffel at ${cancelledAtRemote}`;
      }

      // ২) Cancellation details airlineInitiatedChanges এ log করো
      updates.airlineInitiatedChanges = {
        ...(booking.airlineInitiatedChanges || {}),
        cancellation: {
          id: cancellation?.id || null,
          cancelled_at:
            orderData.cancelled_at || cancellation?.cancelled_at || null,
          refund_amount: cancellation?.refund_amount || null,
          refund_currency: cancellation?.refund_currency || null,
          penalty_amount: cancellation?.penalty_amount || null,
          penalty_currency: cancellation?.penalty_currency || null,
          refunded_at: cancellation?.refunded_at || null,
          raw: cancellation || null,
        },
      };

      // ৩) PaymentStatus আপডেট: refund থাকলে refunded, না থাকলে captured/failed ইত্যাদি 그대로
      if (
        (cancellation?.refund_amount && Number(cancellation.refund_amount) > 0) ||
        cancellation?.refunded_at
      ) {
        if (booking.paymentStatus !== 'refunded') {
          updates.paymentStatus = 'refunded';
        }
      } else if (
        booking.paymentStatus === 'pending' ||
        booking.paymentStatus === 'authorized'
      ) {
        // Cancelled but never captured → fail করে দিচ্ছি
        updates.paymentStatus = 'failed';
      }

      needsUpdate = true;

      // ❗ Cancelled হলে নিচের expiry/payment/doc/schedule logic আর apply করব না
    } else {
      // --- 🟡 Non-cancelled order এর জন্য বাকি লজিক ---

      const paymentStatusObj = orderData.payment_status || {};

      const paidAt =
        (paymentStatusObj.paid_at as string | null) || null;
      const paymentRequiredBy =
        (paymentStatusObj.payment_required_by as string | null) || null;
      const priceGuaranteeExpiresAt =
        (paymentStatusObj.price_guarantee_expires_at as string | null) || null;
      const awaitingPayment =
        paymentStatusObj.awaiting_payment === true;

      const remoteDeadline = paymentRequiredBy || priceGuaranteeExpiresAt;

      // ⏳ Case B: Payment Deadline Sync + Expiry (Duffel যেটা দেয়)
      if (remoteDeadline) {
        const localDeadlineIso = booking.paymentDeadline
          ? new Date(booking.paymentDeadline).toISOString()
          : null;

        if (localDeadlineIso !== remoteDeadline) {
          updates.paymentDeadline = remoteDeadline; // Mongoose Date এ কাস্ট করবে
          needsUpdate = true;
        }

        // Deadline cross হয়ে গেছে, paid হয় নাই → expired
        if (!paidAt && remoteDeadline < nowIso && booking.status !== 'expired') {
          updates.status = 'expired';
          updates.adminNotes =
            booking.adminNotes ||
            `Auto-Sync: Booking expired on Duffel at ${remoteDeadline}`;

          if (booking.paymentStatus === 'pending') {
            updates.paymentStatus = 'failed';
          }

          needsUpdate = true;
        }
      } else {
        // ⚠️ Duffel কোন payment window দেয় নাই:
        // paid না, awaiting_payment=false, আর কোনো docsও নাই → ধরে নিচ্ছি hold expire হয়ে গেছে
        const noPaymentWindow =
          !paidAt &&
          !paymentRequiredBy &&
          !priceGuaranteeExpiresAt &&
          awaitingPayment === false;

        if (
          noPaymentWindow &&
          !hasRemoteDocs &&
          !['expired', 'cancelled', 'failed', 'issued'].includes(
            booking.status,
          )
        ) {
          updates.status = 'expired';
          updates.adminNotes =
            booking.adminNotes ||
            'Auto-Sync: Hold expired (no payment window, unpaid).';

          if (booking.paymentStatus === 'pending') {
            updates.paymentStatus = 'failed';
          }

          needsUpdate = true;
        }

        // Extra: local paymentDeadline থাকলে সেটাও cross হয়ে গেলে expire করতে পারো
        if (
          booking.paymentDeadline &&
          new Date(booking.paymentDeadline) < now &&
          booking.status !== 'expired'
        ) {
          updates.status = 'expired';
          updates.adminNotes =
            booking.adminNotes ||
            `Auto-Sync: Booking expired locally at ${booking.paymentDeadline.toISOString()}`;

          if (booking.paymentStatus === 'pending') {
            updates.paymentStatus = 'failed';
          }

          needsUpdate = true;
        }
      }

      // 🟢 Case C: Payment Status Sync (Duffel)
      if (paidAt) {
        // Airline side এ payment complete
        if (booking.paymentStatus !== 'captured') {
          updates.paymentStatus = 'captured';
          needsUpdate = true;
        }
      } else if (awaitingPayment) {
        // Awaiting payment -> held/pending
        if (booking.status !== 'held') {
          updates.status = 'held';
          needsUpdate = true;
        }
        if (booking.paymentStatus !== 'pending') {
          updates.paymentStatus = 'pending';
          needsUpdate = true;
        }
      }

      // ✅ Case D: Issuance Check (documents)
      if (hasRemoteDocs) {
        const formattedDocs = orderData.documents.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url,
        }));

        const hasLocalDocs =
          Array.isArray(booking.documents) && booking.documents.length > 0;

        if (booking.status !== 'issued' || !hasLocalDocs) {
          updates.status = 'issued';
          updates.documents = formattedDocs;
          updates.pnr = orderData.booking_reference || booking.pnr;

          // Docs থাকলে payment logically captured
          if (booking.paymentStatus !== 'captured') {
            updates.paymentStatus = 'captured';
          }

          needsUpdate = true;
        }
      }

      // 🕒 Case E: Schedule / Date Change Check
      if (
        orderData.slices &&
        orderData.slices.length > 0 &&
        booking.flightDetails
      ) {
        const firstSlice = orderData.slices[0];
        const firstSegment = firstSlice.segments[0];

        const lastSlice = orderData.slices[orderData.slices.length - 1];
        const lastSegment =
          lastSlice.segments[lastSlice.segments.length - 1];

        // Duffel Times
        const newDepartureTime = new Date(firstSegment.departing_at).getTime();
        const newArrivalTime = new Date(lastSegment.arriving_at).getTime();

        // Local DB Times
        const localDepartureTime = booking.flightDetails.departureDate
          ? new Date(booking.flightDetails.departureDate).getTime()
          : null;
        const localArrivalTime = booking.flightDetails.arrivalDate
          ? new Date(booking.flightDetails.arrivalDate).getTime()
          : null;

        // পার্থক্য চেক (ধরি ১ মিনিটের বেশি পার্থক্য হলে আপডেট করব)
        const depDiff =
          localDepartureTime !== null
            ? Math.abs(newDepartureTime - localDepartureTime)
            : Infinity;
        const arrDiff =
          localArrivalTime !== null
            ? Math.abs(newArrivalTime - localArrivalTime)
            : 0;

        if (depDiff > 60000 || arrDiff > 60000) {
          console.log(`⚠️ Schedule Change Detected for PNR ${booking.pnr}`);

          // Flight Details আপডেট
          updates['flightDetails.departureDate'] = firstSegment.departing_at;
          updates['flightDetails.arrivalDate'] = lastSegment.arriving_at;

          const carrierCode =
            firstSegment.operating_carrier?.iata_code ||
            firstSegment.marketing_carrier?.iata_code ||
            '';
          const flightNumber =
            firstSegment.operating_carrier_flight_number ||
            firstSegment.marketing_carrier_flight_number ||
            '';

          updates['flightDetails.flightNumber'] = `${carrierCode}${flightNumber}`;
          updates['flightDetails.duration'] = firstSlice.duration;

          // Airline initiated change log
          updates.airlineInitiatedChanges = {
            ...(booking.airlineInitiatedChanges || {}),
            lastSyncAt: new Date(),
            previousDepartureDate: booking.flightDetails.departureDate,
            previousArrivalDate: booking.flightDetails.arrivalDate,
            newDepartureDate: firstSegment.departing_at,
            newArrivalDate: lastSegment.arriving_at,
          };

          needsUpdate = true;
        }
      }
    }

    // --- ৪. Database Write Operation ---
    if (needsUpdate) {
      console.log(`🔄 Syncing PNR ${booking.pnr || booking._id}: Updates applied.`);

      const updatedBooking = await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: updates,
          $currentDate: { updatedAt: true },
        },
        { new: true },
      ).lean();

      return updatedBooking;
    }

    return booking;
  } catch (error) {
    console.error(`❌ Sync failed for ${booking.pnr || booking._id}:`, error);
    return booking;
  }
}

// --- 🚀 Main API Handler ---
export async function GET(req: Request) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments({});

    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const syncedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const finalStates = ['cancelled', 'failed', 'expired'];

        if (!finalStates.includes(booking.status)) {
          // held, processing, issued -> সব চেক হবে
          return await syncSingleBooking(booking);
        }

        return booking;
      }),
    );

    const now = new Date();

    const formattedData = syncedBookings.map((booking: any) => {
      // এখানে bug ছিল: deadline না থাকলে true করছিলে → সব held কে expired দেখাচ্ছিল
      const isPaymentExpired = booking.paymentDeadline
        ? new Date(booking.paymentDeadline) < now
        : false;

      const flight = booking.flightDetails || {};
      const pricing = booking.pricing || {};
      const contact = booking.contact || {};
      const paymentInfo = booking.paymentInfo || {};

      // 📎 Ticket Shortcut
      const ticketLink =
        booking.status === 'issued' && booking.documents?.length > 0
          ? booking.documents[0]?.url || null
          : null;

      // 🔐 Card Masking Logic (Improved Safety)
      let maskedCard = 'N/A';
      let cardHolder = 'N/A';

      if (paymentInfo && paymentInfo.cardNumber) {
        try {
          const realNum = decrypt(paymentInfo.cardNumber);
          if (realNum && realNum.length >= 4) {
            maskedCard = `**** ${realNum.slice(-4)}`;
          } else {
            maskedCard = '**** (Invalid)';
          }
        } catch (e) {
          console.error('Decryption Error:', e);
          maskedCard = '**** (Error)';
        }
      }

      if (paymentInfo && paymentInfo.cardName) {
        cardHolder = paymentInfo.cardName;
      }

      const effectiveStatus =
        booking.status === 'held' && isPaymentExpired
          ? 'expired'
          : booking.status;

      return {
        // --- Identifiers ---
        id: booking._id.toString(),
        bookingRef: booking.bookingReference || 'N/A',
        pnr: booking.pnr || '---',

        // --- Status Logic ---
        status: effectiveStatus,

        // --- ✈️ Flight Details ---
        flight: {
          airline: flight.airline || 'Unknown',
          flightNumber: flight.flightNumber || '',
          route: flight.route || 'Unknown Route',
          date: flight.departureDate || null,
          duration: flight.duration || '',
          tripType: flight.flightType || 'one_way',
          logoUrl: flight.logoUrl || null,
        },

        // --- Passenger Info ---
        passengerName: booking.passengers?.[0]
          ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
          : 'Guest',
        passengerCount: booking.passengers?.length || 0,

        // --- 📞 Contact Info ---
        contact: {
          email: contact.email || 'N/A',
          phone: contact.phone || 'N/A',
        },

        // --- 💳 Payment Source Info ---
        paymentSource: {
          holderName: cardHolder,
          cardLast4: maskedCard,
        },

        // --- Money ---
        amount: {
          total: pricing.total_amount || 0,
          markup: pricing.markup || 0,
          currency: pricing.currency || 'USD',
          base_amount: pricing.base_amount || 0,
        },

        // --- Timings ---
        timings: {
          deadline: booking.paymentDeadline,
          createdAt: booking.createdAt,
          timeLeft: booking.paymentDeadline
            ? new Date(booking.paymentDeadline).getTime() - now.getTime()
            : 0,
        },

        // --- Actions ---
        actionData: {
          ticketUrl: ticketLink,
        },
        updatedAt: booking.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      meta: {
        total: totalBookings,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalBookings / limit),
      },
      data: formattedData,
    });
  } catch (error: any) {
    console.error('GET Bookings Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}