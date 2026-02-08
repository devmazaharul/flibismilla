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
  Wifi,
  Utensils,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

// ----------------------------------------------------------------------
// TYPES
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
// HELPERS
// ----------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');

const getDayDiff = (dep: string, arr: string) => {
  const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
  return diff > 0 ? `+${diff}` : '';
};

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const AmenityIcon = ({ label }: { label: string }) => {
  const lower = label.toLowerCase();
  if (lower.includes('wifi')) return <Wifi className="w-3 h-3 text-blue-500" />;
  if (lower.includes('meal') || lower.includes('food'))
    return <Utensils className="w-3 h-3 text-amber-600" />;
  if (lower.includes('usb') || lower.includes('power'))
    return <Zap className="w-3 h-3 text-yellow-600" />;
  return <CheckCircleIcon className="w-3 h-3 text-slate-400" />;
};

// ----------------------------------------------------------------------
// Flight Path Visual
// ----------------------------------------------------------------------
const FlightPathVisual = ({ duration, stops }: { duration: string; stops: number }) => (
  <div className="flex flex-col items-center justify-center w-full px-4 min-w-[120px]">
    <div className="flex justify-between w-full mb-1.5">
      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> {duration}
      </span>
      <span
        className={`text-[10px] font-bold ${
          stops === 0 ? 'text-emerald-600' : 'text-amber-600'
        }`}
      >
        {stops === 0 ? 'Non-stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
      </span>
    </div>
    <div className="relative w-full flex items-center h-4">
      {/* Base line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full" />
      </div>

      {/* Start dot */}
      <div className="w-2.5 h-2.5 bg-white border-[2.5px] border-slate-700 rounded-full absolute left-0 z-10 shadow-sm" />

      {/* Plane */}
      <div className="absolute left-1/2 -translate-x-1/2 bg-white px-1 z-10">
        <Plane className="w-3.5 h-3.5 text-slate-700 rotate-90" />
      </div>

      {/* Stop dots */}
      {stops > 0 && (
        <div className="absolute left-[32%] top-1/2 -translate-y-1/2 z-10 group cursor-help">
          <div className="w-2.5 h-2.5 bg-white border-2 border-amber-500 rounded-full ring-2 ring-amber-100 shadow-sm" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg shadow-slate-900/40">
            {stops} Stop{stops > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* End dot */}
      <div className="w-2.5 h-2.5 bg-slate-700 border-[2.5px] border-slate-700 rounded-full absolute right-0 z-10 shadow-sm" />
    </div>
  </div>
);

// ----------------------------------------------------------------------
// MAIN COMPONENT
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
    <div
      className="
        relative mb-5
        rounded-3xl
        bg-white/95
        border border-slate-100
        shadow-[0_18px_45px_rgba(15,23,42,0.08)]
        hover:shadow-[0_24px_60px_rgba(148,27,66,0.18)]
        transition-all duration-300
        overflow-hidden
        group
      "
    >
      {/* subtle top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-400/40 via-rose-300/20 to-sky-400/40 opacity-80" />

      {/* Top Summary */}
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left block: itinerary */}
        <div className="flex-[3] p-5 lg:p-6 flex flex-col justify-center gap-6 bg-gradient-to-br from-white via-white to-slate-50/60">
          {flight.itinerary.map((leg, idx) => {
            const dayDiff = getDayDiff(leg.mainDeparture.time, leg.mainArrival.time);

            return (
              <div
                key={idx}
                className="
                  flex flex-col md:flex-row items-center gap-5 md:gap-6
                  rounded-2xl
                  bg-white/90
                  border border-slate-100
                  shadow-sm shadow-slate-100
                  px-3.5 py-3
                "
              >
                {/* Airline / brand */}
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-[200px] shrink-0">
                  <div
                    className="
                      w-12 h-12 shrink-0 flex items-center justify-center
                      bg-white
                      rounded-2xl
                      border border-slate-200/80
                      shadow-[0_8px_22px_rgba(15,23,42,0.08)]
                      p-1.5
                    "
                  >
                    {leg.mainLogo ? (
                      <img
                        src={leg.mainLogo}
                        alt={leg.mainAirline}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Plane className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 leading-tight truncate">
                      {leg.mainAirline}
                    </p>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                        {leg.segments[0].aircraft}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Times + path */}
                <div className="flex-1 w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6">
                  {/* Departure */}
                  <div className="text-left">
                    <p className="text-xl font-black text-slate-900 leading-none">
                      {formatTime(leg.mainDeparture.time)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                      {leg.mainDeparture.code}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {formatDate(leg.mainDeparture.time)}
                    </p>
                  </div>

                  {/* Path */}
                  <FlightPathVisual duration={leg.totalDuration} stops={leg.stops} />

                  {/* Arrival */}
                  <div className="text-right relative">
                    <p className="text-xl font-black text-slate-900 leading-none">
                      {formatTime(leg.mainArrival.time)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                      {leg.mainArrival.code}
                    </p>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {formatDate(leg.mainArrival.time)}
                      </p>
                      {dayDiff && (
                        <span
                          className="
                            absolute -top-3 -right-2
                            text-[9px] font-bold text-rose-600
                            bg-rose-50 px-1.5 rounded-full
                            border border-rose-100
                          "
                        >
                          {dayDiff}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2 pt-3 border-t border-slate-100">
            {flight.conditions.refundable ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                <Briefcase className="w-3 h-3" /> Refundable
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase border border-rose-100">
                <AlertCircle className="w-3 h-3" /> Non-Refundable
              </span>
            )}

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold uppercase border border-slate-100">
              <Briefcase className="w-3 h-3" /> {flight.baggage}
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase border border-blue-100">
              <Armchair className="w-3 h-3" /> {flight.cabinClass}
            </span>
          </div>
        </div>

        {/* Right block: price + CTA (light background) */}
        <div
          className="
            flex-1 min-w-[220px]
            bg-gradient-to-br from-rose-50 via-white to-slate-50
            border-l border-slate-100
            p-5 lg:p-6
            flex flex-row lg:flex-col
            justify-between lg:justify-center
            items-center gap-4
            relative overflow-hidden
          "
        >
          {/* soft glow */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-12 right-0 w-32 h-32 rounded-full bg-rose-200 blur-3xl" />
            <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-sky-200 blur-3xl" />
          </div>

          <div className="relative z-10 text-left lg:text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-1 hidden lg:block">
              Total Fare
            </p>
            <div className="flex items-baseline lg:justify-center gap-1">
              <span className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                {flight.price.currency === 'USD' ? '$' : flight.price.currency}{' '}
                {flight.price.finalPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Includes all taxes & fees
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-2.5 w-auto lg:w-full">
            <button
              onClick={handleSelectFlight}
              className="
                w-full px-6 py-3
                rounded-2xl
                bg-gradient-to-r from-rose-500 via-rose-500 to-rose-400
                hover:from-rose-600 hover:to-rose-500
                text-white font-semibold text-sm
                flex items-center justify-center gap-2
                shadow-lg shadow-rose-300/60
                transition-all active:scale-95 cursor-pointer
              "
            >
              Select <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="
                text-[11px] font-semibold
                text-rose-600 hover:text-rose-700
                flex items-center justify-center gap-1.5
                transition-colors py-2
                rounded-xl
                hover:bg-rose-50
                cursor-pointer
              "
            >
              {isExpanded ? 'Hide Details' : 'View Flight Details'}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="bg-slate-50/80 border-t border-slate-200 px-5 lg:px-6 pb-6 pt-5 animate-in slide-in-from-top-2">
          {flight.itinerary.map((leg, i) => (
            <div key={i} className="mb-8 last:mb-0">
              {/* leg header */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className={`w-2 h-8 rounded-full ${
                    i === 0 ? 'bg-rose-400' : 'bg-sky-400'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.16em]">
                    {leg.direction} Journey
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Total Duration: {leg.totalDuration} • {leg.segments.length} Flight
                    {leg.segments.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* timeline */}
              <div className="relative pl-6 ml-1 space-y-6">
                <div className="absolute top-3 bottom-3 left-[18px] w-[2px] bg-slate-200" />

                {leg.segments.map((seg, j) => (
                  <div key={j} className="relative z-10">
                    {/* dot */}
                    <div className="absolute left-[12px] top-4 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-slate-400 shadow-sm" />

                    <div
                      className="
                        bg-white
                        p-4 md:p-5
                        rounded-2xl
                        border border-slate-100
                        shadow-[0_12px_30px_rgba(15,23,42,0.06)]
                        ml-4
                        hover:border-rose-100 hover:shadow-rose-100/70
                        transition-colors
                      "
                    >
                      {/* seg header */}
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          {seg.logo && (
                            <img
                              src={seg.logo}
                              alt={seg.airline}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {seg.airline}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {seg.aircraft} • Flight {seg.flightNumber} •{' '}
                              <span className="capitalize">{seg.classType}</span>
                            </p>
                          </div>
                        </div>

                        {seg.amenities && seg.amenities.length > 0 && (
                          <div className="flex gap-1.5">
                            {seg.amenities.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 bg-slate-50 rounded-md border border-slate-100"
                                title={item}
                              >
                                <AmenityIcon label={item} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* times row */}
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                        <div>
                          <p className="text-lg font-black text-slate-900">
                            {formatTime(seg.departure.time)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(seg.departure.time)}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 mt-1">
                            {seg.departure.airport} ({seg.departure.code})
                          </p>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 mb-1">
                            {seg.duration}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">
                            {formatTime(seg.arrival.time)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(seg.arrival.time)}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 mt-1">
                            {seg.arrival.airport} ({seg.arrival.code})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* layover */}
                    {seg.layoverToNext && (
                      <div className="my-5 ml-4 flex items-center gap-3">
                        <div className="h-px bg-slate-300 flex-1 border-t border-dashed" />
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                          <Clock className="w-3 h-3" />
                          {seg.layoverToNext} layover in {seg.arrival.code}
                        </div>
                        <div className="h-px bg-slate-300 flex-1 border-t border-dashed" />
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