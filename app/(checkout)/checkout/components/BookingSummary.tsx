import { 
  Plane, 
  ShieldCheck, 
  AlertTriangle,
  Calendar, 
  Ticket,
  Luggage,
  Lock,
  Users,
  Info,
  RefreshCcw
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

// ------------------------------------------------------------------
// 🛠️ TYPES & INTERFACES (Updated to match Backend)
// ------------------------------------------------------------------
interface Segment {
  mainDeparture: { code: string; time: string; city: string };
  mainArrival: { code: string; time: string; city: string };
  totalDuration: string;
  stops: number;
  mainAirline: string;
  mainLogo: string | null;
  direction: string;
}

interface FlightOffer {
  id: string;
  itinerary: Segment[]; 
  price: { 
    currency: string; 
    basePrice: number; 
    markup: number; 
    finalPrice: number 
  };
  baggage: string;
  cabinClass: string; 
  refundPolicy: string; // New from Backend
  fareRules?: {         // New from Backend
      change: string;
      refund: string;
      isRefundable: boolean;
  }; 
  conditions?: { refundable: boolean }; 
}

interface BookingSummaryProps {
  passengers: { adults: number; children: number; infants: number };
  flight: FlightOffer | null;
}

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ------------------------------------------------------------------

const formatCurrency = (amount: number | undefined, currency: string = "USD") => {
  if (amount === undefined || amount === null) return "0.00";
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2,
    }).format(Math.ceil(amount));
  } catch (e) {
    return `${amount} ${currency}`;
  }
};

const safeDateFormat = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "--";
    return format(date, formatString);
  } catch (error) {
    return "--";
  }
};

