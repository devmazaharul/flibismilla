'use client';

import { useState } from 'react';
import { 
     FaClock, FaSuitcaseRolling, FaChevronDown, 
    FaPlaneDeparture, FaPlaneArrival, FaInfoCircle, FaWifi, FaUtensils, FaChair 
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { formatDuration, formatTime, getAirlineLogo } from '@/validation/response'; 
import { websiteDetails } from '@/constant/data';

const FlightCard = ({ flight, dictionaries }: { flight: any, dictionaries: any }) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Price Formatting
    const price = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: flight.price.currency,
        maximumFractionDigits: 0 
    }).format(flight.price.total);

    // Get Main Airline (Validating Carrier)
    const validatingCarrier = flight.validatingAirlineCodes[0];
    const mainAirlineName = dictionaries?.carriers?.[validatingCarrier] || validatingCarrier;

    // Booking Handler
    const handleBooking = () => {
        const message = `Booking Request:\nAirline: ${mainAirlineName}\nPrice: ${price}\nID: ${flight.id}`;
        window.open(`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-200/70  shadow-2xl shadow-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group mb-6">
          
            {/* ===================== MAIN SUMMARY CARD ===================== */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left: Itinerary Summary (Dynamic Loop for Multi-Legs) */}
                <div className="lg:col-span-9 space-y-6">
                    {flight.itineraries.map((itinerary: any, idx: number) => {
                        const firstSeg = itinerary.segments[0];
                        const lastSeg = itinerary.segments[itinerary.segments.length - 1];
                        const airlineCode = firstSeg.carrierCode;
                        const airlineName = dictionaries?.carriers?.[airlineCode] || airlineCode;
                        const stops = itinerary.segments.length - 1;

                        return (
                            <div key={idx} className="flex flex-col sm:flex-row gap-4 items-center border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                {/* Leg Badge (Trip 1, Trip 2) */}
                                <div className="hidden sm:flex flex-col justify-center items-center w-16 mr-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip</span>
                                    <span className="text-xl font-black text-gray-200">{idx + 1}</span>
                                </div>

                                {/* Airline Logo & Info */}
                                <div className="flex items-center gap-4 w-full sm:w-[25%]">
                                    <div className="w-10 h-10 relative bg-white rounded-full p-1 border border-gray-100 shadow-sm">
                                        <img 
                                            src={getAirlineLogo(airlineCode)} 
                                            alt={airlineCode} 
                                            className="w-full h-full object-contain"
                                            onError={(e) => (e.target as HTMLImageElement).src = '/fallback-airline.png'}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm truncate w-28" title={airlineName}>{airlineName}</h4>
                                        <p className="text-[10px] text-gray-500">{airlineCode}-{firstSeg.number}</p>
                                    </div>
                                </div>

                                {/* Route Visualization */}
                                <div className="flex-1 flex items-center justify-between w-full sm:w-auto gap-2">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">{formatTime(firstSeg.departure.at)}</p>
                                        <p className="text-sm font-bold text-gray-500">{firstSeg.departure.iataCode}</p>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 px-4">
                                        <p className="text-[10px] text-gray-400 mb-1">{formatDuration(itinerary.duration)}</p>
                                        <div className="w-full h-[2px] bg-gray-200 relative flex items-center justify-center rounded-full">
                                            {/* Stop Dots */}
                                            {stops > 0 && <div className="w-2 h-2 bg-rose-500 rounded-full border-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>}
                                        </div>
                                        <p className={`text-[10px] mt-1 font-bold ${stops === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">{formatTime(lastSeg.arrival.at)}</p>
                                        <p className="text-sm font-bold text-gray-500">{lastSeg.arrival.iataCode}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Price & CTA */}
                <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6 flex flex-row lg:flex-col justify-between items-center lg:items-end text-right">
                    <div>
                        <span className="text-2xl font-extrabold text-gray-900 block">{price}</span>
                        <span className="text-xs text-gray-400 font-medium">Total Price</span>
                    </div>
                    <Button 
                        onClick={handleBooking}
                        className="bg-rose-600 hover:bg-rose-700 text-white w-32 lg:w-full mt-0 lg:mt-4 h-11 rounded-xl font-bold shadow-lg shadow-rose-200 transition-all"
                    >
                        Select
                    </Button>
                </div>
            </div>

            {/* ===================== FOOTER TOGGLE ===================== */}
            <div 
                onClick={() => setShowDetails(!showDetails)}
                className="bg-gray-50/80 px-6 py-3 flex justify-between items-center border-t border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            >
                <div className="flex gap-4 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1"><FaSuitcaseRolling className="text-rose-500"/> Baggage Included</span>
                    <span className="flex items-center gap-1 hidden sm:flex"><FaInfoCircle className="text-rose-500"/> Non-Refundable</span>
                </div>
                <button className="text-xs font-bold text-rose-600 flex items-center gap-1 uppercase tracking-wide">
                    {showDetails ? 'Hide Itinerary' : 'View Itinerary'}
                    <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}><FaChevronDown /></span>
                </button>
            </div>

            {/* ===================== EXPANDED DETAILS (TIMELINE) ===================== */}
            {showDetails && (
                <div className="bg-white border-t border-gray-100 p-6 sm:p-8 animate-in slide-in-from-top-2">
                    
                    {/* Iterate over Trips (Itineraries) */}
                    {flight.itineraries.map((itinerary: any, tripIdx: number) => (
                        <div key={tripIdx} className="mb-10 last:mb-0">
                            
                            {/* Trip Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-rose-600/90 text-white font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                                    Trip {tripIdx + 1}
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <FaClock className="text-gray-400" /> Total Duration: {formatDuration(itinerary.duration)}
                                </h4>
                            </div>

                            {/* Segments Timeline */}
                            <div className="space-y-0 relative pl-2">
                                {itinerary.segments.map((seg: any, segIdx: number) => {
                                    // Layover Calculation
                                    let layoverTime = '';
                                    if (segIdx < itinerary.segments.length - 1) {
                                        const arrival = new Date(seg.arrival.at).getTime();
                                        const nextDep = new Date(itinerary.segments[segIdx + 1].departure.at).getTime();
                                        const diff = nextDep - arrival;
                                        const hours = Math.floor(diff / (1000 * 60 * 60));
                                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                        layoverTime = `${hours}h ${mins}m`;
                                    }

                                    const carrierName = dictionaries?.carriers?.[seg.carrierCode];
                                    const aircraftName = dictionaries?.aircraft?.[seg.aircraft.code];

                                    return (
                                        <div key={segIdx} className="relative pl-8 border-l-2 border-dashed border-gray-300 pb-10 last:pb-0 last:border-l-0">
                                            
                                            {/* Dot Icon */}
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gray-800 rounded-full border-4 border-white shadow-sm z-10"></div>

                                            {/* Flight Segment Card */}
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative top-[-10px]">
                                                
                                                {/* Header: Airline & Plane */}
                                                <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={getAirlineLogo(seg.carrierCode)} 
                                                            className="w-8 h-8 object-contain"
                                                            onError={(e) => (e.target as HTMLImageElement).src = '/fallback-airline.png'}
                                                        />
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900">{carrierName} <span className="text-xs text-gray-500 font-normal">({seg.carrierCode}-{seg.number})</span></p>
                                                            <p className="text-[10px] text-gray-500">Aircraft: {aircraftName || seg.aircraft.code} • Economy</p>
                                                        </div>
                                                    </div>
                                                    {/* Amenities Icons (Static for demo) */}
                                                    <div className="flex gap-2 text-gray-400">
                                                        <FaWifi title="Wifi" className="hover:text-rose-500 transition-colors"/>
                                                        <FaUtensils title="Meal" className="hover:text-rose-500 transition-colors"/>
                                                        <FaChair title="Seat" className="hover:text-rose-500 transition-colors"/>
                                                    </div>
                                                </div>

                                                {/* Times & Places */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FaPlaneDeparture /> Depart</p>
                                                        <p className="text-lg font-bold text-gray-900">{formatTime(seg.departure.at)}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{new Date(seg.departure.at).toDateString()}</p>
                                                        <p className="text-sm font-bold text-rose-600 mt-1">{seg.departure.iataCode} <span className="text-gray-400 font-normal text-xs">Terminal {seg.departure.terminal || 'N/A'}</span></p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FaPlaneArrival /> Arrive</p>
                                                        <p className="text-lg font-bold text-gray-900">{formatTime(seg.arrival.at)}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{new Date(seg.arrival.at).toDateString()}</p>
                                                        <p className="text-sm font-bold text-rose-600 mt-1">{seg.arrival.iataCode} <span className="text-gray-400 font-normal text-xs">Terminal {seg.arrival.terminal || 'N/A'}</span></p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                                    <span>Duration: {formatDuration(seg.duration)}</span>
                                                    <span>Cabin: Economy</span>
                                                </div>
                                            </div>

                                            {/* Layover Badge */}
                                            {layoverTime && (
                                                <div className="my-6 flex items-center gap-4">
                                                    <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-xs font-bold border border-orange-100 flex items-center gap-2 shadow-sm">
                                                        <FaSuitcaseRolling /> Change Planes in {seg.arrival.iataCode} • {layoverTime} Layover
                                                    </div>
                                                    <div className="h-[1px] bg-gray-200 flex-1"></div>
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