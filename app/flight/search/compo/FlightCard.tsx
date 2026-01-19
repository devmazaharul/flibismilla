'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FaPlane,
    FaClock,
    FaSuitcaseRolling,
    FaInfoCircle,
    FaWifi,
    FaUtensils,
    FaChair,
    FaChevronDown,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { formatDuration, formatTime, getAirlineLogo } from '@/validation/response';
import { websiteDetails } from '@/constant/data';
import { airportDatabase } from '@/constant/flight';

const FlightCard = ({ flight, dictionaries }: { flight: any; dictionaries: any }) => {
    const [showDetails, setShowDetails] = useState(false);
    const searchParams = useSearchParams();

    const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: flight.price.currency,
        maximumFractionDigits: 0,
    }).format(flight.price.total);

    const validatingCarrier = flight.validatingAirlineCodes[0];
    const mainAirlineName = dictionaries?.carriers?.[validatingCarrier] || validatingCarrier;

    const getAirportData = (code: string) => {
        const localData = airportDatabase[code];
        if (localData) {
            return {
                city: localData.city,
                name: localData.airport,
            };
        }
        return { city: code, name: `Airport (${code})` };
    };

    const getCabinClass = (segmentId: string) => {
        try {
            const fareDetail = flight.travelerPricings[0].fareDetailsBySegment.find(
                (f: any) => f.segmentId === segmentId
            );
            const cabin = fareDetail?.cabin || 'ECONOMY';
            return cabin.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
        } catch (e) {
            return 'Economy';
        }
    };

  
    function handleBooking() {
        const adults = searchParams.get('adults') || '1';
        const children = searchParams.get('children') || '0';
        const infants = searchParams.get('infants') || '0';
        const tripTypeParam = searchParams.get('type') || 'oneway';

    
        let tripTypeLabel = 'One Way';
        if (tripTypeParam === 'round') tripTypeLabel = 'Round Trip';
        else if (tripTypeParam === 'multi') tripTypeLabel = 'Multi City';

        // Get Cabin Class from first segment
        const firstSegId = flight.itineraries[0].segments[0].id;
        const cabinClass = getCabinClass(firstSegId);

        // Generate Journey Details dynamically
        let itineraryDetails = '';

        flight.itineraries.forEach((itinerary: any, index: number) => {
            const segments = itinerary.segments;
            const firstSeg = segments[0];
            const lastSeg = segments[segments.length - 1];

            const origin = getAirportData(firstSeg.departure.iataCode);
            const dest = getAirportData(lastSeg.arrival.iataCode);
            const date = new Date(firstSeg.departure.at).toDateString();

            // Determine Label (Outbound/Return/Flight X)
            let label = `Flight ${index + 1}`;
            if (tripTypeParam === 'round') {
                label = index === 0 ? 'Outbound' : 'Return';
            } else if (tripTypeParam === 'oneway') {
                label = 'Journey';
            } else {
                label = `Flight ${index + 1}`;
            }

            itineraryDetails += `
*${label}:* ${origin.city} (${firstSeg.departure.iataCode}) ➝ ${dest.city} (${lastSeg.arrival.iataCode})
*Date:* ${date}
`;
        });


        const message = `*Flight Booking Inquiry*

*Trip Type:* ${tripTypeLabel}
*Airline:* ${mainAirlineName}
*Class:* ${cabinClass}
*Travelers:* ${adults} Adult, ${children} Child, ${infants} Infant
*Total Price:* ${price}

*-----------------------------*
*ITINERARY DETAILS:*
${itineraryDetails}
*-----------------------------*

I would like to proceed with this booking. Please assist.`;

        const whatsappURL = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xl shadow-gray-100 transition-all duration-300 overflow-hidden group mb-6 relative">
            <div className="p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-9 space-y-8">
                    {flight.itineraries.map((itinerary: any, idx: number) => {
                        const segments = itinerary.segments;
                        const firstSeg = segments[0];
                        const lastSeg = segments[segments.length - 1];

                        const airlineCode = firstSeg.carrierCode;
                        const airlineName = dictionaries?.carriers?.[airlineCode] || airlineCode;
                        const stops = segments.length - 1;

                        const originInfo = getAirportData(firstSeg.departure.iataCode);
                        const destInfo = getAirportData(lastSeg.arrival.iataCode);

                        return (
                            <div
                                key={idx}
                                className="flex flex-col sm:flex-row gap-3 items-center border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                            >
                                <div className="flex items-center gap-4 w-full sm:w-[28%]">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                                        <img
                                            src={getAirlineLogo(airlineCode)}
                                            alt={airlineName || airlineCode}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = '/fallback-airline.png';
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <h4
                                            className="font-bold text-gray-900 text-sm truncate w-32"
                                            title={airlineName}
                                        >
                                            {airlineName}
                                        </h4>
                                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                                            {airlineCode}-{firstSeg.number}
                                        </span>
                                        {/* Trip Label Badge */}
                                        {flight.itineraries.length > 1 && (
                                          <i>
                                              <small className="text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-wider">
                                                {idx === 0 ? 'Outbound' : idx === 1 && flight.itineraries.length === 2 ? 'Return' : `Flight ${idx + 1}`}
                                            </small>
                                          </i>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-between w-full sm:w-auto gap-3">
                                    <div className="text-center min-w-[90px]">
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatTime(firstSeg.departure.at)}
                                        </p>
                                        <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                                            {firstSeg.departure.iataCode}
                                        </p>
                                        <p
                                            className="text-[10px] text-gray-400 truncate max-w-[90px]"
                                            title={originInfo.name}
                                        >
                                            {originInfo.city}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 px-4">
                                        <p className="text-[10px] font-semibold text-gray-400 mb-1">
                                            {formatDuration(itinerary.duration)}
                                        </p>
                                        <div className="w-full h-[2px] bg-gray-200 relative flex items-center justify-center rounded-full my-1">
                                            {stops > 0 && (
                                                <div className="w-2.5 h-2.5 bg-white border-[3px] border-rose-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-sm"></div>
                                            )}
                                            <FaPlane
                                                className={`text-rose-500 text-xs absolute -top-[6px] ${stops === 0 ? 'left-1/2 -translate-x-1/2' : 'right-0'} transform rotate-90`}
                                            />
                                        </div>
                                        <p
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${stops === 0 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}
                                        >
                                            {stops === 0
                                                ? 'Non-stop'
                                                : `${stops} Stop${stops > 1 ? 's' : ''}`}
                                        </p>
                                    </div>

                                    <div className="text-center min-w-[90px]">
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatTime(lastSeg.arrival.at)}
                                        </p>
                                        <p className="text-xs font-bold text-gray-500 mt-1 uppercase">
                                            {lastSeg.arrival.iataCode}
                                        </p>
                                        <p
                                            className="text-[10px] text-gray-400 truncate max-w-[90px]"
                                            title={destInfo.name}
                                        >
                                            {destInfo.city}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8 flex flex-row lg:flex-col justify-between items-center lg:items-end text-right h-full">
                    <div>
                        <span className="text-3xl font-extrabold text-gray-900 block tracking-tight">
                            {price}
                        </span>
                        <span className="text-xs font-bold text-gray-400">Total Price</span>
                    </div>
                    <Button
                        onClick={handleBooking}
                        className="bg-gray-900 hover:bg-rose-600 text-white w-32 lg:w-full mt-0 lg:mt-6 h-12 rounded-xl font-bold shadow-lg shadow-gray-200 transition-all active:scale-95"
                    >
                        Select
                    </Button>
                </div>
            </div>

            <div
                onClick={() => setShowDetails(!showDetails)}
                className="bg-gray-50/50 hover:bg-rose-50/30 px-6 py-3 flex justify-between items-center border-t border-gray-100 cursor-pointer transition-colors group/footer"
            >
                <div className="flex gap-4 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <FaSuitcaseRolling className="text-rose-500" /> Baggage Included
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                        <FaInfoCircle className="text-rose-500" /> Non-Refundable
                    </span>
                </div>
                <button className="text-xs font-bold text-rose-600 flex items-center gap-1 group-hover/footer:underline">
                    {showDetails ? 'Hide Details' : 'View Details'}
                    <span
                        className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    >
                        <FaChevronDown />
                    </span>
                </button>
            </div>

            {showDetails && (
                <div className="bg-white border-t border-gray-100 p-6 md:p-8 animate-in slide-in-from-top-2">
                    {flight.itineraries.map((itinerary: any, tripIdx: number) => (
                        <div key={tripIdx} className="mb-12 last:mb-0">
                            <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100 w-fit">
                                <span className="bg-gray-900 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                    Trip {tripIdx + 1}
                                </span>
                                <h4 className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                    <FaClock className="text-rose-500" /> Duration:{' '}
                                    {formatDuration(itinerary.duration)}
                                </h4>
                            </div>

                            <div className="relative pl-2">
                                {itinerary.segments.map((seg: any, segIdx: number) => {
                                    let layoverTime = '';
                                    if (segIdx < itinerary.segments.length - 1) {
                                        const arrival = new Date(seg.arrival.at).getTime();
                                        const nextDep = new Date(
                                            itinerary.segments[segIdx + 1].departure.at,
                                        ).getTime();
                                        const diff = nextDep - arrival;
                                        const hours = Math.floor(diff / (1000 * 60 * 60));
                                        const mins = Math.floor(
                                            (diff % (1000 * 60 * 60)) / (1000 * 60),
                                        );
                                        layoverTime = `${hours}h ${mins}m`;
                                    }

                                    const carrierName =
                                        dictionaries?.carriers?.[seg.carrierCode] ||
                                        seg.carrierCode;
                                    const aircraftName =
                                        dictionaries?.aircraft?.[seg.aircraft.code] ||
                                        seg.aircraft.code;
                                    const depInfo = getAirportData(seg.departure.iataCode);
                                    const arrInfo = getAirportData(seg.arrival.iataCode);
                                    const cabinClass = getCabinClass(seg.id);

                                    return (
                                        <div
                                            key={segIdx}
                                            className="relative pl-8 border-l-[2px] border-dashed border-gray-300 pb-10 last:pb-0 last:border-l-0"
                                        >
                                            <div className="absolute -left-[9px] top-0 w-[16px] h-[16px] bg-rose-500 rounded-full border-[4px] border-white shadow-sm z-10"></div>

                                            <div className="bg-white rounded-2xl border border-gray-200 p-5 relative -top-3  transition-all">
                                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={getAirlineLogo(seg.carrierCode)}
                                                            className="w-6 h-6 object-contain"
                                                            onError={(e) =>
                                                                ((
                                                                    e.target as HTMLImageElement
                                                                ).src = '/fallback-airline.png')
                                                            }
                                                        />
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900">
                                                                {carrierName}{' '}
                                                                <span className="text-gray-400 font-normal">
                                                                    | {seg.carrierCode}-{seg.number}
                                                                </span>
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                                Aircraft: {aircraftName} • {cabinClass}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-gray-300 text-sm">
                                                        <FaWifi title="Wifi" />{' '}
                                                        <FaUtensils title="Meal" />{' '}
                                                        <FaChair title="Seat" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                                Depart
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(
                                                                    seg.departure.at,
                                                                ).toDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {formatTime(seg.departure.at)}
                                                        </p>
                                                        <div className="mt-1">
                                                            <p className="text-sm font-bold text-rose-600">
                                                                {depInfo.city}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {depInfo.name} (
                                                                {seg.departure.iataCode})
                                                            </p>
                                                            {seg.departure.terminal && (
                                                                <p className="text-[10px] text-gray-400 mt-1 font-bold bg-gray-50 w-fit px-1 rounded">
                                                                    Terminal{' '}
                                                                    {seg.departure.terminal}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                                Arrive
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(
                                                                    seg.arrival.at,
                                                                ).toDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {formatTime(seg.arrival.at)}
                                                        </p>
                                                        <div className="mt-1">
                                                            <p className="text-sm font-bold text-rose-600">
                                                                {arrInfo.city}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {arrInfo.name} (
                                                                {seg.arrival.iataCode})
                                                            </p>
                                                            {seg.arrival.terminal && (
                                                                <p className="text-[10px] text-gray-400 mt-1 font-bold bg-gray-50 w-fit px-1 rounded">
                                                                    Terminal{' '}
                                                                    {seg.arrival.terminal}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {layoverTime && (
                                                <div className="my-6 pl-4 relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-orange-200"></div>
                                                    <div className="bg-orange-50 text-orange-800 px-4 py-3 rounded-xl text-xs font-bold border border-orange-100 flex items-center gap-3">
                                                        <FaSuitcaseRolling className="text-lg" />
                                                        <div>
                                                            <p className="text-orange-900 uppercase tracking-wider text-[10px]">
                                                                Layover in {arrInfo.city}
                                                            </p>
                                                            <p className="text-sm">
                                                                Change Planes • Wait time:{' '}
                                                                {layoverTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlightCard;