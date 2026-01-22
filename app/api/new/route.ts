import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { searchSchema } from './validation';
import { calculateMarkup, formatDuration, MAX_RESULT_LIMIT } from './utils';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 1. Validation
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid search data", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const data = validation.data;
    
    // 2. Build Passenger Array (Correct Logic)
    const passengers: any[] = [];
    for (let i = 0; i < (data.passengers?.adults || 1); i++) passengers.push({ type: 'adult' });
    if (data.passengers?.children) {
        for (let i = 0; i < data.passengers.children; i++) passengers.push({ type: 'child' });
    }
    if (data.passengers?.infants) {
        for (let i = 0; i < data.passengers.infants; i++) passengers.push({ type: 'infant_without_seat' });
    }

    // 3. Build Slices (Flight Legs)
    const slices: any[] = [];
    if (data.type === 'multi_city' && data.flights) {
      data.flights.forEach(flight => {
        slices.push({
          origin: flight.origin,
          destination: flight.destination,
          departure_date: flight.date
        });
      });
    } else {
      // One Way & Round Trip
      slices.push({
        origin: data.origin,
        destination: data.destination,
        departure_date: data.departureDate
      });
      if (data.type === 'round_trip' && data.returnDate) {
        slices.push({
          origin: data.destination,
          destination: data.origin,
          departure_date: data.returnDate
        });
      }
    }

    // 4. Call Duffel API
    const offerRequest = await duffel.offerRequests.create({
      slices: slices,
      passengers: passengers,
      cabin_class: data.cabinClass as any,
      return_offers: true, 
    });

    // Handle Empty Results
    if (!offerRequest.data.offers || offerRequest.data.offers.length === 0) {
      return NextResponse.json({ success: true, data: [], message: "No flights found matching your criteria." });
    }

    // 5. Map & Clean Data
    const cleanOffers = offerRequest.data.offers.slice(0, MAX_RESULT_LIMIT).map((offer) => {
      
      // Calculate Price with 5% Markup
      const priceDetails = calculateMarkup(offer.total_amount, offer.total_currency);

      // Extract Baggage (Safe Check)
  

      // Map Itinerary
      const itinerary = offer.slices.map((slice, sliceIndex) => {
        const segments = slice.segments.map((seg) => ({
          id: seg.id,
          // Fallback to operating carrier if marketing is missing
          airline: seg.marketing_carrier?.name || seg.operating_carrier?.name || "Airline",
          airlineCode: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code,
          logo: seg.marketing_carrier?.logo_symbol_url || seg.operating_carrier?.logo_symbol_url,
          flightNumber: seg.marketing_carrier_flight_number || seg.operating_carrier_flight_number,
          aircraft: seg.aircraft?.name || "Aircraft",
          // Cabin Class Name
          classType: seg.passengers?.[0]?.cabin_class_marketing_name || data.cabinClass,
          
          departure: {
            airport: seg.origin?.name,
            code: seg.origin?.iata_code,
            time: seg.departing_at,
            terminal: seg.origin_terminal,
          },
          arrival: {
            airport: seg.destination?.name,
            code: seg.destination?.iata_code,
            time: seg.arriving_at,
            terminal: seg.destination_terminal,
          },
          duration: formatDuration(seg.duration),
        }));

        // Direction Label
        let directionLabel = "Flight";
        if (data.type === 'round_trip') directionLabel = sliceIndex === 0 ? "Outbound" : "Inbound";
        else if (data.type === 'multi_city') directionLabel = `Leg ${sliceIndex + 1}`;

        return {
          id: slice.id,
          direction: directionLabel,
          totalDuration: formatDuration(slice.duration),
          stops: slice.segments.length - 1,
          segments: segments,
          mainDeparture: segments[0].departure,
          mainArrival: segments[segments.length - 1].arrival,
          mainAirline: segments[0].airline,
          mainLogo: segments[0].logo,
        };
      });

      return {
        id: offer.id,
        token: offer.id,
        carrier: {
          name: offer.owner?.name || "Unknown Airline",
          logo: offer.owner?.logo_symbol_url,
          code: offer.owner?.iata_code
        },
        itinerary: itinerary,
        price: priceDetails,
        conditions: {
          refundable: offer.conditions?.refund_before_departure?.allowed || false,
          changeable: offer.conditions?.change_before_departure?.allowed || false,
        },
      };
    });

    return NextResponse.json({
      success: true,
      meta: { count: cleanOffers.length, type: data.type },
      data: cleanOffers
    });

  } catch (error: any) {
    // Better Error Message for Frontend
    const message = error.errors?.[0]?.message || error.message || "Failed to fetch flights. Please try again.";
    
    return NextResponse.json({ 
        success: false, 
        error: message 
    }, { status: 500 });
  }
}