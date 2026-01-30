'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    Plane, 
    ArrowRight, 
    Clock, 
    ChevronDown, 
    Briefcase, 
    Armchair, 
    Calendar,
    Wifi,
    Utensils,
    Zap,
    AlertCircle
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

// ----------------------------------------------------------------------
// 🛠️ TYPES
// ----------------------------------------------------------------------
interface FlightSegment {
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

interface FlightLeg {
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

interface FlightOffer {
    id: string;
    token: string;
    itinerary: FlightLeg[];
    price: { currency: string; finalPrice: number };
    baggage: string;
    cabinClass: string;
    conditions: { refundable: boolean };
}

// ----------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ----------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');

const getDayDiff = (dep: string, arr: string) => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? `+${diff}` : '';
};

// 🟢 AMENITY ICON MAPPER
const AmenityIcon = ({ label }: { label: string }) => {
    const lower = label.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="w-3 h-3 text-blue-500" />;
    if (lower.includes('meal') || lower.includes('food')) return <Utensils className="w-3 h-3 text-amber-600" />;
    if (lower.includes('usb') || lower.includes('power')) return <Zap className="w-3 h-3 text-yellow-600" />;
    return <CheckCircleIcon className="w-3 h-3 text-slate-400" />;
};

const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

// ----------------------------------------------------------------------
// 🟢 COMPONENT: Flight Path Visualizer
// ----------------------------------------------------------------------
const FlightPathVisual = ({ duration, stops }: { duration: string; stops: number }) => (
    <div className="flex flex-col items-center justify-center w-full px-4 min-w-[100px]">
        <div className="flex justify-between w-full mb-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {duration}
            </span>
            <span className={`text-[10px] font-bold ${stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stops === 0 ? 'Non-stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
            </span>
        </div>
        <div className="relative w-full flex items-center h-4">
            {/* Dotted Line */}
            <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[2px] border-t-2 border-dotted border-slate-300"></div>
            </div>
            {/* Start Dot */}
            <div className="w-2.5 h-2.5 bg-white border-2 border-slate-600 rounded-full absolute left-0 z-10"></div>
            
            {/* Plane Icon */}
            <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1 z-10">
                <Plane className="w-3.5 h-3.5 text-slate-600 rotate-90 fill-slate-100" />
            </div>

            {/* Stop Dots */}
            {stops > 0 && (
                <div className="absolute left-[30%] top-1/2 -translate-y-1/2 z-10 group cursor-help">
                    <div className="w-2.5 h-2.5 bg-white border-2 border-amber-500 rounded-full ring-2 ring-white"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {stops} Stop(s)
                    </div>
                </div>
            )}
            
            {/* End Dot */}
            <div className="w-2.5 h-2.5 bg-slate-600 border-2 border-slate-600 rounded-full absolute right-0 z-10"></div>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// 🟢 MAIN COMPONENT: FlightResultCard
// ----------------------------------------------------------------------
export const FlightResultCard = ({ flight }: { flight: FlightOffer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const searchParams = useSearchParams(); 

    const handleSelectFlight = () => {
        const query = new URLSearchParams(searchParams.toString());
        query.set('offer_id', flight.id);
        window.open(`/checkout?${query.toString()}`, '_blank');
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-300 overflow-hidden mb-5 group">
            
            {/* Top Summary Section */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                
                {/* 🛫 Left: Flight Legs Info */}
                <div className="flex-[3] p-5 flex flex-col justify-center gap-6">
                    {flight.itinerary.map((leg, idx) => {
                        const dayDiff = getDayDiff(leg.mainDeparture.time, leg.mainArrival.time);
                        return (
                            <div key={idx} className="flex flex-col md:flex-row items-center gap-6">
                                
                                {/* Airline Logo & Name */}
                                <div className="flex items-center gap-4 w-full md:w-[180px] shrink-0">
                                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-white rounded-xl border border-slate-200/80 shadow-2xl shadow-gray-100 p-1.5">
                                        {leg.mainLogo ? (
                                            <img src={leg.mainLogo} alt={leg.mainAirline} className="w-full h-full object-contain" />
                                        ) : (
                                            <Plane className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{leg.mainAirline}</p>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md w-fit">
                                            {leg.segments[0].aircraft}
                                        </div>
                                    </div>
                                </div>

                                {/* Flight Times & Path */}
                                <div className="flex-1 w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6">
                                    {/* Departure */}
                                    <div className="text-left">
                                        <p className="text-xl font-black text-slate-900 leading-none">{formatTime(leg.mainDeparture.time)}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{leg.mainDeparture.code}</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{formatDate(leg.mainDeparture.time)}</p>
                                    </div>

                                    {/* Visual Path */}
                                    <FlightPathVisual duration={leg.totalDuration} stops={leg.stops} />

                                    {/* Arrival */}
                                    <div className="text-right relative">
                                        <p className="text-xl font-black text-slate-900 leading-none">{formatTime(leg.mainArrival.time)}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{leg.mainArrival.code}</p>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{formatDate(leg.mainArrival.time)}</p>
                                            {dayDiff && (
                                                <span className="absolute -top-3 -right-2 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded-full border border-rose-100">
                                                    {dayDiff}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Tags & Badges */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 pt-4 border-t border-slate-50">
                        {flight.conditions.refundable ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                                <Briefcase className="w-3 h-3" /> Refundable
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase border border-rose-100">
                                <AlertCircle className="w-3 h-3" /> Non-Refundable
                            </span>
                        )}

                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold uppercase border border-slate-100">
                            <Briefcase className="w-3 h-3" /> {flight.baggage}
                        </span>

                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase border border-blue-100">
                            <Armchair className="w-3 h-3" /> {flight.cabinClass}
                        </span>
                    </div>
                </div>

                {/* 💰 Right: Price & Action */}
                <div className="flex-1 bg-slate-50/50 p-5 flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-4 min-w-[200px]">
                    <div className="text-left lg:text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 hidden lg:block">Total Offer</p>
                        <div className="flex items-baseline lg:justify-center gap-1 text-slate-900">
                            <span className="text-2xl lg:text-3xl font-black tracking-tight">
                                {flight.price.currency === 'USD' ? '$' : flight.price.currency} {flight.price.finalPrice.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 lg:text-center font-medium">Includes taxes & fees</p>
                    </div>

                    <div className="flex flex-col gap-3 w-auto lg:w-full px-2">
                        <button
                            onClick={handleSelectFlight}
                            className="w-full cursor-pointer px-6 py-3 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-rose-200"
                        >
                            Select <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[11px] font-bold cursor-pointer text-slate-500 hover:text-rose-600 flex items-center justify-center gap-1 transition-colors py-2 hover:bg-white rounded-lg"
                        >
                            {isExpanded ? 'Hide Details' : 'View Flight Details'}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔽 Expanded Details Section */}
            {isExpanded && (
                <div className="bg-slate-50/80 border-t border-slate-200 p-6 animate-in slide-in-from-top-2">
                    {flight.itinerary.map((leg, i) => (
                        <div key={i} className="mb-8 last:mb-0">
                            {/* Leg Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`w-2.5 h-8 rounded-full ${i === 0 ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                        {leg.direction} Journey
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Total Duration: {leg.totalDuration} • {leg.segments.length} Flight(s)
                                    </p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-4 ml-1 space-y-8">
                                {/* Vertical Line */}
                                <div className="absolute top-2 bottom-2 left-[19px] w-[2px] bg-slate-200"></div>

                                {leg.segments.map((seg, j) => (
                                    <div key={j} className="relative z-10">
                                        {/* Segment Dot */}
                                        <div className="absolute left-[13px] top-4 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-slate-400"></div>

                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xl shadow-gray-100 ml-8 hover:border-gray-200 transition-colors">
                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={seg.logo || ''} alt={seg.airline} className="w-6 h-6 object-contain" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{seg.airline}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                            {seg.aircraft} • Flight {seg.flightNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Amenities Icons */}
                                                {seg.amenities && (
                                                    <div className="flex gap-2">
                                                        {seg.amenities.map((item, idx) => (
                                                            <div key={idx} className="p-1.5 bg-slate-50 rounded-md" title={item}>
                                                                <AmenityIcon label={item} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Times */}
                                            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                                <div>
                                                    <p className="text-lg font-black text-slate-900">{formatTime(seg.departure.time)}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(seg.departure.time)}</p>
                                                    <p className="text-xs font-semibold text-slate-700 mt-1">{seg.departure.airport} ({seg.departure.code})</p>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-slate-400 mb-1">{seg.duration}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-900">{formatTime(seg.arrival.time)}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(seg.arrival.time)}</p>
                                                    <p className="text-xs font-semibold text-slate-700 mt-1">{seg.arrival.airport} ({seg.arrival.code})</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layover Badge */}
                                        {seg.layoverToNext && (
                                            <div className="my-6 ml-8 flex items-center gap-3">
                                                <div className="h-px bg-slate-300 flex-1 border-t border-dashed"></div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] font-bold uppercase tracking-wide shadow-2xl shadow-amber-100/50">
                                                    <Clock className="w-3 h-3" />
                                                    {seg.layoverToNext} Layover in {seg.arrival.code}
                                                </div>
                                                <div className="h-px bg-slate-300 flex-1 border-t border-dashed"></div>
                                            </div>
                                        )}
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