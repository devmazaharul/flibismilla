import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

// 1. Initialize Amadeus (Server Side Only)
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
});

export async function GET(request: NextRequest) {
  try {
    // 2. Query Params Extraction
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const dest = searchParams.get('dest');
    const date = searchParams.get('date'); // Format: YYYY-MM-DD

    // 3. Validation
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
        console.error("❌ Missing Amadeus API Credentials in .env.local");
        return NextResponse.json(
            { success: false, error: 'Server misconfiguration: Missing API Keys' },
            { status: 500 }
        );
    }

    if (!origin || !dest || !date) {
        return NextResponse.json(
            { success: false, error: 'Missing Required Parameters (origin, dest, date)' },
            { status: 400 }
        );
    }


    // 4. API Call to Amadeus
    const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: dest.toUpperCase(),
        departureDate: date,
        adults: '1',
        currencyCode: 'USD',
        max: '150' // Limit results for speed
    });

    // 5. Success Response
    return NextResponse.json({
        success: true,
        count: response.result.meta.count,
        data: response.result.data,
        dictionaries: response.result.dictionaries
    });

  } catch (error: any) {
    // 6. Detailed Error Logging
    console.error("❌ Amadeus API Error:", error.response ? error.response.body : error);

    let errorMessage = 'Failed to fetch flight data.';
    let statusCode = 500;

    // Handle specific Amadeus errors
    if (error.response) {
        // Amadeus returned an error (like Invalid Date, No Flights)
        const parsedError = JSON.parse(error.response.body);
        errorMessage = parsedError.errors?.[0]?.detail || 'Unknown Amadeus Error';
        statusCode = error.response.statusCode;
    }

    return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
    );
  }
}