export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { searchSchema } from './validation';
import { calculateMarkup, formatDuration, MAX_RESULT_LIMIT } from './utils';

const calculateLayover = (arrival: string, departure: string) => {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.round(((diffMs % 3600000) / 60000));
  return `${diffHrs}h ${diffMins}m`;
};

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = searchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid Data" }, { status: 400 });
    }

    const data = validation.data;
    
    // Passengers Setup
    const passengers: any[] = [];
    for (let i = 0; i < (data.passengers?.adults || 1); i++) passengers.push({ type: 'adult' });
    if (data.passengers?.children) for (let i = 0; i < data.passengers.children; i++) passengers.push({ type: 'child' });
    if (data.passengers?.infants) for (let i = 0; i < data.passengers.infants; i++) passengers.push({ type: 'infant_without_seat' });

    // Slices Setup
    const slices: any[] = [];
    if (data.type === 'multi_city' && data.flights) {
      data.flights.forEach(flight => slices.push({ origin: flight.origin, destination: flight.destination, departure_date: flight.date }));
    } else {
      slices.push({ origin: data.origin, destination: data.destination, departure_date: data.departureDate });
      if (data.type === 'round_trip' && data.returnDate) {
        slices.push({ origin: data.destination, destination: data.origin, departure_date: data.returnDate });
      }
    }

    const offerRequest = await duffel.offerRequests.create({
      slices, passengers, cabin_class: data.cabinClass as any, return_offers: true,
    });

    if (!offerRequest.data.offers || offerRequest.data.offers.length === 0) {
      return NextResponse.json({ success: true, data: [], message: "No flights found." });
    }

    // --- MAPPING DATA ---
    const cleanOffers = offerRequest.data.offers.slice(0, MAX_RESULT_LIMIT).map((offer: any) => {
      const priceDetails = calculateMarkup(offer.total_amount, offer.total_currency);

      // 🟢 FIX: Baggage Logic (PC to KG Conversion)
      let baggageInfo = "1 PC = 23KG"; // Default Fallback
      try {
        const allSegments = offer.slices.flatMap((s: any) => s.segments);
        const segmentWithBag = allSegments.find((s: any) => s.passengers?.[0]?.baggages?.some((b: any) => b.type === 'checked'));
        
        if (segmentWithBag) {
            const bag = segmentWithBag.passengers[0].baggages.find((b: any) => b.type === 'checked');
            
            if (bag.quantity) {
                // Calculation: 1 PC = 23KG standard
                const weight = bag.quantity * 23;
                baggageInfo = `${bag.quantity} PC (${weight} KG Approx.)`;
            }
        } 
      } catch (e) {
          // If extraction fails, keep default
      }

      // Cabin Class Extraction
      let cabinClassInfo = data.cabinClass || "Economy";
      try {
          const firstSegClass = offer.slices[0].segments[0].passengers[0].cabin_class_marketing_name;
          if (firstSegClass) cabinClassInfo = firstSegClass;
          else if (offer.slices[0].segments[0].passengers[0].cabin_class) {
              cabinClassInfo = offer.slices[0].segments[0].passengers[0].cabin_class;
          }
      } catch (e) {}

      // Map Itinerary
      const itinerary = offer.slices.map((slice: any, sliceIndex: number) => {
        const segments = slice.segments.map((seg: any, i: number, arr: any[]) => {
          let layover = null;
          if (i < arr.length - 1) {
            layover = calculateLayover(seg.arriving_at, arr[i + 1].departing_at);
          }
          return {
            id: seg.id,
            airline: seg.marketing_carrier?.name || "Airline",
            airlineCode: seg.marketing_carrier?.iata_code,
            logo: seg.marketing_carrier?.logo_symbol_url,
            flightNumber: seg.marketing_carrier_flight_number,
            aircraft: seg.aircraft?.name || "Aircraft",
            classType: seg.passengers?.[0]?.cabin_class_marketing_name || cabinClassInfo,
            departure: { airport: seg.origin?.name, code: seg.origin?.iata_code, time: seg.departing_at },
            arrival: { airport: seg.destination?.name, code: seg.destination?.iata_code, time: seg.arriving_at },
            duration: formatDuration(seg.duration),
            layoverToNext: layover,
          };
        });

        let layoverSummary = segments.length > 1 ? `${segments[0].layoverToNext} in ${segments[0].arrival.code}` : null;
        let directionLabel = data.type === 'round_trip' ? (sliceIndex === 0 ? "Outbound" : "Inbound") : `Flight`;

        return {
          id: slice.id,
          direction: directionLabel,
          totalDuration: formatDuration(slice.duration),
          stops: slice.segments.length - 1,
          layoverInfo: layoverSummary,
          segments,
          mainDeparture: segments[0].departure,
          mainArrival: segments[segments.length - 1].arrival,
          mainAirline: segments[0].airline,
          mainLogo: segments[0].logo,
        };
      });

      return {
        id: offer.id,
        token: offer.id,
        carrier: { name: offer.owner?.name, logo: offer.owner?.logo_symbol_url, code: offer.owner?.iata_code },
        itinerary,
        price: priceDetails,
        baggage: baggageInfo, 
        cabinClass: cabinClassInfo,
        conditions: {
          refundable: offer.conditions?.refund_before_departure?.allowed || false,
          changeable: offer.conditions?.change_before_departure?.allowed || false,
        },
      };
    });

    return NextResponse.json({ success: true, meta: { count: cleanOffers.length }, data: cleanOffers });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}