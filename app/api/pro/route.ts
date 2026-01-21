import { NextRequest, NextResponse } from 'next/server';
import Amadeus from 'amadeus';

// Amadeus Configuration
const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    
    // --- 1. Extract Common Parameters ---
    const type = searchParams.get('type') || 'oneway';
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');
    const infants = parseInt(searchParams.get('infants') || '0');
    const travelClass = searchParams.get('travelClass') || 'ECONOMY';
    const currency = 'USD'; // আপনার ডিফল্ট কারেন্সি

    try {
        let response;

        // --- 2. Multi-City Logic (Complex Search via POST) ---
        if (type === 'multi') {
            const legsParam = searchParams.get('legs');
            if (!legsParam) throw new Error("Missing flight legs for multi-city search");
            
            const legs = JSON.parse(legsParam);

            // Construct OriginDestinations for POST request
            const originDestinations = legs.map((leg: any, index: number) => ({
                id: (index + 1).toString(),
                originLocationCode: leg.from,
                destinationLocationCode: leg.to,
                departureDateTimeRange: {
                    date: leg.date
                }
            }));

            // Construct Travelers array
            const travelers = [];
            let travelerId = 1;
            for (let i = 0; i < adults; i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'ADULT' });
            for (let i = 0; i < children; i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'CHILD' });
            for (let i = 0; i < infants; i++) travelers.push({ id: (travelerId++).toString(), travelerType: 'SEATED_INFANT' });

            // Call Amadeus POST
            response = await amadeus.shopping.flightOffersSearch.post(JSON.stringify({
                currencyCode: currency,
                originDestinations: originDestinations,
                travelers: travelers,
                sources: ["GDS"],
                searchCriteria: {
                    flightFilters: {
                        cabinRestrictions: [{
                            cabin: travelClass,
                            coverage: "MOST_SEGMENTS",
                            originDestinationIds: originDestinations.map((od:any) => od.id)
                        }]
                    }
                }
            }));

        } 
        
        // --- 3. OneWay / Round Trip Logic (Simple Search via GET) ---
        else {
            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const date = searchParams.get('date');
            const returnDate = searchParams.get('return');

            if (!from || !to || !date) throw new Error("Missing required params");

            const params: any = {
                originLocationCode: from,
                destinationLocationCode: to,
                departureDate: date,
                adults: adults,
                children: children,
                infants: infants,
                travelClass: travelClass,
                currencyCode: currency,
                max: 20
            };

            if (type === 'round' && returnDate) {
                params.returnDate = returnDate;
            }

            response = await amadeus.shopping.flightOffersSearch.get(params);
        }

        // --- 4. Return Data ---
        return NextResponse.json({ 
            success: true, 
            data: response.data, 
            dictionaries: response.result.dictionaries 
        });

    } catch (error: any) {
    
        // Handle Amadeus Errors gracefully
        let errorMessage = "Failed to fetch flights";
        if (error.response) {
            errorMessage = error.response.result?.errors?.[0]?.detail || error.response.body;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}