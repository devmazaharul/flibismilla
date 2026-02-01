'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Plane, 
  Calendar, 
  Clock, 
  CreditCard, 
  Wallet, 
  Download, 
  ChevronRight, 
  AlertTriangle, 
  User, 
  Phone, 
  Mail, 
  X,
  CheckCircle, 
  XCircle, 
  ShoppingCart, 
  DollarSign,
  Eye, 
  EyeOff, 
  Ban, 
  RotateCcw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';


// ----------------------------------------------------------------------
// 🟢 TYPES & INTERFACES
// ----------------------------------------------------------------------

// 1. List View Data Structure
interface Booking {
  id: string;
  bookingRef: string;
  pnr: string;
  status: 'held' | 'issued' | 'cancelled' | 'expired' | 'processing';
  flight: {
    airline: string;
    flightNumber: string;
    route: string;
    date: string;
    duration: string;
    tripType: 'one_way' | 'round_trip' | 'multi_city';
  };
  passengerName: string;
  passengerCount: number;
  contact: {
    email: string;
    phone: string;
  };
  paymentSource: {
    holderName: string;
    cardLast4: string;
  };
  amount: {
    total: number;       // Customer Price
    base_amount: number; // Agency Cost
    markup: number;
    currency: string;
  };
  timings: {
    deadline: string;
    createdAt: string;
    timeLeft: number;
  };
  actionData: {
    ticketUrl: string | null;
  };
}

// 2. Detailed View Data Structure (API Response)
interface BookingDetails {
  id: string;
  bookingRef: string;
  pnr: string;
  status: string;
  availableActions: string[]; // ['cancel', 'change']
  
  // 🟢 Policies Section
  policies: {
    cancellation: { allowed: boolean; penalty: string; note: string; timeline: string };
    dateChange: { allowed: boolean; penalty: string; note: string; timeline: string };
  };

  segments: {
    airline: string; 
    airlineCode: string; 
    flightNumber: string; 
    aircraft: string;
    origin: string; 
    originCity: string; 
    departingAt: string;
    destination: string; 
    destinationCity: string; 
    arrivingAt: string;
    duration: string; 
    baggage: string; 
    cabinClass: string;
  }[];

  passengers: {
    fullName: string; 
    type: string; 
    gender: string; 
    dob: string;
    ticketNumber: string;
  }[];

  finance: {
    basePrice: string; 
    tax: string; 
    duffelTotal: string; 
    yourMarkup: number; 
    clientTotal: number; 
    currency: string;
  };

  paymentSource: {
    holderName: string; 
    cardNumber: string; 
    expiryDate: string; 
    cvv: string; 
    billingAddress: any;
  } | null;
}

