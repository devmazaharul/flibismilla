// app/(main)/booking/status/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plane,
  Loader2,
  CheckCircle,
  Copy,
  ArrowRight,
  Clock,
  Timer,
  AlertTriangle,
  User,
  Baby,
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  RefreshCw,
  ArrowLeftRight,
  Route,
  Ticket,
  CircleCheck,
  Ban,
  Luggage,
  Home,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  ArrowLeft,
  X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// ─── Types ───
interface SegmentData {
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  aircraft: string;
  origin: { code: string; city: string; terminal: string | null };
  destination: { code: string; city: string; terminal: string | null };
  departingAt: string;
  arrivingAt: string;
  duration: string;
  durationFormatted: string;
  cabin: string;
  baggage: string;
}

interface LayoverData {
  airport: string;
  city: string;
  duration: string;
}

interface SliceData {
  label: string;
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departingAt: string;
  arrivingAt: string;
  totalDuration: string;
  stops: number;
  stopsLabel: string;
  segments: SegmentData[];
  layovers: LayoverData[];
}

interface PassengerData {
  fullName: string;
  type: string;
  ticketNumber: string | null;
  isTicketed: boolean;
}

interface DocumentData {
  type: string;
  url: string | null;
  identifier: string;
}

interface BookingResult {
  pnr: string;
  bookingReference: string;
  status: string;
  tripType: string;
  contact: { email: string; phone: string };
  slices: SliceData[];
  passengers: PassengerData[];
  documents: DocumentData[];
  conditions: {
    isRefundable: boolean;
    isChangeable: boolean;
    refundPenalty: string | null;
    refundCurrency: string | null;
    changePenalty: string | null;
    changeCurrency: string | null;
  };
  paymentDeadline: string | null;
  bookedAt: string;
}

