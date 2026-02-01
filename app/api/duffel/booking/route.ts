import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { decrypt, encrypt, generateBookingReference } from './utils';
import Booking from '@/models/Booking.model';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  let newBookingId = null;

  try {
    // 🟢 1. Connect DB & Parse Input
    await dbConnect();
    const body = await request.json();
    const { offer_id, contact, passengers, payment, flight_details, pricing } = body;

    // --- Route Logic Fix (Round Trip / Multi City) ---
    let finalRoute = flight_details.route;
    if (flight_details.flightType === 'round_trip' && !finalRoute.includes('|')) {
        const locations = finalRoute.split('➝').map((s: string) => s.trim());
        if (locations.length === 2) {
            finalRoute = `${locations[0]} ➝ ${locations[1]} | ${locations[1]} ➝ ${locations[0]}`;
        }
    }

    // Capture customer total immediately
    const customerTotalAmount = Number(pricing.total_amount);

    // 🟢 2. Security & Reference Generation
    const bookingRef = generateBookingReference();
    const encryptedCardNumber = encrypt(payment.cardNumber);
    const encryptedCVV = encrypt(payment.cvv);

    // 🟢 3. Database First: Create Initial Record
    const newBooking = await Booking.create({
      bookingReference: bookingRef,
      offerId: offer_id,
      contact,

      // Save Passengers (Ensure Passport Country is Saved)
      passengers: passengers.map((p: any) => ({
        ...p,
        passportCountry: p.passportCountry || 'BD', // Default to BD if missing
      })),

      flightDetails: {
        airline: flight_details.airline,
        flightNumber: flight_details.flightNumber,
        route: finalRoute, // Updated Route
        departureDate: flight_details.departureDate,
        arrivalDate: flight_details.arrivalDate,
        duration: flight_details.duration,
        flightType: flight_details.flightType, // flightType save kora holo
      },

      pricing: {
        currency: pricing.currency || 'USD',
        total_amount: customerTotalAmount,
        markup: 0, // Updated after Duffel response
      },

      paymentInfo: {
        cardName: payment.cardName,
        cardNumber: encryptedCardNumber,
        expiryDate: payment.expiryDate,
        cvv: encryptedCVV,
        billingAddress: payment.billingAddress,
      },

      documents: [],
      airlineInitiatedChanges: null,
      
      status: 'processing',
      isLiveMode: false,
    });

    newBookingId = newBooking._id;

    // 🟢 4. Duffel Payload (With Correct Passport & Infant Logic)
    const duffelPassengers = passengers.map((p: any) => {
      const passengerData: any = {
        id: p.id,
        type: p.type, // Needed for filtering below, removed later
        given_name: p.firstName,
        family_name: p.lastName,
        gender: p.gender === 'male' ? 'm' : 'f',
        title: p.title.toLowerCase(),
        born_on: p.dob,
        email: p.email || contact.email,
        phone_number: p.phone || contact.phone,
      };

      // ✅ FIXED: Passport Country Logic
      if (p.passportNumber) {
        passengerData.identity_documents = [{
          unique_identifier: `ID-${Math.random().toString(36).substr(2, 9)}`,
          type: 'passport',
          number: p.passportNumber,
          expires_on: p.passportExpiry,
          issuing_country_code: p.passportCountry || 'US' // ✅ Duffel field correctly mapped
        }];
      }
      return passengerData;
    });

    // --- Infant Association Logic ---
    const infants = duffelPassengers.filter((p: any) => p.type === 'infant_without_seat');
    const adults = duffelPassengers.filter((p: any) => p.type === 'adult');

    if (infants.length > adults.length) {
      throw new Error("Not enough adults for infants. Each infant needs an adult lap.");
    }

    infants.forEach((infant: any, index: number) => {
      const assignedAdult = adults[index];
      if (assignedAdult) {
        assignedAdult.infant_passenger_id = infant.id;
      }
    });

    // Remove 'type' field as Duffel Create Order doesn't need it in payload
    const finalDuffelPayload = duffelPassengers.map(({ type, ...rest }: any) => rest);

    // 🟢 5. Call Duffel API (Create Hold Order)
    try {
      const order = await duffel.orders.create({
        type: 'pay_later',
        selected_offers: [offer_id],
        passengers: finalDuffelPayload,
      });

 
      // 6. Calculate Markup
      const duffelActualCost = Number(order.data.total_amount);
      const calculatedMarkup = customerTotalAmount - duffelActualCost;

      // 7. Update Database
      await Booking.findByIdAndUpdate(newBookingId, {
        duffelOrderId: order.data.id,
        pnr: order.data.booking_reference,
        paymentDeadline: order.data.payment_status.payment_required_by,
        priceExpiry: order.data.payment_status.price_guarantee_expires_at,

        pricing: {
          currency: order.data.total_currency,
          total_amount: customerTotalAmount,
          markup: Number(calculatedMarkup.toFixed(2)),
          // base_amount removed if not in schema, logic kept clean
          base_amount: duffelActualCost,
        },

        isLiveMode: order.data.live_mode,
        documents: order.data.documents || [],
        airlineInitiatedChanges: order.data.airline_initiated_changes || [],
        
        status: 'held',
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        bookingId: newBookingId,
        reference: bookingRef,
        pnr: order.data.booking_reference,
        expiry: order.data.payment_status.payment_required_by,
      });
} catch (duffelError: any) {

    const error = duffelError.errors?.[0];
    let errorMessage = "Something went wrong. Please try again.";


    if (error?.code === 'offer_no_longer_available') {
        errorMessage = "This flight is no longer available at this price. Please search again for the latest flights.";
    } else if (error?.message) {
        errorMessage = error.message;
    }


    if (newBookingId) {
        await Booking.findByIdAndUpdate(newBookingId, {
            status: 'failed',
            adminNotes: errorMessage,
        });
    }

    return NextResponse.json({
        success: false,
        message: errorMessage,
        code: error?.code
    }, { status: 400 });
}}
     catch (error: any) {
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return NextResponse.json({
            success: false,
            message: `Duplicate entry found for ${field}. Please try again.`,
            errorType: 'DUPLICATE_ERROR'
        }, { status: 409 }); // 409 = Conflict
    }


    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return NextResponse.json({
            success: false,
            message: messages[0], 
            errorType: 'VALIDATION_ERROR'
        }, { status: 400 });
    }


    return NextResponse.json({
        success: false,
        message: error.message || 'Internal Server Error',
        errorType: 'SERVER_ERROR'
    }, { status: 500 });
}
}


