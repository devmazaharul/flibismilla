'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation'; // 🟢 useSearchParams added
import { Plane, ArrowRight, Clock, ChevronDown, Briefcase, Armchair } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface FlightOffer {
    id: string;
    token: string;
    carrier: { name: string; logo: string | null; code: string };
    itinerary: any[];
    price: { currency: string; basePrice: number; markup: number; finalPrice: number };
    baggage: string;
    cabinClass: string;
    conditions: { refundable: boolean; changeable: boolean };
}

const formatDuration = (iso: string) =>
    iso?.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase() || '';
const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');

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
            <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1 ">
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

export const FlightResultCard = ({ flight }: { flight: FlightOffer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const searchParams = useSearchParams(); 

    const handleSelectFlight = () => {
        const adt = searchParams.get('adt') || '1';
        const chd = searchParams.get('chd') || '0';
        const inf = searchParams.get('inf') || '0';
        const type = searchParams.get('type') || 'one_way';
        const url = `/checkout?offer_id=${flight.id}&adt=${adt}&chd=${chd}&inf=${inf}&type=${type}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 overflow-hidden mb-4 group">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* Left: Flight Info */}
                <div className="flex-[3] p-5 flex flex-col justify-center gap-6">
                    {flight.itinerary.map((leg: any, idx: number) => (
                        <div
                            key={idx}
                            className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
                        >
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

                    <div className="flex flex-wrap gap-2 mt-[-10px]">
                        {flight.conditions.refundable && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                                Refundable
                            </span>
                        )}

                        <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wide border border-slate-100 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {flight.baggage}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wide border border-rose-100 flex items-center gap-1">
                            <Armchair className="w-3 h-3" /> {flight.cabinClass}
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
                            <span className="text-2xl lg:text-3xl font-black tracking-tight">
                                {flight.price.currency == 'USD' ? '$' : flight.price.currency}
                                {flight.price.finalPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-auto lg:w-full">
                        <button
                            onClick={handleSelectFlight}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-rose-200 cursor-pointer"
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

            {/* Expanded Details Section */}
            {isExpanded && (
                <div className="bg-slate-50/80 border-t border-slate-200 p-5 animate-in slide-in-from-top-2">
                    {flight.itinerary.map((leg: any, i: number) => (
                        <div key={i} className="mb-6 last:mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {leg.direction} Trip
                                </span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div className="flex flex-col gap-6 pl-3 border-l-2 border-dotted border-slate-300 ml-1">
                                {leg.segments.map((seg: any, j: number) => (
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
                                                    <span className="text-xs  text-slate-500">
                                                        {seg.departure.airport} (
                                                        {seg.departure.code})
                                                    </span>
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
                                        {seg.layoverToNext && (
                                            <div className="mt-4 mb-2 flex justify-center">
                                                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100">
                                                    {seg.layoverToNext} Layover
                                                </span>
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
