'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Loader2, Plane, Copy } from 'lucide-react';
import axios from 'axios';
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
        const res = await axios.get(`/api/public/booking/${id}`);

        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCopyPNR = () => {
    if (booking?.pnr) {
      navigator.clipboard.writeText(booking.pnr);
      toast.success('PNR copied!');
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 gap-3">
        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">
          Generating your ticket...
        </p>
      </div>
    );
  }

  // --- Error/Empty State ---
  if (!booking && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-xs">
          We couldn&apos;t find a booking for this link. Please check your
          email for the correct confirmation link.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
        >
          Go Home
        </button>
      </div>
    );
  }

  // এখানে এসে booking নিশ্চিতভাবে আছে
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 py-12 px-4 flex items-center justify-center">
      <div className="relative max-w-xl w-full bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-400" />

        {/* Content */}
        <div className="pt-10 pb-7 px-6 sm:px-8">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-[6px] border-white shadow-lg flex items-center justify-center mx-auto mb-4 relative">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
            <div className="absolute inset-1 rounded-full border border-emerald-200/70" />
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Booking confirmed
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Your flight is ready to go
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              A detailed e‑ticket has been sent to{' '}
              <span className="font-semibold text-slate-700">
                {booking?.contact.email}
              </span>
              . Your booking and contact details are shown below.
            </p>
          </div>

          {/* Ticket Summary Card */}
          <div className="mt-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-left relative overflow-hidden">
            {/* Cutout Circles for Ticket Look */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-b from-slate-50 to-white rounded-full border-r border-slate-200" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-b from-slate-50 to-white rounded-full border-l border-slate-200" />

            <div className="p-5 space-y-4">
              {/* PNR + Booking reference + User info + Amount */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-dashed border-slate-300/70">
                {/* Left side: PNR + Booking Ref */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.18em]">
                    Airline PNR
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-2xl font-mono font-bold text-emerald-600 tracking-wide">
                      {booking?.pnr}
                    </p>
                    <button
                      onClick={handleCopyPNR}
                      className="p-1.5 cursor-pointer rounded-lg bg-white/70 border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition"
                      aria-label="Copy PNR"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="mt-3 text-[10px] uppercase font-semibold text-slate-400 tracking-[0.18em]">
                    Booking Reference
                  </p>
                  <p className="mt-1 text-xs font-mono font-semibold text-slate-800">
                    {booking?.bookingReference}
                  </p>
                </div>

                {/* Right side: User (contact) info + amount */}
                <div className="sm:text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-[0.18em]">
                    Traveler contact
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-900 break-all">
                    {booking?.contact.email}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {booking?.contact.phone}
                  </p>

                  <p className="mt-4 text-[10px] uppercase font-semibold text-slate-400 tracking-[0.18em]">
                    Total paid
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 font-mono">
                    {booking?.currency} {booking?.amount}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    All taxes &amp; fees included
                  </p>
                </div>
              </div>

              {/* Flight Info */}
              <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Plane className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-slate-400 tracking-[0.18em]">
                      Route
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {booking?.flight.route}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {booking?.flight.airline}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-[13px]">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.18em]">
                      Travel date
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {booking?.flight.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.18em]">
                      Contact
                    </p>
                    <p className="mt-1 font-medium text-slate-900 truncate">
                      {booking?.contact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Small note */}
          <p className="mt-4 text-[11px] text-slate-500 text-center">
            Please arrive at the airport at least 3 hours before departure for
            international flights and carry a valid photo ID matching the
            passenger name.
          </p>

          {/* নিচে action button গুলো ইচ্ছা মতো উঠিয়ে দেওয়া হয়েছে */}
        </div>
      </div>
    </div>
  );
}

// Suspense Wrapper for Next.js Router
export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}