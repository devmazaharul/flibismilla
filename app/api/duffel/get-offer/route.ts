export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { COMMISION_RATE } from '@/constant/control';

// ------------------------------------------------------------------
// ⚙️ CONFIGURATION
// ------------------------------------------------------------------
const COMMISSION_PERCENTAGE = COMMISION_RATE; // এখানে 5 দিলে ৫% লাভ হবে

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN as string,
});

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS (UTILITIES)
// ------------------------------------------------------------------

// 1. Safe Duration Parser (ISO String "PT4H30M" -> "4h 30m")
const parseDuration = (duration: string | null | undefined) => {
  if (!duration) return "--";
  return duration
    .replace('PT', '')
    .replace('H', 'h ')
    .replace('M', 'm')
    .toLowerCase()
    .trim();
};

// 2. Price Calculation with Commission Constant
const calculatePriceWithMarkup = (amount: string | null | undefined, currency: string | undefined) => {
  if (!amount) return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };
  
  const basePrice = parseFloat(amount);
  const markup = basePrice * (COMMISSION_PERCENTAGE / 100); 
  const finalPrice = Math.ceil(basePrice + markup);

  return {
    currency: currency || 'USD',
    basePrice: Number(basePrice.toFixed(2)),
    markup: Number(markup.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
};

// 3. Cabin Class Extractor (Checks deeply nested objects)
const getCabinClass = (slices: any[]) => {
  try {
    const rawClass = slices[0]?.segments[0]?.passengers?.[0]?.cabin_class_marketing_name 
                  || slices[0]?.segments[0]?.passengers?.[0]?.cabin_class 
                  || "Economy";
    
    // Capitalize: "economy" -> "Economy"
    return rawClass.charAt(0).toUpperCase() + rawClass.slice(1);
  } catch (e) {
    return "Economy";
  }
};

// 4. Baggage Info Extractor (Iterates all segments to find checked bags)
const getBaggageInfo = (slices: any[]) => {
  try {
    for (const slice of slices) {
      if (!slice.segments) continue;
      for (const segment of slice.segments) {
        const bags = segment.passengers?.[0]?.baggages;
        if (Array.isArray(bags) && bags.length > 0) {
          const checkedBag = bags.find((b: any) => b.type === 'checked');
          if (checkedBag) {
            return `${checkedBag.quantity} Checked Bag(s)`;
          }
        }
      }
    }
    return "Cabin Baggage Only"; 
  } catch (e) {
    return "Check Airline Rules";
  }
};

// ------------------------------------------------------------------
// 🚀 MAIN API HANDLER (GET)
// ------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let offerId = searchParams.get('offer_id');

  // 🛡️ SECURITY 1: Basic Validation
  if (!offerId) {
    return NextResponse.json({ success: false, error: 'Offer ID is missing' }, { status: 400 });
  }

  // 🛡️ SECURITY 2: Clean ID (Fixes 422 Error from spaces)
  offerId = offerId.trim();

  // 🛡️ SECURITY 3: Format Check
  if (!offerId.startsWith('off_')) {
    return NextResponse.json({ success: false, error: 'Invalid Offer ID format.' }, { status: 422 });
  }

  try {
    // 📡 FETCH FROM DUFFEL
    // console.log(`🔍 Fetching: ${offerId}`); // Debug Log (Optional)
    const offer = await duffel.offers.get(offerId);

    if (!offer.data) {
      throw new Error("Empty data received from Duffel");
    }

    const data = offer.data;

    // 💰 PROCESS CALCULATIONS
    const pricing = calculatePriceWithMarkup(data.total_amount, data.total_currency);
    const cabinClass = getCabinClass(data.slices);
    const baggageInfo = getBaggageInfo(data.slices);

    // 🗺️ PROCESS ITINERARY (Critical Logic for Multi-City)
    const itinerary = data.slices.map((slice: any, index: number) => {
      const segments = slice.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const totalSlices = data.slices.length;

      // 🧠 DYNAMIC DIRECTION LOGIC
      let directionLabel = "One Way";
      if (totalSlices === 2) {
        directionLabel = index === 0 ? 'Outbound' : 'Inbound';
      } else if (totalSlices > 2) {
        directionLabel = `Flight ${index + 1}`; // Multi-City
      }

      // 🛡️ FALLBACK DATA (Prevents "undefined" errors)
      return {
        direction: directionLabel,
        
        // Airline Name Handling
        mainAirline: firstSegment.operating_carrier?.name || "Airline",
        
        // Logo Handling (Frontend will handle null)
        mainLogo: firstSegment.operating_carrier?.logo_symbol_url || null,
        
        mainDeparture: {
          code: firstSegment.origin?.iata_code || "UNK",
          // Fallback: City Name -> Airport Name -> "Unknown"
          city: firstSegment.origin?.city_name || firstSegment.origin?.name || "Unknown City",
          time: firstSegment.departing_at,
        },
        mainArrival: {
          code: lastSegment.destination?.iata_code || "UNK",
          city: lastSegment.destination?.city_name || lastSegment.destination?.name || "Unknown City",
          time: lastSegment.arriving_at,
        },
        
        totalDuration: parseDuration(slice.duration),
        stops: segments.length - 1,
        
        // Detailed Segments for UI
        segments: segments.map((seg: any) => ({
          flightNumber: `${seg.operating_carrier?.iata_code || ''}${seg.operating_carrier_flight_number || ''}`,
          aircraft: seg.aircraft?.name || 'Aircraft',
          airline: seg.operating_carrier?.name || "Airline",
          logo: seg.operating_carrier?.logo_symbol_url || null,
          duration: parseDuration(seg.duration),
          departure: {
             code: seg.origin?.iata_code || "",
             airport: seg.origin?.name || seg.origin?.city_name || "",
             time: seg.departing_at
          },
          arrival: {
             code: seg.destination?.iata_code || "",
             airport: seg.destination?.name || seg.destination?.city_name || "",
             time: seg.arriving_at
          }
        }))
      };
    });

    // ✅ SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        price: pricing,
        itinerary: itinerary,
        baggage: baggageInfo,
        cabinClass: cabinClass,
        conditions: {
          refundable: !data.conditions?.refund_before_departure?.allowed === false,
        },
        expires_at: data.expires_at
      }
    });

  } catch (error: any) {
    // 🔍 Detailed Error Logging

    // 🔴 CASE 1: Offer Expired (Status 422 with specific code)
    // This was your previous error: "offer_no_longer_available"
    if (
      error.meta?.status === 422 && 
      error.errors?.[0]?.code === 'offer_no_longer_available'
    ) {
      return NextResponse.json({ 
        success: false, 
        error: 'This flight price has expired. Please search again for the latest rates.' 
      }, { status: 404 }); // Return 404 to trigger "Expired" UI
    }

    // 🔴 CASE 2: Invalid Data/Format (Generic 422)
    if (error.meta?.status === 422 || error.status === 422) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unprocessable Entity. Please check if the Offer ID is valid.' 
      }, { status: 422 });
    }

    // 🔴 CASE 3: Not Found (404)
    if (error.meta?.status === 404 || error.status === 404) {
      return NextResponse.json({ 
        success: false, 
        error: 'Offer not found or expired.' 
      }, { status: 404 });
    }

    // 🔴 CASE 4: Server Error
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}