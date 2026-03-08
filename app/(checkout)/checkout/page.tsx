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
    Globe,
    Shield,
    Check,
    AlertTriangle,
    Hourglass,
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
// STEP INDICATOR (Lightweight)
// ──────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, label: 'Review', icon: Plane },
        { id: 2, label: 'Passengers', icon: Users },
        { id: 3, label: 'Payment', icon: CreditCard },
    ];

    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            {steps.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                const StepIcon = step.icon;

                return (
                    <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center
                                    transition-all duration-300
                                    ${
                                        isDone
                                            ? 'bg-emerald-500 text-white shadow-2xl shadow-gray-100'
                                            : isActive
                                              ? 'bg-gray-900 text-white shadow-2xl shadow-gray-100'
                                              : 'bg-gray-100 text-gray-400'
                                    }
                                `}
                            >
                                {isDone ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : (
                                    <StepIcon className="w-3.5 h-3.5" />
                                )}
                            </div>
                            <span
                                className={`
                                    text-[10px] font-bold uppercase tracking-wider
                                    hidden sm:block transition-colors duration-300
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
                            <div className="w-6 sm:w-10 h-[2px] mx-0.5 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                    className={`
                                        h-full rounded-full transition-all duration-500
                                        ${isDone ? 'w-full bg-emerald-400' : 'w-0'}
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
// COUNTDOWN TIMER (Clean)
// ──────────────────────────────────────────────
const CountdownTimer = ({ timeLeft, isUrgent }: { timeLeft: string; isUrgent: boolean }) => (
    <div
        className={`
            flex items-center gap-2.5 px-3.5 py-2 rounded-xl
            border transition-all duration-300
            ${isUrgent ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-900 border-gray-800'}
        `}
    >
        <Timer className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
        <div>
            <p
                className={`text-[8px] font-bold uppercase tracking-widest ${
                    isUrgent ? 'text-red-400' : 'text-gray-500'
                }`}
            >
                {isUrgent ? '⚠ Hurry!' : 'Expires In'}
            </p>
            <p
                className={`text-base font-mono font-black leading-none tabular-nums ${
                    isUrgent ? 'text-red-600' : 'text-white'
                }`}
            >
                {timeLeft}
            </p>
        </div>
    </div>
);

// ──────────────────────────────────────────────
// SECTION CARD (Simplified)
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
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
                >
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {badge}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ──────────────────────────────────────────────
// FLIGHT SEGMENT (Clean)
// ──────────────────────────────────────────────
const FlightSegmentCard = ({ seg }: { seg: any }) => (
    <div className="group/seg">
        {/* Layover Badge */}
        {seg.layover && (
            <div className="my-3 ml-5 pl-4 border-l-2 border-dashed border-amber-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">
                        {seg.layover} layover · {seg.departure.airport}
                    </span>
                </div>
            </div>
        )}

        <div className="flex gap-3.5">
            {/* Timeline Dots */}
            <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full border-2 border-gray-800 bg-white" />
                <div className="w-px flex-1 bg-gray-200 my-1 min-h-[50px]" />
                <div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-white" />
            </div>

            <div className="flex-1 pb-4">
                {/* Departure */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-black text-gray-900">
                                {formatTime(seg.departure.time)}
                            </span>
                            <span className="text-sm font-semibold text-gray-600">
                                {seg.departure.city}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {seg.departure.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500">
                                {formatDate(seg.departure.time)}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400">
                                {seg.departure.airport}
                            </span>
                            {seg.departure.terminal && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    T{seg.departure.terminal}
                                </span>
                            )}
                        </div>
                    </div>

                    {seg.logo && (
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                            <img
                                src={seg.logo}
                                alt={seg.airline}
                                className="w-5 h-5 object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Duration Bar */}
                <div className="my-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-700">{seg.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-500">{seg.airline}</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="font-mono font-bold text-gray-600">
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
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                +{getDayDiff(seg.departure.time, seg.arrival.time)}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-gray-600">
                            {seg.arrival.city}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {seg.arrival.code}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-gray-500">
                            {formatDate(seg.arrival.time)}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] text-gray-400">{seg.arrival.airport}</span>
                        {seg.arrival.terminal && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                T{seg.arrival.terminal}
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center">
                    <Hourglass className="w-9 h-9 text-amber-500 animate-pulse" />
                </div>

                <h2 className="text-xl font-black text-gray-900 mb-2">Session Expired</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    The time limit for this offer has passed. Please search again for latest
                    availability.
                </p>

                <button
                    onClick={onRefresh}
                    className="
                        w-full py-3.5 bg-gray-900 hover:bg-gray-800
                        text-white font-bold text-sm rounded-xl
                        flex items-center justify-center gap-2
                        transition-colors duration-200 cursor-pointer
                    "
                >
                    <RefreshCcw className="w-4 h-4" />
                    Search Again
                </button>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────
// PAYMENT CONFIRMATION MODAL
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

    const firstSeg = flightData?.itinerary[0]?.segments[0];
    const lastSlice = flightData?.itinerary[0];
    const lastSeg = lastSlice?.segments[lastSlice.segments.length - 1];

    const depCode = firstSeg?.departure?.code || 'DEP';
    const arrCode = lastSeg?.arrival?.code || 'ARR';
    const flightDate = firstSeg?.departure?.time
        ? format(parseISO(firstSeg.departure.time), 'dd MMM yyyy')
        : '';

    const rawCard = formData?.payment?.cardNumber || '';
    const lastFour = rawCard.replace(/\D/g, '').slice(-4);
    const cardBrand = /^4/.test(rawCard) ? 'Visa' : /^5/.test(rawCard) ? 'Mastercard' : 'Card';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isProcessing ? onClose : undefined}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Top Bar */}
                <div className={`h-1 ${isInstantPayment ? 'bg-rose-500' : 'bg-gray-900'}`} />

                {/* Header */}
                <div className="p-6 pb-4 text-center">
                    <div
                        className={`
                            w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4
                            ${
                                isInstantPayment
                                    ? 'bg-rose-50 text-rose-500'
                                    : 'bg-gray-100 text-gray-700'
                            }
                        `}
                    >
                        {isInstantPayment ? (
                            <CreditCard className="w-6 h-6" />
                        ) : (
                            <ShieldCheck className="w-6 h-6" />
                        )}
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                        {isInstantPayment ? 'Confirm Payment' : 'Complete Booking'}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                        <Lock className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-400">
                            256-bit SSL Encrypted
                        </span>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="px-5 pb-4 space-y-2.5">
                    {/* Flight */}
                    <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                <Plane className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                    {depCode}
                                    <ArrowRight className="w-3 h-3 text-gray-300" />
                                    {arrCode}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{flightDate}</div>
                            </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>

                    {/* Card */}
                    <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-800">
                                    {cardBrand} •••• {lastFour || '0000'}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                    Payment Method
                                </div>
                            </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>

                    {/* Email Notice */}
                    <div className="bg-emerald-50 rounded-xl p-3.5 flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                            You&apos;ll receive a <strong>confirmation email</strong> with your
                            e-ticket shortly after booking.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-5 px-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Total
                        </span>
                        <span className="text-2xl font-black text-gray-900">{price}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="
                                py-3 rounded-xl bg-white border border-gray-200
                                font-bold text-gray-500 hover:bg-gray-50
                                transition-colors text-sm cursor-pointer
                                disabled:opacity-50
                            "
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`
                                py-3 rounded-xl font-bold text-white text-sm
                                flex items-center justify-center gap-2
                                transition-colors cursor-pointer disabled:opacity-70
                                ${
                                    isInstantPayment
                                        ? 'bg-rose-500 hover:bg-rose-600'
                                        : 'bg-gray-900 hover:bg-gray-800'
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
            <div className="w-20 h-20 mx-auto mb-5 bg-rose-50 rounded-full flex items-center justify-center">
                <Ban className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">Online Booking Unavailable</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                This flight cannot be held online. Please contact support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={onWhatsApp}
                    className="
                        flex items-center justify-center gap-2
                        px-6 py-3.5 rounded-xl font-bold text-sm
                        bg-emerald-500 text-white hover:bg-emerald-600
                        transition-colors cursor-pointer
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
                        transition-colors cursor-pointer
                    "
                >
                    Search Other Flights
                </button>
            </div>
        </div>
    </SectionCard>
);

// ──────────────────────────────────────────────
// LOADING & ERROR STATES
// ──────────────────────────────────────────────
const LoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <p className="text-sm font-bold text-gray-600">Loading flight details...</p>
            <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
        </div>
    </div>
);

const ErrorState = ({ message, onBack }: { message: string; onBack: () => void }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
                onClick={onBack}
                className="
                    px-6 py-3 bg-gray-900 text-white rounded-xl
                    font-bold text-sm hover:bg-gray-800
                    transition-colors cursor-pointer
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

    // ✅ FIX: zodResolver handles ALL validation — no inline rules needed
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

    // ─── Fetch Flight Data ───
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

    // ─── Countdown Timer ───
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
                const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [flightData, isExpired]);

    const isUrgent = useMemo(() => {
        const parts = timeLeft.split(':');
        const mins = parseInt(parts[0] || '99');
        return mins < 5 && timeLeft !== '--:--';
    }, [timeLeft]);

    // ─── WhatsApp Redirect ───
    const handleWhatsAppRedirect = () => {
        if (!flightData) return;

        const firstSlice = flightData.itinerary[0];
        const route = `${firstSlice.mainDeparture.city} (${firstSlice.mainDeparture.code}) to ${firstSlice.mainArrival.city} (${firstSlice.mainArrival.code})`;
        const date = new Date(firstSlice.mainDeparture.time).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        const message = [
            'Hello, I want to book a flight but it requires instant payment.',
            '',
            'Flight Info:',
            route,
            `Date: ${date}`,
            `Airline: ${firstSlice.mainAirline}`,
            `Price: ${flightData.price.currency} ${flightData.price.finalPrice}`,
            '',
            `Offer ID: ${flightData.id}`,
            '',
            'Please help me proceed.',
        ].join('\n');

        window.open(
            `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`,
            '_blank',
        );
    };

    // ─── Form Pre-Submit (opens modal) ───
    const onPreSubmit: SubmitHandler<BookingFormData> = (formData) => {
        setPendingFormData(formData);
        setIsModalOpen(true);
    };

    // ─── Final Booking Submit ───
    const handleConfirmBooking = async () => {
        if (!pendingFormData || !flightData) {
            toast.error('Session invalid. Please refresh the page.');
            return;
        }

        setIsSubmitting(true);

        const firstItinerary = flightData.itinerary[0];
        const lastItinerary = flightData.itinerary[flightData.itinerary.length - 1];
        const mainSegment = firstItinerary?.segments[0];
        const lastSegOfLast = lastItinerary?.segments[lastItinerary.segments.length - 1];

        try {
            const routeString = flightData.itinerary
                .map((slice: any) => {
                    const start = slice.segments[0].departure.code;
                    const end = slice.segments[slice.segments.length - 1].arrival.code;
                    return `${start} > ${end}`;
                })
                .join(' | ');

            let tripType = 'one_way';
            if (flightData.itinerary.length === 2) tripType = 'round_trip';
            else if (flightData.itinerary.length > 2) tripType = 'multi_city';

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
                flight_details: {
                    airline: mainSegment?.airline || 'Unknown',
                    flightNumber: mainSegment?.flightNumber || 'N/A',
                    route: routeString,
                    departureDate: mainSegment?.departure?.time,
                    arrivalDate: lastSegOfLast?.arrival?.time,
                    duration: flightData.totalDuration || firstItinerary?.totalDuration,
                    flightType: tripType,
                },
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

            // ─── Offer Expired ───
            if (errorCode === 'offer_no_longer_available' || errorCode === 'OFFER_EXPIRED') {
                toast.error('Session Expired! Redirecting...', { duration: 4000 });

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

            // ─── Instant Payment Required ───
            if (
                errorCode === 'instant_payment_required' ||
                errorCode === 'INSTANT_PAYMENT_REQUIRED'
            ) {
                toast.error('This flight requires Instant Payment. Contact support.');
                setIsModalOpen(false);
                return;
            }

            toast.error(`Booking Failed: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefreshSearch = () => router.push('/flight/search');

    // ─── Render States ───
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
                    transition-all duration-300
                `}
            >
                <div className="min-h-screen bg-gray-50">
                    {/* ═══════════ HEADER ═══════════ */}
                    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <div className="flex items-center justify-between h-14 md:h-16">
                                <StepIndicator currentStep={2} />

                                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                                    <Shield className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 tracking-wide">
                                        Secure Checkout
                                    </span>
                                </div>

                                <CountdownTimer timeLeft={timeLeft} isUrgent={isUrgent} />
                            </div>
                        </div>
                    </header>

                    {/* ═══════════ PAGE TITLE ═══════════ */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-6">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            Complete Your Booking
                        </h1>
                        <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap">
                            Fill in the details to secure your flight
                            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 text-[9px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                <Lock className="w-2.5 h-2.5" />
                                Encrypted
                            </span>
                        </p>
                    </div>

                    {/* ═══════════ MAIN GRID ═══════════ */}
                    {flightData && (
                        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                {/* ─── LEFT (Form) ─── */}
                                <div className="lg:col-span-2 space-y-5">
                                    {/* ITINERARY */}
                                    <SectionCard
                                        icon={Plane}
                                        title="Flight Itinerary"
                                        subtitle={`${flightData.itinerary.length} leg${flightData.itinerary.length > 1 ? 's' : ''}`}
                                        badge={
                                            <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-gray-100">
                                                {flightData.cabinClass || 'Economy'}
                                            </span>
                                        }
                                    >
                                        {flightData.itinerary.map((slice: any, sIdx: number) => (
                                            <div key={slice.id || sIdx}>
                                                {/* Direction Label */}
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <span
                                                        className={`w-1 h-6 rounded-full ${
                                                            sIdx === 0
                                                                ? 'bg-rose-400'
                                                                : 'bg-blue-400'
                                                        }`}
                                                    />
                                                    <span className="text-[10px] font-bold text-white bg-gray-800 px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                                                        <Plane className="w-3 h-3" />
                                                        {slice.direction} Journey
                                                    </span>
                                                </div>

                                                {/* Segments */}
                                                {slice.segments.map((seg: any, idx: number) => (
                                                    <FlightSegmentCard
                                                        key={seg.id || idx}
                                                        seg={seg}
                                                    />
                                                ))}

                                                {/* Divider */}
                                                {sIdx < flightData.itinerary.length - 1 && (
                                                    <div className="my-6 flex items-center justify-center relative">
                                                        <div className="absolute w-full h-px bg-gray-200" />
                                                        <span className="relative bg-white px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 rounded-full">
                                                            Return Flight
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </SectionCard>

                                    {/* ─── FORM OR INSTANT PAYMENT ─── */}
                                    {requiresInstantPayment ? (
                                        <InstantPaymentBlock
                                            onWhatsApp={handleWhatsAppRedirect}
                                            onSearch={() => router.push('/flight/search')}
                                        />
                                    ) : (
                                        <form
                                            onSubmit={handleSubmit(onPreSubmit)}
                                            className="space-y-5"
                                        >
                                            {/* ═══ CONTACT ═══ */}
                                            <SectionCard
                                                icon={Mail}
                                                iconColor="text-blue-500"
                                                iconBg="bg-blue-50"
                                                title="Contact Details"
                                                subtitle="We'll send your e-ticket here"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* ✅ FIX: Removed inline validation — zodResolver handles it */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3" />
                                                            Email Address
                                                        </label>
                                                        <input
                                                            {...register('contact.email')}
                                                            type="email"
                                                            placeholder="ticket@example.com"
                                                            className={`
                                                                w-full p-3 bg-gray-50 border rounded-xl
                                                                text-sm font-medium outline-none
                                                                transition-all duration-200
                                                                placeholder:text-gray-300
                                                                focus:ring-2 focus:ring-gray-900/5
                                                                focus:border-gray-900 focus:bg-white
                                                                ${
                                                                    errors.contact?.email
                                                                        ? 'border-red-300 bg-red-50/30'
                                                                        : 'border-gray-200'
                                                                }
                                                            `}
                                                        />
                                                        {errors.contact?.email && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.contact.email.message}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* ✅ FIX: Removed inline rules — zodResolver handles it */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3" />
                                                            Phone Number
                                                        </label>
                                                        <Controller
                                                            name="contact.phone"
                                                            control={control}
                                                            render={({
                                                                field: { onChange, value },
                                                            }) => (
                                                                <PhoneInput
                                                                    international
                                                                    defaultCountry="US"
                                                                    value={value}
                                                                    onChange={(val) =>
                                                                        onChange(val || '')
                                                                    }
                                                                    placeholder="Enter phone number"
                                                                    className={`PhoneInput ${
                                                                        errors.contact?.phone
                                                                            ? 'input-error'
                                                                            : ''
                                                                    }`}
                                                                />
                                                            )}
                                                        />
                                                        {errors.contact?.phone && (
                                                            <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.contact.phone.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SectionCard>

                                            {/* ═══ PASSENGERS ═══ */}
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
                                                            control={control} // ← এই লাইনটা যোগ করো
                                                        />
                                                    );
                                                },
                                            )}

                                            {/* ═══ PAYMENT ═══ */}
                                            <PaymentForm
                                                register={register}
                                                errors={errors}
                                                setValue={setValue}
                                            />

                                            {/* ═══ SUBMIT BUTTON ═══ */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="
                                                    group relative w-full py-4
                                                    font-bold text-sm uppercase tracking-wider
                                                    rounded-xl text-white overflow-hidden
                                                    bg-gray-900 hover:bg-gray-800
                                                    disabled:bg-gray-300 disabled:cursor-not-allowed
                                                    transition-all duration-200
                                                    flex items-center justify-center gap-2.5
                                                    cursor-pointer shadow-lg shadow-gray-900/15
                                                    active:scale-[0.98]
                                                "
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                        Review & Confirm Booking
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>

                                            {/* ═══ TRUST BADGES ═══ */}
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
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* ─── RIGHT (Summary) ─── */}
                                <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit">
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

            {/* Payment Confirmation Modal */}
            {flightData && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmBooking}
                    price={`${flightData.price.currency} ${flightData.price.finalPrice.toLocaleString()}`}
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
