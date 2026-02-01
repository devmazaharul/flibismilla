import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../utils';

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await dbConnect();
    const booking = await Booking.findById(id).lean();

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    // Duffel Fetch
    let duffelOrder;
    try {
      const res = await duffel.orders.get(booking.duffelOrderId);
      duffelOrder = res.data;
    } catch (error) {
      return NextResponse.json({ success: false, message: "Duffel connection failed" }, { status: 502 });
    }

    // Payment Decryption
    let securePaymentInfo = null;
    if (booking.paymentInfo?.cardNumber) {
      try {
        securePaymentInfo = {
          holderName: booking.paymentInfo.cardName,
          cardNumber: decrypt(booking.paymentInfo.cardNumber),
          expiryDate: booking.paymentInfo.expiryDate,
          cvv: booking.paymentInfo.cvv || "N/A",
          billingAddress: booking.paymentInfo.billingAddress
        };
      } catch (e) {
        securePaymentInfo = { error: "Decryption Failed" };
      }
    }

    // Flight Segments
    const flightSegments = duffelOrder.slices.map((slice: any) => {
      return slice.segments.map((segment: any) => ({
        airline: segment.operating_carrier.name,
        airlineCode: segment.operating_carrier.iata_code,
        flightNumber: segment.operating_carrier_flight_number,
        aircraft: segment.aircraft?.name || "Boeing/Airbus",
        origin: segment.origin.iata_code,
        originCity: segment.origin.city_name,
        departingAt: segment.departing_at,
        destination: segment.destination.iata_code,
        destinationCity: segment.destination.city_name,
        arrivingAt: segment.arriving_at,
        duration: segment.duration,
        cabinClass: slice.conditions?.change_before_departure?.penalty_currency ? "Economy" : "Business",
        baggage: segment.passengers?.[0]?.baggages?.[0]?.quantity || "Check Airline",
      }));
    }).flat();

    // Passengers
    const passengers = duffelOrder.passengers.map((p: any) => ({
      id: p.id,
      type: p.type, 
      fullName: `${p.given_name} ${p.family_name}`,
      ticketNumber: duffelOrder.documents?.find((doc: any) => 
        doc.unique_identifier && doc.unique_identifier.includes(p.id)
      )?.unique_identifier || "Not Issued"
    }));

    // Finance
    const financialOverview = {
      basePrice: duffelOrder.base_amount,
      tax: duffelOrder.tax_amount,
      duffelTotal: duffelOrder.total_amount,
      yourMarkup: booking.pricing.markup,
      clientTotal: booking.pricing.total_amount,
      currency: duffelOrder.total_currency
    };

    // 🟢 SMART POLICY LOGIC (Fixing the Conflict)
    const conditions = duffelOrder.conditions || duffelOrder.slices?.[0]?.conditions;
    const actions = duffelOrder.available_actions || [];

    const getPolicyInfo = (type: 'refund' | 'change') => {
        const rule = type === 'refund' ? conditions?.refund_before_departure : conditions?.change_before_departure;
        
        // Check both specific rule AND general available actions
        const isActionAvailable = type === 'change' ? actions.includes('change') : false; // Only strict check for change
        
        // If rule says NOT allowed, AND action is NOT available -> It's really not allowed
        if (!rule?.allowed && !isActionAvailable) {
            return {
                allowed: false,
                penalty: "N/A",
                note: "Not Allowed (Non-Refundable)",
                timeline: "N/A"
            };
        }

        // If Allowed (Either by rule OR by available_actions override)
        const penaltyAmount = rule?.penalty_amount 
            ? `${rule.penalty_amount} ${rule.penalty_currency}` 
            : (isActionAvailable ? "Check Fee" : "Free"); 

        return {
            allowed: true,
            penalty: penaltyAmount,
            note: type === 'refund' 
                ? `Refundable with ${penaltyAmount} fee` 
                : `Changeable (Fee: ${penaltyAmount} + Fare Diff)`,
            timeline: type === 'refund' 
                ? "7-15 Working Days" 
                : "Instant"
        };
    };

    const policies = {
        cancellation: getPolicyInfo('refund'),
        dateChange: getPolicyInfo('change')
    };

    // Final Response
    const fullDetails = {
      id: booking._id,
      bookingRef: booking.bookingReference,
      pnr: duffelOrder.booking_reference,
      status: booking.status,
      availableActions: actions,
      policies: policies,
      tripType: booking.flightDetails?.flightType || "one_way",
      segments: flightSegments,
      contact: booking.contact,
      passengers: passengers,
      finance: financialOverview,
      paymentSource: securePaymentInfo,
      documents: booking.documents || []
    };

    return NextResponse.json({ success: true, data: fullDetails });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}