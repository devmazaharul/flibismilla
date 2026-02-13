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

// ✅ CSS file import — replaces <style jsx global>
import './phone-input.css';

import { PaymentForm } from './components/PaymentForm';
import { BookingFormData, bookingSchema } from './utils/validation';
import { PassengerForm } from './components/PassengerForm';
import { BookingSummary } from './components/BookingSummary';
import { websiteDetails } from '@/constant/data';
import { toast } from 'sonner';

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');
const getDayDiff = (dep: string, arr: string) => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? diff : 0;
};

// ----------------------------------------------------------------------
// STEP INDICATOR
// ----------------------------------------------------------------------
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: 'Review', icon: Plane },
        { id: 2, label: 'Details', icon: Users },
        { id: 3, label: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
            {steps.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                const StepIcon = step.icon;

                return (
                    <div key={step.id} className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                                className={`
                                    w-7 h-7 sm:w-8 sm:h-8 rounded-lg
                                    flex items-center justify-center
                                    transition-all duration-500
                                    ${
                                        isDone
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                            : isActive
                                              ? 'bg-gray-900 text-white shadow-lg shadow-gray-300'
                                              : 'bg-gray-100 text-gray-400'
                                    }
                                `}
                            >
                                {isDone ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : (
                                    <StepIcon className="w-3.5 h-3.5" />
                                )}
                            </div>
                            <span
                                className={`
                                    text-[11px] font-bold uppercase tracking-wider hidden sm:block
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
                            <div
                                className={`
                                    w-6 sm:w-10 h-[2px] rounded-full mx-1
                                    transition-colors duration-500
                                    ${isDone ? 'bg-emerald-300' : 'bg-gray-200'}
                                `}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ----------------------------------------------------------------------
// COUNTDOWN TIMER
// ----------------------------------------------------------------------
const CountdownTimer = ({
    timeLeft,
    isUrgent,
}: {
    timeLeft: string;
    isUrgent: boolean;
}) => (
    <div
        className={`
            flex items-center gap-3 px-4 py-2.5 rounded-2xl
            border transition-all duration-500
            ${
                isUrgent
                    ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100/50'
                    : 'bg-gray-900 border-gray-800 shadow-lg shadow-gray-200'
            }
        `}
    >
        <div
            className={`
                w-8 h-8 rounded-xl flex items-center justify-center
                ${isUrgent ? 'bg-red-100' : 'bg-white/10'}
            `}
        >
            <Timer
                className={`w-4 h-4 ${
                    isUrgent ? 'text-red-600 animate-pulse' : 'text-rose-400'
                }`}
            />
        </div>
        <div>
            <p
                className={`
                    text-[9px] font-bold uppercase tracking-[0.15em]
                    leading-none mb-1
                    ${isUrgent ? 'text-red-400' : 'text-gray-500'}
                `}
            >
                {isUrgent ? 'Expiring Soon' : 'Price Expires In'}
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

// ----------------------------------------------------------------------
// SECTION WRAPPER
// ----------------------------------------------------------------------
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
            bg-white rounded-2xl
            border border-gray-200/80
            shadow-xl shadow-gray-100/40
            overflow-hidden
        "
    >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`
                        w-9 h-9 rounded-xl flex items-center justify-center
                        ${iconBg} ${iconColor}
                    `}
                >
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {badge}
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ----------------------------------------------------------------------
// FLIGHT SEGMENT
// ----------------------------------------------------------------------
const FlightSegmentCard = ({ seg }: { seg: any }) => (
    <div className="group">
        {seg.layover && (
            <div className="my-3 ml-5 pl-5 border-l-2 border-dashed border-amber-200">
                <div
                    className="
                        inline-flex items-center gap-2
                        px-3 py-1.5 rounded-lg
                        bg-amber-50 border border-amber-100 text-amber-700
                    "
                >
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-bold">
                        {seg.layover} layover in {seg.departure.airport}
                    </span>
                </div>
            </div>
        )}

        <div className="flex gap-4">
            <div className="flex flex-col items-center pt-2 shrink-0">
                <div className="w-3 h-3 rounded-full border-[2.5px] border-gray-800 bg-white shadow-sm" />
                <div className="w-[2px] flex-1 bg-gradient-to-b from-gray-300 to-gray-200 my-1 min-h-[50px]" />
                <div className="w-3 h-3 rounded-full border-[2.5px] border-gray-400 bg-white shadow-sm" />
            </div>

            <div className="flex-1 pb-5">
                {/* Departure */}
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-black text-gray-900">
                                {formatTime(seg.departure.time)}
                            </span>
                            <span className="text-gray-200">|</span>
                            <span className="text-sm font-bold text-gray-700">
                                {seg.departure.city}
                            </span>
                            <span className="text-xs font-medium text-gray-400">
                                ({seg.departure.code})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-medium text-gray-500">
                                {formatDate(seg.departure.time)}
                            </span>
                            <span className="text-gray-200">|</span>
                            <span className="text-[10px] text-gray-400">
                                {seg.departure.airport}
                            </span>
                            {seg.departure.terminal && (
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                    T{seg.departure.terminal}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                        {seg.logo && (
                            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-0.5">
                                <img
                                    src={seg.logo}
                                    alt={seg.airline}
                                    className="w-5 h-5 object-contain"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Duration */}
                <div
                    className="
                        my-3 py-2 px-3.5 rounded-xl
                        bg-gray-50 border border-gray-100
                        flex items-center justify-between flex-wrap gap-2
                    "
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-600">
                            {seg.duration}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="font-semibold">{seg.airline}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="font-mono font-bold">
                            {seg.flightNumber}
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span>{seg.aircraft}</span>
                    </div>
                </div>

                {/* Arrival */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-black text-gray-900">
                            {formatTime(seg.arrival.time)}
                        </span>
                        {getDayDiff(seg.departure.time, seg.arrival.time) > 0 && (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                +{getDayDiff(seg.departure.time, seg.arrival.time)}
                            </span>
                        )}
                        <span className="text-gray-200">|</span>
                        <span className="text-sm font-bold text-gray-700">
                            {seg.arrival.city}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                            ({seg.arrival.code})
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-medium text-gray-500">
                            {formatDate(seg.arrival.time)}
                        </span>
                        <span className="text-gray-200">|</span>
                        <span className="text-[10px] text-gray-400">
                            {seg.arrival.airport}
                        </span>
                        {seg.arrival.terminal && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                                T{seg.arrival.terminal}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// EXPIRATION MODAL
// ----------------------------------------------------------------------
const ExpirationModal = ({
    isOpen,
    onRefresh,
}: {
    isOpen: boolean;
    onRefresh: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-xl animate-in fade-in duration-500" />
            <div className="relative w-full max-w-[400px] animate-in zoom-in-95 slide-in-from-bottom-6 duration-500">
                <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-b from-amber-200/40 to-rose-200/40 blur-sm" />
                <div className="relative bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400" />
                    <div className="p-8 text-center">
                        <div className="relative mx-auto mb-6 w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-ping" />
                            <div
                                className="
                                    relative w-full h-full rounded-full
                                    bg-gradient-to-br from-amber-50 to-amber-100
                                    border border-amber-200/50
                                    flex items-center justify-center
                                    shadow-lg shadow-amber-100/50
                                "
                            >
                                <Hourglass className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
                            Session Expired
                        </h2>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 max-w-[280px] mx-auto">
                            The time limit for this offer has passed.
                            Please search again for latest availability.
                        </p>
                        <button
                            onClick={onRefresh}
                            className="
                                group w-full py-4 px-6
                                bg-gradient-to-r from-gray-900 to-gray-800
                                hover:from-gray-800 hover:to-gray-700
                                text-white font-bold text-sm rounded-2xl
                                shadow-xl shadow-gray-900/20
                                flex items-center justify-center gap-2.5
                                transition-all active:scale-[0.98] cursor-pointer
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

// ----------------------------------------------------------------------
// PAYMENT MODAL
// ----------------------------------------------------------------------
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
    const lastSeg =
        flightData?.itinerary[0]?.segments[
            flightData.itinerary[0].segments.length - 1
        ];
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
                className="absolute inset-0 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200"
                onClick={!isProcessing ? onClose : undefined}
            />
            <div className="relative w-full max-w-[420px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div
                        className={`h-1 ${
                            isInstantPayment
                                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                : 'bg-gradient-to-r from-gray-700 to-gray-900'
                        }`}
                    />

                    {/* Header */}
                    <div className="p-6 pb-4 text-center">
                        <div
                            className={`
                                w-14 h-14 mx-auto rounded-2xl
                                flex items-center justify-center mb-4
                                ${
                                    isInstantPayment
                                        ? 'bg-rose-50 text-rose-500'
                                        : 'bg-gray-50 text-gray-700'
                                }
                            `}
                        >
                            {isInstantPayment ? (
                                <CreditCard className="w-6 h-6" />
                            ) : (
                                <ShieldCheck className="w-6 h-6" />
                            )}
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900">
                            {isInstantPayment ? 'Confirm Payment' : 'Complete Booking'}
                        </h3>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                            <Lock className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[10px] font-semibold text-gray-400">
                                256-bit SSL Encrypted
                            </span>
                        </div>
                    </div>

                    {/* Review Cards */}
                    <div className="px-5 pb-4 space-y-2.5">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Plane className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        {departureCode}
                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                        {arrivalCode}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                        {flightDate}
                                    </div>
                                </div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800">
                                        {cardBrand} **** {lastFour || '0000'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase">
                                        Payment Method
                                    </div>
                                </div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>

                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
                            <Mail className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                You will receive a <strong>confirmation email</strong> with
                                your e-ticket and full itinerary shortly after booking.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-gray-50/50 border-t border-gray-100">
                        <div className="flex justify-between items-end mb-5 px-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Total Amount
                            </span>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">
                                {price}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="
                                    py-3.5 rounded-xl bg-white border border-gray-200
                                    font-bold text-gray-500 hover:bg-gray-50
                                    hover:text-gray-700 transition-all text-sm
                                    cursor-pointer disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isProcessing}
                                className={`
                                    py-3.5 rounded-xl font-bold text-white
                                    flex items-center justify-center gap-2
                                    transition-all active:scale-[0.98] text-sm
                                    cursor-pointer disabled:opacity-70 shadow-lg
                                    ${
                                        isInstantPayment
                                            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                            : 'bg-gray-900 hover:bg-gray-800 shadow-gray-200'
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

// ----------------------------------------------------------------------
// INSTANT PAYMENT BLOCK
// ----------------------------------------------------------------------
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
        <div className="text-center py-4">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                    <Ban className="w-7 h-7 text-rose-500" />
                </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
                Online Booking Unavailable
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                This flight cannot be held online. Please contact our support
                team for immediate assistance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={onWhatsApp}
                    className="
                        flex items-center justify-center gap-2
                        px-6 py-3.5 rounded-xl font-bold text-sm
                        bg-emerald-600 text-white hover:bg-emerald-700
                        shadow-lg shadow-emerald-100
                        transition-all active:scale-[0.98] cursor-pointer
                    "
                >
                    <Phone className="w-4 h-4" />
                    Book via WhatsApp
                </button>
                <button
                    onClick={onSearch}
                    className="
                        px-6 py-3.5 rounded-xl font-bold text-sm
                        bg-gray-100 text-gray-700 hover:bg-gray-200
                        transition-all cursor-pointer
                    "
                >
                    Search Other Flights
                </button>
            </div>
        </div>
    </SectionCard>
);

// ----------------------------------------------------------------------
// LOADING & ERROR
// ----------------------------------------------------------------------
const LoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <p className="text-sm font-semibold text-gray-500">
                Loading flight details...
            </p>
        </div>
    </div>
);

const ErrorState = ({
    message,
    onBack,
}: {
    message: string;
    onBack: () => void;
}) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                Access Denied
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {message}
            </p>
            <button
                onClick={onBack}
                className="
                    px-6 py-3 bg-gray-900 text-white rounded-xl
                    font-bold text-sm hover:bg-gray-800
                    transition-all cursor-pointer active:scale-[0.98]
                "
            >
                Search Again
            </button>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// MAIN CHECKOUT CONTENT
// ----------------------------------------------------------------------
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
    const [pendingFormData, setPendingFormData] =
        useState<BookingFormData | null>(null);

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

                const apiAdults = data.passengers.filter(
                    (p: any) => p.type === 'adult'
                ).length;
                const apiChildren = data.passengers.filter(
                    (p: any) => p.type === 'child'
                ).length;
                const apiInfants = data.passengers.filter(
                    (p: any) => p.type === 'infant_without_seat'
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
                if (axios.isAxiosError(error))
                    msg = error.response?.data?.message || error.message;
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
                const minutes = Math.floor(
                    (distance % (1000 * 60 * 60)) / (1000 * 60)
                );
                const seconds = Math.floor(
                    (distance % (1000 * 60)) / 1000
                );
                setTimeLeft(
                    `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
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
        const date = new Date(
            firstSlice.mainDeparture.time
        ).toLocaleDateString('en-GB', {
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
        const lastItinerary =
            flightData.itinerary[flightData.itinerary.length - 1];
        const mainSegment = firstItinerary?.segments[0];
        const lastSegmentOfLastItinerary =
            lastItinerary?.segments[lastItinerary.segments.length - 1];

        try {
            const routeString = flightData.itinerary
                .map((slice: any) => {
                    const start = slice.segments[0].departure.code;
                    const end =
                        slice.segments[slice.segments.length - 1].arrival
                            .code;
                    return start + ' > ' + end;
                })
                .join(' | ');

            let tripType = 'one_way';
            if (flightData.itinerary.length === 2)
                tripType = 'round_trip';
            else if (flightData.itinerary.length > 2)
                tripType = 'multi_city';

            const flightSnapshot = {
                airline: mainSegment?.airline || 'Unknown Airline',
                flightNumber: mainSegment?.flightNumber || 'N/A',
                route: routeString,
                departureDate: mainSegment?.departure?.time,
                arrivalDate: lastSegmentOfLastItinerary?.arrival?.time,
                duration:
                    flightData.totalDuration ||
                    firstItinerary?.totalDuration,
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
                    cardNumber:
                        pendingFormData.payment.cardNumber.replace(/\s/g, ''),
                    expiryDate: pendingFormData.payment.expiryDate,
                    billingAddress:
                        pendingFormData.payment.billingAddress,
                },
                flight_details: flightSnapshot,
                pricing: {
                    total_amount: flightData.price.finalPrice,
                    currency: flightData.price.currency,
                    base_fare: flightData.price.basePrice || 0,
                },
            };

            const response = await axios.post(
                '/api/duffel/booking',
                bookingPayload
            );

            if (response.data.success) {
                router.push(
                    `/booking/success?id=${response.data.bookingId}`
                );
            } else {
                throw new Error(
                    response.data.message || 'Booking failed.'
                );
            }
        } catch (error: unknown) {
            const axiosErr = axios.isAxiosError(error)
                ? error.response?.data
                : null;
            const errorCode = axiosErr?.code || axiosErr?.errorType;
            const errorMessage =
                axiosErr?.message ||
                (error instanceof Error
                    ? error.message
                    : 'Something went wrong.');

            if (
                errorCode === 'offer_no_longer_available' ||
                errorCode === 'OFFER_EXPIRED'
            ) {
                toast.error(
                    'Session Expired! Redirecting to fresh results...',
                    { duration: 4000 }
                );

                const adt = pendingFormData.passengers.filter(
                    (p) => p.type === 'adult'
                ).length;
                const chd = pendingFormData.passengers.filter(
                    (p) => p.type === 'child'
                ).length;
                const inf = pendingFormData.passengers.filter(
                    (p) => p.type === 'infant_without_seat'
                ).length;

                let currentTripType = 'one_way';
                if (flightData.itinerary.length === 2)
                    currentTripType = 'round_trip';
                else if (flightData.itinerary.length > 2)
                    currentTripType = 'multi_city';

                const params = new URLSearchParams({
                    type: currentTripType,
                    adt: adt.toString(),
                    chd: chd.toString(),
                    inf: inf.toString(),
                    class: 'economy',
                });

                if (currentTripType === 'multi_city') {
                    const flightsArray = flightData.itinerary.map(
                        (slice: any) => ({
                            origin: slice.segments[0].departure.code,
                            destination:
                                slice.segments[
                                    slice.segments.length - 1
                                ].arrival.code,
                            date: slice.segments[0].departure.time.split(
                                'T'
                            )[0],
                        })
                    );
                    params.append(
                        'flights',
                        JSON.stringify(flightsArray)
                    );
                } else {
                    const outbound = flightData.itinerary[0];
                    params.append(
                        'origin',
                        outbound.segments[0].departure.code
                    );
                    params.append(
                        'destination',
                        outbound.segments[
                            outbound.segments.length - 1
                        ].arrival.code
                    );
                    params.append(
                        'date',
                        outbound.segments[0].departure.time.split(
                            'T'
                        )[0]
                    );

                    if (
                        currentTripType === 'round_trip' &&
                        flightData.itinerary[1]
                    ) {
                        params.append(
                            'returnDate',
                            flightData.itinerary[1].segments[0].departure.time.split(
                                'T'
                            )[0]
                        );
                    }
                }

                setTimeout(() => {
                    router.push(
                        `/flight/search?${params.toString()}`
                    );
                }, 2500);

                return;
            }

            if (
                errorCode === 'instant_payment_required' ||
                errorCode === 'INSTANT_PAYMENT_REQUIRED'
            ) {
                toast.error(
                    'This flight requires Instant Payment. Please contact support.'
                );
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
        return (
            <ErrorState
                message={fetchError}
                onBack={() => router.push('/')}
            />
        );

    const summaryCounts = flightData
        ? {
              adults: flightData.passengers.filter(
                  (p: any) => p.type === 'adult'
              ).length,
              children: flightData.passengers.filter(
                  (p: any) => p.type === 'child'
              ).length,
              infants: flightData.passengers.filter(
                  (p: any) => p.type === 'infant_without_seat'
              ).length,
          }
        : { adults: 0, children: 0, infants: 0 };

    const requiresInstantPayment =
        flightData?.payment_requirements?.requires_instant_payment ??
        false;

    return (
        <>
            <ExpirationModal
                isOpen={isExpired}
                onRefresh={handleRefreshSearch}
            />

            <div
                className={`
                    ${isExpired ? 'blur-sm pointer-events-none select-none overflow-hidden h-screen' : ''}
                    transition-all duration-500
                `}
            >
                <div className="min-h-screen bg-gray-50">
                    {/* HEADER */}
                    <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <div className="flex items-center justify-between h-16 md:h-[72px]">
                                <StepIndicator currentStep={2} />
                                <div className="hidden lg:flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[11px] font-semibold text-gray-400">
                                        Secure Checkout
                                    </span>
                                </div>
                                <CountdownTimer
                                    timeLeft={timeLeft}
                                    isUrgent={isUrgent}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PAGE HEADER */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                Complete Your Booking
                            </h1>
                            <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2 font-medium flex-wrap">
                                Fill in the details below to secure your flight
                                <span className="hidden sm:flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                    <Lock className="w-2.5 h-2.5" />
                                    Encrypted
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    {flightData && (
                        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                                {/* LEFT */}
                                <div className="lg:col-span-2 space-y-5">
                                    {/* ITINERARY */}
                                    <SectionCard
                                        icon={Plane}
                                        title="Flight Itinerary"
                                        subtitle={
                                            flightData.itinerary.length +
                                            ' leg' +
                                            (flightData.itinerary.length > 1
                                                ? 's'
                                                : '')
                                        }
                                        badge={
                                            <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                {flightData.cabinClass ||
                                                    'Economy'}
                                            </span>
                                        }
                                    >
                                        {flightData.itinerary.map(
                                            (
                                                slice: any,
                                                sIdx: number
                                            ) => (
                                                <div
                                                    key={
                                                        slice.id || sIdx
                                                    }
                                                >
                                                    <div className="flex items-center gap-2.5 mb-4">
                                                        <span
                                                            className={`
                                                                w-2 h-6 rounded-full
                                                                ${sIdx === 0 ? 'bg-rose-400' : 'bg-blue-400'}
                                                            `}
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                            {slice.direction}{' '}
                                                            Journey
                                                        </span>
                                                    </div>

                                                    {slice.segments.map(
                                                        (
                                                            seg: any,
                                                            idx: number
                                                        ) => (
                                                            <FlightSegmentCard
                                                                key={
                                                                    seg.id ||
                                                                    idx
                                                                }
                                                                seg={seg}
                                                            />
                                                        )
                                                    )}

                                                    {sIdx <
                                                        flightData
                                                            .itinerary
                                                            .length -
                                                            1 && (
                                                        <div className="my-6 flex items-center justify-center relative">
                                                            <div className="absolute w-full h-px bg-gray-200 border-t border-dashed" />
                                                            <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] border border-gray-100 rounded-full py-1.5">
                                                                Return
                                                                Flight
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </SectionCard>

                                    {/* FORM */}
                                    {requiresInstantPayment ? (
                                        <InstantPaymentBlock
                                            onWhatsApp={
                                                handleWhatsAppRedirect
                                            }
                                            onSearch={() =>
                                                router.push(
                                                    '/flight/search'
                                                )
                                            }
                                        />
                                    ) : (
                                        <form
                                            onSubmit={handleSubmit(
                                                onPreSubmit
                                            )}
                                            className="space-y-5"
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
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                                                            Email
                                                            Address
                                                        </label>
                                                        <input
                                                            {...register(
                                                                'contact.email',
                                                                {
                                                                    required:
                                                                        'Email is required',
                                                                    pattern:
                                                                        {
                                                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                            message:
                                                                                'Invalid email',
                                                                        },
                                                                }
                                                            )}
                                                            placeholder="ticket@example.com"
                                                            className={`
                                                                w-full p-3 bg-gray-50
                                                                border rounded-xl text-sm font-medium
                                                                focus:ring-2 focus:ring-gray-900/5
                                                                focus:border-gray-900
                                                                outline-none transition-all focus:bg-white
                                                                ${errors.contact?.email ? 'border-red-400' : 'border-gray-200'}
                                                            `}
                                                        />
                                                        {errors.contact
                                                            ?.email && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {
                                                                    errors
                                                                        .contact
                                                                        .email
                                                                        .message
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                                                            Phone
                                                            Number
                                                        </label>
                                                        <Controller
                                                            name="contact.phone"
                                                            control={
                                                                control
                                                            }
                                                            rules={{
                                                                required:
                                                                    'Phone number is required',
                                                                validate:
                                                                    (
                                                                        value
                                                                    ) =>
                                                                        isValidPhoneNumber(
                                                                            value ||
                                                                                ''
                                                                        ) ||
                                                                        'Invalid phone number',
                                                            }}
                                                            render={({
                                                                field: {
                                                                    onChange,
                                                                    value,
                                                                },
                                                            }) => (
                                                                <PhoneInput
                                                                    international
                                                                    defaultCountry="US"
                                                                    value={
                                                                        value
                                                                    }
                                                                    onChange={
                                                                        onChange
                                                                    }
                                                                    placeholder="Enter phone number"
                                                                    className={`PhoneInput ${errors.contact?.phone ? 'input-error' : ''}`}
                                                                />
                                                            )}
                                                        />
                                                        {errors.contact
                                                            ?.phone && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {
                                                                    errors
                                                                        .contact
                                                                        .phone
                                                                        .message
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SectionCard>

                                            {/* PASSENGERS */}
                                            {flightData.passengers.map(
                                                (
                                                    passenger: any,
                                                    index: number
                                                ) => {
                                                    let type:
                                                        | 'adult'
                                                        | 'child'
                                                        | 'infant' =
                                                        'adult';
                                                    if (
                                                        passenger.type ===
                                                        'child'
                                                    )
                                                        type = 'child';
                                                    if (
                                                        passenger.type ===
                                                        'infant_without_seat'
                                                    )
                                                        type = 'infant';
                                                    return (
                                                        <PassengerForm
                                                            key={
                                                                passenger.id
                                                            }
                                                            index={index}
                                                            type={type}
                                                            register={
                                                                register
                                                            }
                                                            errors={
                                                                errors
                                                            }
                                                        />
                                                    );
                                                }
                                            )}

                                            {/* PAYMENT */}
                                            <PaymentForm
                                                register={register}
                                                errors={errors}
                                                setValue={setValue}
                                            />

                                            {/* SUBMIT */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="
                                                    w-full py-4 font-bold text-sm
                                                    rounded-2xl shadow-xl
                                                    flex items-center justify-center gap-2.5
                                                    bg-gray-900 hover:bg-gray-800
                                                    text-white cursor-pointer
                                                    active:scale-[0.98]
                                                    shadow-gray-200
                                                    disabled:opacity-70
                                                    transition-all
                                                "
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Review and Confirm
                                                Booking
                                            </button>

                                            {/* Trust */}
                                            <div className="flex items-center justify-center gap-6 pt-2">
                                                {[
                                                    {
                                                        icon: Shield,
                                                        label: 'SSL Secure',
                                                    },
                                                    {
                                                        icon: Globe,
                                                        label: 'IATA Certified',
                                                    },
                                                    {
                                                        icon: Lock,
                                                        label: 'PCI Compliant',
                                                    },
                                                ].map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <item.icon className="w-3 h-3 text-gray-300" />
                                                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* RIGHT */}
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
                        flightData?.payment_requirements
                            ?.requires_instant_payment ?? false
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