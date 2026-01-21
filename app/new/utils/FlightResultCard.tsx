'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plane,
    AlertCircle,
    ArrowRight,
    Clock,
    ChevronDown,
    Check,
    Filter,
    X,
    SlidersHorizontal,
    Info,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import OneWayForm from './OneWayForm';
import RoundTripForm from './RoundTripForm';
import MultiCityForm from './MultiCityForm';
import { FlightSearchSkleton } from '@/app/flight/search/compo/FlightSearchSkeleton';
import { websiteDetails } from '@/constant/data';

// --- 🟢 Interfaces ---
interface FlightSegment {
    id: string;
    airline: string;
    airlineCode: string;
    logo: string | null;
    flightNumber: string;
    aircraft: string;
    classType?: string; // New Property from API
    departure: { airport: string; code: string; time: string; terminal: string | null };
    arrival: { airport: string; code: string; time: string; terminal: string | null };
    duration: string;
}

interface FlightItinerary {
    id: string;
    direction: string;
    totalDuration: string;
    stops: number;
    segments: FlightSegment[];
    mainDeparture: FlightSegment['departure'];
    mainArrival: FlightSegment['arrival'];
    mainAirline: string;
    mainLogo: string | null;
}

interface FlightOffer {
    id: string;
    token: string;
    carrier: { name: string; logo: string | null; code: string };
    itinerary: FlightItinerary[];
    price: { currency: string; basePrice: number; markup: number; finalPrice: number };
    // 🟢 New Properties Integrated
    conditions: { refundable: boolean; changeable: boolean; baggage: string };
}

// --- 🟢 Helpers ---
const formatDuration = (iso: string) =>
    iso?.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase() || '';
const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');


