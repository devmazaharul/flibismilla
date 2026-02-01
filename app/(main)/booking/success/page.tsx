'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Loader2, 
  Copy, 
  Check,
  Printer,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await axios.get(`/api/duffel/booking/${bookingId}`);
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCopyPNR = () => {
    if (booking?.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("PNR Copied")
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      <p className="text-gray-400 text-sm font-mono">Loading reservation...</p>
    </div>
  );

  if (!booking) return null;

  // Helper to extract airport codes
  const [origin, destination] = booking.flightDetails.route.split('➝').map((s: string) => s.trim());

  return (
    <div className="min-h-screen bg-gray-50/50 print:mt-20 flex flex-col items-center pt-20 pb-10 px-4 print:bg-white print:p-0">
      
      {/* 🟢 Status Badge */}
      <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 print:hidden">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4 border border-green-200 shadow-sm">
          <Check className="w-5 h-5 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">Booking Confirmed</h1>
        <p className="text-gray-500 text-sm">Confirmation email has been sent to you.</p>
      </div>

      {/* 📄 MAIN CARD */}
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:shadow-none print:border-gray-300 print:rounded-none">
        
        {/* PNR Header */}
        <div className="bg-gray-50/50 border-b border-gray-100 p-6 flex justify-between items-center print:bg-white">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Reference (PNR)</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-tight text-gray-900">{booking.pnr}</span>
              <button 
                onClick={handleCopyPNR} 
                className="p-1.5 cursor-pointer hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-900 print:hidden"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Total Amount</p>
            <p className="font-mono text-xl text-gray-900 font-medium">
              {booking.pricing.currency} {booking.pricing.total_amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Flight Route - Large Typography */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between">
             {/* Origin */}
             <div>
                <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">{origin}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {format(parseISO(booking.flightDetails.departureDate), 'HH:mm')}
                </p>
                <p className="text-gray-400 text-xs font-medium mt-0.5">
                  {format(parseISO(booking.flightDetails.departureDate), 'EEE, dd MMM')}
                </p>
             </div>

             {/* Visual Direction */}
             <div className="flex flex-col items-center px-6">
                <span className="text-[10px] text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full mb-2 bg-gray-50">
                  {booking.flightDetails.duration}
                </span>
                <div className="w-24 h-[1px] bg-gray-200 relative">
                   <ArrowRight className="absolute -right-1 -top-2.5 w-5 h-5 text-gray-300" />
                </div>
                <span className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide font-medium">
                  Direct
                </span>
             </div>

             {/* Destination */}
             <div className="text-right">
                <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">
                  {destination.split('|')[0]}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {format(parseISO(booking.flightDetails.arrivalDate), 'HH:mm')}
                </p>
                <p className="text-gray-400 text-xs font-medium mt-0.5">
                  {format(parseISO(booking.flightDetails.arrivalDate), 'EEE, dd MMM')}
                </p>
             </div>
          </div>
        </div>

        {/* Technical Grid Details */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-dashed border-gray-200 pt-6">
             <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Airline</p>
                <p className="text-sm font-semibold text-gray-900">{booking.flightDetails.airline}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Flight No</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{booking.flightDetails.flightNumber}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Booking Ref</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{booking.bookingReference}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Class</p>
                <p className="text-sm font-semibold text-gray-900">Economy</p>
             </div>
          </div>
        </div>

        {/* Passenger List (Minimal Table) */}
        <div className="bg-gray-50/50 p-8 border-t border-gray-100 print:bg-transparent print:border-gray-200 print:p-0 print:mt-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Travelers</p>
          <div className="space-y-3">
             {booking.passengers.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm group">
                   <div className="flex items-center gap-3">
                      <span className="text-gray-300 font-mono text-xs font-bold group-hover:text-gray-500 transition-colors">0{idx + 1}</span>
                      <span className="font-semibold text-gray-700">{p.firstName} {p.lastName}</span>
                   </div>
                   <div className="text-gray-400 text-xs font-mono uppercase bg-white px-2 py-1 rounded border border-gray-100">
                      {p.type}
                   </div>
                </div>
             ))}
          </div>
        </div>

      </div>

      {/* 🖨️ Actions Footer */}
      <div className="mt-8 flex gap-4 print:hidden">
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>

        <button 
          onClick={handlePrint}
          className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl"
        >
          <Printer className="w-4 h-4" />
          Print 
        </button>
      </div>

    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}