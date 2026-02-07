"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type CardInfo = {
  holderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  zipCode?: string;
};

type CheckoutFormProps = {
  amount: number; // শুধু UI তে দেখানোর জন্য
  bookingId: string;
  cardInfo?: CardInfo; // client card info (optional)
  onSuccess?: () => void;
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  bookingId,
  cardInfo,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!stripe || !elements) return;

  setLoading(true);
  setError(null);
  setSuccessMsg(null);

  try {
    // 1) Create Payment Intent
    const res = await fetch("/api/stripe/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create payment intent");
    }

    const { clientSecret } = await res.json();
    if (!clientSecret) {
      throw new Error("No client secret returned from server");
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error("Card element not found");
    }

    // 2) Confirm card payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "Payment failed");
    }

    if (result.paymentIntent?.status === "succeeded") {
      // 3) Payment success → call issue API
      setSuccessMsg("Payment successful! Ticket issuing in progress...");

      const issueRes = await fetch("/api/duffel/booking/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentMethod: "stripe", 
        }),
      });

      const issueData = await issueRes.json().catch(() => null);

      if (!issueRes.ok || !issueData?.success) {
        setSuccessMsg(null);
        throw new Error(
          issueData?.message ||
            "Payment succeeded but ticket issuing failed. Please contact support."
        );
      }
      setSuccessMsg("Payment & ticket issuing successful!");
      toast.success("Payment & ticket issuing successful!")
      if (onSuccess) onSuccess();

    } else {
      throw new Error(
        `Payment not completed (status: ${result.paymentIntent?.status})`
      );
    }
  } catch (err: any) {
    setError(err?.message || "Something went wrong during payment");
  } finally {
    setLoading(false);
  }
};

  const handleCopy = async () => {
    if (!cardInfo?.cardNumber) return;
    try {
      await navigator.clipboard.writeText(cardInfo.cardNumber);
      setCopied(true);
      toast.success("Card Number Copied")
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto"
    >
      {/* gradient border card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/80 via-sky-500/80 to-emerald-400/80 p-[1px] shadow-xl">
        <div className="rounded-2xl bg-white/90 p-5 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Card payment (Stripe)
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                3D Secure enabled • No card details stored on our servers
              </p>
            </div>

           
          </div>

          {/* Summary */}
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-500">
                Amount to charge
              </span>
              <span className="text-base font-semibold text-slate-900">
                ${amount.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Booking ID:{" "}
              <span className="font-mono text-[11px] text-slate-600">
                {bookingId}
              </span>
            </div>
          </div>

          {/* Client card info (optional) */}
          {cardInfo && (cardInfo.holderName || cardInfo.cardNumber) && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Client card (reference)
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="font-mono">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              </div>

              <p className="text-xs font-semibold uppercase text-slate-800">
                {cardInfo.holderName || "Cardholder Name"}
              </p>

              <p className="mt-1 text-[11px] font-mono text-slate-600 leading-snug">
                {cardInfo.cardNumber || "**** **** **** ****"}
                {" · "}
                Exp {cardInfo.expiryDate || "MM/YY"}
                {cardInfo.zipCode && <>{" · "}Zip {cardInfo.zipCode}</>}
              </p>
            </div>
          )}

          {/* Card input label */}
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
              Card details
            </label>
            <span className="text-[10px] text-slate-400">
              Visa • Mastercard • Amex
            </span>
          </div>

          {/* Card input container */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900/80">
            <CardElement
              options={{
                iconStyle: "solid",
                hidePostalCode: false,
                
                style: {
                  base: {
                    fontSize: "14px",
                    color: "#0f172a",
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    fontSmoothing: "antialiased",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                    ":-webkit-autofill": {
                      color: "#0f172a",
                    },
                  },
                  complete: {
                    color: "#16a34a",
                  },
                  invalid: {
                    color: "#b91c1c",
                    iconColor: "#b91c1c",
                  },
                },
              }}
            />
          </div>

          {/* Errors / success */}
          {error && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p className="text-[11px] font-medium text-emerald-700">
                {successMsg}
              </p>
            </div>
          )}

          {/* Pay button */}
          <button
            type="submit"
            disabled={!stripe || loading}
            className="mt-4 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-black hover:to-black disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing...
              </>
            ) : (
              <>Pay ${amount.toFixed(2)}</>
            )}
          </button>

          {/* Footer note */}
          <p className="mt-3 text-[10px] leading-snug text-slate-400">
            Payments are processed securely by Stripe using industry-standard
            encryption. We never store full card numbers or CVC on our servers.
          </p>
        </div>
      </div>
    </form>
  );
};

type StripeWrapperProps = {
  amount: number;
  bookingId: string;
  cardInfo?: CardInfo;
  onSuccess?: () => void;
};

export default function StripeWrapper({
  amount,
  bookingId,
  cardInfo,
  onSuccess,
}: StripeWrapperProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        bookingId={bookingId}
        cardInfo={cardInfo}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}