// ----------------------------------------------------------------------
// 🟢 HELPER COMPONENTS
// ----------------------------------------------------------------------

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) return 'Expired';

      const hours = Math.floor((diff / (1000 * 60 * 60)));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(diff < 3600000); // Less than 1 hour (Red Alert)
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 'Expired') return <span className="text-red-500 font-bold text-xs">Expired</span>;

  return (
    <div className={`flex items-center gap-1 text-xs font-mono font-medium ${isUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
      <Clock size={12} />
      {timeLeft}
    </div>
  );
};

// ----------------------------------------------------------------------
// 🟢 MAIN COMPONENT
// ----------------------------------------------------------------------

export default function BookingsDashboard() {
  // --- States ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Modals States
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Detailed View States
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false); // Eye Toggle

  // Issue Processing States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'balance'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);

  // ----------------------------------------------------------------------
  // 🟢 API CALLS
  // ----------------------------------------------------------------------

  // 1. Fetch All Bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/duffel/booking');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 2. Fetch Single Booking Details
  const fetchBookingDetails = async (id: string) => {
    setDetailsLoading(true);
    setBookingDetails(null);
    setShowSensitive(false);
    try {
      const res = await axios.get(`/api/duffel/booking/${id}`);
      if (res.data.success) {
        setBookingDetails(res.data.data);
      } else {
        toast.error("Failed to fetch details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network Error: Could not fetch details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // 🟢 HANDLERS
  // ----------------------------------------------------------------------

  const openIssueModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentMethod('balance'); // Default to balance
    setIssueModalOpen(true);
  };

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
    fetchBookingDetails(booking.id);
  };

  const handleIssueTicket = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);

    try {
      const res = await axios.post('/api/duffel/booking/issue', {
        bookingId: selectedBooking.id,
        paymentMethod: paymentMethod
      });

      if (res.data.success) {
        toast.success("Ticket Issued Successfully! 🎉");
        setIssueModalOpen(false);
        fetchBookings(); // Refresh the list
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to issue ticket";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------------------
  // 🟢 LOGIC & CALCULATIONS
  // ----------------------------------------------------------------------

  // Stats Calculation
  const stats = useMemo(() => {
    return {
        total: bookings.length,
        issued: bookings.filter(b => b.status === 'issued').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        profit: bookings
            .filter(b => b.status === 'issued')
            .reduce((acc, curr) => acc + (curr.amount.markup || 0), 0)
    };
  }, [bookings]);

  // Filtering Logic
  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.bookingRef.toLowerCase().includes(search.toLowerCase()) || 
                        b.pnr?.toLowerCase().includes(search.toLowerCase()) || 
                        b.passengerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      issued: "bg-emerald-100 text-emerald-700 border-emerald-200",
      held: "bg-amber-100 text-amber-700 border-amber-200",
      expired: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.cancelled} capitalize`}>
        {status}
      </span>
    );
  };

  // ----------------------------------------------------------------------
  // 🟢 RENDER UI
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      
      {/* 1. Header Section */}
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Flight Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage reservations, issue tickets & track expiry.</p>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <ShoppingCart size={24}/>
              </div>
          </div>

          {/* Confirmed */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirmed</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.issued}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                  <CheckCircle size={24}/>
              </div>
          </div>

          {/* Cancelled */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cancelled</p>
                  <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</h3>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-red-600">
                  <XCircle size={24}/>
              </div>
          </div>

          {/* Profit */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/70 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Profit</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">${stats.profit.toFixed(2)}</h3>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                  <DollarSign size={24}/>
              </div>
          </div>
      </div>

      {/* 3. Controls (Search & Filter) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/70 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search PNR, Reference or Passenger..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['all', 'held', 'issued', 'expired', 'cancelled'].map((stat) => (
            <button
              key={stat}
              onClick={() => setFilter(stat)}
              className={`px-4 py-2 cursor-pointer rounded-lg text-sm font-medium capitalize transition whitespace-nowrap ${
                filter === stat 
                  ? 'bg-black text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/70 overflow-hidden">
        {loading ? (
           <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="flex flex-col items-center">
                 <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                 Loading bookings...
              </div>
           </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-5 font-semibold">Ref / PNR</th>
                <th className="p-5 font-semibold">Flight Info</th>
                <th className="p-5 font-semibold">Passenger & Contact</th>
                <th className="p-5 font-semibold">Timeline</th>
                <th className="p-5 font-semibold text-center">Amount</th>
                <th className="p-5 font-semibold text-center">Status</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.map((booking) => {
                const hasPnr = booking.pnr && booking.pnr !== "---";
                return (
                <tr key={booking.id} className="hover:bg-blue-50/30 transition group">
                  
                  {/* ID Column */}
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{booking.bookingRef}</span>
                      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-1">
                        {booking.pnr}
                      </span>
                    </div>
                  </td>

                  {/* Flight Info Column */}
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <Plane size={14} className="text-gray-400" />
                        {booking.flight.route}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {/* Logo with Fallback Logic */}
                        <img 
                          src={`https://pics.avs.io/200/200/${booking.flight.airline.slice(0,2)}.png`} 
                          alt="Airline" 
                          className="w-4 h-4 rounded-full object-cover" 
                          onError={(e) => {
                             e.currentTarget.style.display = 'none'; // Hide if broken
                          }}
                        />
                        {booking.flight.airline} • {booking.flight.flightNumber}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">
                        {booking.flight.tripType?.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Passenger Column */}
                  <td className="p-5">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <User size={14} className="text-gray-400"/>
                      {booking.passengerName}
                    </div>
                    
                    {/* Contact details with Icons */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 font-mono">
                        <Phone size={12} className="text-gray-400"/>
                        {booking.contact.phone}
                    </div>
                    <div className="mt-1 group/email relative w-fit flex items-center gap-2 text-xs text-gray-600 font-mono">
                        <Mail size={12} className="text-gray-400"/>
                        <span className="truncate max-w-[120px]" title={booking.contact.email}>{booking.contact.email}</span>
                    </div>
                  </td>

                  {/* Timeline Column */}
                  <td className="p-5">
                     <div className="flex flex-col gap-1">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                           <Calendar size={12}/>
                           {new Date(booking.flight.date).toLocaleDateString()}
                        </div>
                        {booking.status === 'held' && (
                           <div className="mt-1 bg-gray-50 border border-gray-100 rounded-full px-2 py-1 w-fit">
                              <CountdownTimer deadline={booking.timings.deadline} />
                           </div>
                        )}
                     </div>
                  </td>

                  {/* Amount Column */}
                  <td className="p-5 text-center">
                    <div className="font-bold text-gray-900 text-base">
                      {booking.amount.currency} {booking.amount.total}
                    </div>
                    {booking.amount.markup > 0 && (
                      <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        + {booking.amount.markup} Profit
                      </div>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="p-5 text-center">
                    <StatusBadge status={booking.status} />
                  </td>

                  {/* Actions Column */}
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      
                      {/* Download Ticket (If Issued) */}
                      {booking.status === 'issued' && booking.actionData.ticketUrl && (
                        <a 
                          href={booking.actionData.ticketUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition cursor-pointer"
                          title="Download Ticket"
                        >
                          <Download size={16} />
                        </a>
                      )}

                      {/* View Details Button */}
                      <button 
                        onClick={() => openDetailsModal(booking)}
                        disabled={!hasPnr}
                        className={`p-2 rounded transition ${hasPnr ? 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 cursor-pointer' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                        title={hasPnr ? "View Details" : "No PNR"}
                      >
                        <ChevronRight size={16} />
                      </button>

                      {/* Issue Button (Only if held) */}
                      {booking.status === 'held' && (
                        <button
                          onClick={() => openIssueModal(booking)}
                          className="px-4 py-2 cursor-pointer bg-black text-white text-xs font-bold rounded shadow hover:bg-gray-800 transition"
                        >
                          Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 5. 🟢 ISSUE TICKET MODAL */}
      {issueModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <div>
                 <h2 className="text-xl font-bold text-gray-800">Issue Ticket</h2>
                 <p className="text-xs text-gray-500 mt-1">Confirm payment to generate e-ticket.</p>
              </div>
              <button onClick={() => setIssueModalOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer"><X size={24}/></button>
            </div>

            <div className="p-6">
               <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                  {/* Card Info Display */}
                  <div className="flex justify-between items-start mb-3">
                     <div>
                        <p className="text-xs text-gray-500">Payment Source</p>
                        <p className="font-bold text-gray-800">{selectedBooking.paymentSource?.holderName || "N/A"}</p>
                        <p className="text-xs font-mono text-gray-600 mt-0.5">{selectedBooking.paymentSource?.cardLast4}</p>
                     </div>
                     <CreditCard className="text-blue-300" size={32} />
                  </div>
                  
                  <div className="h-px bg-blue-200 my-3"></div>

                  {/* Dynamic Cost Display */}
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-gray-700">
                        {paymentMethod === 'balance' ? 'Cost (Duffel)' : 'Charge (Client)'}
                     </span>
                     <span className="text-xl font-bold text-gray-900">
                        {selectedBooking.amount.currency} {' '}
                        {paymentMethod === 'balance' 
                           ? (selectedBooking.amount.base_amount || 0).toFixed(2)
                           : (selectedBooking.amount.total || 0).toFixed(2)
                        }
                     </span>
                  </div>
               </div>

               <p className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</p>
               
               <div className="space-y-3">
                  {/* Balance Option */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'balance' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'balance' ? 'border-black' : 'border-gray-300'}`}>
                        {paymentMethod === 'balance' && <div className="w-2.5 h-2.5 rounded-full bg-black"></div>}
                     </div>
                     <div className="bg-purple-100 p-2 rounded-lg text-purple-700"><Wallet size={20}/></div>
                     <div className="flex-1">
                        <div className="font-bold text-gray-900">Duffel Balance</div>
                        <div className="text-xs text-gray-500">Pay Base Price ({selectedBooking.amount.base_amount})</div>
                     </div>
                     <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('balance')} />
                  </label>

                  {/* Card Option */}
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-black' : 'border-gray-300'}`}>
                         {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-black"></div>}
                     </div>
                     <div className="bg-blue-100 p-2 rounded-lg text-blue-700"><CreditCard size={20}/></div>
                     <div className="flex-1">
                        <div className="font-bold text-gray-900">Charge Client Card</div>
                        <div className="text-xs text-gray-500">Charge Total Price ({selectedBooking.amount.total})</div>
                     </div>
                     <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('card')} />
                  </label>
               </div>
               
               <div className="flex items-start gap-2 mt-4 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
                  <p>Ticket will be issued immediately. Ensure funds are available.</p>
               </div>
            </div>

            <div className="p-5 border-t bg-gray-50 flex gap-3">
               <button onClick={() => setIssueModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer">Cancel</button>
               <button 
                 onClick={handleIssueTicket}
                 disabled={isProcessing}
                 className="flex-1 py-3 bg-black text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
               >
                 {isProcessing ? 'Processing...' : <>Pay & Issue <ChevronRight size={16}/></>}
               </button>
            </div>
          </div>
        </div>
      )}

     {/* --- 🟢 VIEW DETAILS MODAL --- */}
      {detailsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end">
           <div className="bg-white w-full md:w-[600px] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              
              {/* 1. Header */}
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                 <div>
                    <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                    <p className="text-xs text-gray-500">PNR: {selectedBooking?.pnr} • Ref: {selectedBooking?.bookingRef}</p>
                 </div>
                 <button onClick={() => setDetailsModalOpen(false)} className="bg-white cursor-pointer p-2 rounded-full border hover:bg-red-50 hover:text-red-500 transition"><X size={20}/></button>
              </div>

              {/* 2. Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {detailsLoading || !bookingDetails ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-3">
                       <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-gray-400 text-sm">Fetching live data from Airline & Vault...</p>
                    </div>
                 ) : (
                    <>
                       {/* A. Secure Payment Card Vault */}
                       {bookingDetails.paymentSource ? (
                         <div className="bg-gray-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100}/></div>
                            
                            <div className="flex justify-between items-start z-10 relative">
                               <div>
                                  <p className="text-xs text-gray-400 uppercase tracking-wider">Card Holder</p>
                                  <p className="font-bold text-lg">{bookingDetails.paymentSource.holderName}</p>
                               </div>
                               <button onClick={() => setShowSensitive(!showSensitive)} className="text-gray-400 hover:text-white transition cursor-pointer">
                                 {showSensitive ? <EyeOff size={20}/> : <Eye size={20}/>}
                               </button>
                            </div>
                            
                            <div className="mt-6 z-10 relative">
                               <p className="text-xs text-gray-400 uppercase tracking-wider">Card Number</p>
                               <p className="font-mono text-xl tracking-widest mt-1">
                                  {showSensitive ? bookingDetails.paymentSource.cardNumber : `**** **** **** ${bookingDetails.paymentSource.cardNumber.slice(-4)}`}
                               </p>
                            </div>
                            
                            <div className="flex gap-8 mt-6 z-10 relative">
                               <div><p className="text-xs text-gray-400">Expiry</p><p className="font-mono">{bookingDetails.paymentSource.expiryDate}</p></div>
                               <div>
                                  <p className="text-xs text-gray-400">CVV</p>
                                  <p className={`font-mono ${showSensitive ? 'text-red-400' : ''}`}>
                                     {showSensitive ? bookingDetails.paymentSource.cvv : '•••'}
                                  </p>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                            No Card Data Found
                         </div>
                       )}

                       {/* B. Financial Breakdown */}
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                             <p className="text-xs text-purple-600 mb-1">Agency Cost (Duffel)</p>
                             <p className="text-xl font-bold text-gray-800">{bookingDetails.finance.currency} {bookingDetails.finance.duffelTotal}</p>
                             <p className="text-[10px] text-gray-500">Base: {bookingDetails.finance.basePrice} + Tax: {bookingDetails.finance.tax}</p>
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                             <p className="text-xs text-emerald-600 mb-1">Customer Charge</p>
                             <p className="text-xl font-bold text-gray-800">{bookingDetails.finance.currency} {bookingDetails.finance.clientTotal}</p>
                             <p className="text-xs font-bold text-emerald-600 mt-1">Profit: +{bookingDetails.finance.yourMarkup}</p>
                          </div>
                       </div>

                       {/* C. 🟢 Policy & Rules Section (Cancellation & Change) */}
                       {bookingDetails.policies && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            
                            {/* Cancellation Card */}
                            <div className={`p-4 rounded-xl border ${bookingDetails.policies.cancellation.allowed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                     {bookingDetails.policies.cancellation.allowed ? <CheckCircle size={16} className="text-emerald-600"/> : <Ban size={16} className="text-red-600"/>}
                                     <p className={`text-sm font-bold ${bookingDetails.policies.cancellation.allowed ? 'text-emerald-800' : 'text-red-800'}`}>
                                        {bookingDetails.policies.cancellation.allowed ? 'Refundable' : 'Non-Refundable'}
                                     </p>
                                  </div>
                                  {bookingDetails.policies.cancellation.allowed && (
                                     <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-emerald-600 border border-emerald-200">
                                        Fee: {bookingDetails.policies.cancellation.penalty}
                                     </span>
                                  )}
                               </div>
                               <p className="text-xs text-gray-600 line-clamp-2" title={bookingDetails.policies.cancellation.note}>
                                  {bookingDetails.policies.cancellation.note}
                               </p>
                               <p className="text-[10px] text-gray-400 mt-1">Time: {bookingDetails.policies.cancellation.timeline}</p>
                            </div>

                            {/* Date Change Card */}
                            <div className={`p-4 rounded-xl border ${bookingDetails.policies.dateChange.allowed ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                               <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                     {bookingDetails.policies.dateChange.allowed ? <RotateCcw size={16} className="text-blue-600"/> : <Ban size={16} className="text-gray-400"/>}
                                     <p className={`text-sm font-bold ${bookingDetails.policies.dateChange.allowed ? 'text-blue-800' : 'text-gray-500'}`}>
                                        {bookingDetails.policies.dateChange.allowed ? 'Changeable' : 'Not Changeable'}
                                     </p>
                                  </div>
                                  {bookingDetails.policies.dateChange.allowed && (
                                     <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-blue-600 border border-blue-200">
                                        Fee: {bookingDetails.policies.dateChange.penalty}
                                     </span>
                                  )}
                               </div>
                               <p className="text-xs text-gray-600 line-clamp-2" title={bookingDetails.policies.dateChange.note}>
                                  {bookingDetails.policies.dateChange.note}
                               </p>
                               <p className="text-[10px] text-gray-400 mt-1">Time: {bookingDetails.policies.dateChange.timeline}</p>
                            </div>
                         </div>
                       )}

                       {/* D. Flight Segments */}
                       <div>
                          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Plane size={18}/> Flight Segments</h3>
                          <div className="space-y-4">
                             {bookingDetails.segments.map((seg, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-lg p-4 relative">
                                   <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                                   <div className="ml-4 space-y-4">
                                      {/* Departure */}
                                      <div className="relative">
                                         <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white"></div>
                                         <div className="flex justify-between">
                                            <div>
                                               <p className="text-xl font-bold text-gray-800">{seg.origin}</p>
                                               <p className="text-xs text-gray-500">{seg.originCity}</p>
                                            </div>
                                            <div className="text-right">
                                               <p className="font-mono font-bold">{new Date(seg.departingAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                               <p className="text-xs text-gray-500">{new Date(seg.departingAt).toLocaleDateString()}</p>
                                            </div>
                                         </div>
                                      </div>
                                      
                                      {/* Flight Info */}
                                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 flex justify-between items-center">
                                         <div className="flex items-center gap-2">
                                            <img 
                                              src={`https://pics.avs.io/200/200/${seg.airlineCode}.png`} 
                                              className="w-5 h-5 rounded-full object-contain bg-white border" 
                                              alt={seg.airline} 
                                              onError={(e) => { e.currentTarget.style.display='none'; }}
                                            />
                                            <span>{seg.airline} ({seg.flightNumber})</span>
                                         </div>
                                         <span>{seg.duration.replace('PT', '').toLowerCase()}</span>
                                      </div>

                                      {/* Arrival */}
                                      <div className="relative">
                                         <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white"></div>
                                         <div className="flex justify-between">
                                            <div>
                                               <p className="text-xl font-bold text-gray-800">{seg.destination}</p>
                                               <p className="text-xs text-gray-500">{seg.destinationCity}</p>
                                            </div>
                                            <div className="text-right">
                                               <p className="font-mono font-bold">{new Date(seg.arrivingAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                               <p className="text-xs text-gray-500">{new Date(seg.arrivingAt).toLocaleDateString()}</p>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* E. Passengers List */}
                       <div>
                          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><User size={18}/> Passengers</h3>
                          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                             <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr className="border-b"><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3 text-right">Ticket No</th></tr></thead>
                                <tbody className="divide-y">
                                   {bookingDetails.passengers.map((p, idx) => (
                                      <tr key={idx}>
                                         <td className="p-3 font-medium">{p.fullName}</td>
                                         <td className="p-3 capitalize text-gray-500">{p.type}</td>
                                         <td className="p-3 text-right font-mono text-blue-600">{p.ticketNumber}</td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </>
                 )}
              </div>

              {/* 3. Footer with Dynamic Actions */}
              <div className="p-5 border-t bg-gray-50 flex gap-3">
                  
                  {/* CASE 1: Booking is HELD (Not Paid) -> Show ISSUE Button */}
                  {selectedBooking?.status === 'held' && (
                     <button 
                        onClick={() => {setDetailsModalOpen(false); openIssueModal(selectedBooking!);}} 
                        className="flex-1 bg-black text-white py-3 rounded-xl font-bold cursor-pointer hover:bg-gray-800 transition shadow-lg"
                     >
                        Pay & Issue Ticket
                     </button>
                  )}

                  {/* CASE 2: Booking is ISSUED (Paid) -> Show Action Buttons */}
                  {selectedBooking?.status === 'issued' && bookingDetails && (
                    <>
                      {/* Cancel Button */}
                      {bookingDetails.availableActions.includes('cancel') && (
                        <button 
                          className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold cursor-pointer hover:bg-red-100 transition"
                          onClick={() => toast.error("Cancellation API not connected yet")}
                        >
                          Cancel Booking
                        </button>
                      )}

                      {/* Reschedule Button */}
                      {bookingDetails.availableActions.includes('change') && (
                        <button 
                          className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-100 transition"
                          onClick={() => toast.success("Reschedule Request Initiated")}
                        >
                          Reschedule
                        </button>
                      )}
                    </>
                  )}

                  <button 
                     onClick={() => setDetailsModalOpen(false)} 
                     className="px-6 cursor-pointer py-3 border bg-white rounded-xl font-bold hover:bg-gray-100 transition"
                  >
                     Close
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}