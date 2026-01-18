import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

// 1. Initialize Amadeus
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
});

export async function GET(request: NextRequest) {
  try {
    // 2. Extract Query Params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'oneway'; // oneway | round | multi
    
    // Common Params
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const returnDate = searchParams.get('return'); // Frontend sends 'return'
    const legsStr = searchParams.get('legs');      // Frontend sends 'legs' JSON for Multi

    // 3. Validation: API Keys Check
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
        return NextResponse.json({ success: false, error: 'Server Config Error: API Keys Missing' }, { status: 500 });
    }

    let response;

    // ============================================
    // CASE A: MULTI CITY (Complex Search)
    // ============================================
    if (type === 'multi') {
        if (!legsStr) {
            return NextResponse.json({ success: false, error: 'Missing flight legs for multi-city' }, { status: 400 });
        }

        const legs = JSON.parse(legsStr);
        
        // Construct Amadeus POST Payload
        const originDestinations = legs.map((leg: any, index: number) => ({
            id: (index + 1).toString(),
            originLocationCode: leg.from.toUpperCase(),
            destinationLocationCode: leg.to.toUpperCase(),
            departureDateTimeRange: {
                date: leg.date
            }
        }));

        const requestBody = {
            currencyCode: "USD",
            originDestinations: originDestinations,
            travelers: [
                {
                    id: "1",
                    travelerType: "ADULT"
                }
            ],
            sources: ["GDS"]
        };

        // Call Amadeus POST endpoint
        response = await amadeus.shopping.flightOffersSearch.post(JSON.stringify(requestBody));
    } 
    
    // ============================================
    // CASE B: ONE WAY / ROUND TRIP (Simple Search)
    // ============================================
    else {
        if (!from || !to || !date) {
            return NextResponse.json({ success: false, error: 'Missing origin, destination or date' }, { status: 400 });
        }

        const params: any = {
            originLocationCode: from.toUpperCase(),
            destinationLocationCode: to.toUpperCase(),
            departureDate: date,
            adults: '1',
            currencyCode: 'USD',
            max: '10'
        };

        // Add Return Date if Round Trip
        if (type === 'round' && returnDate) {
            params.returnDate = returnDate;
        }

        // Call Amadeus GET endpoint
        response = await amadeus.shopping.flightOffersSearch.get(params);
    }

    // 4. Success Response
    return NextResponse.json({
        success: true,
        count: response.result.meta.count,
        data: response.result.data,
        dictionaries: response.result.dictionaries
    });

  } catch (error: any) {
    // 5. Error Handling
    console.error("❌ Amadeus Error:", error.response ? error.response.body : error);

    let errorMessage = 'Failed to fetch flight data.';
    let statusCode = 500;

    if (error.response) {
        try {
            const parsedError = JSON.parse(error.response.body);
            errorMessage = parsedError.errors?.[0]?.detail || parsedError.errors?.[0]?.title || 'API Error';
            statusCode = error.response.statusCode;
        } catch (e) {
            errorMessage = 'Unknown Amadeus Error';
        }
    }

    return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
    );
  }
}