"use client";
import { useState } from "react";

import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { 
  FaPlane, FaPlaneDeparture, FaPlaneArrival, FaClock, 
  FaSuitcaseRolling, FaCalendarAlt, FaFilter, FaChevronDown, FaChevronUp 
} from "react-icons/fa";
import { flightResults } from "@/constant/flight";

const FlightSearchPage = () => {
  const { colors, layout, button } = appTheme;
  
  // Dummy Search State
  const [searchParams, setSearchParams] = useState({
    from: "Dhaka (DAC)",
    to: "New York (JFK)",
    date: "15 Jan, 2026",
    travelers: "1 Adult, Economy"
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* ================= 1. Top Search Header (Sticky) ================= */}
      <div className="bg-white border-b border-gray-200/70 sticky top-0 z-40 shadow-2xl shadow-gray-100 ">
        <div className={`${layout.container} py-4`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Route Info */}
            <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 w-full md:w-auto">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase">From</span>
                <span className="font-bold text-gray-800">{searchParams.from}</span>
              </div>
              <FaPlane className="text-rose-400 rotate-90 md:rotate-0" />
              <div className="flex flex-col text-right md:text-left">
                <span className="text-xs text-gray-500 font-bold uppercase">To</span>
                <span className="font-bold text-gray-800">{searchParams.to}</span>
              </div>
            </div>

            {/* Date & Traveler Info */}
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
               <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 whitespace-nowrap">
                  <FaCalendarAlt className="text-rose-500" />
                  <span className="font-medium text-gray-700">{searchParams.date}</span>
               </div>
               <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 whitespace-nowrap">
                  <FaSuitcaseRolling className="text-rose-500" />
                  <span className="font-medium text-gray-700">{searchParams.travelers}</span>
               </div>
               <Button className={`${button.primary} h-auto py-2`}>Modify</Button>
            </div>

          </div>
        </div>
      </div>


      <div className={`${layout.container} mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8`}>
        {/* ================= 2. Sidebar Filters (Left) ================= */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-900">Filters</h3>
               <span className="text-xs text-rose-600 font-bold cursor-pointer">Reset</span>
            </div>
            
            {/* Stops Filter */}
            <div className="mb-6">
               <h4 className="text-sm font-bold text-gray-700 mb-3">Stops</h4>
               <div className="space-y-2">
                 {["Direct", "1 Stop", "2+ Stops"].map((stop, i) => (
                   <label key={i} className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                     <span className="text-gray-600 text-sm">{stop}</span>
                   </label>
                 ))}
               </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
               <h4 className="text-sm font-bold text-gray-700 mb-3">Price Range</h4>
               <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600" />
               <div className="flex justify-between text-xs text-gray-500 mt-2">
                 <span>$500</span>
                 <span>$5000</span>
               </div>
            </div>

             {/* Airlines Filter */}
             <div>
               <h4 className="text-sm font-bold text-gray-700 mb-3">Airlines</h4>
               <div className="space-y-2">
                 {["Emirates", "Qatar Airways", "Turkish Airlines", "Biman"].map((air, i) => (
                   <label key={i} className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                     <span className="text-gray-600 text-sm">{air}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* ================= 3. Flight Results (Right) ================= */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          
          {/* Tabs (Cheapest / Fastest) */}
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 mb-4 overflow-x-auto">
             <button className="flex-1 py-3 px-4 text-sm font-bold text-rose-600 bg-rose-50 rounded-lg text-center whitespace-nowrap">
                Cheapest • $950
             </button>
             <button className="flex-1 py-3 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg text-center whitespace-nowrap">
                Fastest • 11h 30m
             </button>
             <button className="flex-1 py-3 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg text-center whitespace-nowrap">
                Best Value • $1180
             </button>
          </div>

          {/* Mapping Flight Cards */}
          {flightResults.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}

        </div>
      </div>
    </main>
  );
};

// ================= Helper Component: Flight Card =================
const FlightCard = ({ flight }: { flight: any }) => {
    const [showDetails, setShowDetails] = useState(false);
    const { button } = appTheme;
  
    return (
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-2xl shadow-gray-100 hover:shadow-md transition-shadow overflow-hidden">
        
        {/* Top Section: Main Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          {/* 1. Airline Info */}
          <div className="flex items-center gap-4 col-span-1">
             <div className="w-12 h-12 relative flex-shrink-0">
               {/* Use Next/Image in real project */}
               <img src={flight.logo} alt={flight.airline} className="w-full h-full object-contain" />
             </div>
             <div>
                <h3 className="font-bold text-gray-900">{flight.airline}</h3>
                <p className="text-xs text-gray-500">{flight.flightNumber}</p>
             </div>
          </div>
  
          {/* 2. Timing & Path Info (Middle) */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-between px-2 md:px-8">
             {/* Departure */}
             <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{flight.departureTime}</p>
                <p className="text-sm text-gray-500 font-medium">{flight.fromCode}</p>
             </div>
  
             {/* Path Graphic */}
             <div className="flex-1 flex flex-col items-center px-4">
                <p className="text-xs text-gray-500 mb-1">{flight.duration}</p>
                <div className="w-full flex items-center gap-1">
                    <div className="h-[2px] bg-gray-300 flex-1 relative">
                        {/* Connecting Dots */}
                        {flight.stops > 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white border-2 border-rose-500 rounded-full" title={flight.stopInfo}></div>
                        )}
                    </div>
                    <FaPlane className="text-rose-500 text-sm transform rotate-90" />
                    <div className="h-[2px] bg-gray-300 flex-1"></div>
                </div>
                <p className={`text-xs mt-1 font-bold ${flight.stops === 0 ? "text-green-600" : "text-rose-600"}`}>
                   {flight.stopInfo}
                </p>
             </div>
  
             {/* Arrival */}
             <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{flight.arrivalTime}</p>
                <p className="text-sm text-gray-500 font-medium">{flight.toCode}</p>
             </div>
          </div>
  
          {/* 3. Price & Action */}
          <div className="col-span-1 flex flex-row md:flex-col justify-between md:justify-center md:items-end gap-2 md:text-right border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
             <div>
                <p className="text-2xl font-extrabold text-rose-600">${flight.price}</p>
                <p className="text-xs text-gray-400">per person</p>
             </div>
             <Button className={`${button.primary} px-6`}>
                 Select <FaChevronDown className="ml-2 text-xs opacity-70" />
             </Button>
          </div>
        </div>
  
        {/* Bottom Bar: Toggle Details */}
        <div className="bg-gray-50 px-6 py-2 flex justify-between items-center border-t border-gray-100">
             <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                <FaSuitcaseRolling /> Refundable
             </span>
             <button 
               onClick={() => setShowDetails(!showDetails)}
               className="text-sm font-bold text-rose-600 flex items-center gap-1 hover:underline"
             >
                {showDetails ? "Hide Details" : "Flight Details"} 
                {showDetails ? <FaChevronUp /> : <FaChevronDown />}
             </button>
        </div>
  
        {/* ================= Expanding Details Section ================= */}
        {showDetails && (
          <div className="bg-white border-t border-gray-200 p-6 animate-in slide-in-from-top-2">
            
            {flight.stops === 0 ? (
                <div className="flex items-center gap-3 text-gray-600 bg-green-50 p-4 rounded-lg border border-green-100">
                    <FaPlane className="text-green-600" />
                    <span>Direct flight from <strong>{flight.fromCity}</strong> to <strong>{flight.toCity}</strong>. No layovers.</span>
                </div>
            ) : (
                <div className="space-y-6 relative">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
  
                    {flight.legs.map((leg: any, idx: number) => (
                        <div key={idx} className="relative z-10">
                            {/* Segment Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                                   <FaPlaneDeparture className="text-gray-500 text-sm" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm">
                                        {leg.from} <span className="text-gray-400 mx-2">➔</span> {leg.to}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Airline: {leg.airline} • Duration: {leg.duration}
                                    </p>
                                </div>
                            </div>
  
                            {/* Layover Badge (if not last item) */}
                            {idx < flight.legs.length - 1 && (
                                <div className="ml-12 my-3">
                                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 flex w-fit items-center gap-1">
                                       <FaClock /> Layover in {leg.to}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
  
                    <div className="flex items-center gap-4 relative z-10 pt-2">
                         <div className="w-10 h-10 rounded-full bg-rose-600 border-4 border-white shadow-2xl shadow-gray-100 flex items-center justify-center flex-shrink-0">
                             <FaPlaneArrival className="text-white text-sm" />
                         </div>
                         <div className="flex-1">
                             <h4 className="font-bold text-gray-800 text-sm">Arrive at {flight.toCity} ({flight.toCode})</h4>
                         </div>
                    </div>
                </div>
            )}
            
          </div>
        )}
      </div>
    );
  };

export default FlightSearchPage;