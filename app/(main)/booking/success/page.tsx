'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Home, Printer, Loader2, Plane, Download, Copy } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';

// --- Types (আপনার ডাটাবেস স্কিমা অনুযায়ী) ---
interface BookingDetails {
  bookingReference: string;
  pnr: string;
  contact: { email: string; phone: string };
  amount: string;
  currency: string;
  status: string;
  flight: {
    airline: string;
    route: string;
    date: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  // 1. Fetch Booking Data
  useEffect(() => {
    if (!id) return;

    const fetchBooking = async () => {
      try {
        // আপনার GET API কল করুন (বুকিং আইডি দিয়ে)
        // নিশ্চিত করুন আপনার ব্যাকএন্ডে এই রাউটটি আছে: /api/booking/[id]
        const res = await axios.get(`/api/public/booking/${id}`);
        
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Could not load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCopyPNR = () => {
    if (booking?.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      toast.success("PNR Copied!");
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Generating your ticket...</p>
      </div>
    );
  }

  // --- Error/Empty State ---
  if (!booking && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <button onClick={() => router.push('/')} className="mt-6 text-blue-600 hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl shadow-slate-100 border border-slate-100 overflow-hidden relative">
        
        {/* Top Decoration */}
        <div className="h-2 w-full bg-emerald-500"></div>

        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-50/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 text-sm mb-8">
            Your flight has been successfully booked. A confirmation email has been sent to <span className="font-bold text-slate-700">{booking?.contact.email}</span>.
          </p>

          {/* Ticket Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 text-left relative overflow-hidden">
            {/* Cutout Circles for Ticket Look */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-slate-200"></div>
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-slate-200"></div>

            <div className="space-y-4">
              {/* PNR Section */}
              <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-300">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Airline PNR</p>
                  <p className="text-2xl font-mono font-bold text-emerald-600 tracking-wide">{booking?.pnr}</p>
                </div>
                <button onClick={handleCopyPNR} className="p-2 cursor-pointer hover:bg-slate-200 rounded-lg transition text-slate-400 hover:text-slate-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Flight Info */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl border border-slate-100">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{booking?.flight.route}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{booking?.flight.airline} • {booking?.flight.date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-8 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex items-center cursor-pointer justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button 
              onClick={() => router.push('/')}
              className="flex items-center justify-center cursor-pointer gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-slate-200"
            >
              <Home className="w-4 h-4" /> Back Home
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Suspense Wrapper for Next.js Router
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}