// 1. Smart Flight Path
const SmartFlightPath = ({ duration, stops }: { duration: string; stops: number }) => (
    <div className="flex flex-col items-center justify-center w-full px-2 min-w-[80px] md:min-w-[120px]">
        <div className="flex justify-between w-full mb-1.5">
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDuration(duration)}
            </span>
            <span
                className={`text-[9px] md:text-[10px] font-bold ${stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}
            >
                {stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}
            </span>
        </div>
        <div className="relative w-full flex items-center h-4">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[2px] border-t-2 border-dotted border-slate-300"></div>
            </div>
            <div className="w-2 h-2 bg-white border-2 border-slate-700 rounded-full absolute left-0 z-10"></div>
            <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1 z-20">
                <Plane className="w-3 h-3 text-slate-700 rotate-90" />
            </div>
            {stops > 0 && (
                <div className="absolute left-[30%] top-1/2 -translate-y-1/2 z-10">
                    <div className="w-2 h-2 bg-white border-2 border-amber-500 rounded-full ring-2 ring-white"></div>
                </div>
            )}
            <div className="w-2 h-2 bg-slate-700 border-2 border-slate-700 rounded-full absolute right-0 z-10"></div>
        </div>
    </div>
);

// 2. Flight Result Card
export const FlightResultCard = ({ flight }: { flight: FlightOffer }) => {
    const formatDate = (iso: string) => format(parseISO(iso), 'dd MMM, yyyy');
    const [isExpanded, setIsExpanded] = useState(false);
    const searchParams = useSearchParams();

    const handleBookFlight = () => {
        const tripType = searchParams.get('type') || 'One Way';
        const cabinClass = searchParams.get('class') || 'Economy';
        const adults = searchParams.get('adt') || '1';
        const children = searchParams.get('chd') || '0';
        const infants = searchParams.get('inf') || '0';

        let itineraryText = '';

        flight.itinerary.forEach((leg, index) => {
            const directionTitle =
                tripType === 'round_trip'
                    ? index === 0
                        ? 'OUTBOUND'
                        : 'INBOUND'
                    : `FLIGHT LEG ${index + 1}`;

            itineraryText += `
*${directionTitle}*
 *${leg.mainDeparture.code}* ➝ *${leg.mainArrival.code}*
 Date: ${formatDate(leg.mainDeparture.time)}
 Time: ${formatTime(leg.mainDeparture.time)} - ${formatTime(leg.mainArrival.time)}
 Flight: ${leg.mainAirline} (${leg.segments[0].airlineCode}${leg.segments[0].flightNumber})
 Duration: ${leg.totalDuration}
-----------------------------`;
        });

        // 3. Construct Final Message
        const message = `
 *Hello, I want to book this flight!*

 *TRIP DETAILS*
*Type:* ${tripType.replace('_', ' ').toUpperCase()}
*Class:* ${cabinClass.toUpperCase()}

${itineraryText}

 *PASSENGERS*
 Adults: ${adults}
 Children: ${children}
 Infants: ${infants}

 *TOTAL PRICE:* ${flight.price.finalPrice.toLocaleString()} ${flight.price.currency}

 
pelese provide me with the booking details and payment instructions. Thank you!
    `;

        const url = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message.trim())}`;

        window.open(url, '_blank');
    };
    // *Token ID:* ${flight.id}
    return (
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 overflow-hidden mb-4 group">
            {/* 🟢 Main Row */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* Left: Flight Info */}
                <div className="flex-[3] p-5 flex flex-col justify-center gap-6">
                    {flight.itinerary.map((leg, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
                        >
                            {/* Airline Info */}
                            <div className="flex items-center gap-3 w-full md:w-[180px] shrink-0">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white rounded-xl border border-slate-100 shadow-2xl shadow-gray-300 p-1">
                                    {leg.mainLogo ? (
                                        <img
                                            src={leg.mainLogo}
                                            alt={leg.mainAirline}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Plane className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 leading-tight">
                                        {leg.mainAirline}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                                        {leg.segments[0].airlineCode}
                                        {leg.segments[0].flightNumber} • {leg.segments[0].aircraft}
                                    </p>
                                </div>
                            </div>

                            {/* Times & Path */}
                            <div className="flex-1 w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8 pl-13 md:pl-0">
                                <div className="text-left min-w-[50px]">
                                    <p className="text-xl font-black text-slate-900 leading-none">
                                        {formatTime(leg.mainDeparture.time)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                        {leg.mainDeparture.code}
                                    </p>
                                </div>

                                <SmartFlightPath duration={leg.totalDuration} stops={leg.stops} />

                                <div className="text-right min-w-[50px]">
                                    <p className="text-xl font-black text-slate-900 leading-none">
                                        {formatTime(leg.mainArrival.time)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                                        {leg.mainArrival.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* 🟢 New Property: Conditions Badges */}
                    <div className="flex flex-wrap gap-2 mt-[-10px]">
                        {flight.conditions.refundable && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                                Refundable
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-100 flex items-center gap-1">
                            <Info className="w-3 h-3" />{' '}
                            {flight.conditions.baggage || 'Check Baggage'}
                        </span>
                    </div>
                </div>

                {/* Right: Price & CTA */}
                <div className="flex-1 bg-slate-50/50 p-5 flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-4">
                    <div className="text-left lg:text-center">
                        <p className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Total Price
                        </p>
                        <div className="flex items-baseline lg:justify-center gap-1 text-slate-900">
                            {/* <span className="text-xs font-bold">{flight.price.currency}</span> */}
                            <span className="text-2xl lg:text-3xl font-black tracking-tight">
                                {flight.price.currency == 'USD' ? '$' : flight.price.currency}
                                {flight.price.finalPrice.toLocaleString()}
                            </span>
                            <br />
                            <p className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Total Price
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-auto lg:w-full">
                        <button
                            onClick={handleBookFlight}
                            className="px-6 py-2.5 bg-slate-900 cursor-pointer hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Select <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1 mt-1 transition-colors cursor-pointer"
                        >
                            {isExpanded ? 'Hide Details' : 'View Details'}{' '}
                            <ChevronDown className={`w-3 h-3 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Details (Same as before) */}
            {isExpanded && (
                <div className="bg-slate-50/80 border-t border-slate-200 p-5 animate-in slide-in-from-top-2">
                    {flight.itinerary.map((leg, i) => (
                        <div key={i} className="mb-6 last:mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {leg.direction} Trip
                                </span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div className="flex flex-col gap-6 pl-3 border-l-2 border-dotted border-slate-300 ml-1">
                                {leg.segments.map((seg, j) => (
                                    <div key={j} className="relative">
                                        <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400"></div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xl shadow-gray-100 flex flex-col gap-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={seg.logo || ''}
                                                        className="w-8 h-8 object-contain"
                                                        alt="logo"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">
                                                            {seg.airline}
                                                        </p>
                                                        <p className="text-[10px] font-semibold text-slate-400">
                                                            {seg.aircraft} • {seg.airlineCode}
                                                            {seg.flightNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full block mb-1">
                                                        {formatDuration(seg.duration)}
                                                    </span>
                                                    {/* 🟢 New Property: Cabin Class Name */}
                                                    {seg.classType && (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                            {seg.classType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-lg font-black text-slate-900">
                                                        {formatTime(seg.departure.time)}
                                                    </p>
                                                    <p className="text-xs  text-slate-500">
                                                        {seg.departure.airport} (
                                                        {seg.departure.code})
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-rose-300" />
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-900">
                                                        {formatTime(seg.arrival.time)}
                                                    </p>
                                                    <p className="text-xs  text-slate-500">
                                                        {seg.arrival.airport} ({seg.arrival.code})
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- 🟢 MAIN CONTENT ---
function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resultsRef = useRef<HTMLDivElement>(null);

    // States
    const [activeTab, setActiveTab] = useState<'one_way' | 'round_trip' | 'multi_city'>('one_way');
    const [loading, setLoading] = useState(false);
    const [rawResults, setRawResults] = useState<FlightOffer[]>([]);
    const [error, setError] = useState('');
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Sort State
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'best'>('best');

    // Sync Tab
    useEffect(() => {
        const type = searchParams.get('type') as any;
        if (type) setActiveTab(type);
    }, [searchParams]);

    // 🟢 FETCH DATA
    useEffect(() => {
        const fetchFlights = async () => {
            const type = searchParams.get('type');
            if (!type) return;

            setError('');
            setRawResults([]);
            // Note: loading=true is set in push handler to avoid flicker, or here if direct access
            if (rawResults.length === 0) setLoading(true);

            try {
                let payload: any = {
                    type,
                    // 🟢 Fixed: Parsing all passengers
                    passengers: {
                        adults: parseInt(searchParams.get('adt') || '1'),
                        children: parseInt(searchParams.get('chd') || '0'),
                        infants: parseInt(searchParams.get('inf') || '0'),
                    },
                    cabinClass: searchParams.get('class') || 'economy',
                };

                if (type === 'multi_city') {
                    const legsJson = searchParams.get('flights');
                    if (legsJson) payload.flights = JSON.parse(legsJson);
                } else {
                    payload.origin = searchParams.get('origin');
                    payload.destination = searchParams.get('dest');
                    payload.departureDate = searchParams.get('date');
                    if (type === 'round_trip') payload.returnDate = searchParams.get('ret');
                }

                const res = await fetch('/api/new', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (!data.success) throw new Error(data.error || 'No flights found');
                setRawResults(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFlights();
    }, [searchParams]);

    // Handle Search Push
    const handleSearchPush = (params: URLSearchParams) => {
        setLoading(true);
        setRawResults([]);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 10);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // 🟢 Sort Logic
    const filteredResults = useMemo(() => {
        let res = [...rawResults];
        // Add filtering logic here if needed (airline, price range etc.)
        if (sortBy === 'price') res.sort((a, b) => a.price.finalPrice - b.price.finalPrice);
        else if (sortBy === 'duration')
            res.sort((a, b) =>
                a.itinerary[0].totalDuration.localeCompare(b.itinerary[0].totalDuration),
            );
        return res;
    }, [rawResults, sortBy]);

    const tabs = [
        { id: 'one_way', label: 'One Way' },
        { id: 'round_trip', label: 'Round Trip' },
        { id: 'multi_city', label: 'Multi City' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
            {/* Hero */}
            <div className="bg-slate-900 pt-10 pb-32 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                        Find Your Flight
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base">
                        Compare prices from hundreds of airlines.
                    </p>
                </div>
            </div>

            {/* Forms */}
            <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-20 mb-12">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-2">
                    <div className="flex gap-1 p-2 border-b border-slate-100 mb-4 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 md:p-4">
                        {activeTab === 'one_way' && <OneWayForm onSearch={handleSearchPush} />}
                        {activeTab === 'round_trip' && (
                            <RoundTripForm onSearch={handleSearchPush} />
                        )}
                        {activeTab === 'multi_city' && (
                            <MultiCityForm onSearch={handleSearchPush} />
                        )}
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div ref={resultsRef} className="scroll-mt-24 max-w-5xl mx-auto px-4 pb-20">
                {loading ? (
                    <div className="space-y-4">
                        <FlightSearchSkleton />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-6 rounded-xl text-red-700 font-bold flex items-center justify-center gap-3 border border-red-100">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                ) : rawResults.length > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 🟢 NEW HEADER DESIGN (Matching uploaded image) */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                            {/* Left: Title & Info */}
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Found {filteredResults.length} Flights
                                    </h2>
                                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                        {searchParams.get('class') || 'Economy'}
                                    </span>
                                </div>
                                {/* Subtitle Info */}
                                <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                                    <span>{parseInt(searchParams.get('adt') || '1')} Adult,</span>
                                    {parseInt(searchParams.get('chd') || '0') > 0 && (
                                        <span>{searchParams.get('chd')} Child,</span>
                                    )}
                                    {parseInt(searchParams.get('inf') || '0') > 0 && (
                                        <span>{searchParams.get('inf')} Infant</span>
                                    )}
                                    <span className="text-slate-300">•</span>
                                    <span>Including taxes</span>
                                </p>
                            </div>

                            {/* Right: Sort Toggle */}
                            <div className="flex items-center gap-2">
                                {/* Mobile Filter Button */}
                                <button
                                    onClick={() => setShowMobileFilter(true)}
                                    className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>

                                {/* Segmented Control */}
                                <div className="bg-slate-100 p-1.5 rounded-xl flex items-center">
                                    {[
                                        { id: 'best', label: 'Best' },
                                        { id: 'price', label: 'Cheapest' },
                                        { id: 'duration', label: 'Fastest' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id as any)}
                                            className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                                sortBy === opt.id
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {filteredResults.map((f) => (
                                <FlightResultCard key={f.id} flight={f} />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Empty State
                    <div className="text-center py-32 opacity-50">
                        <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-slate-800">Start Your Search</h3>
                        <p className="text-slate-400 mt-2">
                            Select your destination to see flights.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FlightSearchPage() {
    return (
        <Suspense>
            <SearchPageContent />
        </Suspense>
    );
}
