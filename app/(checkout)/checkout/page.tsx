'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Mail,
    Lock,
    AlertCircle,
    Loader2,
    CreditCard,
    Clock,
    CheckCircle,
    Ban,
    Plane,
    Phone,
    Timer,
    RefreshCcw,
    ShieldCheck,
    ArrowRight,
    Users,
    ChevronRight,
    Globe,
    Shield,
    X,
    Check,
    AlertTriangle,
    Hourglass,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState, useMemo, Suspense } from 'react';
import axios from 'axios';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input.css';

import { PaymentForm } from './components/PaymentForm';
import { BookingFormData, bookingSchema } from './utils/validation';
import { PassengerForm } from './components/PassengerForm';
import { BookingSummary } from './components/BookingSummary';
import { websiteDetails } from '@/constant/data';
import { toast } from 'sonner';

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');
const getDayDiff = (dep: string, arr: string) => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? diff : 0;
};

// ──────────────────────────────────────────────
// STEP INDICATOR
// ──────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: 'Review', icon: Plane },
        { id: 2, label: 'Passenger Details', icon: Users },
        { id: 3, label: 'Payment Details', icon: CreditCard },
    ];

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                const StepIcon = step.icon;

                return (
                    <div key={step.id} className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                                className={`
                                    relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl
                                    flex items-center justify-center
                                    transition-all duration-500 ease-out
                                    ${
                                        isDone
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-200/60'
                                            : isActive
                                              ? 'bg-gradient-to-br from-gray-800 to-gray-950 text-white shadow-2xl shadow-gray-300/50 ring-2 ring-gray-900/5'
                                              : 'bg-gray-100/80 text-gray-400'
                                    }
                                `}
                            >
                                {isDone ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : (
                                    <StepIcon className="w-3.5 h-3.5" />
                                )}
                                {isActive && (
                                    <span className="absolute -inset-1 rounded-xl border-2 border-gray-900/10 animate-pulse" />
                                )}
                            </div>
                            <span
                                className={`
                                    text-[10px] font-extrabold uppercase tracking-[0.15em] hidden sm:block
                                    transition-colors duration-300
                                    ${
                                        isDone
                                            ? 'text-emerald-600'
                                            : isActive
                                              ? 'text-gray-900'
                                              : 'text-gray-400'
                                    }
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="relative w-6 sm:w-12 h-[2px] mx-1 rounded-full overflow-hidden bg-gray-200">
                                <div
                                    className={`
                                        absolute inset-y-0 left-0 rounded-full
                                        transition-all duration-700 ease-out
                                        ${isDone ? 'w-full bg-gradient-to-r from-emerald-400 to-emerald-500' : 'w-0'}
                                    `}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ──────────────────────────────────────────────
// COUNTDOWN TIMER
// ──────────────────────────────────────────────
const CountdownTimer = ({ timeLeft, isUrgent }: { timeLeft: string; isUrgent: boolean }) => (
    <div
        className={`
            group flex items-center gap-3 px-4 py-2.5 rounded-2xl
            border backdrop-blur-sm
            transition-all duration-500 ease-out
            ${
                isUrgent
                    ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/80 shadow-2xl shadow-red-100/60 animate-pulse'
                    : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700/50 shadow-xl shadow-gray-900/20'
            }
        `}
    >
        <div
            className={`
                relative w-8 h-8 rounded-xl flex items-center justify-center
                transition-colors duration-300
                ${isUrgent ? 'bg-red-100/80' : 'bg-white/10'}
            `}
        >
            <Timer
                className={`w-4 h-4 ${isUrgent ? 'text-red-600 animate-bounce' : 'text-rose-400'}`}
            />
            {isUrgent && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
        </div>
        <div>
            <p
                className={`
                    text-[8px] font-extrabold uppercase tracking-[0.2em]
                    leading-none mb-1
                    ${isUrgent ? 'text-red-400' : 'text-gray-500'}
                `}
            >
                {isUrgent ? '⚠ Expiring Soon' : 'Price Expires In'}
            </p>
            <p
                className={`
                    text-lg font-mono font-black leading-none tabular-nums
                    ${isUrgent ? 'text-red-700' : 'text-white'}
                `}
            >
                {timeLeft}
            </p>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// SECTION WRAPPER
// ──────────────────────────────────────────────
const SectionCard = ({
    icon: Icon,
    iconColor = 'text-rose-500',
    iconBg = 'bg-rose-50',
    title,
    subtitle,
    badge,
    children,
}: {
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div
        className="
            group/card bg-white rounded-xl
            border border-gray-200/70
            transition-shadow duration-500
            overflow-hidden
        "
    >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gray-200/80 to-transparent" />

        <div className="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center
                        ${iconBg} ${iconColor}
                        shadow-2xl shadow-gray-100 transition-transform duration-300
                        group-hover/card:scale-105
                    `}
                >
                    <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight tracking-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {badge}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ──────────────────────────────────────────────
// FLIGHT SEGMENT
// ──────────────────────────────────────────────
const FlightSegmentCard = ({ seg }: { seg: any }) => (
    <div className="group/seg">
        {seg.layover && (
            <div className="my-4 ml-5 pl-5 border-l-2 border-dashed border-amber-300/60">
                <div
                    className="
                        inline-flex items-center gap-2.5
                        px-3.5 py-2 rounded-xl
                        bg-gradient-to-r from-amber-50 to-orange-50
                        border border-amber-200/60 text-amber-700
                    shadow-2xl shadow-gray-100
                    "
                >
                    <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="text-[11px] font-bold">
                        {seg.layover} layover in {seg.departure.airport}
                    </span>
                </div>
            </div>
        )}

        <div className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center pt-2 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-gray-800 bg-white shadow-md shadow-gray-200/50 ring-2 ring-gray-100" />
                <div className="w-[2px] flex-1 bg-gradient-to-b from-gray-400 via-gray-300 to-gray-200 my-1 min-h-[60px]" />
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-gray-400 bg-white shadow-md shadow-gray-200/50 ring-2 ring-gray-100" />
            </div>

            <div className="flex-1 pb-5">
                {/* Departure */}
                <div className="flex items-start justify-between mb-1.5">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-base font-black text-gray-900 tracking-tight">
                                {formatTime(seg.departure.time)}
                            </span>
                            <span className="w-px h-4 bg-gray-200" />
                            <span className="text-sm font-bold text-gray-700">
                                {seg.departure.city}
                            </span>
                            <span
                                className="
                                    text-[10px] font-bold text-gray-500 
                                    bg-gray-100 px-1.5 py-0.5 rounded-md
                                "
                            >
                                {seg.departure.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-gray-500">
                                {formatDate(seg.departure.time)}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400 font-medium">
                                {seg.departure.airport}
                            </span>
                            {seg.departure.terminal && (
                                <span
                                    className="
                                        text-[9px] font-bold text-emerald-700 
                                        bg-emerald-50 px-2 py-0.5 rounded-md 
                                        border border-emerald-100
                                    "
                                >
                                    Terminal {seg.departure.terminal}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0">
                        {seg.logo && (
                            <div
                                className="
                                    w-9 h-9 rounded-xl bg-gray-50 
                                    border border-gray-100 
                                    flex items-center justify-center p-1
                                    shadow-2xl shadow-gray-100
                                "
                            >
                                <img
                                    src={seg.logo}
                                    alt={seg.airline}
                                    className="w-6 h-6 object-contain"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Duration Bar */}
                <div
                    className="
                        my-3.5 py-2.5 px-4 rounded-xl
                        bg-gradient-to-r from-gray-50 to-slate-50
                        border border-gray-100/80
                        flex items-center justify-between flex-wrap gap-2
                        group-hover/seg:from-gray-100/50 group-hover/seg:to-slate-100/50
                        transition-colors duration-300
                    "
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center  shadow-2xl shadow-gray-100">
                            <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-[12px] font-extrabold text-gray-700">{seg.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                        <span className="font-bold text-gray-500">{seg.airline}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="font-mono font-bold text-gray-600">{seg.flightNumber}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span>{seg.aircraft}</span>
                    </div>
                </div>

                {/* Arrival */}
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-black text-gray-900 tracking-tight">
                            {formatTime(seg.arrival.time)}
                        </span>
                        {getDayDiff(seg.departure.time, seg.arrival.time) > 0 && (
                            <span
                                className="
                                    text-[9px] font-extrabold text-rose-600 
                                    bg-rose-50 px-2 py-0.5 rounded-md 
                                    border border-rose-100
                                    animate-pulse
                                "
                            >
                                +{getDayDiff(seg.departure.time, seg.arrival.time)} Day
                            </span>
                        )}
                        <span className="w-px h-4 bg-gray-200" />
                        <span className="text-sm font-bold text-gray-700">{seg.arrival.city}</span>
                        <span
                            className="
                                text-[10px] font-bold text-gray-500 
                                bg-gray-100 px-1.5 py-0.5 rounded-md
                            "
                        >
                            {seg.arrival.code}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-gray-500">
                            {formatDate(seg.arrival.time)}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] text-gray-400 font-medium">
                            {seg.arrival.airport}
                        </span>
                        {seg.arrival.terminal && (
                            <span
                                className="
                                    text-[9px] font-bold text-emerald-700 
                                    bg-emerald-50 px-2 py-0.5 rounded-md 
                                    border border-emerald-100
                                "
                            >
                                Terminal {seg.arrival.terminal}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// EXPIRATION MODAL
// ──────────────────────────────────────────────
const ExpirationModal = ({ isOpen, onRefresh }: { isOpen: boolean; onRefresh: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-2xl animate-in fade-in duration-500" />
            <div className="relative w-full max-w-[420px] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-b from-amber-300/30 via-rose-300/20 to-amber-300/30 blur-lg" />
                <div className="relative bg-white rounded-[2rem] border border-gray-100/80 shadow-2xl overflow-hidden">
                    {/* Top gradient bar */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400" />

                    <div className="p-10 text-center">
                        {/* Animated icon */}
                        <div className="relative mx-auto mb-7 w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-2 border-amber-200/50 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-amber-200/30 animate-pulse" />
                            <div
                                className="
                                    relative w-full h-full rounded-full
                                    bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100
                                    border border-amber-200/40
                                    flex items-center justify-center
                                    shadow-xl shadow-amber-100/60
                                "
                            >
                                <Hourglass className="w-10 h-10 text-amber-600 animate-pulse" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                            Session Expired
                        </h2>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10 max-w-[300px] mx-auto">
                            The time limit for this offer has passed. Please search again for latest
                            availability.
                        </p>

                        <button
                            onClick={onRefresh}
                            className="
                                group w-full py-4 px-6
                                bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
                                hover:from-gray-800 hover:via-gray-700 hover:to-gray-800
                                text-white font-bold text-sm rounded-2xl
                                shadow-xl shadow-gray-900/25
                                flex items-center justify-center gap-2.5
                                transition-all duration-300 active:scale-[0.97] cursor-pointer
                            "
                        >
                            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                            Search Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// PAYMENT MODAL
// ──────────────────────────────────────────────
const PaymentModal = ({
    isOpen,
    onClose,
    onConfirm,
    isInstantPayment,
    price,
    isProcessing,
    flightData,
    formData,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isInstantPayment: boolean;
    price: string;
    isProcessing: boolean;
    flightData: any;
    formData: BookingFormData | null;
}) => {
    if (!isOpen || !flightData || !formData) return null;

    const firstSegment = flightData?.itinerary[0]?.segments[0];
    const lastSeg = flightData?.itinerary[0]?.segments[flightData.itinerary[0].segments.length - 1];
    const departureCode = firstSegment?.departure?.code || 'DEP';
    const arrivalCode = lastSeg?.arrival?.code || 'ARR';
    const flightDate = firstSegment?.departure?.time
        ? format(parseISO(firstSegment.departure.time), 'dd MMM yyyy')
        : '';

    const cardNumber = formData?.payment?.cardNumber || '';
    const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
    const cardBrand = /^4/.test(cardNumber)
        ? 'Visa'
        : /^5/.test(cardNumber)
          ? 'Mastercard'
          : 'Card';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-950/60 backdrop-blur-lg animate-in fade-in duration-300"
                onClick={!isProcessing ? onClose : undefined}
            />
            <div className="relative w-full max-w-[440px] animate-in zoom-in-95 slide-in-from-bottom-6 duration-400">
                {/* Outer glow */}
                <div
                    className={`
                        absolute -inset-1 rounded-[2rem] blur-lg
                        ${isInstantPayment
                            ? 'bg-gradient-to-b from-rose-300/20 to-rose-400/20'
                            : 'bg-gradient-to-b from-gray-300/20 to-gray-400/20'
                        }
                    `}
                />
                <div className="relative bg-white rounded-[1.75rem] shadow-2xl border border-gray-100/80 overflow-hidden">
                    {/* Top bar */}
                    <div
                        className={`h-1.5 ${
                            isInstantPayment
                                ? 'bg-gradient-to-r from-rose-400 via-red-500 to-rose-400'
                                : 'bg-gradient-to-r from-gray-600 via-gray-900 to-gray-600'
                        }`}
                    />

                    {/* Header */}
                    <div className="p-7 pb-5 text-center">
                        <div
                            className={`
                                w-16 h-16 mx-auto rounded-2xl
                                flex items-center justify-center mb-5
                                shadow-2xl
                                ${
                                    isInstantPayment
                                        ? 'bg-gradient-to-br from-rose-50 to-red-100 text-rose-500 shadow-rose-100/60'
                                        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 shadow-gray-100/60'
                                }
                            `}
                        >
                            {isInstantPayment ? (
                                <CreditCard className="w-7 h-7" />
                            ) : (
                                <ShieldCheck className="w-7 h-7" />
                            )}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            {isInstantPayment ? 'Confirm Payment' : 'Complete Booking'}
                        </h3>
                        <div className="flex items-center justify-center gap-1.5 mt-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Lock className="w-2.5 h-2.5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 tracking-wide">
                                256-bit SSL Encrypted
                            </span>
                        </div>
                    </div>

                    {/* Review Cards */}
                    <div className="px-6 pb-5 space-y-3">
                        {/* Flight info */}
                        <div
                            className="
                                bg-gradient-to-r from-gray-50 to-slate-50 
                                border border-gray-100/80 rounded-2xl p-4 
                                flex items-center justify-between
                                hover:from-gray-100/50 hover:to-slate-100/50
                                transition-colors duration-300
                            "
                        >
                            <div className="flex items-center gap-3.5">
                                <div
                                    className="
                                        w-10 h-10 rounded-xl 
                                        bg-gradient-to-br from-blue-50 to-indigo-50 
                                        text-blue-600 
                                        flex items-center justify-center
                                        shadow-2xl shadow-gray-100 border border-blue-100/50
                                    "
                                >
                                    <Plane className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                                        {departureCode}
                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                        {arrivalCode}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                        {flightDate}
                                    </div>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                        </div>

                        {/* Card info */}
                        <div
                            className="
                                bg-gradient-to-r from-gray-50 to-slate-50 
                                border border-gray-100/80 rounded-2xl p-4 
                                flex items-center justify-between
                            "
                        >
                            <div className="flex items-center gap-3.5">
                                <div
                                    className="
                                        w-10 h-10 rounded-xl 
                                        bg-gradient-to-br from-gray-50 to-gray-100 
                                        text-gray-600 
                                        flex items-center justify-center
                                        shadow-2xl shadow-gray-100 border border-gray-100/50
                                    "
                                >
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-gray-800">
                                        {cardBrand} •••• {lastFour || '0000'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                                        Payment Method
                                    </div>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                        </div>

                        {/* Email notice */}
                        <div
                            className="
                                bg-gradient-to-r from-emerald-50/80 to-teal-50/80 
                                border border-emerald-100/60 rounded-2xl p-4 
                                flex items-start gap-3
                            "
                        >
                            <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center shrink-0 mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                You will receive a <strong>confirmation email</strong> with your
                                e-ticket and full itinerary shortly after booking.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gradient-to-t from-gray-50/80 to-white border-t border-gray-100/60">
                        <div className="flex justify-between items-end mb-6 px-1">
                            <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                    Total Amount
                                </span>
                            </div>
                            <span className="text-3xl font-black text-gray-900 tracking-tight">
                                {price}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="
                                    py-3.5 rounded-2xl bg-white border border-gray-200/80
                                    font-bold text-gray-500 hover:bg-gray-50
                                    hover:text-gray-700 hover:border-gray-300
                                    transition-all duration-200 text-sm
                                    cursor-pointer disabled:opacity-50
                                   shadow-2xl shadow-gray-100
                                "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className={`
                                    py-3.5 rounded-2xl font-bold text-white
                                    flex items-center justify-center gap-2
                                    transition-all duration-200 active:scale-[0.97] text-sm
                                    cursor-pointer disabled:opacity-70
                                    ${
                                        isInstantPayment
                                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-2xl shadow-rose-200/50'
                                            : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 shadow-2xl shadow-gray-300/50'
                                    }
                                `}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isInstantPayment ? (
                                    'Pay Now'
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// INSTANT PAYMENT BLOCK
// ──────────────────────────────────────────────
const InstantPaymentBlock = ({
    onWhatsApp,
    onSearch,
}: {
    onWhatsApp: () => void;
    onSearch: () => void;
}) => (
    <SectionCard
        icon={AlertTriangle}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="Instant Payment Required"
        subtitle="This flight requires immediate payment"
    >
        <div className="text-center py-6">
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-rose-100/50 rounded-full animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-rose-50 to-red-100 rounded-full flex items-center justify-center shadow-2xl shadow-rose-100/50">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-red-200 rounded-full flex items-center justify-center">
                        <Ban className="w-8 h-8 text-rose-500" />
                    </div>
                </div>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2.5 tracking-tight">
                Online Booking Unavailable
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                This flight cannot be held online. Please contact our support team for immediate
                assistance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={onWhatsApp}
                    className="
                        flex items-center justify-center gap-2.5
                        px-7 py-4 rounded-2xl font-bold text-sm
                        bg-gradient-to-r from-emerald-500 to-emerald-600 
                        text-white hover:from-emerald-600 hover:to-emerald-700
                        shadow-2xl shadow-emerald-200/50
                        transition-all duration-200 active:scale-[0.97] cursor-pointer
                    "
                >
                    <Phone className="w-4 h-4" />
                    Book via WhatsApp
                </button>
                <button
                    onClick={onSearch}
                    className="
                        px-7 py-4 rounded-2xl font-bold text-sm
                        bg-gray-100 text-gray-700 hover:bg-gray-200
                        transition-all duration-200 cursor-pointer
                    "
                >
                    Search Other Flights
                </button>
            </div>
        </div>
    </SectionCard>
);

// ──────────────────────────────────────────────
// LOADING & ERROR
// ──────────────────────────────────────────────
const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200/60" />
                <div className="absolute inset-0 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border border-gray-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Plane className="w-6 h-6 text-gray-400 animate-pulse" />
                </div>
            </div>
            <p className="text-sm font-bold text-gray-500">Loading flight details...</p>
            <p className="text-[11px] text-gray-400 mt-1.5">Please wait a moment</p>
        </div>
    </div>
);

const ErrorState = ({ message, onBack }: { message: string; onBack: () => void }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-gray-100/80 p-10 text-center">
            <div
                className="
                    w-20 h-20 mx-auto mb-6 rounded-2xl
                    bg-gradient-to-br from-red-50 to-rose-100
                    flex items-center justify-center
                    shadow-2xl shadow-red-100/40
                "
            >
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2.5 tracking-tight">
                Access Denied
            </h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
            <button
                onClick={onBack}
                className="
                    px-8 py-3.5 
                    bg-gradient-to-r from-gray-800 to-gray-900 
                    text-white rounded-2xl
                    font-bold text-sm 
                    hover:from-gray-700 hover:to-gray-800
                    shadow-2xl shadow-gray-200/50
                    transition-all duration-200 cursor-pointer active:scale-[0.97]
                "
            >
                Search Again
            </button>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// MAIN CHECKOUT CONTENT
// ──────────────────────────────────────────────
function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const offerId = searchParams.get('offer_id');
    const adultsCount = parseInt(searchParams.get('adt') || '0');
    const childrenCount = parseInt(searchParams.get('chd') || '0');
    const infantsCount = parseInt(searchParams.get('inf') || '0');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [flightData, setFlightData] = useState<any>(null);
    const [fetchError, setFetchError] = useState('');

    const [timeLeft, setTimeLeft] = useState('--:--');
    const [isExpired, setIsExpired] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
        setValue,
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            contact: { email: '', phone: '' },
            passengers: [],
            payment: {
                cardName: '',
                cardNumber: '',
                expiryDate: '',
                billingAddress: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'US',
                },
            },
        },
    });

    // Fetch
    useEffect(() => {
        if (!offerId) {
            setFetchError('Invalid Offer ID.');
            setIsLoading(false);
            return;
        }

        const getFlightDetails = async () => {
            try {
                const response = await axios.get('/api/duffel/get-offer', {
                    params: { offer_id: offerId },
                });
                const result = response.data;
                if (!result.success) throw new Error(result.message);
                const data = result.data;

                const apiAdults = data.passengers.filter((p: any) => p.type === 'adult').length;
                const apiChildren = data.passengers.filter((p: any) => p.type === 'child').length;
                const apiInfants = data.passengers.filter(
                    (p: any) => p.type === 'infant_without_seat',
                ).length;

                if (
                    apiAdults !== adultsCount ||
                    apiChildren !== childrenCount ||
                    apiInfants !== infantsCount
                ) {
                    throw new Error('Security Mismatch: Please search again.');
                }

                setFlightData(data);
                reset({
                    contact: { email: '', phone: '' },
                    payment: {
                        cardName: '',
                        cardNumber: '',
                        expiryDate: '',
                        billingAddress: {
                            street: '',
                            city: '',
                            zipCode: '',
                            country: 'US',
                            state: '',
                        },
                    },
                    passengers: data.passengers.map((p: any) => ({
                        id: p.id,
                        type: p.type,
                        gender: 'male',
                        firstName: '',
                        lastName: '',
                        dob: '',
                        passportNumber: '',
                        passportExpiry: '',
                        middleName: '',
                        passportCountry: 'US',
                    })),
                });
                setIsLoading(false);
            } catch (error: unknown) {
                let msg = 'An unexpected error occurred.';
                if (axios.isAxiosError(error)) msg = error.response?.data?.message || error.message;
                else if (error instanceof Error) msg = error.message;
                setFetchError(msg);
                setIsLoading(false);
            }
        };

        getFlightDetails();
    }, [offerId, adultsCount, childrenCount, infantsCount, reset]);

    // Timer
    useEffect(() => {
        if (!flightData?.expires_at || isExpired) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const expiry = new Date(flightData.expires_at).getTime();
            const distance = expiry - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
                setIsExpired(true);
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(
                    `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
                );
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [flightData, isExpired]);

    const isUrgent = useMemo(() => {
        const parts = timeLeft.split(':');
        const mins = parseInt(parts[0] || '99');
        return mins < 5 && timeLeft !== '--:--';
    }, [timeLeft]);

    // WhatsApp
    const handleWhatsAppRedirect = () => {
        if (!flightData) return;
        const firstSlice = flightData.itinerary[0];
        const route = [
            firstSlice.mainDeparture.city,
            '(',
            firstSlice.mainDeparture.code,
            ') to ',
            firstSlice.mainArrival.city,
            '(',
            firstSlice.mainArrival.code,
            ')',
        ].join('');
        const date = new Date(firstSlice.mainDeparture.time).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        const airline = firstSlice.mainAirline;
        const priceStr = `${flightData.price.currency} ${flightData.price.finalPrice}`;

        const message = [
            'Hello, I want to book a flight but it requires instant payment.',
            '',
            'Flight Info:',
            route,
            'Date: ' + date,
            'Airline: ' + airline,
            'Price: ' + priceStr,
            '',
            'Offer ID: ' + flightData.id,
            '',
            'Please help me proceed.',
        ].join('\n');

        const url = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const onPreSubmit: SubmitHandler<BookingFormData> = (formData) => {
        setPendingFormData(formData);
        setIsModalOpen(true);
    };

    // Confirm booking
    const handleConfirmBooking = async () => {
        if (!pendingFormData || !flightData) {
            toast.error('Session invalid. Please refresh the page.');
            return;
        }

        setIsSubmitting(true);

        const firstItinerary = flightData.itinerary[0];
        const lastItinerary = flightData.itinerary[flightData.itinerary.length - 1];
        const mainSegment = firstItinerary?.segments[0];
        const lastSegmentOfLastItinerary =
            lastItinerary?.segments[lastItinerary.segments.length - 1];

        try {
            const routeString = flightData.itinerary
                .map((slice: any) => {
                    const start = slice.segments[0].departure.code;
                    const end = slice.segments[slice.segments.length - 1].arrival.code;
                    return start + ' > ' + end;
                })
                .join(' | ');

            let tripType = 'one_way';
            if (flightData.itinerary.length === 2) tripType = 'round_trip';
            else if (flightData.itinerary.length > 2) tripType = 'multi_city';

            const flightSnapshot = {
                airline: mainSegment?.airline || 'Unknown Airline',
                flightNumber: mainSegment?.flightNumber || 'N/A',
                route: routeString,
                departureDate: mainSegment?.departure?.time,
                arrivalDate: lastSegmentOfLastItinerary?.arrival?.time,
                duration: flightData.totalDuration || firstItinerary?.totalDuration,
                flightType: tripType,
            };

            const bookingPayload = {
                offer_id: offerId,
                contact: {
                    email: pendingFormData.contact.email,
                    phone: pendingFormData.contact.phone,
                },
                passengers: pendingFormData.passengers.map((p) => ({
                    id: p.id,
                    type: p.type,
                    firstName: p.firstName,
                    lastName: p.lastName,
                    middleName: p.middleName || '',
                    gender: p.gender,
                    dob: p.dob,
                    passportNumber: p.passportNumber || '',
                    passportExpiry: p.passportExpiry || '',
                    passportCountry: p.passportCountry || 'US',
                })),
                payment: {
                    cardName: pendingFormData.payment.cardName,
                    cardNumber: pendingFormData.payment.cardNumber.replace(/\s/g, ''),
                    expiryDate: pendingFormData.payment.expiryDate,
                    billingAddress: pendingFormData.payment.billingAddress,
                },
                flight_details: flightSnapshot,
                pricing: {
                    total_amount: flightData.price.finalPrice,
                    currency: flightData.price.currency,
                    base_fare: flightData.price.basePrice || 0,
                },
            };

            const response = await axios.post('/api/duffel/booking', bookingPayload);

            if (response.data.success) {
                router.push(`/booking/success?id=${response.data.bookingId}`);
            } else {
                throw new Error(response.data.message || 'Booking failed.');
            }
        } catch (error: unknown) {
            const axiosErr = axios.isAxiosError(error) ? error.response?.data : null;
            const errorCode = axiosErr?.code || axiosErr?.errorType;
            const errorMessage =
                axiosErr?.message ||
                (error instanceof Error ? error.message : 'Something went wrong.');

            if (errorCode === 'offer_no_longer_available' || errorCode === 'OFFER_EXPIRED') {
                toast.error('Session Expired! Redirecting to fresh results...', { duration: 4000 });

                const adt = pendingFormData.passengers.filter((p) => p.type === 'adult').length;
                const chd = pendingFormData.passengers.filter((p) => p.type === 'child').length;
                const inf = pendingFormData.passengers.filter(
                    (p) => p.type === 'infant_without_seat',
                ).length;

                let currentTripType = 'one_way';
                if (flightData.itinerary.length === 2) currentTripType = 'round_trip';
                else if (flightData.itinerary.length > 2) currentTripType = 'multi_city';

                const params = new URLSearchParams({
                    type: currentTripType,
                    adt: adt.toString(),
                    chd: chd.toString(),
                    inf: inf.toString(),
                    class: 'economy',
                });

                if (currentTripType === 'multi_city') {
                    const flightsArray = flightData.itinerary.map((slice: any) => ({
                        origin: slice.segments[0].departure.code,
                        destination: slice.segments[slice.segments.length - 1].arrival.code,
                        date: slice.segments[0].departure.time.split('T')[0],
                    }));
                    params.append('flights', JSON.stringify(flightsArray));
                } else {
                    const outbound = flightData.itinerary[0];
                    params.append('origin', outbound.segments[0].departure.code);
                    params.append(
                        'destination',
                        outbound.segments[outbound.segments.length - 1].arrival.code,
                    );
                    params.append('date', outbound.segments[0].departure.time.split('T')[0]);

                    if (currentTripType === 'round_trip' && flightData.itinerary[1]) {
                        params.append(
                            'returnDate',
                            flightData.itinerary[1].segments[0].departure.time.split('T')[0],
                        );
                    }
                }

                setTimeout(() => {
                    router.push(`/flight/search?${params.toString()}`);
                }, 2500);

                return;
            }

            if (
                errorCode === 'instant_payment_required' ||
                errorCode === 'INSTANT_PAYMENT_REQUIRED'
            ) {
                toast.error('This flight requires Instant Payment. Please contact support.');
                setIsModalOpen(false);
                return;
            }

            toast.error('Booking Failed: ' + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefreshSearch = () => router.push('/flight/search');

    // --- STATES ---
    if (isLoading) return <LoadingState />;

    if ((fetchError || !flightData) && !isExpired)
        return <ErrorState message={fetchError} onBack={() => router.push('/')} />;

    const summaryCounts = flightData
        ? {
              adults: flightData.passengers.filter((p: any) => p.type === 'adult').length,
              children: flightData.passengers.filter((p: any) => p.type === 'child').length,
              infants: flightData.passengers.filter((p: any) => p.type === 'infant_without_seat')
                  .length,
          }
        : { adults: 0, children: 0, infants: 0 };

    const requiresInstantPayment =
        flightData?.payment_requirements?.requires_instant_payment ?? false;

    return (
        <>
            <ExpirationModal isOpen={isExpired} onRefresh={handleRefreshSearch} />

            <div
                className={`
                    ${isExpired ? 'blur-sm pointer-events-none select-none overflow-hidden h-screen' : ''}
                    transition-all duration-500
                `}
            >
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
                    {/* ═══════════ HEADER ═══════════ */}
                    <div
                        className="
                            bg-white/80 backdrop-blur-xl 
                            border-b border-gray-100/80 
                            sticky top-0 z-30
                            shadow-[0_1px_3px_rgba(0,0,0,0.02)]
                        "
                    >
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <div className="flex items-center justify-between h-16 md:h-[76px]">
                                <StepIndicator currentStep={2} />
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-100/50">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 tracking-wide">
                                        Secure Checkout
                                    </span>
                                </div>
                                <CountdownTimer timeLeft={timeLeft} isUrgent={isUrgent} />
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ PAGE HEADER ═══════════ */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-8">
                        <div className="relative">
                            {/* Decorative dot */}
                            <div className="absolute -left-3 top-1 w-1.5 h-10 rounded-full bg-gradient-to-b from-rose-400 to-rose-500 hidden md:block" />
                            <h1 className="text-2xl md:text-[32px] font-black text-gray-900 tracking-tight leading-tight">
                                Complete Your Booking
                            </h1>
                            <p className="text-sm text-gray-400 mt-2 flex items-center gap-2.5 font-medium flex-wrap">
                                Fill in the details below to secure your flight
                                <span
                                    className="
                                        hidden sm:inline-flex items-center gap-1.5 
                                        text-emerald-700 text-[9px] font-extrabold 
                                        bg-emerald-50 px-2.5 py-1 rounded-full 
                                        border border-emerald-100/80 
                                        uppercase tracking-[0.15em]
                                    "
                                >
                                    <Lock className="w-2.5 h-2.5" />
                                    Encrypted
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* ═══════════ MAIN CONTENT ═══════════ */}
                    {flightData && (
                        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                                {/* ─── LEFT COLUMN ─── */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* ITINERARY */}
                                    <SectionCard
                                        icon={Plane}
                                        title="Flight Itinerary"
                                        subtitle={
                                            flightData.itinerary.length +
                                            ' leg' +
                                            (flightData.itinerary.length > 1 ? 's' : '')
                                        }
                                        badge={
                                            <span
                                                className="
                                                    text-[9px] font-extrabold text-gray-500 
                                                    bg-gradient-to-r from-gray-50 to-gray-100 
                                                    px-3 py-1.5 rounded-xl 
                                                    uppercase tracking-[0.12em]
                                                    border border-gray-100
                                                "
                                            >
                                                {flightData.cabinClass || 'Economy'}
                                            </span>
                                        }
                                    >
                                        {flightData.itinerary.map((slice: any, sIdx: number) => (
                                            <div key={slice.id || sIdx}>
                                                <div className="flex items-center gap-3 mb-5">
                                                    <span
                                                        className={`
                                                            w-1.5 h-7 rounded-full
                                                            ${sIdx === 0
                                                                ? 'bg-gradient-to-b from-rose-400 to-rose-500'
                                                                : 'bg-gradient-to-b from-blue-400 to-blue-500'
                                                            }
                                                        `}
                                                    />
                                                    <span
                                                        className="
                                                            inline-flex items-center gap-2 
                                                            px-3.5 py-1.5 text-[11px] 
                                                            font-bold text-white
                                                            bg-gradient-to-r from-gray-800 to-gray-700
                                                            rounded-lg shadow-md shadow-gray-200/50
                                                            uppercase tracking-wide
                                                        "
                                                    >
                                                        <Plane className="w-3 h-3" />
                                                        {slice.direction} Journey
                                                    </span>
                                                </div>

                                                {slice.segments.map((seg: any, idx: number) => (
                                                    <FlightSegmentCard
                                                        key={seg.id || idx}
                                                        seg={seg}
                                                    />
                                                ))}

                                                {sIdx < flightData.itinerary.length - 1 && (
                                                    <div className="my-8 flex items-center justify-center relative">
                                                        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                                        <span
                                                            className="
                                                                relative bg-white px-5 py-2 
                                                                text-[10px] font-extrabold text-gray-400 
                                                                uppercase tracking-[0.2em] 
                                                                border border-gray-100 rounded-full 
                                                                 shadow-2xl shadow-gray-100
                                                            "
                                                        >
                                                            Return Flight
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </SectionCard>

                                    {/* ─── FORM ─── */}
                                    {requiresInstantPayment ? (
                                        <InstantPaymentBlock
                                            onWhatsApp={handleWhatsAppRedirect}
                                            onSearch={() => router.push('/flight/search')}
                                        />
                                    ) : (
                                        <form
                                            onSubmit={handleSubmit(onPreSubmit)}
                                            className="space-y-6"
                                        >
                                            {/* CONTACT */}
                                            <SectionCard
                                                icon={Mail}
                                                iconColor="text-blue-500"
                                                iconBg="bg-blue-50"
                                                title="Contact Details"
                                                subtitle="We will send your e-ticket here"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3" />
                                                            Email Address
                                                        </label>
                                                        <input
                                                            {...register('contact.email', {
                                                                required: 'Email is required',
                                                                pattern: {
                                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                    message: 'Invalid email',
                                                                },
                                                            })}
                                                            placeholder="ticket@example.com"
                                                            className={`
                                                                w-full p-3.5 bg-gray-50/80
                                                                border rounded-xl text-sm font-medium
                                                                focus:ring-2 focus:ring-gray-900/5
                                                                focus:border-gray-900 focus:bg-white
                                                                outline-none transition-all duration-200
                                                                placeholder:text-gray-300
                                                                ${errors.contact?.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200/80'}
                                                            `}
                                                        />
                                                        {errors.contact?.email && (
                                                            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 mt-1.5">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.contact.email.message}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3" />
                                                            Phone Number
                                                        </label>
                                                        <Controller
                                                            name="contact.phone"
                                                            control={control}
                                                            rules={{
                                                                required:
                                                                    'Phone number is required',
                                                                validate: (value) =>
                                                                    isValidPhoneNumber(
                                                                        value || '',
                                                                    ) || 'Invalid phone number',
                                                            }}
                                                            render={({
                                                                field: { onChange, value },
                                                            }) => (
                                                                <PhoneInput
                                                                    international
                                                                    defaultCountry="US"
                                                                    value={value}
                                                                    onChange={onChange}
                                                                    placeholder="Enter phone number"
                                                                    className={`PhoneInput ${errors.contact?.phone ? 'input-error' : ''}`}
                                                                />
                                                            )}
                                                        />
                                                        {errors.contact?.phone && (
                                                            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 mt-1.5">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.contact.phone.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SectionCard>

                                            {/* PASSENGERS */}
                                            {flightData.passengers.map(
                                                (passenger: any, index: number) => {
                                                    let type: 'adult' | 'child' | 'infant' =
                                                        'adult';
                                                    if (passenger.type === 'child') type = 'child';
                                                    if (passenger.type === 'infant_without_seat')
                                                        type = 'infant';
                                                    return (
                                                        <PassengerForm
                                                            key={passenger.id}
                                                            index={index}
                                                            type={type}
                                                            register={register}
                                                            errors={errors}
                                                        />
                                                    );
                                                },
                                            )}

                                            {/* PAYMENT */}
                                            <PaymentForm
                                                register={register}
                                                errors={errors}
                                                setValue={setValue}
                                            />

                                            {/* ═══════════ SUBMIT BUTTON ═══════════ */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="
                                                    group relative w-full py-5 
                                                    font-extrabold text-[13px] uppercase tracking-[0.15em]
                                                    rounded-2xl text-white overflow-hidden
                                                    bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
                                                    shadow-[0_6px_0_0_#1f2937,0_10px_30px_rgba(0,0,0,0.15)]
                                                    hover:shadow-[0_3px_0_0_#1f2937,0_8px_20px_rgba(0,0,0,0.2)]
                                                    hover:translate-y-[3px]
                                                    active:shadow-[0_0px_0_0_#1f2937,0_2px_10px_rgba(0,0,0,0.1)]
                                                    active:translate-y-[6px]
                                                    disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300
                                                    disabled:shadow-[0_3px_0_0_#9ca3af]
                                                    disabled:translate-y-0 disabled:cursor-not-allowed
                                                    transition-all duration-150 ease-out
                                                    flex items-center justify-center gap-3
                                                    cursor-pointer
                                                "
                                            >
                                                {/* Shine sweep */}
                                                <span
                                                    className="
                                                        absolute inset-0
                                                        bg-gradient-to-r from-transparent via-white/10 to-transparent
                                                        translate-x-[-200%] group-hover:translate-x-[200%]
                                                        transition-transform duration-700 ease-in-out
                                                        group-disabled:hidden
                                                    "
                                                />

                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="relative z-10 w-5 h-5 animate-spin" />
                                                        <span className="relative z-10">Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck
                                                            className="
                                                                relative z-10 w-5 h-5 text-emerald-400
                                                                group-hover:scale-110 
                                                                transition-transform duration-300
                                                            "
                                                        />
                                                        <span className="relative z-10">
                                                            Review & Confirm Booking
                                                        </span>
                                                        <ArrowRight
                                                            className="
                                                                relative z-10 w-4 h-4 
                                                                group-hover:translate-x-1.5 
                                                                transition-transform duration-300
                                                            "
                                                        />
                                                    </>
                                                )}
                                            </button>

                                            {/* ═══════════ TRUST BADGES ═══════════ */}
                                            <div className="flex items-center justify-center gap-5 sm:gap-8 pt-3">
                                                {[
                                                    { icon: Shield, label: 'SSL Secure' },
                                                    { icon: Globe, label: 'IATA Certified' },
                                                    { icon: Lock, label: 'PCI Compliant' },
                                                ].map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="
                                                            flex items-center gap-2
                                                            group/trust
                                                        "
                                                    >
                                                        <div
                                                            className="
                                                                w-5 h-5 rounded-md 
                                                                bg-gray-100/80 
                                                                flex items-center justify-center
                                                                group-hover/trust:bg-emerald-50
                                                                transition-colors duration-300
                                                            "
                                                        >
                                                            <item.icon
                                                                className="
                                                                    w-3 h-3 text-gray-400
                                                                    group-hover/trust:text-emerald-500
                                                                    transition-colors duration-300
                                                                "
                                                            />
                                                        </div>
                                                        <span
                                                            className="
                                                                text-[9px] font-bold text-gray-400 
                                                                uppercase tracking-[0.1em]
                                                                group-hover/trust:text-gray-600
                                                                transition-colors duration-300
                                                            "
                                                        >
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* ─── RIGHT COLUMN ─── */}
                                <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
                                    <BookingSummary
                                        passengers={summaryCounts}
                                        flight={flightData}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {flightData && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmBooking}
                    price={
                        flightData.price.currency +
                        ' ' +
                        flightData.price.finalPrice.toLocaleString()
                    }
                    isProcessing={isSubmitting}
                    isInstantPayment={
                        flightData?.payment_requirements?.requires_instant_payment ?? false
                    }
                    flightData={flightData}
                    formData={pendingFormData}
                />
            )}
        </>
    );
}

// ═══════════ EXPORT ═══════════
export default function CheckoutPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CheckoutContent />
        </Suspense>
    );
}