// Robust Duration Formatter (Handles Backend '10h 30m' or ISO 'PT10H30M')
const formatDuration = (duration: string | undefined) => {
  if (!duration) return "--";
  // If backend sends clean format, return as is
  if (!duration.toUpperCase().includes('P') && (duration.includes('h') || duration.includes('m'))) {
      return duration;
  }
  
  const upper = duration.toUpperCase();
  const daysMatch = upper.match(/(\d+)\s*D/);
  const hoursMatch = upper.match(/(\d+)\s*H/);
  const minutesMatch = upper.match(/(\d+)\s*M/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  if (parts.length === 0) return duration.replace('P', '').replace('T', '').toLowerCase();
  return parts.join(' ');
};

const getPassengerText = (p: { adults: number; children: number; infants: number }) => {
  const parts = [];
  if (p.adults > 0) parts.push(`${p.adults} Adult${p.adults > 1 ? 's' : ''}`);
  if (p.children > 0) parts.push(`${p.children} Child${p.children > 1 ? 'ren' : ''}`);
  if (p.infants > 0) parts.push(`${p.infants} Infant${p.infants > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') : 'No Passengers';
};

// ------------------------------------------------------------------
// 🚀 COMPONENT
// ------------------------------------------------------------------
export const BookingSummary = ({ passengers, flight }: BookingSummaryProps) => {

  // 🦴 SKELETON LOADER
  if (!flight) return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-2xl shadow-gray-100/50 h-auto animate-pulse sticky top-24">
       <div className="h-32 bg-slate-100 rounded-2xl mb-6"></div>
       <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
       </div>
       <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="h-8 bg-slate-100 rounded w-full"></div>
       </div>
    </div>
  );

  if (!flight.itinerary || flight.itinerary.length === 0) return null;

  const totalPassengers = (passengers.adults || 0) + (passengers.children || 0) + (passengers.infants || 0);
  const firstSegment = flight.itinerary[0];
  
  // Use new advanced refund policy from backend if available, else fallback
  const isRefundable = flight.fareRules?.isRefundable ?? flight.conditions?.refundable ?? false;
  const refundText = flight.refundPolicy || (isRefundable ? "Refundable" : "Non-refundable");

  return (
    <div className="sticky top-24 space-y-6">
      
      {/* 🟢 MAIN CARD */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden relative shadow-2xl shadow-slate-200/50">
        
        {/* Header Graphic */}
        <div className="absolute top-0 left-0 w-full h-28 bg-slate-900 overflow-hidden">
           <div className="absolute -right-4 -top-10 w-32 h-32 bg-rose-500/30 rounded-full blur-3xl"></div>
           <div className="absolute left-10 top-5 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative pt-6 px-6 pb-6">
            
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6 text-white relative z-10">
                <div>
                   <h3 className="text-lg font-black tracking-tight">Trip Summary</h3>
                   <div className="flex items-center gap-2 mt-2 flex-wrap">
                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                          <Users className="w-3 h-3 text-rose-400" />
                          <span className="text-xs font-bold text-slate-100">{totalPassengers} Travelers</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          <span className="text-xs font-bold text-slate-100">
                             {safeDateFormat(firstSegment.mainDeparture.time, 'dd MMM')}
                          </span>
                       </div>
                   </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-lg">
                    {flight.cabinClass}
                </div>
            </div>

            {/* 🛫 FLIGHT SEGMENTS */}
            <div className="space-y-3 mb-8">
              {flight.itinerary.map((leg, index) => (
                <div key={index} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-gray-100 p-4 relative overflow-hidden group hover:border-slate-200 transition-colors">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${index === 0 ? 'bg-rose-500' : 'bg-blue-500'}`}></div>

                  <div className="flex justify-between items-center mb-3 pl-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         {leg.direction}
                      </span>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                         {leg.mainLogo && <img src={leg.mainLogo} alt={leg.mainAirline} className="w-4 h-4 object-contain" />}
                         <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">
                            {leg.mainAirline}
                         </span>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pl-2">
                      <div className="text-left">
                         <p className="text-xl font-black text-slate-800 leading-none">{leg.mainDeparture.code}</p>
                         <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            {safeDateFormat(leg.mainDeparture.time, 'hh:mm a')}
                         </p>
                      </div>

                      <div className="flex-1 px-4 flex flex-col items-center">
                         <div className="flex items-center gap-1 w-full opacity-20 group-hover:opacity-40 transition-opacity">
                            <div className="h-[2px] w-full bg-slate-900 rounded-full"></div>
                            <Plane className="w-3.5 h-3.5 text-slate-900 rotate-90" />
                            <div className="h-[2px] w-full bg-slate-900 rounded-full"></div>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {formatDuration(leg.totalDuration)}
                         </p>
                      </div>

                      <div className="text-right">
                         <p className="text-xl font-black text-slate-800 leading-none">{leg.mainArrival.code}</p>
                         <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            {safeDateFormat(leg.mainArrival.time, 'hh:mm a')}
                         </p>
                      </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🧳 BAGGAGE & REFUND POLICY */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                    <Luggage className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">
                        {flight.baggage}
                    </span>
                </div>

                <div className={`p-3 rounded-2xl border flex flex-col justify-center items-center text-center ${
                    isRefundable 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-rose-50 border-rose-100'
                }`}>
                    {isRefundable ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-500 mb-1.5" />
                    )}
                    <span className={`text-[10px] font-bold leading-tight ${isRefundable ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {refundText}
                    </span>
                </div>
            </div>

            {/* 📜 NEW: FARE RULES (Expandable or visible) */}
            {flight.fareRules && (
               <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-3 flex items-center gap-2">
                     <Info className="w-3.5 h-3.5 text-blue-500" /> Fare Rules
                  </h4>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-medium">Change Penalty</span>
                        <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                           {flight.fareRules.change}
                        </span>
                     </div>
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-medium">Cancellation Penalty</span>
                        <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                           {flight.fareRules.refund}
                        </span>
                     </div>
                  </div>
               </div>
            )}

            {/* 💰 PRICE BREAKDOWN */}
            <div className="border-t-2 border-dashed border-slate-100 pt-5">
                <div className="flex items-center gap-2 mb-4">
                    <Ticket className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">
                        {getPassengerText(passengers)}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Base Fare</span>
                        <span className="text-slate-700">
                            {formatCurrency(flight.price.basePrice, flight.price.currency)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Taxes & Fees</span>
                        <span className="text-slate-700">
                            {formatCurrency(flight.price.markup, flight.price.currency)}
                        </span>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Payable</p>
                        <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                           Included all taxes
                        </p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(flight.price.finalPrice, flight.price.currency)}
                    </p>
                </div>
            </div>

        </div>
      </div>
      
      {/* 🔒 SECURITY FOOTER */}
      <div className="flex justify-center items-center gap-2 text-[10px] font-medium text-slate-400">
         <Lock className="w-3 h-3" />
         <span>Payments are encrypted and secure</span>
      </div>

    </div>
  );
};