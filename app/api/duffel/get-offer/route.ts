export const dynamic = 'force-dynamic'; // Prevent Vercel Caching
import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { COMMISION_RATE } from '@/constant/control';

// ------------------------------------------------------------------
// ⚙️ CONFIGURATION & TYPES
// ------------------------------------------------------------------
const COMMISSION_PERCENTAGE = Number(COMMISION_RATE) || 0; // Ensure number

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN as string,
});

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ------------------------------------------------------------------

// 1. Safe Duration Parser
const parseDuration = (duration: string | null | undefined) => {
  if (!duration) return "--";
  return duration
    .replace('PT', '')
    .replace('H', 'h ')
    .replace('M', 'm')
    .toLowerCase()
    .trim();
};

// 2. Price Calculation (Safe Math)
const calculatePriceWithMarkup = (amount: string | null | undefined, currency: string | undefined) => {
  if (!amount) return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };
  
  const basePrice = parseFloat(amount);
  // Security: Prevent NaN issues
  if (isNaN(basePrice)) return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };

  const markup = basePrice * (COMMISSION_PERCENTAGE / 100); 
  const finalPrice = Math.ceil(basePrice + markup);

  return {
    currency: currency || 'USD',
    basePrice: Number(basePrice.toFixed(2)),
    markup: Number(markup.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
};

// 3. Cabin Class Extractor (Fail-safe)
const getCabinClass = (slices: any[]) => {
  try {
    const segment = slices[0]?.segments[0];
    const passenger = segment?.passengers?.[0];
    
    const rawClass = passenger?.cabin_class_marketing_name || passenger?.cabin_class || "Economy";
    // Capitalize properly
    return rawClass.charAt(0).toUpperCase() + rawClass.slice(1).toLowerCase();
  } catch (e) {
    return "Economy";
  }
};

// 4. Baggage Extractor
const getBaggageInfo = (slices: any[]) => {
  try {
    // Check first passenger of first segment
    const bags = slices[0]?.segments[0]?.passengers?.[0]?.baggages;
    
    if (Array.isArray(bags) && bags.length > 0) {
      const checkedBag = bags.find((b: any) => b.type === 'checked');
      if (checkedBag) {
         // Some airlines send weight (e.g., "23kg") instead of quantity
         if(checkedBag.quantity) return `${checkedBag.quantity} Checked Bag(s)`;
         // if(checkedBag.weight) return `${checkedBag.weight} Checked Bag`; // Optional logic
      }
    }
    return "Cabin Bag Only";
  } catch (e) {
    return "Check Rules";
  }
};

// ------------------------------------------------------------------
// 🚀 MAIN API HANDLER
// ------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawOfferId = searchParams.get('offer_id');

    // 🛡️ SECURITY 1: Input Existence Check
    if (!rawOfferId) {
      return NextResponse.json(
        { success: false, message: 'Offer ID is required.' }, 
        { status: 400 }
      );
    }

    const offerId = rawOfferId.trim();

    // 🛡️ SECURITY 2: Strict Format Validation (Regex)
    // Duffel Offer IDs always start with "off_" followed by alphanumeric characters
    const offerIdRegex = /^off_[a-zA-Z0-9]+$/;
    if (!offerIdRegex.test(offerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Offer ID format detected.' }, 
        { status: 422 } // Unprocessable Entity
      );
    }

    // 📡 FETCH DATA
    const offer = await duffel.offers.get(offerId);

    // 🛡️ SECURITY 3: Empty Data Check
    if (!offer || !offer.data) {
      return NextResponse.json(
        { success: false, message: 'No data received from flight provider.' }, 
        { status: 404 }
      );
    }

    const data = offer.data;

    // 💰 CALCULATIONS
    const pricing = calculatePriceWithMarkup(data.total_amount, data.total_currency);
    const cabinClass = getCabinClass(data.slices);
    const baggageInfo = getBaggageInfo(data.slices);

    // 🗺️ ITINERARY MAPPING
    const itinerary = data.slices.map((slice: any, index: number) => {
      const segments = slice.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const totalSlices = data.slices.length;

      let directionLabel = "One Way";
      if (totalSlices === 2) {
        directionLabel = index === 0 ? 'Outbound' : 'Inbound';
      } else if (totalSlices > 2) {
        directionLabel = `Flight ${index + 1}`;
      }

      return {
        id: slice.id,
        direction: directionLabel,
        mainAirline: firstSegment.operating_carrier?.name || "Airline",
        mainLogo: firstSegment.operating_carrier?.logo_symbol_url || null,
        
        mainDeparture: {
          code: firstSegment.origin?.iata_code || "UNK",
          city: firstSegment.origin?.city_name || firstSegment.origin?.name,
          time: firstSegment.departing_at,
        },
        mainArrival: {
          code: lastSegment.destination?.iata_code || "UNK",
          city: lastSegment.destination?.city_name || lastSegment.destination?.name,
          time: lastSegment.arriving_at,
        },
        
        totalDuration: parseDuration(slice.duration),
        stops: segments.length - 1,
        
        segments: segments.map((seg: any) => ({
          id: seg.id,
          flightNumber: `${seg.operating_carrier?.iata_code || ''} ${seg.operating_carrier_flight_number || ''}`,
          aircraft: seg.aircraft?.name || 'Aircraft',
          airline: seg.operating_carrier?.name,
          logo: seg.operating_carrier?.logo_symbol_url,
          duration: parseDuration(seg.duration),
          departure: {
             code: seg.origin?.iata_code,
             airport: seg.origin?.name,
             time: seg.departing_at
          },
          arrival: {
             code: seg.destination?.iata_code,
             airport: seg.destination?.name,
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
        // Frontend Needs these for Logic:
        expires_at: data.expires_at,
        payment_requirements: data.payment_requirements, // Instant payment check এর জন্য
        
        // Frontend Needs these for Display:
        price: pricing,
        itinerary: itinerary,
        baggage: baggageInfo,
        cabinClass: cabinClass,
        
        // For Fare Rules & Passenger Form:
        passengers: data.passengers, // Form generation এর জন্য
        conditions: data.conditions, // Refund policy এর জন্য
        owner: data.owner // Airline info
      }
    });

  } catch (error: any) {
    console.error("❌ Offer Fetch Error:", error.meta || error);

    // 🔴 ERROR HANDLING STRATEGY

    // 1. Duffel Specific: Offer Expired
    if (
      error.meta?.status === 422 && 
      error.errors?.[0]?.code === 'offer_no_longer_available'
    ) {
      return NextResponse.json(
        { success: false, message: 'This flight price has expired. Please search again.' }, 
        { status: 404 } 
      );
    }

    // 2. Duffel Specific: Not Found
    if (error.meta?.status === 404) {
      return NextResponse.json(
        { success: false, message: 'Offer not found or invalid.' }, 
        { status: 404 }
      );
    }

    // 3. Generic Client Error (400-499)
    if (error.meta?.status >= 400 && error.meta?.status < 500) {
      return NextResponse.json(
        { success: false, message: 'Unable to process request. Please try again.' }, 
        { status: 422 }
      );
    }

    // 4. Server Error (500)
    return NextResponse.json(
      { success: false, message: 'Internal Server Error. Please contact support.' }, 
      { status: 500 }
    );
  }
}