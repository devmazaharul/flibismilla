"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plane,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  Wallet,
  Download,
  Copy,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Calendar,
  FileText,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  XCircle,
  Wifi,
} from "lucide-react";
import { format, differenceInSeconds, parseISO } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import StripeWrapper from "@/app/admin/components/StripeWrapper";

// ==========================================
// 1. TYPES
// ==========================================

interface Segment {
  direction: string;
  sliceIndex: number;
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
  cabinClass: string;
  baggage: string;
}

type BookingStatus =
  | "held"
  | "issued"
  | "cancelled"
  | "expired"
  | "processing"
  | "failed";

type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

interface BookingData {
  id: string;
  bookingRef: string;
  duffelOrderId: string;
  pnr: string;
  status: BookingStatus;
  tripType: "one_way" | "round_trip" | "multi_city";
  availableActions: string[];
  policies: {
    cancellation: {
      allowed: boolean;
      penalty: string;
      note: string;
      timeline: string;
    };
    dateChange: {
      allowed: boolean;
      penalty: string;
      note: string;
      timeline: string;
    };
  };
  segments: Segment[];
  contact: { email: string; phone: string };
  passengers: {
    id: string;
    type: string;
    fullName: string;
    ticketNumber: string;
    gender: string;
    dob: string;
    carryingInfant: string;
  }[];
  finance: {
    basePrice: string;
    tax: string;
    clientTotal: string;
    currency: string;
    yourMarkup: string;
    duffelTotal: string;
  };
  paymentSource?: {
    holderName: string;
    cardNumber: string;
    expiryDate: string;
    cardLast4?: string;
    billingAddress?: {
      zipCode?: string;
    };
  };
  documents?: any[];
  timings?: { deadline: string };
  paymentStatus: PaymentStatus;
  adminNotes?: string | null;
  cancellation?: {
    cancelled_at: string | null;
    refund_amount: string | null;
    refund_currency: string | null;
    penalty_amount: string | null;
    penalty_currency: string | null;
    refunded_at: string | null;
  } | null;
}

