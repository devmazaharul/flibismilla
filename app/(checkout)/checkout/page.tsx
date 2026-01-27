"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Lock, AlertCircle } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { BookingFormData, bookingSchema } from "./utils/validation";
import { PassengerForm } from "./components/PassengerForm";
import { BookingSummary } from "./components/BookingSummary";
import { PriceValidityNotice } from "@/app/(main)/components/PriceValidityNotice";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL থেকে ডাটা এক্সট্রাকশন
  const offerId = searchParams.get("offer_id");
  const adultsCount = parseInt(searchParams.get("adt") || "1");
  const childrenCount = parseInt(searchParams.get("chd") || "0");
  const infantsCount = parseInt(searchParams.get("inf") || "0");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flightData, setFlightData] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");

  // 🟢 1. REAL API CALL TO FETCH FLIGHT DETAILS
  useEffect(() => {
    if (!offerId) {
      setFetchError("Invalid Offer ID. Please search again.");
      setIsLoading(false);
      return;
    }

    const getFlightDetails = async () => {
      try {
        // 🚀 Calling your Backend API
        const res = await fetch(`/api/duffel/get-offer?offer_id=${offerId}`);
        const result = await res.json();


        if (!result.success) {
          throw new Error(result.error || "Failed to load flight details.");
        }
     setFlightData(result.data);
        setIsLoading(false);

      } catch (error: any) {
        setFetchError(error.message || "This offer has expired or is no longer available.");
        setIsLoading(false);
      }
    };

    getFlightDetails();
  }, [offerId]);

  // 🟢 2. FORM SETUP
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      contact: { email: "", phone: "" },
      passengers: [
        ...Array(adultsCount).fill({ type: "adult", gender: "", title: "", firstName: "", lastName: "", dob: "", passportNumber: "", passportExpiry: "" }),
        ...Array(childrenCount).fill({ type: "child", gender: "", title: "", firstName: "", lastName: "", dob: "", passportNumber: "", passportExpiry: "" }),
        ...Array(infantsCount).fill({ type: "infant", gender: "", title: "", firstName: "", lastName: "", dob: "", passportNumber: "", passportExpiry: "" }),
      ],
    },
  });

  // 🟢 3. HANDLE FORM SUBMISSION & PAYMENT
  const onSubmit: SubmitHandler<BookingFormData> = async (formData) => {
    setIsSubmitting(true);
    

    const bookingPayload = {
        offer_id: offerId,
        contact: formData.contact,
        passengers: formData.passengers,
        expected_total: flightData?.price.finalPrice, 
    };

    console.log("SENDING TO BACKEND:", bookingPayload);
    
    try {
        // 🚀 Create Order & Get Payment Link
        // const response = await fetch('/api/create-order', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(bookingPayload)
        // });
        // const data = await response.json();
        
        // if(data.url) {
        //    window.location.href = data.url; // Redirect to Stripe
        // } else {
        //    throw new Error('Payment URL not found');
        // }
        
        // Demo Alert (যতক্ষণ না পেমেন্ট এপিআই বসাচ্ছেন)
        setTimeout(() => {
            alert("API Call Success! Redirecting to Payment Gateway...");
            setIsSubmitting(false);
        }, 2000);

    } catch (error) {
        alert("Something went wrong with the booking. Please try again.");
        setIsSubmitting(false);
    }
  };

  // 🟢 4. LOADING STATE
  if (isLoading) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Verifying Flight Availability...</p>
            </div>
        </div>
    );
  }

  // 🟢 5. ERROR STATE
  if (fetchError || !flightData) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="p-8 rounded-3xl  text-center max-w-md animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Offer Expired</h2>
                <p className="text-slate-500 mb-6">{fetchError}</p>
                <button 
                    onClick={() => router.push('/flight/search')}
                    className="w-full py-3 cursor-pointer bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                    Search New Flights
                </button>
            </div>
        </div>
    );
  }

  // 🟢 6. MAIN CONTENT
  return (
   <div>
      <div className="mb-8 max-w-3xl mx-auto lg:mx-0">
              <PriceValidityNotice offerId={offerId as string} />
          </div>
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Complete Your Booking</h1>
        <p className="text-slate-500 mb-8">Please fill in the details carefully as per your passport.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
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
                  <input
                    {...register("contact.email")}
                    placeholder="ticket@example.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  {errors.contact?.email && <p className="text-xs text-red-500 font-bold">{errors.contact.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    {...register("contact.phone")}
                    placeholder="+1"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  {errors.contact?.phone && <p className="text-xs text-red-500 font-bold">{errors.contact.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Dynamic Passengers Forms */}
            {Array.from({ length: adultsCount + childrenCount + infantsCount }).map((_, index) => {
               let type: "adult" | "child" | "infant" = "adult";
               if (index >= adultsCount && index < adultsCount + childrenCount) type = "child";
               if (index >= adultsCount + childrenCount) type = "infant";

               return (
                 <PassengerForm 
                    key={index} 
                    index={index} 
                    type={type} 
                    register={register} 
                    errors={errors} 
                 />
               );
            })}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="w-5 h-5" /> Proceed to Payment
                </>
              )}
            </button>
          </div>

          {/* Right Side: Summary (Real Data Passed) */}
          <div className="lg:col-span-1">
             <BookingSummary 
                passengers={{ adults: adultsCount, children: childrenCount, infants: infantsCount }} 
                flight={flightData} 
             />
          </div>

        </form>
      </div>
    </div>
   </div>
  );
}

// 🟢 7. Wrapper Component (Suspense Boundary)
export default function CheckoutPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    }>
        <CheckoutContent />
    </Suspense>
  );
}