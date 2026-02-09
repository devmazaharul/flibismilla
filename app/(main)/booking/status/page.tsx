'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plane,
  Loader2,
  ArrowRight,
  AlertCircle,
  Mail,
  Hash,
  CheckCircle,
  Calendar,
  Clock,
  User,
  FileText,
  ShieldCheck,
  XCircle,
  Download,
  MapPin,
  RotateCcw,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// -------------------------
// TYPES
// -------------------------

type SearchFormData = {
  pnr: string;
  email: string;
};

type PublicSegment = {
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departingAt: string;
  arrivingAt: string;
  duration: string;
  baggage: string;
};

type PublicPassenger = {
  fullName: string;
  type: string;
  ticketNumber: string | null;
};

type PublicDocument = {
  type: string;
  url: string;
};

type PublicBooking = {
  pnr: string;
  bookingRef: string;
  status: string;
  bookedAt: string;
  tripType: 'one_way' | 'round_trip' | 'multi_city';
  segments: PublicSegment[];
  passengers: PublicPassenger[];
  documents: PublicDocument[];
  isRefundable: boolean;
  isChangeable: boolean;
};

// -------------------------
// HELPERS
// -------------------------

const formatDuration = (isoDuration: string) => {
  if (!isoDuration) return '';
  const hMatch = isoDuration.match(/(\d+)H/);
  const mMatch = isoDuration.match(/(\d+)M/);
  const h = hMatch ? `${hMatch[1]}h` : '';
  const m = mMatch ? `${mMatch[1]}m` : '';
  return [h, m].filter(Boolean).join(' ') || isoDuration;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    issued: {
      label: 'Issued',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle size={10} className="text-emerald-500" />,
    },
    held: {
      label: 'On Hold',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock size={10} className="text-amber-500" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: <XCircle size={10} className="text-gray-500" />,
    },
    expired: {
      label: 'Expired',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle size={10} className="text-rose-500" />,
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Loader2 size={10} className="text-blue-500 animate-spin" />,
    },
  };

  const data = map[status] || {
    label: status,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-current" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${data.className}`}
    >
      {data.icon}
      {data.label}
    </span>
  );
};

const TripTypePill = ({ type }: { type: PublicBooking['tripType'] }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
    <Plane size={10} />
    {type ? type.split('_').join(' ') : 'one way'}
  </span>
);

// -------------------------
// MAIN PAGE
// -------------------------

