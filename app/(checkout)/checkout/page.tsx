'use client';

import { useSearchParams, useRouter } from 'next/navigation';
// 1. Controller import added
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
  ShieldCheck
} from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

// 2. React Phone Number Input Import
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 

import { PaymentForm } from './components/PaymentForm'; 
import { BookingFormData, bookingSchema } from './utils/validation';
import { PassengerForm } from './components/PassengerForm';
import { BookingSummary } from './components/BookingSummary';
import { websiteDetails } from '@/constant/data';
import { toast } from 'sonner';

// --- Helper Functions ---
const formatTime = (iso: string) => format(parseISO(iso), 'hh:mm a');
const formatDate = (iso: string) => format(parseISO(iso), 'EEE, dd MMM');
const getDayDiff = (dep: string, arr: string) => {
    const diff = differenceInCalendarDays(parseISO(arr), parseISO(dep));
    return diff > 0 ? diff : 0;
};

// ----------------------------------------------------------------------
// 🔴 EXPIRATION MODAL
// ----------------------------------------------------------------------
const ExpirationModal = ({ isOpen, onRefresh }: { isOpen: boolean; onRefresh: () => void }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                  <Timer className="w-8 h-8 text-rose-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Session Expired</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              The time limit for this offer has passed. Airline prices change constantly, so please search again to get the latest availability.
            </p>
            <button 
              onClick={onRefresh}
              className="w-full py-4 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              <RefreshCcw className="w-5 h-5" /> Search Again
            </button>
          </div>
        </div>
      </div>
    );
};
  
