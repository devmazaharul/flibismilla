export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api'; 
import { searchSchema } from './validation';
import { calculatePriceWithMarkup, checkRateLimit } from './utils';

// ------------------------------------------------------------------
// 🛡️ SECURITY: RATE LIMITER
// ------------------------------------------------------------------



// ✅ 1. Advanced Duration Parser (Fixes P1DT10H -> 1d 10h)
const parseDuration = (duration: string | null) => {
  if (!duration) return "--";
  
  // Normalize string
  const isoString = duration.toUpperCase();

  // Extract parts using Regex
  const daysMatch = isoString.match(/(\d+)D/);
  const hoursMatch = isoString.match(/(\d+)H/);
  const minutesMatch = isoString.match(/(\d+)M/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}m`);

  return parts.join(' ');
};

// ✅ 2. Smart Baggage Formatter (Adds Approx Weight)
const formatBaggage = (bag: any) => {
    if (!bag) return "Cabin Bag Only";

    // Priority 1: Exact Weight from API
    if (bag.weight) {
        return `${bag.quantity || 1} Bag (${bag.weight}kg)`;
    }

    // Priority 2: Quantity Only (Estimate 23kg standard)
    if (bag.quantity) {
        const qty = bag.quantity;
        const approxWeight = qty * 23; 
        return `${qty} Bag${qty > 1 ? 's' : ''} (${approxWeight}kg approx)`;
    }

    return "Check Rules";
};


// ------------------------------------------------------------------
// ⚙️ CONFIG
// ------------------------------------------------------------------
const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: false, error: "Too many requests. Slow down." }, { status: 429 });
    }

    // 2. Validation
    const body = await req.json();
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid Data" }, { status: 400 });
    }
    const { origin, destination, departureDate, returnDate, passengers: pax, cabinClass, type } = validation.data;

    // 3. Prepare Duffel Params
    const passengers: any[] = [];
    Array.from({ length: pax?.adults || 1 }).forEach(() => passengers.push({ type: 'adult' }));
    if (pax?.children) Array.from({ length: pax.children }).forEach(() => passengers.push({ type: 'child' }));
    if (pax?.infants) Array.from({ length: pax.infants }).forEach(() => passengers.push({ type: 'infant_without_seat' }));

    const slices: any[] = [];
    if (type === 'multi_city' && body.flights) {
      body.flights.forEach((f: any) => slices.push({ origin: f.origin, destination: f.destination, departure_date: f.date }));
    } else {
      slices.push({ origin, destination, departure_date: departureDate });
      if (type === 'round_trip' && returnDate) {
        slices.push({ origin: destination, destination: origin, departure_date: returnDate });
      }
    }

    // 4. API Call
    const offerRequest = await duffel.offerRequests.create({
      slices, 
      passengers, 
      cabin_class: cabinClass as any, 
      return_offers: true,
    });

    const rawOffers = offerRequest.data.offers || [];
 

    // 5. 🟢 ENTERPRISE DATA MAPPING
    const cleanOffers = rawOffers.map((offer: any) => {
      
      // A. Price Calculation
      const priceDetails = calculatePriceWithMarkup(offer.total_amount, offer.total_currency);

      // B. Baggage Logic (Global for offer)
      let baggageInfo = "Cabin Bag Only";
      try {
        const firstSegment = offer.slices[0].segments[0];
        const bagData = firstSegment.passengers?.[0]?.baggages?.find((b: any) => b.type === 'checked');
        if (bagData) baggageInfo = formatBaggage(bagData); // Using helper function
      } catch (e) {}

      // C. Itinerary Mapping
      const itinerary = offer.slices.map((slice: any, index: number) => {
        const segments = slice.segments.map((seg: any, i: number, arr: any[]) => {
          
          // Layover Calculation
          let layover = null;
          if (i < arr.length - 1) {
            const arrTime = new Date(seg.arriving_at).getTime();
            const depTime = new Date(arr[i + 1].departing_at).getTime();
            const diffMins = (depTime - arrTime) / 60000;
            const h = Math.floor(diffMins / 60);
            const m = Math.floor(diffMins % 60);
            layover = `${h}h ${m}m`;
          }

          // 🟢 Amenities Extraction (Simulated/Mapped)
          // Duffel search doesn't explicitly return "Wifi: true". We infer from aircraft/class.
          const amenities = [
             seg.aircraft?.name ? `Aircraft: ${seg.aircraft.name}` : null,
             "In-flight Meal", // Standard for intl flights (Assumption)
             "USB Power"       // Standard for modern aircraft (Assumption)
          ].filter(Boolean);

          return {
            id: seg.id,
            airline: seg.marketing_carrier?.name,
            logo: seg.marketing_carrier?.logo_symbol_url,
            flightNumber: `${seg.marketing_carrier?.iata_code} ${seg.marketing_carrier_flight_number}`,
            aircraft: seg.aircraft?.name || "Aircraft",
            classType: seg.passengers?.[0]?.cabin_class_marketing_name || cabinClass,
            
            departure: { 
                airport: seg.origin?.name, 
                code: seg.origin?.iata_code, 
                time: seg.departing_at 
            },
            arrival: { 
                airport: seg.destination?.name, 
                code: seg.destination?.iata_code, 
                time: seg.arriving_at 
            },
            
            duration: parseDuration(seg.duration), // ✅ Fixed P1DT10H
            layoverToNext: layover,
            amenities: amenities // ✅ Added Amenities
          };
        });

        return {
          id: slice.id,
          direction: type === 'round_trip' ? (index === 0 ? "Outbound" : "Inbound") : `Flight ${index + 1}`,
          totalDuration: parseDuration(slice.duration), // ✅ Fixed P1DT10H
          stops: slice.segments.length - 1,
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
        carrier: { 
            name: offer.owner?.name, 
            logo: offer.owner?.logo_symbol_url, 
            code: offer.owner?.iata_code 
        },
        itinerary,
        price: priceDetails,
        baggage: baggageInfo,
        cabinClass: cabinClass,
        conditions: {
          refundable: !offer.conditions?.refund_before_departure?.allowed ? false : true,
          changeable: !offer.conditions?.change_before_departure?.allowed ? false : true,
        },
        expires_at: offer.expires_at
      };
    });

    return NextResponse.json({ 
        success: true, 
        meta: { count: cleanOffers.length }, 
        data: cleanOffers 
    });

  } catch (error: any) {
    console.error("Search Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch flights." }, { status: 500 });
  }
}