export default function CheckBookingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PublicBooking | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>();

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true);
    setHasSearched(true);
    setResult(null);

    try {
      const res = await axios.post('/api/public/status-booking', {
        pnr: data.pnr.toUpperCase(),
        email: data.email,
      });

      if (res.data.success) {
        setResult(res.data.data as PublicBooking);
        toast.success('Booking found');
      }
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setResult(null);
    setHasSearched(false);
  };

  const mainRoute = (() => {
    if (!result || !result.segments?.length) return null;
    const first = result.segments[0];
    const last = result.segments[result.segments.length - 1];
    return {
      from: `${first.originCity} (${first.origin})`,
      to: `${last.destinationCity} (${last.destination})`,
    };
  })();

  const firstDeparture = result?.segments?.[0]
    ? parseISO(result.segments[0].departingAt)
    : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50/50 via-slate-50 to-sky-50/50 px-4 py-10 sm:px-6 lg:px-8">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-100px] h-96 w-96 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-rose-100/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-rose-100/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Heading */}
        <motion.div
          className="mb-8 max-w-xl text-center mx-auto space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-rose-100 px-4 py-1.5 text-[11px] font-semibold text-rose-600 shadow-sm backdrop-blur-sm mb-2">
            <Search size={12} />
            Booking Lookup
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Find your flight booking
          </h1>
          <p className="max-w-md text-sm mx-auto text-slate-500 leading-relaxed">
            Use your 6‑character PNR and the email used during booking to view
            ticket status, passengers, and your flight itinerary.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="max-w-xl mx-auto rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:px-7 sm:py-8 relative overflow-hidden"
        >
          {/* Card accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400 opacity-80" />

          {/* ---- FORM VIEW ---- */}
          {!result && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-rose-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Retrieve your booking
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 pl-[42px]">
                  Enter the details exactly as they appear in your confirmation
                  email.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {/* PNR */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="pnr"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
                    >
                      <Hash className="w-3 h-3 text-rose-400" />
                      Booking Reference (PNR)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      6 characters
                    </span>
                  </div>
                  <div className="mt-2 relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Hash className="h-4 w-4 text-slate-300 group-focus-within:text-rose-400 transition-colors" />
                    </div>
                    <input
                      id="pnr"
                      type="text"
                      placeholder="e.g. 4SFMSP"
                      maxLength={6}
                      className={`
                        block w-full rounded-2xl border bg-slate-50/50
                        py-3.5 pl-10 pr-10
                        text-sm font-mono tracking-[0.25em] uppercase
                        text-slate-900 placeholder:text-slate-300
                        outline-none transition-all duration-200
                        focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100
                        ${errors.pnr ? 'border-rose-300 bg-rose-50/50 ring-2 ring-rose-100' : 'border-slate-200'}
                      `}
                      {...register('pnr', {
                        required: 'PNR is required',
                        minLength: { value: 6, message: 'PNR must be 6 characters' },
                        maxLength: { value: 6, message: 'PNR must be 6 characters' },
                      })}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                      {errors.pnr && <AlertCircle className="h-4 w-4 text-rose-400" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {errors.pnr && (
                      <motion.p
                        className="mt-1.5 text-[11px] text-rose-500 font-medium flex items-center gap-1 pl-1"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <AlertCircle size={10} />
                        {errors.pnr.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
                  >
                    <Mail className="w-3 h-3 text-rose-400" />
                    Email Address
                  </label>
                  <div className="mt-2 relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-4 w-4 text-slate-300 group-focus-within:text-rose-400 transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="passenger@example.com"
                      className={`
                        block w-full rounded-2xl border bg-slate-50/50
                        py-3.5 pl-10 pr-10
                        text-sm text-slate-900 placeholder:text-slate-300
                        outline-none transition-all duration-200
                        focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100
                        ${errors.email ? 'border-rose-300 bg-rose-50/50 ring-2 ring-rose-100' : 'border-slate-200'}
                      `}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                      {errors.email && <AlertCircle className="h-4 w-4 text-rose-400" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        className="mt-1.5 text-[11px] text-rose-500 font-medium flex items-center gap-1 pl-1"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <AlertCircle size={10} />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={isLoading}
                    className="
                      relative flex w-full cursor-pointer items-center justify-center gap-2.5
                      rounded-2xl bg-rose-500 hover:bg-rose-600
                      py-3.5 text-sm font-semibold text-white
                      shadow-lg shadow-rose-200/60
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2
                      disabled:cursor-not-allowed disabled:opacity-70
                      overflow-hidden group/btn
                    "
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />

                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Finding your booking…</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        <span>Find My Booking</span>
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Helper */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    Your PNR (booking reference) is a 6‑character code found in your
                    confirmation email — look for something like <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">4SFMSP</code>.
                  </span>
                </div>

                <AnimatePresence>
                  {hasSearched && !result && !isLoading && (
                    <motion.div
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle size={14} className="text-rose-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-rose-800">
                            No booking found
                          </p>
                          <p className="mt-0.5 text-[11px] text-rose-600 leading-relaxed">
                            Please check that you entered the correct 6‑character
                            PNR and the same email address used during booking.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ---- RESULT VIEW ---- */}
          <AnimatePresence>
            {result && (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
              >
                {/* Booking header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Your Booking
                    </p>
                    {mainRoute && (
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        {mainRoute.from}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        {mainRoute.to}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {firstDeparture && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                          <Calendar size={10} />
                          {format(firstDeparture, 'EEE, dd MMM yyyy')}
                        </span>
                      )}
                      <TripTypePill type={result.tripType} />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge status={result.status} />
                      <button
                        onClick={handleNewSearch}
                        className="
                          flex items-center gap-1.5
                          rounded-full border border-slate-200 bg-white
                          px-3 py-1 text-[11px] font-medium text-slate-600
                          hover:bg-slate-50 hover:border-slate-300
                          transition-colors cursor-pointer
                        "
                      >
                        <RotateCcw size={10} />
                        New Search
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] text-slate-700 border border-slate-200">
                        <Hash size={9} /> PNR: {result.pnr}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] text-slate-700 border border-slate-200">
                        REF: {result.bookingRef}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Booked: {format(new Date(result.bookedAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>

                {/* Flight Segments */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <Plane size={11} className="text-rose-500" />
                    </div>
                    Flight Itinerary
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {result.segments.map((seg, idx) => {
                      const dep = parseISO(seg.departingAt);
                      const arr = parseISO(seg.arrivingAt);
                      return (
                        <div
                          key={idx}
                          className="
                            relative rounded-2xl border border-slate-200/80 bg-slate-50/60
                            p-4 hover:border-rose-200 hover:bg-rose-50/20
                            transition-all duration-200
                          "
                        >
                          {/* Left accent */}
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-rose-300" />

                          <div className="flex items-start gap-3 pl-2">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shrink-0">
                              {seg.airlineLogo ? (
                                <img
                                  src={seg.airlineLogo}
                                  alt={seg.airline}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <Plane className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {seg.airline}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    {seg.flightNumber} · {seg.aircraft}
                                  </p>
                                </div>
                                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                  <Clock size={10} className="inline mr-1" />
                                  {formatDuration(seg.duration)}
                                </span>
                              </div>

                              {/* Times row */}
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-1">
                                <div>
                                  <p className="text-base font-black text-slate-900">
                                    {format(dep, 'hh:mm a')}
                                  </p>
                                  <p className="text-[11px] font-medium text-slate-600">
                                    {seg.originCity} ({seg.origin})
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {format(dep, 'dd MMM yyyy')}
                                  </p>
                                </div>

                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-2 h-2 rounded-full border-2 border-rose-300 bg-white" />
                                  <div className="h-8 w-[2px] bg-rose-200 rounded-full relative">
                                    <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-rose-400 rotate-90" />
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                                </div>

                                <div className="text-right">
                                  <p className="text-base font-black text-slate-900">
                                    {format(arr, 'hh:mm a')}
                                  </p>
                                  <p className="text-[11px] font-medium text-slate-600">
                                    {seg.destinationCity} ({seg.destination})
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {format(arr, 'dd MMM')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                                  <Briefcase size={9} className="text-slate-400" />
                                  {seg.baggage}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passengers & Policies */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Passengers */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <User size={11} className="text-slate-500" />
                      </div>
                      Passengers
                    </div>
                    <div className="space-y-2">
                      {result.passengers.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3 hover:bg-white transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[12px] font-bold text-rose-600 shrink-0">
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-900 space-y-1">
                            <p className="font-bold text-sm">{p.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                              {p.type}
                            </p>
                            <div>
                              {p.ticketNumber ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                  <CheckCircle size={10} />
                                  {p.ticketNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                                  <Clock size={10} />
                                  Pending issuance
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Policies & Documents */}
                  <div className="space-y-4">
                    {/* Policies */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <ShieldCheck size={11} className="text-slate-500" />
                        </div>
                        Fare Conditions
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-xl border px-3 py-2.5 ${
                          result.isRefundable
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-rose-200 bg-rose-50/60'
                        }`}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Refund
                          </p>
                          <p className={`mt-1 text-xs font-bold ${
                            result.isRefundable ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {result.isRefundable ? '✓ Refundable' : '✕ Non-refundable'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500 leading-relaxed">
                            {result.isRefundable
                              ? 'Cancellation may incur airline fees.'
                              : 'Ticket value cannot be refunded.'}
                          </p>
                        </div>
                        <div className={`rounded-xl border px-3 py-2.5 ${
                          result.isChangeable
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-rose-200 bg-rose-50/60'
                        }`}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Changes
                          </p>
                          <p className={`mt-1 text-xs font-bold ${
                            result.isChangeable ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {result.isChangeable ? '✓ Changeable' : '✕ Non-changeable'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500 leading-relaxed">
                            {result.isChangeable
                              ? 'Fare difference may apply.'
                              : 'Dates cannot be changed.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <FileText size={11} className="text-slate-500" />
                        </div>
                        Documents
                      </div>
                      {result.documents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-center">
                          <FileText size={18} className="text-slate-300 mx-auto mb-1.5" />
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            No documents available yet. Your e‑ticket will appear here once issued.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {result.documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              className="
                                flex items-center justify-between gap-3
                                rounded-xl border border-slate-200 bg-white
                                px-3.5 py-2.5 text-slate-900
                                hover:border-rose-200 hover:bg-rose-50/30
                                transition-all duration-200 group/doc
                              "
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                                  <FileText size={14} className="text-rose-500" />
                                </div>
                                <div>
                                  <p className="text-[12px] font-semibold">{doc.type}</p>
                                  <p className="text-[10px] text-slate-400">
                                    Click to download
                                  </p>
                                </div>
                              </div>
                              <Download
                                size={16}
                                className="text-slate-400 group-hover/doc:text-rose-500 transition-colors"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          Need help?{' '}
          <a href="/contact" className="text-rose-500 hover:text-rose-600 font-medium underline underline-offset-2">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}