const INITIATE_CARD_URL = "/api/duffel/booking/initiate-card";

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<string, string> = {
    issued:
      "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
    held: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
    cancelled:
      "bg-gray-100 text-gray-600 border-gray-200 ring-gray-500/10",
    expired:
      "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
    processing:
      "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20",
    failed:
      "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-bold border ring-1 uppercase tracking-wide flex items-center gap-1.5 ${
        styles[status] || styles.cancelled
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const map: Record<
    PaymentStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    requires_action: {
      label: "Requires Action",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    authorized: {
      label: "Authorized",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    captured: {
      label: "Captured",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    failed: {
      label: "Failed",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    refunded: {
      label: "Refunded",
      className: "bg-slate-50 text-slate-700 border-slate-200",
    },
  };

  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border ${s.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
};

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded transition cursor-pointer"
      title="Click to copy"
    >
      <span className="font-mono  font-medium text-sm text-gray-700">
        {text}
      </span>
      <Copy className="w-3 h-3 text-gray-400 group-hover:text-black" />
    </button>
  );
};

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("Loading...");

  useEffect(() => {
    if (!deadline) return;

    const calculateTime = () => {
      const diff = differenceInSeconds(new Date(deadline), new Date());
      if (diff <= 0) return "Expired";

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return `${h}h ${m}m ${s}s`;
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(
      () => setTimeLeft(calculateTime()),
      1000
    );
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === "Expired")
    return (
      <span className="text-rose-600 font-bold">Expired</span>
    );
  return (
    <span className="font-mono font-bold text-amber-700 tracking-tight">
      {timeLeft}
    </span>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function BookingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundData, setRefundData] = useState<
    BookingData["cancellation"] | null
  >(null);

  useEffect(() => {
    if (refundModalOpen) {
      setRefundData(data?.cancellation || null);
    }
  }, [refundModalOpen, data]);

  const refreshRefundFromAirline = async () => {
    if (!data) return;
    setRefundLoading(true);
    try {
      const res = await axios.get(`/api/duffel/booking/${data.id}/refund`);
      if (res.data.success) {
        setRefundData(res.data.data);
        toast.success("Refund information updated from airline");
      } else {
        toast.error(res.data.message || "Failed to fetch refund details");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch refund details"
      );
    } finally {
      setRefundLoading(false);
    }
  };

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "balance" | "card"
  >("stripe");

  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`/api/duffel/booking/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const eTicketDoc =
    data?.documents?.find((doc: any) => doc.type === "electronic_ticket") ||
    data?.documents?.[0];

  const handleIssueTicket = async () => {
    if (!data) return;

    if (paymentMethod === "card" && cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }

    setIsProcessing(true);

    const finalizeIssue = async (
      pMethod: "balance" | "card",
      cardId?: string
    ) => {
      const res = await axios.post("/api/duffel/booking/issue", {
        bookingId: data.id,
        paymentMethod: pMethod,
        cardId,
      });

      if (res.data.success) {
        toast.success("Ticket Issued Successfully!");
        setIssueModalOpen(false);
        fetchBooking();
      } else {
        throw new Error(res.data.message || "Failed to issue ticket");
      }
    };

    try {
      // CASE A: Agency Balance
      if (paymentMethod === "balance") {
        await finalizeIssue("balance");
        return;
      }

      // CASE B: Stored Card + simulated 3DS
      if (paymentMethod === "card") {
        if (!data.paymentSource) {
          toast.error("No stored card information found.");
          return;
        }

        const initRes = await axios.post(
          `${INITIATE_CARD_URL}/test`,
          {
            bookingId: data.id,
            cvv,
          }
        );

        if (!initRes.data.success) {
          const code = initRes.data.code;
          const msg =
            initRes.data.message ||
            (code === "CARD_DECLINED"
              ? "Card declined (Mock). Try another card."
              : "Card verification failed (Mock).");
          throw new Error(msg);
        }

        const {
          action,
          client_token,
          card_id,
          scenario,
        }: {
          action: "PROCEED_TO_PAY" | "SHOW_3DS_POPUP";
          client_token?: string;
          card_id: string;
          scenario?: string;
        } = initRes.data;

        if (action === "SHOW_3DS_POPUP" && client_token) {
          toast.loading("Simulating bank security check...", {
            id: "3ds-toast",
          });

          try {
            await new Promise((resolve) => setTimeout(resolve, 2500));

            toast.dismiss("3ds-toast");
            toast.success(
              "3D Secure verification simulated successfully. Issuing ticket..."
            );

            // আসলে এখানে finalizeIssue("card", card_id) কল হবে
            // await finalizeIssue("card", card_id);
            return;
          } catch (otpError: any) {
            console.error("Mock 3DS Error:", otpError);
            toast.dismiss("3ds-toast");
            toast.error(
              "Mock verification failed or cancelled by user."
            );
            return;
          }
        }

        if (action === "PROCEED_TO_PAY") {
          await finalizeIssue("card", card_id);
          return;
        }

        throw new Error(
          `Unexpected card-init action: ${action} (scenario: ${scenario})`
        );
      }
    } catch (error: any) {
      console.error("Issue Error:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to issue ticket";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">
          Retrieving flight details...
        </p>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500 font-medium">
            Booking information unavailable
          </p>
        </div>
      </div>
    );

  const canCancel = data.availableActions.includes("cancel");
  const canChange =
    data.availableActions.includes("change") ||
    data.availableActions.includes("update");

  const routeDisplay = (() => {
    const firstSeg = data.segments[0];
    const lastSeg = data.segments[data.segments.length - 1];

    let origin = firstSeg.originCity;
    let destination = lastSeg.destinationCity;
    let separator = "→";

    if (data.tripType === "round_trip") {
      const outboundSegments = data.segments.filter(
        (s) => s.sliceIndex === 0
      );
      const mainDest =
        outboundSegments[outboundSegments.length - 1];

      if (mainDest) {
        destination = mainDest.destinationCity;
      }
      separator = "↔";
    }

    return { origin, destination, separator };
  })();

  const firstDeparture = parseISO(data.segments[0].departingAt);
  const lastArrival = parseISO(
    data.segments[data.segments.length - 1].arrivingAt
  );
  const totalTripSeconds = differenceInSeconds(lastArrival, firstDeparture);
  const totalTripHours = Math.floor(totalTripSeconds / 3600);
  const totalTripMinutes = Math.floor(
    (totalTripSeconds % 3600) / 60
  );
  const totalTripDurationLabel = `${totalTripHours}h${
    totalTripMinutes ? ` ${totalTripMinutes}m` : ""
  }`;

  const passengerCount = data.passengers.length;
  const passengerLabel =
    passengerCount === 1
      ? "1 traveler"
      : `${passengerCount} travelers`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-gray-900 font-sans pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* --- Header Section (Hero) --- */}
        <div className="mb-10 space-y-4">
          {/* Breadcrumb / Back */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200/70 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-2xl shadow-gray-100 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <span>Back</span>
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </button>
              <span className="hidden sm:inline text-gray-400">
                /
              </span>
              <span className="hidden sm:inline text-xs font-medium text-gray-500">
                Booking management
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
              <span className="rounded-full bg-white/80 px-3 py-1 border border-gray-200/70 shadow-2xl shadow-gray-100 ">
                Trip:
                <span className="font-semibold text-gray-800 ml-1">
                  {data.tripType.replace("_", " ")}
                </span>
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 border border-gray-200/70 shadow-2xl shadow-gray-100 ">
                Booking ID:
                <span title={data.id} className="font-mono text-xs ml-1">
                  {data.id.slice(0, 8)}...
                </span>
              </span>
            </div>
          </div>

          {/* Hero grid */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            {/* Route & meta */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-6 py-5 shadow-2xl shadow-gray-100">
              <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
              <div className="absolute -left-14 -bottom-20 h-36 w-36 rounded-full bg-indigo-100/50 blur-3xl" />

              <div className="relative space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                      Flight itinerary
                    </p>
                    <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      <span>{routeDisplay.origin}</span>
                      <span className="text-slate-300 text-2xl sm:text-3xl">
                        {routeDisplay.separator}
                      </span>
                      <span>{routeDisplay.destination}</span>
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 border border-gray-200/70 shadow-2xl shadow-gray-100 backdrop-blur-sm">
                        <Calendar className="h-3.5 w-3.5 text-sky-500" />
                        <span className="font-medium">
                          {format(firstDeparture, "EEE, dd MMM")} –{" "}
                          {format(lastArrival, "EEE, dd MMM")}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 border  border-gray-200/70 shadow-2xl shadow-gray-100 backdrop-blur-sm">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="font-medium">
                          {passengerLabel}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 border  border-gray-200/70 shadow-2xl shadow-gray-100 backdrop-blur-sm">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-medium">
                          Total trip: {totalTripDurationLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={data.status} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white border-gray-200/70 shadow-2xl shadow-gray-100 ">
                      <Plane className="h-3 w-3" />
                      {data.tripType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Ref / PNR / Duffel */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 border border-gray-200/70 shadow-2xl shadow-gray-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Reference
                    </span>
                    <CopyButton
                      text={data.bookingRef}
                      label="Reference"
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 border  border-gray-200/70 shadow-2xl shadow-gray-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      PNR
                    </span>
                    <CopyButton text={data.pnr} label="PNR" />
                  </div>
                  {data.duffelOrderId && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 border border-gray-200/80 text-[11px] font-mono text-gray-500">
                      <span className="uppercase text-[9px] tracking-widest text-gray-400">
                        Duffel
                      </span>
                      <span className="truncate max-w-[130px]">
                        <CopyButton
                          text={data.duffelOrderId}
                          label="duffelOrderId"
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status / Deadline / Contact snapshot */}
            <div className="flex h-full flex-col gap-4 rounded-2xl border  bg-white/80 p-5  border-gray-200/70 shadow-2xl shadow-gray-100 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Booking status
                  </p>
                  <div className="mt-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {data.status === "issued"
                        ? "Ticketed & confirmed"
                        : data.status === "held"
                        ? "On hold – not yet ticketed"
                        : data.status === "cancelled"
                        ? "Cancelled"
                        : data.status === "expired"
                        ? "Expired"
                        : data.status === "processing"
                        ? "Processing"
                        : "Failed"}
                    </p>
                    {data.status === "issued" && (
                      <p className="mt-0.5 text-xs text-emerald-600">
                        You can download the e‑ticket from the
                        summary panel.
                      </p>
                    )}
                    {data.status === "held" && (
                      <p className="mt-0.5 text-xs text-amber-600">
                        Complete payment before the hold
                        deadline.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {data.status === "held" &&
                data.timings?.deadline && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                      <div>
                        <p className="font-semibold">
                          Ticket expires in
                        </p>
                        <p className="text-[11px]">
                          Hold until{" "}
                          {format(
                            parseISO(
                              data.timings.deadline
                            ),
                            "EEE, dd MMM hh:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                    <CountdownTimer
                      deadline={data.timings.deadline}
                    />
                  </div>
                )}

              {/* Quick contact */}
              <div className="mt-auto rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">
                    {data.contact.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span>{data.contact.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column (Flight Info) --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Flight Itinerary */}
            <div className="bg-white border border-gray-200/70 shadow-2xl shadow-gray-100  rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    Flight Itinerary
                  </h3>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200">
                  {data.tripType.replace("_", " ")}
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {data.segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-6 md:p-8 hover:bg-gray-50/40 transition"
                  >
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                      {/* Airline Info */}
                      <div className="flex md:flex-col items-center md:items-start gap-3 w-full md:w-32 shrink-0">
                        <img
                          src={`https://pics.avs.io/200/200/${seg.airlineCode}.png`}
                          alt={seg.airlineCode}
                          className="w-10 h-10 object-contain"
                          onError={(e) =>
                            (e.currentTarget.style.display =
                              "none")
                          }
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {seg.airline}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {seg.airlineCode}-{seg.flightNumber}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {seg.aircraft}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 grid grid-cols-3 gap-4 items-center relative">
                        {/* Origin */}
                        <div className="text-left">
                          <div className="text-2xl font-bold text-gray-900">
                            {format(
                              parseISO(seg.departingAt),
                              "hh:mm a"
                            )}
                          </div>
                          <div className="font-semibold text-gray-700">
                            {seg.origin}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(
                              parseISO(seg.departingAt),
                              "EEE, dd MMM"
                            )}
                          </div>
                        </div>

                        {/* Duration / Arrow */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] font-medium text-gray-400 mb-1">
                            {seg.duration
                              .replace("PT", "")
                              .toLowerCase()}
                          </span>
                          <div className="w-full flex items-center gap-2">
                            <div className="h-[2px] bg-gray-200 flex-1 rounded-full relative">
                              <div className="absolute right-0 -top-[3px] w-2 h-2 bg-gray-300 rounded-full" />
                              <div className="absolute left-0 -top-[3px] w-2 h-2 bg-gray-300 rounded-full" />
                            </div>
                            <Plane className="w-4 h-4 text-gray-300 rotate-90 shrink-0" />
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
                            Direct
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {format(
                              parseISO(seg.arrivingAt),
                              "hh:mm a"
                            )}
                          </div>
                          <div className="font-semibold text-gray-700">
                            {seg.destination}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(
                              parseISO(seg.arrivingAt),
                              "EEE, dd MMM"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-dashed border-gray-100">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        <User className="w-3 h-3" /> {seg.cabinClass}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                        <Wallet className="w-3 h-3" /> Baggage:{" "}
                        {seg.baggage}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200">
                        {seg.originCity}{" "}
                        <ArrowRight className="w-3 h-3" />{" "}
                        {seg.destinationCity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Travelers */}
            <div className="bg-white rounded-2xl border border-gray-200/70 shadow-2xl shadow-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    Travelers
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 font-medium tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 font-medium tracking-wider">
                        Date Of Birth
                      </th>
                      <th className="px-6 py-3 font-medium tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 font-medium tracking-wider text-right">
                        E-Ticket
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.passengers.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/60 transition"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            {p.fullName.charAt(0)}
                          </div>
                          {p.fullName}
                        </td>
                        <td className="px-6 py-4 text-gray-500 capitalize">
                          {p.type.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 text-gray-500 capitalize">
                          {p.dob}
                        </td>
                        <td className="px-6 py-4 text-gray-500 capitalize">
                          <span>
                            {p.gender === "m" ? "Male" : "Female"}
                          </span>
                          {p.carryingInfant && (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200">
                              Carrying infant: {p.carryingInfant}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                          {p.ticketNumber !== "Not Issued" ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />{" "}
                              {p.ticketNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Processing...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Fare Rules & Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cancellation Policy Card */}
              <div
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  data.policies.cancellation.allowed
                    ? "bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100 hover:border-emerald-200"
                    : "bg-gradient-to-br from-rose-50/50 to-white border-rose-100 hover:border-rose-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          data.policies.cancellation.allowed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {data.policies.cancellation.allowed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <ShieldAlert className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          Cancellation
                        </h4>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            data.policies.cancellation.allowed
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {data.policies.cancellation.allowed
                            ? "Refundable"
                            : "Non-Refundable"}
                        </p>
                      </div>
                    </div>
                    {data.policies.cancellation.allowed && (
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 font-medium uppercase">
                          Penalty Fee
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {data.policies.cancellation.penalty}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`rounded-xl p-3.5 text-sm mb-3 border ${
                      data.policies.cancellation.allowed
                        ? "bg-emerald-50/50 border-emerald-100/50 text-emerald-800"
                        : "bg-rose-50/50 border-rose-100/50 text-rose-800"
                    }`}
                  >
                    {data.policies.cancellation.allowed
                      ? "You can cancel this ticket and get a refund after deducting the penalty fee."
                      : "This ticket cannot be cancelled. No refund will be issued."}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Processing Time:{" "}
                      <span className="font-medium text-gray-700">
                        {data.policies.cancellation.timeline ||
                          "7-15 Working Days"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Change Policy Card */}
              <div
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  data.policies.dateChange.allowed
                    ? "bg-gradient-to-br from-blue-50/50 to-white border-blue-100 hover:border-blue-200"
                    : "bg-gradient-to-br from-rose-50/50 to-white border-rose-100 hover:border-rose-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          data.policies.dateChange.allowed
                            ? "bg-blue-100 text-blue-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {data.policies.dateChange.allowed ? (
                          <RefreshCw className="w-6 h-6" />
                        ) : (
                          <XCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900">
                          Date Change
                        </h4>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            data.policies.dateChange.allowed
                              ? "text-blue-600"
                              : "text-rose-600"
                          }`}
                        >
                          {data.policies.dateChange.allowed
                            ? "Changeable"
                            : "Non-Changeable"}
                        </p>
                      </div>
                    </div>

                    {data.policies.dateChange.allowed && (
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 font-medium uppercase">
                          Penalty Fee
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {data.policies.dateChange.penalty}
                        </span>

                        {!data.policies.dateChange.penalty.includes(
                          data.finance.currency
                        ) && (
                          <span className="block text-[10px] text-amber-600 mt-0.5 font-medium">
                            *Converted at payment
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`rounded-xl p-3.5 text-sm mb-3 border ${
                      data.policies.dateChange.allowed
                        ? "bg-blue-50/50 border-blue-100/50 text-blue-800"
                        : "bg-rose-50/50 border-rose-100/50 text-rose-800"
                    }`}
                  >
                    {data.policies.dateChange.allowed
                      ? "Date change is permitted. Fare difference + Penalty fee will apply."
                      : "Flight dates cannot be modified for this booking class."}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Processing Time:{" "}
                      <span className="font-medium text-gray-700">
                        {data.policies.dateChange.timeline ||
                          "Instant / 24 Hours"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Right Column (Summary & Actions) --- */}
          <div className="space-y-6">
            {/* 1. Payment Summary */}
            <div className="sticky top-6 rounded-2xl border border-gray-200/80 bg-white/90 p-6 shadow-xl shadow-gray-200/40 backdrop-blur">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Payment
                    </p>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Order summary
                    </h3>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    {data.finance.currency}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center text-sm text-gray-500 border-b pb-2 border-gray-100/60 gap-2">
                  <span>Payment Status</span>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={data.paymentStatus} />
                    {(data.status === "cancelled" ||
                      data.paymentStatus === "refunded") && (
                      <button
                        onClick={() => setRefundModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Refund details
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Base Fare</span>
                  <span>
                    {data.finance.currency}{" "}
                    {data.finance.duffelTotal}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxes &amp; Fees / Markup</span>
                  <span>
                    {data.finance.currency}{" "}
                    {data.finance.yourMarkup}
                  </span>
                </div>
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      {data.status === "held"
                        ? "To be charged"
                        : "Total paid"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                      {data.status === "held"
                        ? "Pending issue"
                        : "Ticket issued"}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {data.finance.currency}{" "}
                      {data.finance.clientTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Masked Card Info */}
              {data.paymentSource && (
                <div className="relative overflow-hidden rounded-xl bg-slate-900 text-slate-300 shadow-lg shadow-slate-200 mb-6 transition-all hover:shadow-xl hover:shadow-slate-300">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-slate-800/50 blur-2xl -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-blue-900/20 blur-xl -ml-10 -mb-10" />

                  <div className="relative px-5 py-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-600/30 grid grid-cols-2 gap-[1px] p-[2px] opacity-90">
                          <div className="border-r border-amber-700/40 h-full" />
                          <div className="h-full" />
                        </div>
                        <Wifi className="w-4 h-4 text-slate-600 rotate-90" />
                      </div>

                      <button
                        onClick={() => setShowCard(!showCard)}
                        className="group flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 hover:bg-slate-800 text-[10px] font-medium transition-colors cursor-pointer border border-slate-700/50"
                      >
                        <span className="text-slate-400 group-hover:text-white transition-colors">
                          {showCard ? "Hide" : "Show"}
                        </span>
                        {showCard ? (
                          <EyeOff className="w-3 h-3 text-slate-400 group-hover:text-white" />
                        ) : (
                          <Eye className="w-3 h-3 text-slate-400 group-hover:text-white" />
                        )}
                      </button>
                    </div>

                    <div className="mb-4 pl-1">
                      <p className="font-mono text-lg md:text-xl tracking-widest text-white drop-shadow-sm">
                        {showCard
                          ? data.paymentSource.cardNumber
                              .match(/.{1,4}/g)
                              ?.join(" ") ||
                            data.paymentSource.cardNumber
                          : `•••• •••• •••• ${data.paymentSource.cardNumber.slice(
                              -4
                            )}`}
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-slate-800/50 pt-2">
                      <div className="space-y-0.5">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                          Holder
                        </p>
                        <p className="text-xs font-medium text-slate-200 uppercase truncate max-w-[140px]">
                          {data.paymentSource.holderName ||
                            "CLIENT"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-0.5">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                          Expires
                        </p>
                        <p className="text-xs font-mono font-medium text-amber-50">
                          {data.paymentSource.expiryDate ||
                            "MM/YY"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Action Buttons */}
              <div className="space-y-3">
                {data.status === "issued" ? (
                  <>
                    {eTicketDoc?.url && (
                      <a
                        href={eTicketDoc.url}
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download
                        E-Ticket
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        disabled={
                          !canChange ||
                          !data.policies.dateChange.allowed
                        }
                        className={`py-2.5 px-3 border rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                          canChange &&
                          data.policies.dateChange.allowed
                            ? "border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 opacity-60"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />{" "}
                        Reschedule
                      </button>

                      <button
                        disabled={
                          !canCancel ||
                          !data.policies.cancellation.allowed
                        }
                        onClick={() => {
                          const confirm = window.confirm(
                            "Are you sure you want to cancel this ticket? Standard airline fees will apply."
                          );
                          if (confirm) {
                            toast.info(
                              "Cancellation request sent to admin."
                            );
                          }
                        }}
                        className={`py-2.5 px-3 border rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
                          canCancel &&
                          data.policies.cancellation.allowed
                            ? "border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                            : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 opacity-60"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>

                    {(!data.policies.cancellation.allowed ||
                      !data.policies.dateChange.allowed) && (
                      <div className="text-[10px] text-center text-gray-400 mt-2 bg-gray-50 py-1.5 rounded border border-gray-100">
                        {!data.policies.cancellation.allowed &&
                        !data.policies.dateChange.allowed
                          ? "This ticket is Non-Refundable & Non-Changeable."
                          : !data.policies.cancellation.allowed
                          ? "Cancellation is not allowed for this ticket."
                          : "Date change is not allowed for this ticket."}
                      </div>
                    )}
                  </>
                ) : data.status === "held" ? (
                  <button
                    onClick={() => {
                      setIssueModalOpen(true);
                      setPaymentMethod("balance");
                      setCvv("");
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-xl shadow-gray-200 cursor-pointer"
                  >
                    Issue Ticket{" "}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-center text-xs text-gray-500">
                    This booking is {data.status}. No actions
                    available.
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="mt-5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-600 flex gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-[2px]" />
                <div>
                  <span className="font-semibold text-gray-800">
                    Admin notes:
                  </span>{" "}
                  {data.adminNotes && data.adminNotes.trim().length > 0 ? (
                    <span>{data.adminNotes}</span>
                  ) : (
                    <span className="text-gray-400">
                      No admin notes added for this booking.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


{/* REFUND DETAILS MODAL */}
{refundModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-2 py-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Refund details
          </p>
          <h3 className="mt-1 text-sm font-bold text-slate-900">
            {data?.bookingRef} • {data?.pnr}
          </h3>
        </div>
        <button
          onClick={() => setRefundModalOpen(false)}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:shadow-sm"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs text-slate-800">
        {!refundData ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>No local refund information found.</p>
            <button
              onClick={refreshRefundFromAirline}
              disabled={refundLoading}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              {refundLoading && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Refresh from airline
            </button>
          </div>
        ) : (
          (() => {
            const raw: any = (refundData as any).raw || {};
            const refundCurrency =
              refundData.refund_currency || data?.finance.currency;

            // refund_to mapping
            const refundTargetLabel = (() => {
              const t = raw.refund_to;
              if (t === "balance") return "Agency Duffel balance";
              if (t === "card") return "Customer card (original payment method)";
              if (t === "voucher") return "Airline voucher / credit";
              if (!t) return "Unknown target";
              return String(t);
            })();

            const createdAt = raw.created_at
              ? format(parseISO(raw.created_at), "dd MMM yyyy, hh:mm a")
              : null;

            const confirmedAt =
              refundData.refunded_at || raw.confirmed_at
                ? format(
                    parseISO(
                      refundData.refunded_at || raw.confirmed_at,
                    ),
                    "dd MMM yyyy, hh:mm a",
                  )
                : null;

            const expiresAt = raw.expires_at
              ? format(parseISO(raw.expires_at), "dd MMM yyyy, hh:mm a")
              : null;

            // Net refund (refund - penalty)
            const numericRefund = refundData.refund_amount
              ? Number(refundData.refund_amount)
              : null;
            const numericPenalty = refundData.penalty_amount
              ? Number(refundData.penalty_amount)
              : null;
            const netRefund =
              numericRefund != null
                ? numericRefund - (numericPenalty || 0)
                : null;

            return (
              <>
                {/* Top badges */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-100">
                    <AlertCircle className="h-3 w-3" />
                    Cancelled booking
                  </span>
                  {refundData.refunded_at ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                      <CheckCircle className="h-3 w-3" />
                      Refunded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                      <Clock className="h-3 w-3" />
                      Pending refund
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                      Refund amount
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {refundData.refund_amount
                        ? `${refundCurrency} ${refundData.refund_amount}`
                        : "N/A"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Refunded back to:{" "}
                      <span className="font-semibold text-slate-700">
                        {refundTargetLabel}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
                      Penalty / fee
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {refundData.penalty_amount
                        ? `${refundData.penalty_currency || refundCurrency} ${refundData.penalty_amount}`
                        : "N/A"}
                    </p>
                    {netRefund != null && (
                      <p className="text-[10px] text-emerald-700 mt-0.5">
                        Net back to you:{" "}
                        <span className="font-semibold">
                          {refundCurrency}{" "}
                          {netRefund.toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-2 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-600">
                      Cancelled at:
                    </span>{" "}
                    {refundData.cancelled_at
                      ? format(
                          parseISO(refundData.cancelled_at),
                          "dd MMM yyyy, hh:mm a",
                        )
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">
                      Refund created:
                    </span>{" "}
                    {createdAt || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">
                      Refund status:
                    </span>{" "}
                    {confirmedAt
                      ? `Completed on ${confirmedAt}`
                      : "In progress (7–15 working days)"}
                  </p>
                  {expiresAt && !confirmedAt && (
                    <p className="text-[10px] text-slate-500">
                      Airline refund quote valid until:{" "}
                      <span className="font-semibold text-slate-700">
                        {expiresAt}
                      </span>
                    </p>
                  )}
                </div>

                {/* Technical details */}
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-1 text-[10px] text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-600">
                      Refund ID:
                    </span>{" "}
                    {raw.id || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">
                      Order ID:
                    </span>{" "}
                    {raw.order_id || data?.duffelOrderId || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">
                      Mode:
                    </span>{" "}
                    {raw.live_mode === false ? "TEST / Sandbox" : "LIVE"}
                  </p>
                  {Array.isArray(raw.airline_credits) &&
                    raw.airline_credits.length > 0 && (
                      <p className="text-[10px] text-slate-600">
                        Airline credits issued (
                        {raw.airline_credits.length} item
                        {raw.airline_credits.length > 1 ? "s" : ""})
                      </p>
                    )}
                </div>

                <button
                  onClick={refreshRefundFromAirline}
                  disabled={refundLoading}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                >
                  {refundLoading && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Refresh from airline
                </button>
              </>
            );
          })()
        )}
      </div>
    </div>
  </div>
)}


      {/* ISSUE TICKET MODAL */}
      {issueModalOpen && data && (
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
                  PNR:{" "}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                    {data.pnr}
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

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {/* Amount summary */}
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Total amount
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-slate-600">
                    {paymentMethod === "balance"
                      ? "Using agency balance"
                      : paymentMethod === "stripe"
                      ? "Client pays via Stripe"
                      : "Charging stored client card"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    {data.finance.currency}{" "}
                    {paymentMethod === "balance"
                      ? data.finance.duffelTotal
                      : data.finance.clientTotal}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Taxes & fees included
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* OPTION 1: Stripe */}
                <div
                  onClick={() => setPaymentMethod("stripe")}
                  className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                    paymentMethod === "stripe"
                      ? "border-indigo-500/80 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
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

                    {paymentMethod === "stripe" && (
                      <div
                        className="mt-2 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StripeWrapper
                          amount={Number(data.finance.clientTotal)}
                          bookingId={data.id as any}
                          bookRef={data.bookingRef}
                          cardInfo={{
                            holderName: data.paymentSource?.holderName,
                            cardNumber: data.paymentSource?.cardNumber,
                            expiryDate: data.paymentSource?.expiryDate,
                            zipCode:
                              data.paymentSource?.billingAddress?.zipCode,
                          }}
                          onSuccess={() => {
                            setIssueModalOpen(false);
                            fetchBooking();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* OPTION 2: Duffel Balance */}
                <div
                  onClick={() => setPaymentMethod("balance")}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all ${
                    paymentMethod === "balance"
                      ? "border-slate-600/80 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        paymentMethod === "balance"
                          ? "border-slate-700"
                          : "border-slate-300"
                      }`}
                    >
                      {paymentMethod === "balance" && (
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
                            Deduct directly from your agency wallet. Good for
                            net fares or corporate bookings.
                          </p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Wallet size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stored card option চাইলে এখানে আবার আনতে পারো */}
              </div>

              {/* Warning */}
              <div className="mt-4 flex gap-2.5 rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-2.5">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-orange-500"
                />
                <p className="text-[11px] leading-relaxed text-orange-900">
                  Confirming this action will immediately issue the ticket and
                  charge the selected source. This cannot be undone and airline
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
                disabled={
                  isProcessing ||
                  paymentMethod === "stripe" ||
                  (paymentMethod === "card" && cvv.length < 3)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isProcessing && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isProcessing ? "Processing..." : "Confirm & Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}