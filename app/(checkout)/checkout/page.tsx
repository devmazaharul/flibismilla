"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle, Loader2, CreditCard, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import axios from "axios"; 

import { BookingFormData, bookingSchema } from "./utils/validation";
import { PassengerForm } from "./components/PassengerForm";
import { BookingSummary } from "./components/BookingSummary";
import { PriceValidityNotice } from "@/app/(main)/components/PriceValidityNotice";

// ----------------------------------------------------------------------
// 🟢 MODAL COMPONENT (Payment Confirmation)
// ----------------------------------------------------------------------
const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isInstantPayment, 
  price, 
  isProcessing 
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`p-6 text-center ${isInstantPayment ? 'bg-rose-50' : 'bg-blue-50'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isInstantPayment ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
            {isInstantPayment ? <CreditCard className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-black text-slate-800">
            {isInstantPayment ? "Instant Payment Required" : "Confirm Booking"}
          </h3>
          <p className="text-sm text-slate-500 mt-2 px-4">
            {isInstantPayment 
              ? "This airline requires immediate payment to issue the ticket. Holding is not available." 
              : "You can hold this booking now and pay later within the time limit."}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
            <span className="text-sm font-bold text-slate-500">Total Amount</span>
            <span className="text-xl font-black text-slate-900">{price}</span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-xl font-bold cursor-pointer text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-3.5 rounded-xl font-bold cursor-pointer text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                isInstantPayment 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isInstantPayment ? "Pay Now" : "Book Now"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ----------------------------------------------------------------------
// 🟢 MAIN COMPONENT
// ----------------------------------------------------------------------
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL Params
  const offerId = searchParams.get("offer_id");
  const adultsCount = parseInt(searchParams.get("adt") || "0");
  const childrenCount = parseInt(searchParams.get("chd") || "0");
  const infantsCount = parseInt(searchParams.get("inf") || "0");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false); // For final API call
  const [isLoading, setIsLoading] = useState(true); // For initial fetch
  const [flightData, setFlightData] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { contact: { email: "", phone: "" }, passengers: [] },
  });

  // 1. FETCH & VALIDATE
  useEffect(() => {
    if (!offerId) {
      setFetchError("Invalid Offer ID.");
      setIsLoading(false);
      return;
    }

    const getFlightDetails = async () => {
      try {
        const response = await axios.get('/api/duffel/get-offer', { params: { offer_id: offerId } });
        const result = response.data;

        if (!result.success) throw new Error(result.message);
        const data = result.data;
        
        // 🛡️ Guard Clause
        const apiAdults = data.passengers.filter((p: any) => p.type === 'adult').length;
        const apiChildren = data.passengers.filter((p: any) => p.type === 'child').length;
        const apiInfants = data.passengers.filter((p: any) => p.type === 'infant_without_seat').length;

        if (apiAdults !== adultsCount || apiChildren !== childrenCount || apiInfants !== infantsCount) {
           throw new Error("Security Mismatch: Please search again.");
        }

        setFlightData(data);
        reset({
          contact: { email: "", phone: "" },
          passengers: data.passengers.map((p: any) => ({
            id: p.id, type: p.type, gender: "male", title: "mr",
            firstName: "", lastName: "", dob: "", passportNumber: "", passportExpiry: "", middleName: ""
          }))
        });
        setIsLoading(false);

      } catch (error: any) {
        let msg = "An unexpected error occurred.";
        if (axios.isAxiosError(error)) msg = error.response?.data?.message || error.message;
        else if (error instanceof Error) msg = error.message;
        setFetchError(msg);
        setIsLoading(false);
      }
    };

    getFlightDetails();
  }, [offerId, adultsCount, childrenCount, infantsCount, reset]);

  // 2. PRE-SUBMIT (Opens Modal)
  const onPreSubmit: SubmitHandler<BookingFormData> = (formData) => {
    setPendingFormData(formData);
    setIsModalOpen(true);
  };

  // 3. FINAL EXECUTION (Called from Modal)
  const handleConfirmBooking = async () => {
    if (!pendingFormData || !flightData) return;
    
    setIsSubmitting(true);

    const bookingPayload = {
        offer_id: offerId,
        contact: pendingFormData.contact,
        passengers: pendingFormData.passengers.map(p => ({
            id: p.id,
            given_name: p.firstName,
            family_name: p.lastName,
            gender: p.gender,
            title: p.title,
            born_on: p.dob,
            email: pendingFormData.contact.email, 
            phone_number: pendingFormData.contact.phone,
            type: p.type 
        })),
        expected_total: flightData.price.finalPrice, 
    };

    try {
        // 👇 BACKEND CALL
        // const response = await axios.post('/api/booking/create', bookingPayload);
        
        console.log("Submitting Payload:", bookingPayload);

        setTimeout(() => {
            alert("Success! Redirecting...");
            setIsSubmitting(false);
            setIsModalOpen(false);
        }, 2000);

    } catch (error) {
        alert("Booking failed. Please try again.");
        setIsSubmitting(false);
        setIsModalOpen(false);
    }
  };

  // Loading UI
  if (isLoading) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-rose-600 animate-spin" />
        </div>
    );
  }

  // Error UI
  if (fetchError || !flightData) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="p-8 bg-white shadow-xl rounded-3xl text-center max-w-md border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 mb-6 text-sm">{fetchError}</p>
                <button onClick={() => router.push('/')} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Search Again</button>
            </div>
        </div>
    );
  }

  const summaryCounts = {
      adults: flightData.passengers.filter((p: any) => p.type === 'adult').length,
      children: flightData.passengers.filter((p: any) => p.type === 'child').length,
      infants: flightData.passengers.filter((p: any) => p.type === 'infant_without_seat').length,
  };

  // Payment Requirement Check
  const requiresInstantPayment = flightData.payment_requirements?.requires_instant_payment ?? true;

  return (
   <>
    <div>
      <div className="mb-8 max-w-3xl mx-auto lg:mx-0">
          <PriceValidityNotice offerId={offerId as string} />
      </div>

      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Complete Your Booking</h1>
              <p className="text-slate-500 flex items-center gap-2">
                Passenger details must match your passport.
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    <Lock className="w-3 h-3" /> Secure Session
                </span>
              </p>
            </div>

            {/* Payment Badge Indicator */}
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                requiresInstantPayment ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
                {requiresInstantPayment ? <CreditCard className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                <span className="text-xs font-bold">
                    {requiresInstantPayment ? "Instant Payment Only" : "Hold Booking Available"}
                </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onPreSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Side: Forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Contact Info */}
              <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-500" /> Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                    <input {...register("contact.email")} placeholder="ticket@example.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none" />
                    {errors.contact?.email && <p className="text-xs text-red-500 font-bold mt-1">{errors.contact.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <input {...register("contact.phone")} placeholder="+880 1XXX..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none" />
                    {errors.contact?.phone && <p className="text-xs text-red-500 font-bold mt-1">{errors.contact.phone.message}</p>}
                  </div>
                </div>
              </div>

              {/* Passenger Forms */}
              {flightData.passengers.map((passenger: any, index: number) => {
                  let type = "adult";
                  if (passenger.type === 'child') type = "child";
                  if (passenger.type === 'infant_without_seat') type = "infant";
                 return <PassengerForm key={passenger.id} index={index} type={type as any} register={register} errors={errors} />;
              })}

              {/* MAIN SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-4 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle className="w-5 h-5" /> Review & Continue
              </button>
            </div>

            {/* Right Side: Summary */}
            <div className="lg:col-span-1">
               <BookingSummary passengers={summaryCounts} flight={flightData} />
            </div>

          </form>
        </div>
      </div>
    </div>

    {/* 🟢 CONFIRMATION MODAL */}
    <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBooking}
        isInstantPayment={requiresInstantPayment}
        price={`${flightData.price.currency} ${flightData.price.finalPrice.toLocaleString()}`}
        isProcessing={isSubmitting}
    />
   </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
        <CheckoutContent />
    </Suspense>
  );
}