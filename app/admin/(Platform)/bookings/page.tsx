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
  X,
  CheckCircle,
  XCircle,
  ShoppingCart,
  DollarSign,
  Loader2,
  Copy,
  Eye,
  RefreshCcw as RefreshCcwIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import StripeWrapper from '@/app/admin/components/StripeWrapper';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface Booking {
  id: string;
  bookingRef: string;
  pnr: string;
  updatedAt: string;
  status: 'held' | 'issued' | 'cancelled' | 'expired' | 'processing' | 'failed';
  flight: {
    airline: string;
    flightNumber: string;
    route: string;
    date: string;
    duration: string;
    tripType: 'one_way' | 'round_trip' | 'multi_city';
    logoUrl: string;
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
// HELPER COMPONENTS
// ----------------------------------------------------------------------

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        setIsUrgent(false);
        return 'Expired';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(diff < 3600000); // < 1 hour
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 'Expired')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-400">
        <Clock size={10} />
        Expired
      </span>
    );

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold ${
        isUrgent
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}
    >
      <Clock size={10} />
      {timeLeft}
    </div>
  );
};

const StatusBadge = ({ status }: { status: Booking['status'] }) => {
  const map: Record<
    Booking['status'],
    { label: string; className: string }
  > = {
    issued: {
      label: 'Issued',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    held: {
      label: 'Held',
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
    failed: {
      label: 'Failed',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const data = map[status] || map.cancelled;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${data.className}`}
    >
      {data.label}
    </span>
  );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function BookingsDashboard() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'held' | 'issued' | 'cancelled'
  >('all');

  // Issue Modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'balance'>(
    'stripe',
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ----------------------------------------------------------------------
  // API
  // ----------------------------------------------------------------------

  const fetchBookings = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/duffel/booking?page=${pageNum}&limit=20`,
      );

      if (res.data.success) {
        setBookings(res.data.data);
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.total);
      }
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page, isRefreshing]);

  // ----------------------------------------------------------------------
  // HANDLERS
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
    setPaymentMethod('balance'); // default agency balance
    setIssueModalOpen(true);
  };

  const handleIssueTicket = async () => {
    if (!selectedBooking) return;

    // এখানে এখন শুধু balance path handle করছি; Stripe path StripeWrapper এর ভিতরে
    if (paymentMethod !== 'balance') return;

    setIsProcessing(true);
    try {
      const res = await axios.post('/api/duffel/booking/issue', {
        bookingId: selectedBooking.id,
        paymentMethod: 'balance',
      });

      if (res.data.success) {
        toast.success('Ticket Issued Successfully');
        setIssueModalOpen(false);
        fetchBookings(page);
      } else {
        throw new Error(res.data.message || 'Failed to issue ticket');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error.message || 'Failed to issue ticket';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (pnr: string) => {
    navigator.clipboard.writeText(pnr);
    toast.success('PNR copied');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // ----------------------------------------------------------------------
  // LOGIC
  // ----------------------------------------------------------------------

  const stats = useMemo(() => {
    return {
      total: totalCount,
      issued: bookings.filter((b) => b.status === 'issued').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      profit: bookings
        .filter((b) => b.status === 'issued')
        .reduce((acc, curr) => acc + (curr.amount.markup || 0), 0),
    };
  }, [bookings, totalCount]);

  const filteredBookings = bookings.filter((b) => {
    const term = search.toLowerCase();
    const matchSearch =
      b.bookingRef.toLowerCase().includes(term) ||
      b.pnr?.toLowerCase().includes(term) ||
      b.passengerName.toLowerCase().includes(term);

    const matchFilter = filter === 'all' || b.status === filter;

    return matchSearch && matchFilter;
  });

  // ----------------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-6 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operations
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Bookings dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor flight reservations, ticketing status and profit in one place.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-800 shadow-2xl shadow-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="font-semibold">{stats.issued} issued</span>
                <span className="text-gray-400">/</span>
                <span>{stats.total} total</span>
              </div>
              <p className="mt-0.5 text-[10px] text-emerald-700">
                Profit so far:{' '}
                <span className="font-semibold">
                  ${stats.profit.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: 'Total bookings',
              value: stats.total,
              icon: ShoppingCart,
              accent: 'from-sky-100 to-sky-200/80',
            },
            {
              label: 'Issued',
              value: stats.issued,
              icon: CheckCircle,
              accent: 'from-emerald-100/80 to-emerald-200/80',
            },
            {
              label: 'Cancelled',
              value: stats.cancelled,
              icon: XCircle,
              accent: 'from-rose-100/80 to-rose-200/80',
            },
            {
              label: 'Profit',
              value: `$${stats.profit.toFixed(2)}`,
              icon: DollarSign,
              accent: 'from-amber-100/80 to-amber-200/80',
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-100 hover:shadow-sm transition-shadow"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-60`}
              />
              <div className="relative flex items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {stat.label}
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </h3>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-2xl shadow-gray-100 border border-gray-100/40">
                  <stat.icon size={18} className="text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by PNR, reference or passenger..."
                className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2 text-sm text-gray-900 outline-none ring-0 transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button title="Refresh" onClick={handleRefresh}>
              <RefreshCcwIcon
                className={`${
                  isRefreshing ? 'animate-spin' : ''
                } transition-all cursor-pointer duration-300 text-slate-600`}
                size={17}
              />
            </button>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
            {['all', 'held', 'issued', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as typeof filter)}
                className={`px-3 py-1.5 cursor-pointer text-xs font-medium capitalize rounded-full transition-all ${
                  filter === s
                    ? 'bg-black text-slate-100 shadow-2xl shadow-gray-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-100">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" size={16} />
                Loading bookings…
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100/40 bg-gray-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      <th className="px-4 py-3">Ref / PNR</th>
                      <th className="px-4 py-3">Flight</th>
                      <th className="px-4 py-3">Passenger & Contact</th>
                      <th className="px-4 py-3">Date & Status</th>
                      <th className="px-4 py-3 text-center">Amount</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-sm text-gray-400"
                        >
                          No bookings match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => {
                        const hasPnr = booking.pnr && booking.pnr !== '---';
                        const flightDate = new Date(booking.flight.date);

                        return (
                          <tr
                            key={booking.id}
                            className={`transition hover:bg-slate-50 ${
                              booking.status === 'held' ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {/* Ref / PNR */}
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-1">
                                <div className="px-2 py-0.5 text-[11px] font-bold text-slate-800">
                                  {booking.bookingRef}
                                </div>
                                {hasPnr && (
                                  <button
                                    onClick={() => handleCopy(booking.pnr)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-black px-2 py-0.5 text-[11px] font-mono text-gray-100 hover:border-gray-300 transition hover:bg-gray-700"
                                    title="Copy PNR"
                                  >
                                    <span>{booking.pnr}</span>
                                    <Copy size={11} className="text-gray-300" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Flight */}
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-start gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                                  {booking.flight.logoUrl && (
                                    <img
                                      src={booking.flight.logoUrl}
                                      alt="Logo"
                                      className="h-full w-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display =
                                          'none';
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="max-w-[220px] space-y-0.5">
                                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                                    <span className="truncate">
                                      {booking.flight.route}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    {booking.flight.airline} • {booking.flight.flightNumber}
                                  </div>
                                  <div className="text-[10px] font-semibold text-gray-400">
                                    {booking.flight.tripType
                                      .split('_')
                                      .join(' ')
                                      .toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Passenger */}
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                                    {booking.passengerName.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="truncate">{booking.passengerName}</span>
                                </div>
                                <p className="max-w-[200px] truncate text-[11px] text-gray-500">
                                  {booking.contact.email}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  +{booking.passengerCount - 1} more travelers
                                </p>
                              </div>
                            </td>

                            {/* Date & Status */}
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-1.5 text-xs text-gray-700">
                                <div className="text-gray-500 pt-1 font-medium flex items-center gap-1">
                                  <Calendar size={11} className="text-gray-400" />
                                  <span>
                                    {flightDate.toLocaleDateString()} •{' '}
                                    {flightDate.toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <StatusBadge status={booking.status} />
                                {booking.status === 'held' && (
                                  <div className="pt-0.5">
                                    <CountdownTimer deadline={booking.timings.deadline} />
                                  </div>
                                )}
                              </div>
                              <small className="text-gray-400 pt-1 text-[10px] flex items-center gap-1">
                                Last Updated:{' '}
                                {booking.updatedAt
                                  ? format(
                                      new Date(booking.updatedAt),
                                      'dd MMM yyyy, hh:mm a',
                                    )
                                  : 'Never'}
                              </small>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-4 text-center align-top">
                              <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-gray-900">
                                  {booking.amount.currency}{' '}
                                  {booking.amount.total.toFixed(2)}
                                </div>
                                {booking.amount.markup > 0 && (
                                  <div className="text-[10px] font-medium text-emerald-600">
                                    + Profit {booking.amount.markup}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-right align-top">
                              <div className="flex items-center justify-end gap-2">
                                {booking.status === 'issued' &&
                                  booking.actionData.ticketUrl && (
                                    <a
                                      href={booking.actionData.ticketUrl}
                                      target="_blank"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-black hover:bg-gray-50 transition"
                                      title="Download ticket"
                                    >
                                      <Download size={14} />
                                    </a>
                                  )}

                                <button
                                  onClick={() => handleViewDetails(booking.id)}
                                  disabled={!hasPnr}
                                  className={`inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-full border text-gray-500 transition
                                  ${
                                    hasPnr
                                      ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:text-black'
                                      : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                  }`}
                                  title={hasPnr ? 'View details' : 'PNR not available'}
                                >
                                  <Eye size={14} />
                                </button>

                                {booking.status === 'held' && (
                                  <button
                                    onClick={() => openIssueModal(booking)}
                                    className="inline-flex items-center cursor-pointer gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl shadow-gray-100 hover:bg-black transition"
                                  >
                                    Issue
                                    <ChevronRight size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                <span>
                  Page {page} of {totalPages} • Showing {filteredBookings.length} of{' '}
                  {totalCount} bookings
                </span>
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-gray-300 hover:bg-gray-50 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-gray-300 hover:bg-gray-50 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ISSUE TICKET MODAL (Stripe + Duffel balance, same style as flight details page) */}
      {issueModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-2 py-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100 flex flex-col">
            {/* Top accent bar */}
            <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 pt-4 pb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ticket issuing
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900 tracking-tight">
                  Issue Ticket
                </h3>
                <p className="mt-0.5 text-[11px] font-mono text-slate-500">
                  PNR:{' '}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                    {selectedBooking.pnr}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIssueModalOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-slate-900 hover:shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {/* Amount summary */}
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Total amount
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-slate-600">
                    {paymentMethod === 'balance'
                      ? 'Using agency balance'
                      : 'Client pays via Stripe'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    {selectedBooking.amount.currency}{' '}
                    {paymentMethod === 'balance'
                      ? selectedBooking.amount.base_amount.toFixed(2)
                      : selectedBooking.amount.total.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Taxes & fees included
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* OPTION 1: Stripe */}
                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-indigo-500/80 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

                  <div className="relative p-3 pt-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Pay with Stripe
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Secure card payment with 3D Secure (OTP).
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          <span className="text-[9px] font-semibold tracking-wide text-white">
                            STRIPE
                          </span>
                        </span>
                        <span className="text-[9px] font-medium text-slate-400">
                          Encrypted • PCI compliant
                        </span>
                      </div>
                    </div>

                    {paymentMethod === 'stripe' && (
                      <div
                        className="mt-2 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StripeWrapper
                          amount={Number(selectedBooking.amount.total)}
                          bookingId={selectedBooking.id}
                          bookRef={selectedBooking.bookingRef}
                          cardInfo={{
                            holderName: selectedBooking.paymentSource.holderName,
                            cardNumber: selectedBooking.paymentSource.cardLast4
                              ? `${selectedBooking.paymentSource.cardLast4}`
                              : '',
                          }}
                          onSuccess={() => {
                            // Stripe payment success হলে backend webhook/অন্য flow এ issue হবে ধরে নিচ্ছি
                            setIssueModalOpen(false);
                            fetchBookings(page);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* OPTION 2: Duffel Balance */}
                <div
                  onClick={() => setPaymentMethod('balance')}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all ${
                    paymentMethod === 'balance'
                      ? 'border-slate-600/80 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        paymentMethod === 'balance'
                          ? 'border-slate-700'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'balance' && (
                        <div className="h-2 w-2 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Duffel balance
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Deduct directly from your agency wallet. Good for net fares
                            or corporate bookings.
                          </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Wallet size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-4 flex gap-2.5 rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-orange-500" />
                <p className="text-[11px] leading-relaxed text-orange-900">
                  Confirming this action will immediately issue the ticket and charge
                  the selected source. This cannot be undone and airline
                  change/refund rules will apply.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/90 px-5 py-3 rounded-b-2xl">
              <button
                onClick={() => setIssueModalOpen(false)}
                className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:text-slate-900 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueTicket}
                disabled={isProcessing || paymentMethod === 'stripe'}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isProcessing && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isProcessing ? 'Processing...' : 'Confirm & Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}