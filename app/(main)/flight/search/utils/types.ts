// types/flight.ts

export interface FlightSegment {
    id: string;
    airline: string;
    airlineCode: string;
    logo: string | null;
    flightNumber: string;
    aircraft: string;
    classType: string;
    departure: { airport: string; code: string; time: string };
    arrival: { airport: string; code: string; time: string };
    duration: string;
    layoverToNext?: string;
    amenities?: string[];
}

export interface FlightLeg {
    id: string;
    direction: string;
    totalDuration: string;
    stops: number;
    mainDeparture: { code: string; time: string; airport: string };
    mainArrival: { code: string; time: string; airport: string };
    mainAirline: string;
    mainLogo: string | null;
    segments: FlightSegment[];
}

export interface FlightOffer {
    id: string;
    token: string;
    carrier: {
        name: string;
        logo: string | null;
        code: string;
    };
    itinerary: FlightLeg[];
    price: {
        currency: string;
        basePrice: number;
        markup: number;
        finalPrice: number;
    };
    conditions: {
        refundable: boolean;
        changeable: boolean;
        penalty?: string;
    };
    baggage: string;
    cabinClass: string;
    expires_at?: string;
}