// ─── Helpers ───
function formatTime(d: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', {
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

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  issued: {
    label: 'Ticket Issued',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  held: {
    label: 'On Hold',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Timer,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  processing: {
    label: 'Processing',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Loader2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: Ban,
  },
};

const tripConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  one_way: {
    label: 'One Way',
    icon: ArrowRight,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  round_trip: {
    label: 'Round Trip',
    icon: ArrowLeftRight,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  multi_city: {
    label: 'Multi City',
    icon: Route,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

// ─── Countdown ───
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
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadline]);

  return { timeLeft, isExpired };
}

// ─── Download Helper ───
async function downloadTicket(url: string, filename: string) {
  try {
    toast.loading('Downloading ticket...', { id: 'download' });
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    toast.success('Ticket downloaded!', { id: 'download' });
  } catch {
    toast.error('Download failed. Try opening the link directly.', {
      id: 'download',
    });
    window.open(url, '_blank');
  }
}

// ─── Segment Card ───
function SegmentCard({ seg }: { seg: SegmentData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-3">
        {seg.airlineLogo ? (
          <img
            src={seg.airlineLogo}
            alt={seg.airline}
            className="w-9 h-9 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Plane className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              {seg.flightNumber}
            </span>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-xs text-gray-500 truncate">
              {seg.airline}
            </span>
          </div>
          {seg.aircraft && (
            <p className="text-[10px] text-gray-400 mt-0.5">{seg.aircraft}</p>
          )}
        </div>
        {seg.cabin && (
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 flex-shrink-0">
            {seg.cabin}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-center flex-1">
          <p className="text-xl font-black text-gray-900">
            {seg.origin.code}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {seg.origin.city}
          </p>
          {seg.origin.terminal && (
            <p className="text-[9px] text-gray-300 mt-0.5">
              T{seg.origin.terminal}
            </p>
          )}
          <p className="text-xs font-bold text-gray-700 mt-1">
            {formatTime(seg.departingAt)}
          </p>
          <p className="text-[10px] text-gray-400">
            {formatDate(seg.departingAt)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 px-2 flex-shrink-0">
          <p className="text-[10px] font-bold text-gray-400">
            {seg.durationFormatted || formatDuration(seg.duration)}
          </p>
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full border-2 border-rose-400 bg-white" />
            <div className="w-14 h-[2px] bg-gradient-to-r from-rose-300 to-rose-400 rounded-full relative">
              <Plane className="w-3 h-3 text-rose-500 absolute -top-[5px] left-1/2 -translate-x-1/2" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <p className="text-[9px] text-gray-300">DIRECT</p>
        </div>

        <div className="text-center flex-1">
          <p className="text-xl font-black text-gray-900">
            {seg.destination.code}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {seg.destination.city}
          </p>
          {seg.destination.terminal && (
            <p className="text-[9px] text-gray-300 mt-0.5">
              T{seg.destination.terminal}
            </p>
          )}
          <p className="text-xs font-bold text-gray-700 mt-1">
            {formatTime(seg.arrivingAt)}
          </p>
          <p className="text-[10px] text-gray-400">
            {formatDate(seg.arrivingAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <Luggage className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[11px] text-gray-500">{seg.baggage}</span>
      </div>
    </div>
  );
}

// ─── Slice Section ───
function SliceSection({ slice }: { slice: SliceData }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-2xl shadow-gray-100">
            <Plane className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">
              {slice.label}
            </p>
            <p className="text-sm font-bold text-gray-900">
              {slice.origin.city} → {slice.destination.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-700">
              {slice.totalDuration}
            </p>
            <p className="text-[10px] text-gray-400">{slice.stopsLabel}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {slice.segments.map((seg, i) => (
            <div key={i}>
              <SegmentCard seg={seg} />
              {slice.layovers[i] && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="h-[1px] flex-1 bg-amber-200" />
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">
                      {slice.layovers[i].duration} layover in{' '}
                      {slice.layovers[i].city} ({slice.layovers[i].airport})
                    </span>
                  </div>
                  <div className="h-[1px] flex-1 bg-amber-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ─── MAIN PAGE ───
// ═══════════════════════════════════════
export default function BookingStatusPage() {
  const [pnr, setPnr] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { timeLeft, isExpired } = useCountdown(
    result?.paymentDeadline || null
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!pnr.trim() || !email.trim()) {
      setError('Please enter both PNR and Email.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/public/status-booking', {
        pnr: pnr.trim(),
        email: email.trim(),
      });
      if (res.data.success) {
        setResult(res.data.data);
        // Scroll to results after short delay
        setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      } else {
        setError(res.data.message || 'Booking not found.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNewSearch = () => {
    setResult(null);
    setError('');
    setPnr('');
    setEmail('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sInfo = result
    ? statusConfig[result.status] || statusConfig.processing
    : null;
  const tInfo = result
    ? tripConfig[result.tripType] || tripConfig.one_way
    : null;

  const adultCount =
    result?.passengers.filter((p) => p.type === 'adult').length || 0;
  const childCount =
    result?.passengers.filter((p) => p.type === 'child').length || 0;
  const infantCount =
    result?.passengers.filter((p) => p.type === 'infant_without_seat')
      .length || 0;

  return (
    <div className="min-h-screen bg-[#f8faf9] relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-rose-100/40 via-pink-50/30 to-transparent rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-rose-100/30 via-orange-50/20 to-transparent rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(244 63 94 / 0.03) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6">
        {/* ═══════════════════════════════
            SEARCH FORM — Hidden when result exists
        ═══════════════════════════════ */}
        {!result && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 rounded-t-3xl" />

            <div className="px-6 sm:px-8 pt-8 pb-7">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200/50">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Check Booking Status
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Enter your PNR and email to view your booking
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">
                      Airline PNR / Booking Code
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={pnr}
                        onChange={(e) => setPnr(e.target.value.toUpperCase())}
                        placeholder="e.g. XJ4K2L"
                        maxLength={8}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all tracking-widest uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 text-sm font-bold shadow-lg shadow-rose-200/50 hover:from-rose-600 hover:to-pink-600 hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find My Booking
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════
            RESULTS — Show when result exists
        ═══════════════════════════════ */}
        {result && sInfo && tInfo && (
          <div
            ref={resultRef}
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* ── Back Button ── */}
            <button
              onClick={handleNewSearch}
              className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Search
            </button>

            {/* ── Header Card ── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
              <div
                className={`h-1.5 ${
                  result.status === 'cancelled'
                    ? 'bg-red-400'
                    : result.status === 'held'
                    ? 'bg-blue-400'
                    : 'bg-gradient-to-r from-rose-400 to-pink-400'
                }`}
              />

              <div className="px-6 sm:px-8 py-6">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full ${sInfo.bg} border ${sInfo.border} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${sInfo.color}`}
                  >
                    <sInfo.icon className="w-3 h-3" />
                    {sInfo.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full ${tInfo.bg} border ${tInfo.border} px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${tInfo.color}`}
                  >
                    <tInfo.icon className="w-3 h-3" />
                    {tInfo.label}
                  </span>
                </div>

                {/* PNR + Ref */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      PNR
                    </p>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <p className="text-3xl font-mono font-black text-rose-600 tracking-[0.15em]">
                        {result.pnr}
                      </p>
                      <button
                        onClick={() => handleCopy(result.pnr, 'pnr')}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all cursor-pointer ${
                          copiedField === 'pnr'
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {copiedField === 'pnr' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedField === 'pnr' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">
                        Booking Ref
                      </p>
                      <div className="mt-1 flex items-center gap-2 sm:justify-end">
                        <span className="text-sm font-mono font-bold text-gray-800 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          {result.bookingReference}
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(result.bookingReference, 'ref')
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {result.bookedAt && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 sm:justify-end">
                        <Calendar className="w-3 h-3" />
                        Booked on {formatDate(result.bookedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Hold Deadline ── */}
            {result.status === 'held' && result.paymentDeadline && (
              <div
                className={`rounded-2xl border p-5 ${
                  isExpired
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isExpired ? 'bg-red-100' : 'bg-blue-100'
                    }`}
                  >
                    <Timer
                      className={`w-5 h-5 ${
                        isExpired ? 'text-red-600' : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isExpired ? 'text-red-800' : 'text-blue-800'
                      }`}
                    >
                      {isExpired
                        ? 'Payment Deadline Expired'
                        : 'Payment Required'}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isExpired ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {isExpired
                        ? 'This hold has expired.'
                        : `Time remaining: ${timeLeft}`}
                    </p>
                    <p
                      className={`text-xs font-mono font-bold mt-2 ${
                        isExpired ? 'text-red-700' : 'text-blue-700'
                      }`}
                    >
                      Deadline: {formatDate(result.paymentDeadline)},{' '}
                      {formatTime(result.paymentDeadline)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Flight Slices ── */}
            <div className="space-y-3">
              {result.slices.map((slice, i) => (
                <SliceSection key={i} slice={slice} />
              ))}
            </div>

            {/* ── Passengers ── */}
            {result.passengers.length > 0 && (
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
                  {result.passengers.map((p, i) => (
                    <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          p.type === 'infant_without_seat'
                            ? 'bg-pink-50 border border-pink-100'
                            : p.type === 'child'
                            ? 'bg-amber-50 border border-amber-100'
                            : 'bg-rose-50 border border-rose-100'
                        }`}
                      >
                        {p.type === 'infant_without_seat' ? (
                          <Baby className="w-4 h-4 text-pink-500" />
                        ) : (
                          <User className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {p.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {p.type === 'infant_without_seat'
                            ? 'Infant'
                            : p.type === 'child'
                            ? 'Child'
                            : 'Adult'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {p.isTicketed ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                              {p.ticketNumber}
                            </span>
                            <CircleCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Documents / E-Tickets ── */}
            {result.documents.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-900">
                    Documents & E-Tickets
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {result.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {doc.type === 'electronic_ticket'
                              ? 'E-Ticket'
                              : doc.type}
                          </p>
                          {doc.identifier && (
                            <p className="text-[10px] font-mono text-gray-400">
                              {doc.identifier}
                            </p>
                          )}
                        </div>
                      </div>

                      {doc.url && (
                        <button
                          onClick={() =>
                            downloadTicket(
                              doc.url!,
                              `ticket-${doc.identifier || result.pnr}.pdf`
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2.5 text-[11px] font-bold shadow-md shadow-rose-200/40 hover:from-rose-600 hover:to-pink-600 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Download All — if multiple docs */}
                {result.documents.filter((d) => d.url).length > 1 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={() => {
                        result.documents.forEach((doc, i) => {
                          if (doc.url) {
                            setTimeout(() => {
                              downloadTicket(
                                doc.url!,
                                `ticket-${i + 1}-${result.pnr}.pdf`
                              );
                            }, i * 500);
                          }
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-200 text-rose-600 py-2.5 text-[11px] font-bold hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download All Tickets
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Conditions ── */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-2xl border p-4 ${
                  result.conditions.isRefundable
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw
                    className={`w-4 h-4 ${
                      result.conditions.isRefundable
                        ? 'text-emerald-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Refund
                  </span>
                </div>
                <p
                  className={`text-sm font-bold ${
                    result.conditions.isRefundable
                      ? 'text-emerald-700'
                      : 'text-gray-500'
                  }`}
                >
                  {result.conditions.isRefundable
                    ? 'Refundable'
                    : 'Non-refundable'}
                </p>
                {result.conditions.isRefundable &&
                  result.conditions.refundPenalty && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Penalty: {result.conditions.refundCurrency}{' '}
                      {result.conditions.refundPenalty}
                    </p>
                  )}
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  result.conditions.isChangeable
                    ? 'bg-sky-50 border-sky-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight
                    className={`w-4 h-4 ${
                      result.conditions.isChangeable
                        ? 'text-sky-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Change
                  </span>
                </div>
                <p
                  className={`text-sm font-bold ${
                    result.conditions.isChangeable
                      ? 'text-sky-700'
                      : 'text-gray-500'
                  }`}
                >
                  {result.conditions.isChangeable
                    ? 'Changeable'
                    : 'Non-changeable'}
                </p>
                {result.conditions.isChangeable &&
                  result.conditions.changePenalty && (
                    <p className="text-[10px] text-sky-600 mt-0.5">
                      Penalty: {result.conditions.changeCurrency}{' '}
                      {result.conditions.changePenalty}
                    </p>
                  )}
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">
                    Email
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 break-all">
                  {result.contact.email}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xl shadow-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.15em]">
                    Phone
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {result.contact.phone}
                </p>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleNewSearch}
                className="flex-1 group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 text-sm font-bold shadow-xl shadow-rose-200/40 hover:from-rose-600 hover:to-pink-600 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Search Another Booking
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-gray-600 py-4 text-sm font-semibold shadow-2xl shadow-gray-100 hover:bg-gray-50 hover:border-rose-200 hover:text-rose-600 transition-all duration-300 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>

            {/* ── Footer ── */}
            <div className="text-center pt-2 pb-6">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <Shield className="w-3 h-3" />
                <span>Secured & verified booking</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Need help?{' '}
                <a
                  href="/contact"
                  className="text-rose-500 hover:text-rose-600 font-semibold underline underline-offset-2 transition-colors"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}