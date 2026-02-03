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
  const map: Record<string, { label: string; className: string }> = {
    issued: {
      label: 'Issued',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    held: {
      label: 'On Hold',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    expired: {
      label: 'Expired',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  };

  const data = map[status] || {
    label: status,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${data.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {data.label}
    </span>
  );
};

const TripTypePill = ({ type }: { type: PublicBooking['tripType'] }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-sky-900/70 via-slate-950 to-slate-950" />
      </div>

      {/* Content container (form on left) */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Top heading (only this text) */}
        <div className="mb-8 max-w-xl text-center mx-auto  text-slate-50 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your flight booking
          </h1>
          <p className="max-w-md text-sm mx-auto text-slate-300/80">
            Use your 6‑character PNR and the email used during booking to
            view ticket status, passengers, and your flight itinerary.
          </p>
        </div>

        {/* Main card (left aligned) */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="max-w-xl mx-auto rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.75)] backdrop-blur-md sm:px-6 sm:py-7"
        >
          {/* ---------------- FORM VIEW (no result) ---------------- */}
          {!result && (
            <>
              {/* Form Header */}
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-50">
                  Retrieve your booking
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter the details exactly as they appear in your confirmation
                  email.
                </p>
              </div>

              {/* FORM */}
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {/* PNR */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="pnr"
                      className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"
                    >
                      Booking reference (PNR)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      6 letters / numbers
                    </span>
                  </div>
                  <div className="mt-1.5 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="pnr"
                      type="text"
                      placeholder="4SFMSP"
                      maxLength={6}
                      className={`block w-full rounded-2xl border bg-slate-900/70 py-3 pl-10 pr-9 text-sm font-mono tracking-[0.25em] uppercase text-slate-50 placeholder:text-slate-500 outline-none ring-0 transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400 ${
                        errors.pnr
                          ? 'border-rose-400/80 bg-rose-950/40'
                          : 'border-slate-700/80'
                      }`}
                      {...register('pnr', {
                        required: 'PNR is required',
                        minLength: {
                          value: 6,
                          message: 'PNR must be 6 characters',
                        },
                        maxLength: {
                          value: 6,
                          message: 'PNR must be 6 characters',
                        },
                      })}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {errors.pnr && (
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {errors.pnr && (
                      <motion.p
                        className="mt-1 text-[11px] text-rose-300"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        {errors.pnr.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"
                  >
                    Email address
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="passenger@example.com"
                      className={`block w-full rounded-2xl border bg-slate-900/70 py-3 pl-10 pr-9 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-0 transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400 ${
                        errors.email
                          ? 'border-rose-400/80 bg-rose-950/40'
                          : 'border-slate-700/80'
                      }`}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value:
                            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      {errors.email && (
                        <AlertCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        className="mt-1 text-[11px] text-rose-300"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(56,189,248,0.5)] transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Finding your booking…</span>
                      </>
                    ) : (
                      <>
                        <span>Find my booking</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Helper + error */}
              <div className="mt-6 space-y-3 text-xs text-slate-400">
                <div className="flex items-center justify-start gap-1 text-[11px]">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span>
                    Your PNR (booking reference) is a 6‑character code in your
                    confirmation email.
                  </span>
                </div>

                <AnimatePresence>
                  {hasSearched && !result && !isLoading && (
                    <motion.div
                      className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-3 py-3 text-xs text-rose-100"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={14}
                          className="mt-0.5 text-rose-400"
                        />
                        <div>
                          <p className="font-semibold">
                            No booking found for this PNR and email.
                          </p>
                          <p className="mt-0.5 text-[11px] text-rose-200/80">
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

          {/* ---------------- RESULT VIEW (form hidden) ---------------- */}
          <AnimatePresence>
            {result && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                {/* Booking header */}
                <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Your booking
                    </p>
                    {mainRoute && (
                      <h3 className="text-base font-semibold text-slate-50">
                        {mainRoute.from}{' '}
                        <span className="text-slate-500">→</span>{' '}
                        {mainRoute.to}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {firstDeparture && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5">
                          <Calendar size={10} />{' '}
                          {format(firstDeparture, 'EEE, dd MMM yyyy')}
                        </span>
                      )}
                      <TripTypePill type={result.tripType} />
                    </div>
                  </div>
                  <div className="space-y-1 text-right text-[11px]">
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge status={result.status} />
                      <button
                        onClick={handleNewSearch}
                        className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-200 hover:bg-slate-800"
                      >
                        New search
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1 mt-1">
                      <span className="inline-flex rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-50">
                        PNR: {result.pnr}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-50">
                        REF: {result.bookingRef}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Booked at:{' '}
                      {format(new Date(result.bookedAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>

                {/* Flight segments */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <Clock size={11} />
                    Flight itinerary
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                    {result.segments.map((seg, idx) => {
                      const dep = parseISO(seg.departingAt);
                      const arr = parseISO(seg.arrivingAt);
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                              {seg.airlineLogo && (
                                <img
                                  src={seg.airlineLogo}
                                  alt={seg.airline}
                                  className="h-full w-full object-contain"
                                />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <div>
                                  <p className="text-sm font-semibold text-slate-50">
                                    {seg.airline}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {seg.flightNumber} · {seg.aircraft}
                                  </p>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {formatDuration(seg.duration)}
                                </span>
                              </div>

                              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-100">
                                {/* Origin */}
                                <div>
                                  <p className="text-sm font-semibold text-slate-50">
                                    {/* 🟢 TIME CHANGED TO 12H */}
                                    {format(dep, 'hh:mm a')}
                                  </p>
                                  <p className="text-[11px">
                                    {seg.originCity} ({seg.origin})
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {format(dep, 'dd MMM')}
                                  </p>
                                </div>

                                {/* Line */}
                                <div className="flex flex-col items-center gap-1">
                                  <div className="h-[2px] w-16 rounded-full bg-slate-700" />
                                  <Plane className="h-3.5 w-3.5 text-slate-500 rotate-90" />
                                </div>

                                {/* Destination */}
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-slate-50">
                                    {/* 🟢 TIME CHANGED TO 12H */}
                                    {format(arr, 'hh:mm a')}
                                  </p>
                                  <p className="text-[11px]">
                                    {seg.destinationCity} ({seg.destination})
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {format(arr, 'dd MMM')}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2 py-0.5">
                                  Baggage: {seg.baggage}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passengers & policies / docs */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Passengers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      <User size={11} />
                      Passengers
                    </div>
                    <div className="space-y-2">
                      {result.passengers.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                        >
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-slate-100">
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-100">
                            <p className="font-semibold">{p.fullName}</p>
                            <p className="text-[10px] text-slate-400">
                              Type: {p.type}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-300">
                              Ticket:{' '}
                              {p.ticketNumber ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-100">
                                  <CheckCircle size={10} />
                                  {p.ticketNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                                  <XCircle size={10} />
                                  Not yet issued
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Policies & Documents */}
                  <div className="space-y-3">
                    {/* Policies */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <ShieldCheck size={11} />
                        Fare conditions
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Refund
                          </p>
                          <p className="mt-1 font-medium text-slate-50">
                            {result.isRefundable ? 'Refundable' : 'Non-refundable'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {result.isRefundable
                              ? 'Cancellation may incur airline fees.'
                              : 'Ticket value cannot be refunded.'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Changes
                          </p>
                          <p className="mt-1 font-medium text-slate-50">
                            {result.isChangeable ? 'Changeable' : 'Non-changeable'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {result.isChangeable
                              ? 'Date change allowed, fare difference may apply.'
                              : 'Flight dates cannot be changed.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <FileText size={11} />
                        Documents
                      </div>
                      {result.documents.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
                          No downloadable documents are available yet. Once
                          issued, your e‑ticket will appear here.
                        </p>
                      ) : (
                        <div className="space-y-1.5 text-[11px]">
                          {result.documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-100 hover:border-slate-600"
                            >
                              <div className="flex items-center gap-2">
                                <FileText
                                  size={14}
                                  className="text-slate-300"
                                />
                                <div>
                                  <p className="text-[11px] font-medium">
                                    {doc.type}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Click to view / download
                                  </p>
                                </div>
                              </div>
                              <Download
                                size={14}
                                className="text-slate-400"
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
      </div>
    </div>
  );
}