import { 
  Plane, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Briefcase, 
  Armchair, 
  Ticket,
  Info,
  ChevronRight,
  CreditCard,
  Luggage
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface FlightOffer {
  id: string;
  itinerary: any[]; 
  price: { currency: string; basePrice: number; markup: number; finalPrice: number };
  baggage: string;
  cabinClass: string; 
  conditions: { refundable: boolean };
}

interface BookingSummaryProps {
  passengers: { adults: number; children: number; infants: number };
  flight: FlightOffer | null;
}

export const BookingSummary = ({ passengers, flight }: BookingSummaryProps) => {

  if (!flight) return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-96 animate-pulse">
       <div className="flex justify-between mb-8">
          <div className="h-6 bg-slate-100 rounded w-1/3"></div>
          <div className="h-6 bg-slate-100 rounded w-1/4"></div>
       </div>
       <div className="space-y-4">
          <div className="h-24 bg-slate-50 rounded-2xl"></div>
          <div className="h-24 bg-slate-50 rounded-2xl"></div>
       </div>
    </div>
  );

  const getLegLabel = (index: number, totalLegs: number) => {
    if (totalLegs === 1) return "One Way";
    if (totalLegs === 2) return index === 0 ? "Outbound" : "Inbound";
    return `Flight ${index + 1}`;
  };

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;
  
  // Assuming flight.price.finalPrice IS THE TOTAL PRICE from API
  // If it's per person, you need to adjust this calculation.
  const grandTotal = flight.price.finalPrice; 

  return (
    <div className="sticky top-24 space-y-6">
      
      {/* 🟢 MAIN CARD */}
      <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
        
        {/* Header Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-32 bg-slate-800 overflow-hidden">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl"></div>
           <div className="absolute -left-10 top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative p-6">
            
            {/* Title Section */}
            <div className="flex items-center justify-between mb-8 text-white">
                <div>
                   <h3 className="text-xl font-black tracking-tight">Your Trip</h3>
                   <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                      <Ticket className="w-3 h-3 text-rose-500" /> 
                      {totalPassengers} Traveler(s) • {flight.cabinClass}
                   </p>
                </div>
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                   <Plane className="w-5 h-5 text-white -rotate-45" />
                </div>
            </div>

            {/* 🟢 FLIGHT LEGS (Ticket Style) */}
            <div className="space-y-4 mb-8">
              {flight.itinerary.map((leg, index) => (
                <div key={index} className="group relative bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-gray-100 transition-all hover:shadow-md hover:border-slate-300/60">
                  
                  {/* Left Decoration Stripe */}
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-rose-500 to-orange-500 rounded-r-full"></div>

                  <div className="p-4 pl-6">
                    {/* Leg Header */}
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {getLegLabel(index, flight.itinerary.length)}
                       </span>
                       <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {format(parseISO(leg.mainDeparture.time), 'EEE, dd MMM')}
                       </span>
                    </div>

                    {/* Route Info */}
                    <div className="flex items-center justify-between gap-2">
                       {/* Departure */}
                       <div className="text-left min-w-[3rem]">
                          <p className="text-xl font-black text-slate-900 leading-none">{leg.mainDeparture.code}</p>
                          <p className="text-xs font-bold text-slate-500 mt-1">{format(parseISO(leg.mainDeparture.time), 'HH:mm')}</p>
                       </div>

                       {/* Duration Line */}
                       <div className="flex-1 flex flex-col items-center px-2">
                          <div className="w-full flex items-center gap-1 mb-1">
                             <div className="h-[2px] w-full bg-slate-200 rounded-full"></div>
                             <Plane className="w-3 h-3 text-slate-300 shrink-0 rotate-90" />
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 text-center w-full truncate">
                             {leg.totalDuration} • {leg.stops === 0 ? 'Direct' : `${leg.stops} Stop`}
                          </p>
                       </div>

                       {/* Arrival */}
                       <div className="text-right min-w-[3rem]">
                          <p className="text-xl font-black text-slate-900 leading-none">{leg.mainArrival.code}</p>
                          <p className="text-xs font-bold text-slate-500 mt-1">{format(parseISO(leg.mainArrival.time), 'HH:mm')}</p>
                       </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between gap-2">
                       <div className="flex items-center gap-2">
                          <img src={leg.mainLogo || '/placeholder.png'} alt="Airline" className="w-5 h-5 object-contain" />
                          <p className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{leg.mainAirline}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                             <Luggage className="w-3 h-3" /> {flight.baggage}
                          </div>
                       </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* 🟢 PRICE BREAKDOWN (Accordion Style) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
                
                {/* Expandable Header (Visual only for now) */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 border-dashed">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Breakdown</span>
                    <CreditCard className="w-4 h-4 text-slate-300" />
                </div>

                <div className="space-y-2.5">
                    {/* Item Row */}
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Base Fare ({totalPassengers} Travelers)</span>
                        <span className="font-bold text-slate-900">
                           {flight.price.currency} {(Math.ceil(flight.price.basePrice)).toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Taxes */}
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Taxes & Fees</span>
                        <span className="font-bold text-slate-900">
                           {flight.price.currency} {(flight.price.markup).toLocaleString()}
                        </span>
                    </div>

                    {/* Discount (if any - optional) */}
                    {/* <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount</span>
                        <span className="font-bold">-$0.00</span>
                    </div> */}
                </div>

                {/* Total Row */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400">Total Amount</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1">No hidden fees</span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {flight.price.currency} {grandTotal.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* 🟢 TRUST BADGE */}
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-xl shadow-2xl shadow-gray-100 ">
               <div className="p-2 bg-green-50 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
               </div>
               <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  <strong className="text-slate-800">Free Cancellation</strong> within 24 hours of booking confirmation.
               </p>
            </div>

        </div>
      </div>
      
    </div>
  );
};