// --- 🛡️ Rate Limiter ---
const rateLimitMap = new Map();
function isRateLimited(ip: string) {
  const windowMs = 60 * 1000;
  const maxRequests = 20; 
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, startTime: now };
  if (now - clientData.startTime > windowMs) {
    clientData.count = 1;
    clientData.startTime = now;
  } else { clientData.count++; }
  rateLimitMap.set(ip, clientData);
  return clientData.count > maxRequests;
}

// --- 🔄 Smart Sync Function ---
async function syncSingleBooking(booking: any) {
  if (!booking.duffelOrderId || ['cancelled', 'failed', 'expired', 'issued'].includes(booking.status)) {
    return booking;
  }
  try {
    const order = await duffel.orders.get(booking.duffelOrderId) as any
    const updates: any = {
      paymentDeadline: order.data.payment_status.payment_required_by,
    };

    if (order.data.cancelled_at) {
      updates.status = 'cancelled';
    } else if (order.data.documents?.length > 0) {
      updates.status = 'issued';
      updates.documents = order.data.documents;
    } else if (booking.status === 'processing' && !order.data.documents?.length) {
      updates.status = 'held';
    }
    return await Booking.findByIdAndUpdate(booking._id, updates, { new: true }).lean();
  } catch (error) {
    return booking;
  }
}

// --- 🚀 Main API Handler ---
export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    if (isRateLimited(ip)) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }

    await dbConnect();


    const allBookings = await Booking.find({})
      .select('-paymentInfo.cvv')
      .sort({ createdAt: -1 })
      .lean();


    const syncedBookings = await Promise.all(
      allBookings.map(async (booking) => {
        if (booking.status === 'held' || booking.status === 'processing') {
          return await syncSingleBooking(booking);
        }
        return booking;
      })
    );

    const now = new Date();
    
    const formattedData = syncedBookings.map((booking: any) => {
      const isPaymentExpired = booking.paymentDeadline 
        ? new Date(booking.paymentDeadline) < now 
        : true;

      // Safe Access
      const flight = booking.flightDetails || {};
      const pricing = booking.pricing || {};
      const contact = booking.contact || {};
      const paymentInfo = booking.paymentInfo || {}; // 🟢 Payment info access

      // 📎 Ticket Shortcut
      const ticketLink = (booking.status === 'issued' && booking.documents?.length > 0)
        ? booking.documents[0]?.url || "https://www.mazaharul.site/resume_mazaharul_islam.pdf"
        : null;

      // 🔐 Card Masking Logic (New)
      let maskedCard = "N/A";
      if (paymentInfo.cardNumber) {
        try {
            const realNum = decrypt(paymentInfo.cardNumber);
            maskedCard = `**** ${realNum.slice(-4)}`;
        } catch (e) {
            maskedCard = "**** (Encrypted)";
        }
      }

      return {
        // --- Identifiers ---
        id: booking._id.toString(),
        bookingRef: booking.bookingReference || "N/A",
        pnr: booking.pnr || "---",
        
        // --- Status Logic ---
        status: (booking.status === 'held' && isPaymentExpired) ? 'expired' : booking.status,
        
        // --- ✈️ Flight Details ---
        flight: {
          airline: flight.airline || "Unknown",
          flightNumber: flight.flightNumber || "",
          route: flight.route || "Unknown Route",
          date: flight.departureDate || new Date().toISOString(),
          duration: flight.duration || "",
          tripType: flight.flightType || "one_way"
        },
        
        // --- Passenger Info ---
        passengerName: booking.passengers?.[0] 
          ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` 
          : 'Guest',
        passengerCount: booking.passengers?.length || 0,

        // --- 📞 Contact Info ---
        contact: {
          email: contact.email || "N/A",
          phone: contact.phone || "N/A"
        },

        // --- 💳 Payment Source Info (🟢 NEW ADDED) ---
        paymentSource: {
          holderName: paymentInfo.cardName || "N/A",
          cardLast4: maskedCard // এক্সাম্পল: **** 1234
        },

        // --- Money ---
        amount: {
          total: pricing.total_amount || 0,
          markup: pricing.markup || 0,
          currency: pricing.currency || 'USD',
          base_amount: pricing.base_amount || 0 // 🟢 Added base_amount as requested
        },

        // --- Timings ---
        timings: {
          deadline: booking.paymentDeadline,
          createdAt: booking.createdAt,
          timeLeft: booking.paymentDeadline 
            ? new Date(booking.paymentDeadline).getTime() - now.getTime() 
            : 0
        },

        // --- Actions ---
        actionData: {
          ticketUrl: ticketLink
        }
      };
    });

    return NextResponse.json({ 
      success: true, 
      count: formattedData.length, 
      data: formattedData 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}