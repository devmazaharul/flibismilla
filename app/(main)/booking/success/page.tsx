// app/(main)/booking/success/page.tsx

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import {
  CheckCircle,
  Loader2,
  Plane,
  Copy,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  Home,
  Search,
  Sparkles,
  CircleCheck,
  Users,
  ArrowLeftRight,
  Route,
  Timer,
  AlertTriangle,
  User,
  Baby,
  Shield,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// ─── Types ───
interface Segment {
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departingAt: string;
  arrivingAt: string;
  duration: string;
  cabin: string;
}

interface Slice {
  label: string;
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departure: string;
  arrival: string;
  stops: number;
  segments: Segment[];
}

interface Passenger {
  name: string;
  type: string;
}

interface BookingData {
  bookingReference: string;
  pnr: string;
  status: string;
  contact: { email: string; phone: string };
  tripType: string;
  slices: Slice[];
  passengers: Passenger[];
  paymentDeadline: string | null;
  bookedAt: string;
}

// ─── Helpers ───
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h} ${m}`.trim();
}

function getTripLabel(type: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    one_way: { label: 'One Way', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
    round_trip: { label: 'Round Trip', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
    multi_city: { label: 'Multi City', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  };
  return map[type] || map.one_way;
}

function getStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
    held: { label: 'On Hold', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Timer },
    issued: { label: 'Ticket Issued', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
    confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle },
    processing: { label: 'Processing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Loader2 },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  };
  return map[status] || map.processing;
}

// ─── Confetti ───
const ConfettiParticles = () => {
  const particles = useMemo(() => {
    const colors = [
      'bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400',
      'bg-violet-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400',
    ];
    return Array.from({ length: 24 }).map((_, i) => ({
      size: Math.random() * 6 + 4,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 3 + 4,
      color: colors[i % colors.length],
      isCircle: Math.random() > 0.5,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.color} opacity-60`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: '-10px',
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Countdown Hook ───
function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return { timeLeft, isExpired };
}

