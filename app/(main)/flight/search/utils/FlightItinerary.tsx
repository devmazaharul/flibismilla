'use client';

import { memo } from 'react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Plane,
    Utensils,
    Wifi,
    Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FlightLeg } from './FlightResultCard';

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');

// ----------------------------------------------------------------------
// Amenity Icon
// ----------------------------------------------------------------------
const AmenityIcon = ({ label }: { label: string }) => {
    const lower = label.toLowerCase();
    if (lower.includes('wifi'))
        return <Wifi className="w-3 h-3 text-blue-500" />;
    if (lower.includes('meal') || lower.includes('food'))
        return <Utensils className="w-3 h-3 text-amber-600" />;
    if (lower.includes('usb') || lower.includes('power'))
        return <Zap className="w-3 h-3 text-yellow-600" />;
    // ✅ Fixed: CheckCircleIcon doesn't exist in lucide — use CheckCircle2
    return <CheckCircle2 className="w-3 h-3 text-slate-400" />;
};

// ----------------------------------------------------------------------
// MAIN COMPONENT — memo wrapped for performance
// ----------------------------------------------------------------------
export const FlightDetails = memo(function FlightDetails({
    itinerary,
}: {
    itinerary: FlightLeg[];
}) {
    return (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            {itinerary.map((leg, i) => (
                <div key={leg.id || i} className="mb-8 last:mb-0">
                    {/* Leg Header */}
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
                                Total Duration: {leg.totalDuration} •{' '}
                                {leg.segments.length} Flight
                                {leg.segments.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-6 ml-1 space-y-6">
                        {/* Vertical line */}
                        <div className="absolute top-3 bottom-3 left-[18px] w-[2px] bg-slate-200" />

                        {leg.segments.map((seg, j) => (
                            <div key={seg.id || j} className="relative z-10">
                                {/* Timeline dot */}
                                <div
                                    className="
                                        absolute left-[12px] top-4
                                        w-3.5 h-3.5 rounded-full
                                        bg-white border-[3px] border-slate-400
                                        shadow-sm
                                    "
                                />

                                {/* Segment Card */}
                                <div
                                    className="
                                        bg-white
                                        p-4 md:p-5
                                        rounded-2xl
                                        border border-slate-100
                                        shadow-[0_12px_30px_rgba(15,23,42,0.06)]
                                        ml-4
                                        hover:border-rose-100
                                        hover:shadow-rose-100/70
                                        transition-colors duration-200
                                    "
                                >
                                    {/* Segment Header */}
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="
                                                    w-8 h-8 shrink-0
                                                    flex items-center justify-center
                                                    bg-slate-50 rounded-lg
                                                    border border-slate-100
                                                "
                                            >
                                                {seg.logo ? (
                                                    <img
                                                        src={seg.logo}
                                                        alt={seg.airline}
                                                        className="w-6 h-6 object-contain"
                                                    />
                                                ) : (
                                                    <Plane className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {seg.airline}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {seg.aircraft} • Flight{' '}
                                                    {seg.flightNumber} •{' '}
                                                    <span className="capitalize">
                                                        {seg.classType}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        {seg.amenities && seg.amenities.length > 0 && (
                                            <div className="flex gap-1.5">
                                                {seg.amenities.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="
                                                            p-1.5 bg-slate-50
                                                            rounded-md border border-slate-100
                                                            hover:bg-slate-100
                                                            transition-colors
                                                        "
                                                        title={item}
                                                    >
                                                        <AmenityIcon label={item} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Times Row */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                        {/* Departure */}
                                        <div>
                                            <p className="text-lg font-black text-slate-900">
                                                {formatTime(seg.departure.time)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDate(seg.departure.time)}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-700 mt-1">
                                                {seg.departure.airport} (
                                                {seg.departure.code})
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 mb-1">
                                                {seg.duration}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-300" />
                                        </div>

                                        {/* Arrival */}
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900">
                                                {formatTime(seg.arrival.time)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDate(seg.arrival.time)}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-700 mt-1">
                                                {seg.arrival.airport} (
                                                {seg.arrival.code})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Layover Badge */}
                                {seg.layoverToNext && (
                                    <div className="my-5 ml-4 flex items-center gap-3">
                                        <div className="h-px bg-slate-300 flex-1 border-t border-dashed" />
                                        <div
                                            className="
                                                flex items-center gap-2
                                                px-3 py-1.5
                                                bg-amber-50 border border-amber-200
                                                rounded-full
                                                text-amber-700 text-[10px]
                                                font-bold uppercase tracking-wide
                                                shadow-sm
                                            "
                                        >
                                            <Clock className="w-3 h-3" />
                                            {seg.layoverToNext} layover in{' '}
                                            {seg.arrival.code}
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
    );
});