// ----------------------------------------------------------------------
// 🟢 PAYMENT MODAL
// ----------------------------------------------------------------------
const PaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isInstantPayment,
  price,
  isProcessing,
  flightData, 
  formData 
}: any) => {
  if (!isOpen) return null;

  // --- Helpers for Display ---
  const firstSegment = flightData?.itinerary[0]?.segments[0];
  const lastSegment = flightData?.itinerary[0]?.segments[flightData.itinerary[0].segments.length - 1];
  const departureCode = firstSegment?.departure?.code || "DEP";
  const arrivalCode = lastSegment?.arrival?.code || "ARR";
  const flightDate = firstSegment?.departure?.time ? format(parseISO(firstSegment.departure.time), 'dd MMM yyyy') : "";
  
  const cardNumber = formData?.payment?.cardNumber || "";
  const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
  const cardBrand = /^4/.test(cardNumber) ? "Visa" : /^5/.test(cardNumber) ? "Mastercard" : "Card";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-slate-50">
          <div className={`w-12 h-12 mx-auto flex items-center justify-center mb-4 ${isInstantPayment ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
            {isInstantPayment ? <CreditCard className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {isInstantPayment ? 'Confirm Payment' : 'Complete Booking'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Secure 256-bit SSL Encrypted Transaction
          </p>
        </div>

        {/* Review Section */}
        <div className="p-5 space-y-3 bg-slate-50/50">
          
          {/* Flight Mini Summary */}
          <div className="bg-white border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between shadow-2xl shadow-gray-100">
            <div className="flex items-center gap-3.5">
               <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Plane className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                     {departureCode} <span className="text-slate-300 text-[10px]">●●●</span> {arrivalCode}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                     {flightDate}
                  </div>
               </div>
            </div>
          </div>

          {/* Card Mini Summary */}
          <div className="bg-white border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between shadow-2xl shadow-gray-100">
            <div className="flex items-center gap-3.5">
               <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <CreditCard className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                     <span className="hidden sm:inline">{cardBrand}</span> •••• {lastFour || "0000"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">
                     Payment Method
                  </div>
               </div>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>

          {/* Confirmation Message */}
          <div className="mt-2 bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 flex gap-3 items-start">
             <div className="mt-0.5 min-w-[16px]"> 
                <Mail className="w-4 h-4 text-emerald-600" />
             </div>
             <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                You will receive a <strong>confirmation email</strong> with your e-ticket and full flight itinerary shortly after payment.
             </p>
          </div>

        </div>

        {/* Footer / Price */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="flex justify-between items-end mb-5 px-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Amount</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{price}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onClose} 
                disabled={isProcessing} 
                className="py-3.5 rounded-xl bg-gray-100 font-bold cursor-pointer text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm"
            >
                Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`py-3.5 rounded-xl font-bold cursor-pointer text-white shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm ${
                isInstantPayment ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isInstantPayment ? 'Pay Now' : 'Confirm Booking'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


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
  
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isExpired, setIsExpired] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  // 3. Added 'control' for React Hook Form Controller
  const { register, handleSubmit, reset, control, formState: { errors }, setValue } = useForm<BookingFormData>({
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
                country: 'US'
            }
        }
    },
  });

  // 1. FETCH & VALIDATE
  useEffect(() => {
    if (!offerId) {
      setFetchError('Invalid Offer ID.');
      setIsLoading(false);
      return;
    }

    const getFlightDetails = async () => {
      try {
        const response = await axios.get('/api/duffel/get-offer', { params: { offer_id: offerId } });
        const result = response.data;

        if (!result.success) throw new Error(result.message);
        const data = result.data;
        
        const apiAdults = data.passengers.filter((p: any) => p.type === 'adult').length;
        const apiChildren = data.passengers.filter((p: any) => p.type === 'child').length;
        const apiInfants = data.passengers.filter((p: any) => p.type === 'infant_without_seat').length;

        if (apiAdults !== adultsCount || apiChildren !== childrenCount || apiInfants !== infantsCount) {
          throw new Error('Security Mismatch: Please search again.');
        }

        setFlightData(data);
        reset({
          contact: { email: '', phone: '' },
          payment: {
            cardName: '',
            cardNumber: '',
            expiryDate: '',
            billingAddress: { street: '', city: '', zipCode: '', country: 'US', state: '' }
          },
          passengers: data.passengers.map((p: any) => ({
            id: p.id, type: p.type, gender: 'male', title: 'mr',
            firstName: '', lastName: '', dob: '', passportNumber: '', passportExpiry: '', middleName: '', passportCountry: 'BD'
          })),
        });
        setIsLoading(false);
      } catch (error: any) {
        let msg = 'An unexpected error occurred.';
        if (axios.isAxiosError(error)) msg = error.response?.data?.message || error.message;
        else if (error instanceof Error) msg = error.message;
        setFetchError(msg);
        setIsLoading(false);
      }
    };

    getFlightDetails();
  }, [offerId, adultsCount, childrenCount, infantsCount, reset]);

  // Timer Logic
  useEffect(() => {
    if (!flightData?.expires_at || isExpired) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = new Date(flightData.expires_at).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        setIsExpired(true); 
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const m = minutes < 10 ? `0${minutes}` : minutes;
        const s = seconds < 10 ? `0${seconds}` : seconds;
        setTimeLeft(`${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [flightData, isExpired]);


  const handleWhatsAppRedirect = () => {
    if (!flightData) return;
    const firstSlice = flightData.itinerary[0];
    const route = `${firstSlice.mainDeparture.city} (${firstSlice.mainDeparture.code}) ➡️ ${firstSlice.mainArrival.city} (${firstSlice.mainArrival.code})`;
    const date = new Date(firstSlice.mainDeparture.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const airline = firstSlice.mainAirline;
    const price = `${flightData.price.currency} ${flightData.price.finalPrice}`;
    
    const message = `Hello, I want to book a flight but it requires instant payment.\n\n *Flight Info:*\n${route}\n📅 *Date:* ${date}\n *Airline:* ${airline}\n💰 *Price:* ${price}\n\n🆔 *Offer ID:* ${flightData.id}\n\nPlease help me proceed.`;

    const url = `https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const onPreSubmit: SubmitHandler<BookingFormData> = (formData) => {
    setPendingFormData(formData);
    setIsModalOpen(true);
  };

 // 🟢 CORE BOOKING LOGIC WITH ERROR HANDLING
  const handleConfirmBooking = async () => {
    if (!pendingFormData || !flightData) {
        alert("Session invalid. Please refresh the page.");
        return;
    }

    setIsSubmitting(true);

    // Helpers need to be accessible in catch block
    const firstItinerary = flightData.itinerary[0];
    const lastItinerary = flightData.itinerary[flightData.itinerary.length - 1];
    const mainSegment = firstItinerary?.segments[0];
    const lastSegmentOfLastItinerary = lastItinerary?.segments[lastItinerary.segments.length - 1];

    try {
        // Route Generation Logic
        const routeString = flightData.itinerary
            .map((slice: any) => {
                const start = slice.segments[0].departure.code;
                const end = slice.segments[slice.segments.length - 1].arrival.code;
                return `${start} ➝ ${end}`;
            })
            .join(" | ");

        // Trip Type Logic
        let tripType = "one_way";
        if (flightData.itinerary.length === 2) tripType = "round_trip";
        else if (flightData.itinerary.length > 2) tripType = "multi_city";

        const flightSnapshot = {
            airline: mainSegment?.airline || "Unknown Airline",
            flightNumber: mainSegment?.flightNumber || "N/A",
            route: routeString, 
            departureDate: mainSegment?.departure?.time,
            arrivalDate: lastSegmentOfLastItinerary?.arrival?.time,
            duration: flightData.totalDuration || firstItinerary?.totalDuration,
            flightType: tripType 
        };

        const bookingPayload = {
            offer_id: offerId,
            contact: {
                email: pendingFormData.contact.email,
                phone: pendingFormData.contact.phone
            },
            passengers: pendingFormData.passengers.map((p) => ({
                id: p.id,
                type: p.type,
                title: p.title,
                firstName: p.firstName,
                lastName: p.lastName,
                middleName: p.middleName || "",
                gender: p.gender,
                dob: p.dob,
                passportNumber: p.passportNumber || "",
                passportExpiry: p.passportExpiry || "",
                passportCountry: p.passportCountry || "BD"
            })),
            payment: {
                cardName: pendingFormData.payment.cardName,
                cardNumber: pendingFormData.payment.cardNumber.replace(/\s/g, ''),
                expiryDate: pendingFormData.payment.expiryDate,
                billingAddress: pendingFormData.payment.billingAddress
            },
            flight_details: flightSnapshot,
            pricing: {
                total_amount: flightData.price.finalPrice,
                currency: flightData.price.currency,
                base_fare: flightData.price.basePrice || 0,
            }
        };

        const response = await axios.post('/api/duffel/booking', bookingPayload);

        if (response.data.success) {
            router.push(`/booking/success?id=${response.data.bookingId}`);
        } else {
            throw new Error(response.data.message || "Booking failed.");
        }

    } catch (error: any) {
        // 🔥 SMART ERROR HANDLING
        const errorResponse = error.response?.data;
        const errorCode = errorResponse?.code || errorResponse?.errorType;
        const errorMessage = errorResponse?.message || error.message || "Something went wrong.";

        // 🛑 Case 1: Offer Expired or Price Changed
        if (errorCode === 'offer_no_longer_available' || errorCode === 'OFFER_EXPIRED') {
            
            toast.error("Session Expired! Redirecting to fresh results...", { duration: 4000 });

            // 1. Calculate Passenger Counts
            const adt = pendingFormData.passengers.filter(p => p.type === 'adult').length;
            const chd = pendingFormData.passengers.filter(p => p.type === 'child').length;
            const inf = pendingFormData.passengers.filter(p => p.type === 'infant_without_seat').length;

            // 2. Determine Trip Type
            let currentTripType = 'one_way';
            if (flightData.itinerary.length === 2) currentTripType = 'round_trip';
            else if (flightData.itinerary.length > 2) currentTripType = 'multi_city';

            // 3. Construct Search Query
            const params = new URLSearchParams({
                type: currentTripType, // Changed 'tripType' to 'type' to match your URL format
                adt: adt.toString(), // Match 'adt'
                chd: chd.toString(), // Match 'chd'
                inf: inf.toString(), // Match 'inf'
                class: 'economy'     // Match 'class'
            });

            // 4. Handle Specific Logic based on Trip Type
            if (currentTripType === 'multi_city') {
                // ✅ Multi City Format: &flights=[{origin, destination, date}, ...]
                const flightsArray = flightData.itinerary.map((slice: any) => ({
                    origin: slice.segments[0].departure.code,
                    destination: slice.segments[slice.segments.length - 1].arrival.code,
                    date: slice.segments[0].departure.time.split('T')[0]
                }));
                
                params.append('flights', JSON.stringify(flightsArray));

            } else {
                // ✅ One Way / Round Trip Logic
                // Origin/Dest from first leg
                const outboundSlice = flightData.itinerary[0];
                const searchOrigin = outboundSlice.segments[0].departure.code;
                const searchDest = outboundSlice.segments[outboundSlice.segments.length - 1].arrival.code;
                const searchDate = outboundSlice.segments[0].departure.time.split('T')[0];

                params.append('origin', searchOrigin);
                params.append('destination', searchDest);
                params.append('date', searchDate); // Or 'departureDate' based on your router

                // Add Return Date if Round Trip
                if (currentTripType === 'round_trip' && flightData.itinerary[1]) {
                    const returnDate = flightData.itinerary[1].segments[0].departure.time.split('T')[0];
                    params.append('returnDate', returnDate);
                }
            }

            // 5. Redirect after brief delay
            setTimeout(() => {
                // Ensure the path matches your search page route (e.g., /flight/search or /flights)
                router.push(`/flight/search?${params.toString()}`);
            }, 2500);
            
            return; 
        }

        // 🛑 Case 2: Instant Payment Required
        if (errorCode === 'instant_payment_required' || errorCode === 'INSTANT_PAYMENT_REQUIRED') {
             toast.error("This flight requires Instant Payment. Please contact support.");
             setIsModalOpen(false);
             return;
        }

        // Default Error
        toast.error(`Booking Failed: ${errorMessage}`);
        
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRefreshSearch = () => {
      router.push('/flight/search');
  }

  // --- UI RENDERING ---
  if (isLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="w-10 h-10 text-rose-600 animate-spin" /></div>;
  
  if ((fetchError || !flightData) && !isExpired) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="p-8 bg-white shadow-2xl shadow-gray-100 rounded-3xl text-center max-w-md">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-6 text-sm">{fetchError}</p>
        <button onClick={() => router.push('/')} className="px-6 py-2 cursor-pointer bg-slate-900 text-white rounded-lg font-bold">Search Again</button>
      </div>
    </div>
  );

  const summaryCounts = flightData ? {
    adults: flightData.passengers.filter((p: any) => p.type === 'adult').length,
    children: flightData.passengers.filter((p: any) => p.type === 'child').length,
    infants: flightData.passengers.filter((p: any) => p.type === 'infant_without_seat').length,
  } : { adults:0, children:0, infants:0 };

  const requiresInstantPayment = flightData?.payment_requirements?.requires_instant_payment ?? false;

  return (
    <>
      <ExpirationModal isOpen={isExpired} onRefresh={handleRefreshSearch} />
      
      {/* 4. Global Style for Phone Input to match standard inputs */}
      <style jsx global>{`
        .PhoneInput {
            display: flex;
            align-items: center;
            width: 100%;
            background-color: #f8fafc; /* bg-slate-50 */
            border: 1px solid #e2e8f0; /* border-slate-200 */
            border-radius: 0.75rem; /* rounded-xl */
            padding: 0.75rem; /* p-3 */
            transition: all 0.2s;
        }
        .PhoneInput:focus-within {
            border-color: #f43f5e; /* rose-500 */
            background-color: #ffffff;
            box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
        }
        .PhoneInputInput {
            border: none;
            background: transparent;
            outline: none;
            font-size: 0.875rem; /* text-sm */
            font-weight: 500;
            color: #1e293b;
            flex: 1;
        }
        .PhoneInputCountry {
            margin-right: 0.75rem;
        }
        /* Error State */
        .PhoneInput.input-error {
            border-color: #ef4444; /* red-500 */
        }
      `}</style>

      <div className={`${isExpired ? "blur-sm pointer-events-none select-none overflow-hidden h-screen" : ""} transition-all duration-500`}>
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Complete Your Booking</h1>
                <p className="text-slate-500 flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                    <Lock className="w-3 h-3" /> Secure Session
                  </span>
                </p>
              </div>

              {/* Timer */}
              <div className={`px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-lg transition-colors ${parseInt(timeLeft) < 5 ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
                 <Timer className={`w-5 h-5 ${parseInt(timeLeft) < 5 ? 'text-white' : 'text-rose-400'}`} />
                 <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${parseInt(timeLeft) < 5 ? 'text-rose-100' : 'text-slate-400'}`}>Price Expires In</p>
                    <p className="text-lg font-mono font-bold text-white leading-none">{timeLeft}</p>
                 </div>
              </div>
            </div>

            {flightData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
                {/* 🟢 LEFT SIDE: CONTENT */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* FLIGHT DETAILS CARD */}
                    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/80">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <Plane className="w-5 h-5 text-rose-500" /> Flight Itinerary
                    </h3>
                    <div className="relative">
                        {flightData.itinerary.map((slice: any, sIdx: number) => (
                        <div key={slice.id || sIdx} className="relative">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${sIdx === 0 ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                            {slice.direction} Journey
                            </p>
                            <div className="space-y-1"> 
                            {slice.segments.map((seg: any, idx: number) => (
                                <div key={seg.id || idx} className="group">
                                {seg.layover && (
                                    <div className="ml-4 pl-4 border-l-2 border-dashed border-amber-200 my-2">
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1.5 w-fit">
                                        <Clock className="w-3 h-3" /> Layover: <span className="font-bold">{seg.layover}</span> in {seg.departure.airport}
                                    </span>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center pt-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full border-[2px] border-slate-700 bg-white"></div>
                                    <div className="w-[1.5px] flex-1 bg-slate-200 my-0.5 min-h-[40px]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full border-[2px] border-slate-400 bg-white"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start">
                                            
                                            {/* DEPARTURE */}
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    {formatTime(seg.departure.time)}
                                                    <span className="text-slate-300 font-light text-xs">|</span>
                                                    {seg.departure.city} <span className="text-slate-400 font-medium text-xs">({seg.departure.code})</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                    {formatDate(seg.departure.time)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {seg.departure.airport}
                                                    {seg.departure.terminal && <span className="ml-1.5 text-blue-600 bg-blue-50 px-1.5 rounded text-[10px] font-bold">T-{seg.departure.terminal}</span>}
                                                </p>
                                            </div>

                                            {/* Airline Info Right */}
                                            <div className="text-right">
                                                {seg.logo && <img src={seg.logo} alt="" className="w-5 h-5 object-contain ml-auto opacity-80" />}
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{seg.airline}</p>
                                            </div>
                                    </div>

                                    {/* Duration Bar */}
                                    <div className="my-2 py-1.5 px-3 bg-slate-50/70 rounded-lg border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span className="text-[11px] font-semibold text-slate-600">{seg.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-slate-400 font-medium uppercase">{seg.flightNumber}</span>
                                            <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-3">{seg.aircraft}</span>
                                            </div>
                                    </div>

                                    {/* ARRIVAL */}
                                    <div>
                                            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                {formatTime(seg.arrival.time)}
                                                {getDayDiff(seg.departure.time, seg.arrival.time) > 0 && (
                                                    <sup className="text-[9px] font-black text-rose-500 bg-rose-50 px-1 rounded">+{getDayDiff(seg.departure.time, seg.arrival.time)}</sup>
                                                )}
                                                <span className="text-slate-300 font-light text-xs">|</span>
                                                {seg.arrival.city} <span className="text-slate-400 font-medium text-xs">({seg.arrival.code})</span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                {formatDate(seg.arrival.time)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {seg.arrival.airport}
                                                {seg.arrival.terminal && <span className="ml-1.5 text-blue-600 bg-blue-50 px-1.5 rounded text-[10px] font-bold">T-{seg.arrival.terminal}</span>}
                                            </p>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            ))}
                            </div>
                            {sIdx < flightData.itinerary.length - 1 && (
                            <div className="my-8 py-2 relative flex items-center justify-center">
                                <div className="absolute w-full h-[1px] bg-slate-200 dashed-border"></div>
                                <div className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 rounded-full py-1">Return Flight</div>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* FORM SECTION */}
                    {requiresInstantPayment ? (
                        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Ban className="w-8 h-8 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Instant Payment Required</h2>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                                This flight cannot be held online. To book this ticket, please contact our support team immediately.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <button onClick={handleWhatsAppRedirect} className="flex cursor-pointer items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                                    <Phone className="w-4 h-4" /> Book via WhatsApp
                                </button>
                                <button onClick={() => router.push('/flight/search')} className="px-6 cursor-pointer py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                    Search Other Flights
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
                            {/* 5. UPDATED CONTACT DETAILS SECTION */}
                            <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/80">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-rose-500" /> Contact Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                                        <input 
                                            {...register('contact.email', {
                                                required: "Email is required",
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Invalid email address"
                                                }
                                            })} 
                                            placeholder="ticket@example.com" 
                                            className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-all focus:bg-white ${errors.contact?.email ? 'border-red-500' : 'border-slate-200'}`} 
                                        />
                                        {errors.contact?.email && <p className="text-xs text-red-500 font-semibold mt-1">{errors.contact.email.message}</p>}
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                                        
                                        {/* React Phone Number Input with Strict Validation */}
                                        <Controller
                                            name="contact.phone"
                                            control={control}
                                            rules={{
                                                required: "Phone number is required",
                                                validate: (value) => isValidPhoneNumber(value || "") || "Invalid phone number for selected country"
                                            }}
                                            render={({ field: { onChange, value } }) => (
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
                                        {errors.contact?.phone && <p className="text-xs text-red-500 font-semibold mt-1">{errors.contact.phone.message}</p>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* PASSENGERS */}
                            {flightData.passengers.map((passenger: any, index: number) => {
                                let type = 'adult';
                                if (passenger.type === 'child') type = 'child';
                                if (passenger.type === 'infant_without_seat') type = 'infant';
                                return <PassengerForm key={passenger.id} index={index} type={type as any} register={register} errors={errors} />;
                            })}
                            
                            {/* PAYMENT */}
                            <PaymentForm register={register} errors={errors} setValue={setValue}/>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.98]">
                                <CheckCircle className="w-5 h-5" /> Review & Confirm Booking
                            </button>
                        </form>
                    )}
                </div>

                {/* 🟢 RIGHT SIDE */}
                <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit">
                    <BookingSummary passengers={summaryCounts} flight={flightData} />
                </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {flightData && (
        <PaymentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmBooking}
            price={`${flightData.price.currency} ${flightData.price.finalPrice.toLocaleString()}`}
            isProcessing={isSubmitting}
            isInstantPayment={flightData?.payment_requirements?.requires_instant_payment ?? false}
            
            flightData={flightData}
            formData={pendingFormData}
        />
      )}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}