// ─── Slice Card ───
function SliceCard({ slice, index }: { slice: Slice; index: number }) {
  const stopsLabel = slice.stops === 0 ? 'Direct' : `${slice.stops} Stop${slice.stops > 1 ? 's' : ''}`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5 space-y-4">
      {/* Slice Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] flex items-center gap-1.5">
          <Plane className="w-3 h-3" />
          {slice.label}
        </span>
        <span className="text-[10px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-100">
          {stopsLabel}
        </span>
      </div>

      {/* Route Visual */}
      <div className="flex items-center justify-between gap-3">
        {/* Origin */}
        <div className="text-center min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {slice.origin.code}
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
            {slice.origin.city}
          </p>
          {slice.departure && (
            <p className="text-xs font-bold text-gray-700 mt-1.5">
              {formatTime(slice.departure)}
            </p>
          )}
        </div>

        {/* Flight Path */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full border-2 border-emerald-400 bg-white" />
            <div className="w-12 sm:w-20 h-[2px] bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 rounded-full relative">
              <Plane className="w-3.5 h-3.5 text-emerald-500 absolute -top-[5px] left-1/2 -translate-x-1/2" />
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          {slice.departure && (
            <p className="text-[10px] text-gray-400 font-medium">
              {formatDate(slice.departure)}
            </p>
          )}
        </div>

        {/* Destination */}
        <div className="text-center min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {slice.destination.code}
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
            {slice.destination.city}
          </p>
          {slice.arrival && (
            <p className="text-xs font-bold text-gray-700 mt-1.5">
              {formatTime(slice.arrival)}
            </p>
          )}
        </div>
      </div>

      {/* Segments */}
      {slice.segments.length > 0 && (
        <div className="space-y-2 pt-1">
          {slice.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3.5 py-2.5"
            >
              {/* Airline Logo */}
              {seg.airlineLogo ? (
                <img
                  src={seg.airlineLogo}
                  alt={seg.airline}
                  className="w-8 h-8 rounded-lg object-contain flex-shrink-0 bg-gray-50 p-1"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Plane className="w-4 h-4 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-900">
                    {seg.flightNumber}
                  </span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[11px] text-gray-500 truncate">
                    {seg.airline}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-medium">
                  <span>{seg.origin}</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                  <span>{seg.destination}</span>
                  {seg.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(seg.duration)}</span>
                    </>
                  )}
                  {seg.cabin && (
                    <>
                      <span>•</span>
                      <span>{seg.cabin}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Content ───
function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { timeLeft, isExpired } = useCountdown(booking?.paymentDeadline || null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await axios.get(`/api/public/booking/${id}`);
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch {
        toast.error('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();

    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, [id]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf9] gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200/50">
            <Plane className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg border border-gray-100">
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-bold text-gray-900">
            Confirming your booking
          </p>
          <p className="text-xs text-gray-400">
            Fetching details from the airline...
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Not Found ───
  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf9] p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/40 p-10 space-y-5 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Booking Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              We couldn&apos;t find this booking. Check your email for the
              correct link.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white py-3 text-sm font-bold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
            <button
              onClick={() => router.push('/booking/status')}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-gray-600 py-3 text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tripInfo = getTripLabel(booking.tripType);
  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;
  const isHeld = booking.status === 'held';

  // Passenger counts
  const adultCount = booking.passengers.filter((p) => p.type === 'adult').length;
  const childCount = booking.passengers.filter((p) => p.type === 'child').length;
  const infantCount = booking.passengers.filter((p) => p.type === 'infant_without_seat').length;

  return (
    <div className="min-h-screen bg-[#f8faf9] py-8 sm:py-12 px-4 flex items-start justify-center relative overflow-hidden">
      {/* BG Decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/40 via-teal-50/30 to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-sky-100/30 via-blue-50/20 to-transparent rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {showConfetti && <ConfettiParticles />}

      {/* ═══ MAIN ═══ */}
      <div className="relative z-10 max-w-xl w-full space-y-4">
        {/* ═══════════════════════════════
            1. SUCCESS HEADER
        ═══════════════════════════════ */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl" />

          <div className="relative px-6 sm:px-8 pt-10 pb-8 text-center">
            {/* Icon */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div
                className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <div
                className="absolute inset-2 rounded-full bg-emerald-400/10 animate-ping"
                style={{ animationDuration: '2s', animationDelay: '0.3s' }}
              />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-400/30">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${statusInfo.bg} border ${statusInfo.border} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${statusInfo.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${tripInfo.bg} border ${tripInfo.border} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${tripInfo.color}`}
              >
                {booking.tripType === 'round_trip' ? (
                  <ArrowLeftRight className="w-3 h-3" />
                ) : booking.tripType === 'multi_city' ? (
                  <Route className="w-3 h-3" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )}
                {tripInfo.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {isHeld ? 'Booking On Hold! ⏳' : 'You\'re All Set! ✈️'}
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              {isHeld ? (
                <>
                 Your seat is reserved successfully.
 Your confirmation email, along with the ticket, will be sent to you shortly.

                </>
              ) : (
                <>
                  Confirmation sent to{' '}
                  <span className="font-semibold text-gray-700">
                    {booking.contact.email}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>



        {/* ═══════════════════════════════
            3. TICKET CARD (PNR + Reference)
        ═══════════════════════════════ */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
          {/* Ticket cutouts */}
          <div className="absolute -left-3 top-[55%] w-6 h-6 bg-[#f8faf9] rounded-full border-r border-gray-200 z-20" />
          <div className="absolute -right-3 top-[55%] w-6 h-6 bg-[#f8faf9] rounded-full border-l border-gray-200 z-20" />

          {/* PNR Section */}
          <div className="px-6 sm:px-8 pt-7 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              {/* PNR */}
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Airline PNR
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <p className="text-3xl sm:text-4xl font-mono font-black text-emerald-600 tracking-[0.15em]">
                    {booking.pnr || 'Pending'}
                  </p>
                  {booking.pnr && booking.pnr !== 'Pending' && (
                    <button
                      onClick={() => handleCopy(booking.pnr, 'pnr')}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all duration-300 cursor-pointer ${
                        copiedField === 'pnr'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {copiedField === 'pnr' ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Booking Reference */}
              <div className="sm:text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">
                  Booking Reference
                </p>
                <div className="mt-2 flex items-center gap-2 sm:justify-end">
                  <p className="text-sm font-mono font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {booking.bookingReference}
                  </p>
                  <button
                    onClick={() =>
                      handleCopy(booking.bookingReference, 'ref')
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {booking.bookedAt && (
                  <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1 sm:justify-end">
                    <Calendar className="w-3 h-3" />
                    Booked on {formatDate(booking.bookedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="mx-8 border-t-2 border-dashed border-gray-200/70" />

          {/* Flight Slices */}
          <div className="px-6 sm:px-8 pt-5 pb-7 space-y-3">
            {booking.slices.length > 0 ? (
              booking.slices.map((slice, i) => (
                <SliceCard key={i} slice={slice} index={i} />
              ))
            ) : (
              <div className="text-center py-6">
                <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Flight details are being processed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════
            4. PASSENGERS
        ═══════════════════════════════ */}
        {booking.passengers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-900">
                  Passengers
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                {adultCount > 0 && (
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    {adultCount} Adult{adultCount > 1 ? 's' : ''}
                  </span>
                )}
                {childCount > 0 && (
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    {childCount} Child{childCount > 1 ? 'ren' : ''}
                  </span>
                )}
                {infantCount > 0 && (
                  <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    {infantCount} Infant{infantCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {booking.passengers.map((p, i) => (
                <div
                  key={i}
                  className="px-6 py-3.5 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      p.type === 'infant_without_seat'
                        ? 'bg-pink-50 border border-pink-100'
                        : p.type === 'child'
                        ? 'bg-amber-50 border border-amber-100'
                        : 'bg-sky-50 border border-sky-100'
                    }`}
                  >
                    {p.type === 'infant_without_seat' ? (
                      <Baby className="w-4 h-4 text-pink-500" />
                    ) : (
                      <User className="w-4 h-4 text-sky-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm capitalize font-bold text-gray-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      {p.type === 'infant_without_seat'
                        ? 'Infant'
                        : p.type === 'child'
                        ? 'Child'
                        : 'Adult'}
                    </p>
                  </div>
                  <CircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════
            5. CONTACT DETAILS
        ═══════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-md shadow-gray-100/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">
                Email
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 break-all">
              {booking.contact.email}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-md shadow-gray-100/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">
                Phone
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {booking.contact.phone}
            </p>
          </div>
        </div>




        {/* ═══════════════════════════════
            9. FOOTER
        ═══════════════════════════════ */}
        <div className="text-center pt-2 pb-6">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Secured & verified booking</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Need help?{' '}
            <a
              href="/contact"
              className="text-emerald-500 hover:text-emerald-600 font-semibold underline underline-offset-2 transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ───
export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf9] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200/50">
            <Plane className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}