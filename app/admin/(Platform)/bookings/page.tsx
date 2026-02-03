'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Search, 
  Plane, 
  Calendar, 
  Clock, 
  CreditCard, 
  Wallet, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  X,
  CheckCircle, 
  XCircle, 
  ShoppingCart, 
  DollarSign,
  Loader2,
  Lock,
  View,
  ViewIcon,
  Copy,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

// ----------------------------------------------------------------------
// 🟢 TYPES & INTERFACES
// ----------------------------------------------------------------------

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
    logoUrl:string
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
    total: number;       
    base_amount: number; 
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

      setIsUrgent(diff < 3600000); 
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 'Expired') return <span className="text-gray-400 font-medium text-xs">Expired</span>;

  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-md w-fit  text-xs font-mono font-medium ${isUrgent ? 'text-amber-600 bg-white' : 'text-gray-800 bg-gray-100'}`}>
      <Clock size={12} />
      {timeLeft}
    </div>
  );
};

// ----------------------------------------------------------------------
// 🟢 MAIN COMPONENT
// ----------------------------------------------------------------------

export default function BookingsDashboard() {
  const router = useRouter();

  // --- States ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Issue Modal States
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'balance'>('balance');
  const [cvv, setCvv] = useState(''); // 🟢 CVV State
  const [isProcessing, setIsProcessing] = useState(false);

  // ----------------------------------------------------------------------
  // 🟢 API CALLS
  // ----------------------------------------------------------------------

  const fetchBookings = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/duffel/booking?page=${pageNum}&limit=20`);
      
      if (res.data.success) {
        setBookings(res.data.data);
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.total);
      }
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  // ----------------------------------------------------------------------
  // 🟢 HANDLERS
  // ----------------------------------------------------------------------

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/admin/bookings/${bookingId}`);
  };

  const openIssueModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentMethod('balance');
    setCvv(''); // Reset CVV
    setIssueModalOpen(true);
  };

  const handleIssueTicket = async () => {
    if (!selectedBooking) return;
    
    // CVV Validation
    if (paymentMethod === 'card' && cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await axios.post('/api/duffel/booking/issue', {
        bookingId: selectedBooking.id,
        paymentMethod: paymentMethod,
        cvv: paymentMethod === 'card' ? cvv : undefined // Send CVV if card
      });

      if (res.data.success) {
        toast.success("Ticket Issued Successfully");
        setIssueModalOpen(false);
        fetchBookings(page); 
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to issue ticket";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------------------
  // 🟢 LOGIC
  // ----------------------------------------------------------------------

  const stats = useMemo(() => {
    return {
        total: totalCount, 
        issued: bookings.filter(b => b.status === 'issued').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        profit: bookings
            .filter(b => b.status === 'issued')
            .reduce((acc, curr) => acc + (curr.amount.markup || 0), 0)
    };
  }, [bookings, totalCount]);

  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.bookingRef.toLowerCase().includes(search.toLowerCase()) || 
                        b.pnr?.toLowerCase().includes(search.toLowerCase()) || 
                        b.passengerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      issued: "bg-green-100 text-green-700 border-green-200",
      held: "bg-amber-50 text-amber-700 border-amber-200",
      expired: "bg-red-50 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-600 border-gray-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200"
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${styles[status] || styles.cancelled} capitalize tracking-wide`}>
        {status}
      </span>
    );
  };

  // ----------------------------------------------------------------------
  // 🟢 RENDER UI
  // ----------------------------------------------------------------------


  function handleCopy(pnr:string){
navigator.clipboard.writeText(pnr)
    toast.success("PNR copied")
  }
  return (
    <div className="min-h-screen bg-[#fafafa] p-8 font-sans text-gray-900">
      
      {/* 1. Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage flight reservations and transactions.</p>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: ShoppingCart },
            { label: 'Issued ', value: stats.issued, icon: CheckCircle },
            { label: 'Cancelled ', value: stats.cancelled, icon: XCircle },
            { label: 'Profit ', value: `$${stats.profit.toFixed(2)}`, icon: DollarSign },
          ].map((stat, idx) => (
             <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200/80 rounded-lg shadow-2xl shadow-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-xs font-medium text-gray-500 uppercase">{stat.label}</p>
                   <stat.icon size={16} className="text-gray-400"/>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">{stat.value}</h3>
             </div>
          ))}
      </div>

      {/* 3. Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-black focus:border-black transition outline-none placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1 p-1 bg-gray-100 rounded-md border border-gray-200">
          {['all', 'held', 'issued', 'cancelled'].map((stat) => (
            <button
              key={stat}
              onClick={() => setFilter(stat)}
              className={`px-3 py-1.5 cursor-pointer rounded text-xs font-medium capitalize transition-all ${
                filter === stat 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white border border-gray-200/80 rounded-lg shadow-2xl shadow-gray-100  overflow-hidden">
        {loading ? (
           <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-300" size={24} />
           </div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <th className="p-4 font-medium">REF/PNR</th>
                <th className="p-4 font-medium">Flight</th>
                <th className="p-4 font-medium">Passenger</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium text-center">Amount</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBookings.length === 0 ? (
                 <tr><td colSpan={7} className="text-center p-8 text-gray-400">No results found</td></tr>
              ) : (
              filteredBookings.map((booking) => {
                const hasPnr = booking.pnr && booking.pnr !== "---";
                return (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition">
               <td className="p-4">
  <div className="font-medium">{booking.bookingRef}</div>

  {hasPnr && (
    <div
      onClick={()=>handleCopy(booking.pnr)}
      className="text-xs flex items-center gap-1 text-gray-100 w-fit p-1 rounded 
                 font-mono bg-black mt-0.5 cursor-pointer hover:bg-gray-800"
      title="Click to copy PNR"
    >
      <p className='text-[10px]'>{booking?.pnr}</p>
      <Copy size={12} />
    </div>
  )}
</td>


                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                          <img 
                            src={booking.flight.logoUrl} 
                            alt="Logo" className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                          />
                       </div>
                     <div className="max-w-[180px]">
  <div className="font-medium truncate">
    {booking.flight.route}
  </div>
  <small className="text-[11px] text-gray-500 truncate block font-semibold">
    {booking.flight.airline} • {booking.flight.flightNumber}
  </small>
  <small className="text-[9px] font-medium text-gray-500 truncate block">
    {booking.flight?.tripType.split("_").join(" ").toUpperCase()}
  </small>
</div>

                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-medium">{booking.passengerName}</div>
                    <small className=" text-gray-500 truncate max-w-[140px]">{booking.contact.email}</small>
                  </td>

                  <td className="p-4">
                    <div className="text-gray-900">{new Date(booking.flight.date).toLocaleDateString()}</div>
                    {booking.status === 'held' && (
                       <div className="mt-1">
                          <CountdownTimer deadline={booking.timings.deadline} />
                       </div>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <div className="font-medium">{booking.amount.currency} {booking.amount.total}</div>
                    {booking.amount.markup > 0 && (
                      <div className="text-[10px] text-green-600 font-medium">+ {booking.amount.markup}</div>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <StatusBadge status={booking.status} />
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {booking.status === 'issued' && booking.actionData.ticketUrl && (
                        <a 
                          href={booking.actionData.ticketUrl} 
                          target="_blank" 
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition"
                          title="Download Ticket"
                        >
                          <Download size={16} />
                        </a>
                      )}

                      <button 
                        onClick={() => handleViewDetails(booking.id)}
                        disabled={!hasPnr}
                        className={`p-1.5 cursor-pointer rounded transition ${hasPnr ? 'text-gray-500 hover:text-black hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                        title="view details"
                      >
                        <Eye   size={16} />
                      </button>

                      {booking.status === 'held' && (
                        <button
                          onClick={() => openIssueModal(booking)}
                          className="px-3 py-1.5 cursor-pointer bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition"
                        >
                          Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
           <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
           <div className="flex gap-1">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-1.5 bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-40 hover:border-gray-300 transition"
              >
                <ChevronLeft size={16}/>
              </button>
              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-gray-200 rounded text-gray-600 disabled:opacity-40 hover:border-gray-300 transition"
              >
                <ChevronRight size={16}/>
              </button>
           </div>
        </div>
        </>
        )}
      </div>

      {/* 🟢 VERCEL STYLE ISSUE MODAL */}
      {issueModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                 <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Issue Ticket</h3>
                 <p className="text-sm text-gray-500">Complete payment to issue PNR: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{selectedBooking.pnr}</span></p>
              </div>
              <button onClick={() => setIssueModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-black transition">
                <X size={20}/>
              </button>
            </div>

            <div className="p-6">
               {/* Cost Summary */}
               <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 border border-gray-100 rounded-md">
                   <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</span>
                      <span className="text-sm text-gray-600">{paymentMethod === 'balance' ? 'Agency Balance' : 'Client Charge'}</span>
                   </div>
                   <div className="text-xl font-bold text-gray-900">
                      {selectedBooking.amount.currency} {' '}
                      {paymentMethod === 'balance' 
                         ? selectedBooking.amount.base_amount.toFixed(2)
                         : selectedBooking.amount.total.toFixed(2)
                      }
                   </div>
               </div>

               <div className="space-y-4">
                  {/* Option 1: Duffel Balance */}
                  <div 
                    onClick={() => setPaymentMethod('balance')}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'balance' 
                        ? 'border-black bg-gray-50/50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                     <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'balance' ? 'border-black' : 'border-gray-300'}`}>
                            {paymentMethod === 'balance' && <div className="w-2 h-2 rounded-full bg-black"/>}
                        </div>
                        <div>
                           <p className="text-sm font-medium text-gray-900">Duffel Balance</p>
                           <p className="text-xs text-gray-500">Deduct funds from your agency wallet.</p>
                        </div>
                        <Wallet className="ml-auto text-gray-400" size={18}/>
                     </div>
                  </div>

                  {/* Option 2: Card + CVV Logic */}
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                        ? 'border-black bg-gray-50/50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                     <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-black' : 'border-gray-300'}`}>
                            {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-black"/>}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Charge Client Card</p>
                                <p className="text-xs text-gray-500">Use card ending in <span className="font-mono">{selectedBooking.paymentSource?.cardLast4}</span></p>
                              </div>
                              <CreditCard className="text-gray-400" size={18}/>
                           </div>

                           {/* 🟢 CONDITIONAL CVV INPUT (Smooth Reveal) */}
                           {paymentMethod === 'card' && (
                             <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                   <Lock size={10}/> Security Code (CVV)
                                </label>
                                <div className="relative max-w-[120px]">
                                  <input 
                                    type="text" 
                                    maxLength={4}
                                    placeholder="123"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition placeholder:text-gray-300"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()} // Prevent card click bubble
                                  />
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Info Alert */}
               <div className="flex gap-2 mt-4 p-3 bg-gray-50 border border-gray-100 rounded-md">
                  <AlertCircle size={16} className="text-gray-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-gray-500 leading-relaxed">
                     Once processed, the ticket will be issued immediately. This action cannot be undone without penalty fees.
                  </p>
               </div>
            </div>

            {/* Minimal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
               <button 
                 onClick={() => setIssueModalOpen(false)} 
                 className="px-4 py-2 text-sm font-medium cursor-pointer text-gray-600 hover:text-black transition"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleIssueTicket}
                 disabled={isProcessing}
                 className="px-4 py-2 bg-black cursor-pointer text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-sm"
               >
                 {isProcessing && <Loader2 size={14} className="animate-spin"/>}
                 {isProcessing ? 'Processing' : 'Pay & Issue'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}