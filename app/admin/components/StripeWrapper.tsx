// app/admin/components/StripeWrapper.tsx

"use client";

import React, { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";

// ════════════════════════════════════════════
// Stripe client (singleton)
// ════════════════════════════════════════════

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

type CardInfo = {
  holderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  zipCode?: string;
};

type CheckoutFormProps = {
  amount: number;
  currency?: string;
  bookingId: string;
  bookRef: string;
  cardInfo?: CardInfo;
  onSuccess?: () => void;
};

// ════════════════════════════════════════════
// CURRENCY HELPERS
// ════════════════════════════════════════════

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BDT: "৳",
  AED: "د.إ",
  SAR: "﷼",
  INR: "₹",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
};

function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code.toUpperCase() + " ";
}

function formatAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ════════════════════════════════════════════
// CHECKOUT FORM
//
// Flow (with webhook architecture):
// 1. Create PaymentIntent via API
// 2. Confirm card payment via Stripe.js
// 3. Show "processing" state
// 4. Webhook handles ticket issuance (server-side)
// 5. Frontend polls or waits for confirmation
//
// The /api/duffel/booking/issue call is kept as a
// BACKUP trigger, but the webhook is the primary
// mechanism for reliability.
// ════════════════════════════════════════════

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency = "USD",
  bookingId,
  cardInfo,
  bookRef,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!cardInfo?.cardNumber) return;
    try {
      await navigator.clipboard.writeText(cardInfo.cardNumber);
      setCopied(true);
      toast.success("Card number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [cardInfo?.cardNumber]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded yet. Please wait.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // ════════════════════════════════════════
      // STEP 1: Create PaymentIntent
      // ════════════════════════════════════════

      const intentRes = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const intentData = await intentRes.json().catch(() => ({}));

      if (!intentRes.ok || !intentData.success) {
        throw new Error(
          intentData.error || "Failed to create payment session"
        );
      }

      const { clientSecret } = intentData;

      if (!clientSecret) {
        throw new Error("No payment session received from server");
      }

      // ════════════════════════════════════════
      // STEP 2: Confirm Card Payment
      // ════════════════════════════════════════

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card input not ready. Please refresh and try again.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            // ── Billing details for fraud prevention ──
            billing_details: {
              name: cardInfo?.holderName || undefined,
              address: cardInfo?.zipCode
                ? { postal_code: cardInfo.zipCode }
                : undefined,
            },
          },
        });

      if (stripeError) {
        // User-friendly error messages
        const friendlyMessages: Record<string, string> = {
          card_declined: "Your card was declined. Please try another card.",
          expired_card: "This card has expired. Please use a different card.",
          incorrect_cvc: "The CVC/CVV code is incorrect.",
          processing_error:
            "A processing error occurred. Please try again.",
          insufficient_funds: "Insufficient funds. Please try another card.",
        };

        const message =
          friendlyMessages[stripeError.code || ""] ||
          stripeError.message ||
          "Payment failed. Please try again.";

        throw new Error(message);
      }

      // ════════════════════════════════════════
      // STEP 3: Handle Payment Result
      // ════════════════════════════════════════

      if (paymentIntent?.status === "succeeded") {
        setSuccessMsg("Payment successful! Issuing your ticket...");

        // ── BACKUP: Client-side issue trigger ──
        // Primary issuance happens via webhook.
        // This is a backup in case webhook is delayed.
        try {
          const issueRes = await fetch("/api/duffel/booking/issue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId,
              paymentMethod: "stripe",
            }),
          });

          const issueData = await issueRes.json().catch(() => null);

          if (issueRes.ok && issueData?.success) {
            setSuccessMsg("Payment complete & ticket issued successfully!");
            toast.success("Ticket issued successfully!");
          } else {
            // Issue call failed but payment succeeded
            // Webhook will handle it — show reassuring message
            setSuccessMsg(
              "Payment successful! Your ticket is being processed and will be ready shortly."
            );
            toast.info(
              "Payment received. Ticket will be issued automatically."
            );
          }
        } catch {
          // Network error on issue call — webhook will handle
          setSuccessMsg(
            "Payment successful! Your ticket is being processed automatically."
          );
          toast.info("Payment confirmed. Ticket processing in background.");
        }

        onSuccess?.();
      } else if (paymentIntent?.status === "requires_action") {
        // 3D Secure is being handled by Stripe.js automatically
        // This state shouldn't normally reach here
        setError(
          "Additional authentication required. Please complete the verification."
        );
      } else {
        throw new Error(
          `Payment not completed. Status: ${paymentIntent?.status || "unknown"}`
        );
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err?.message || "Something went wrong during payment");
    } finally {
      setLoading(false);
    }
  };

  const displayAmount = formatAmount(amount, currency);

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      {/* Gradient border card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/80 via-sky-500/80 to-emerald-400/80 p-[1px] shadow-xl">
        <div className="rounded-2xl bg-white/90 p-5 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Card Payment (Stripe)
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              3D Secure enabled • No card details stored on our servers
            </p>
          </div>

          {/* Amount Summary */}
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-500">
                Amount to charge
              </span>
              <span className="text-base font-semibold text-slate-900 tabular-nums">
                {displayAmount}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Booking:{" "}
              <span className="font-semibold text-slate-600">{bookRef}</span>
            </div>
          </div>

          {/* Client Card Reference (optional) */}
          {cardInfo && (cardInfo.holderName || cardInfo.cardNumber) && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Client card (reference only)
                </p>
                {cardInfo.cardNumber && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold uppercase text-slate-800">
                {cardInfo.holderName || "Cardholder Name"}
              </p>

              <p className="mt-1 text-[11px] font-mono text-slate-600 leading-snug">
                {cardInfo.cardNumber || "**** **** **** ****"}
                {" · "}
                Exp {cardInfo.expiryDate || "MM/YY"}
                {cardInfo.zipCode && (
                  <>
                    {" · "}Zip {cardInfo.zipCode}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Card Input Label */}
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
              Enter card details
            </label>
            <span className="text-[10px] text-slate-400">
              Visa • Mastercard • Amex
            </span>
          </div>

          {/* Stripe Card Element */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900/80">
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
                    "::placeholder": { color: "#9ca3af" },
                    ":-webkit-autofill": { color: "#0f172a" },
                  },
                  complete: { color: "#16a34a" },
                  invalid: { color: "#b91c1c", iconColor: "#b91c1c" },
                },
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500 mt-0.5" />
              <p className="text-[11px] font-medium text-red-700 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <p className="text-[11px] font-medium text-emerald-700 leading-relaxed">
                {successMsg}
              </p>
            </div>
          )}

          {/* Pay Button */}
          <button
            type="submit"
            disabled={!stripe || loading || !!successMsg}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-black hover:to-black active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : successMsg ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Payment Complete
              </>
            ) : (
              <>Pay {displayAmount}</>
            )}
          </button>

          {/* Security Note */}
          <p className="mt-3 text-center text-[10px] leading-snug text-slate-400">
            Secured by Stripe with industry-standard encryption.
            <br />
            We never store card numbers or CVC on our servers.
          </p>
        </div>
      </div>
    </form>
  );
};

// ════════════════════════════════════════════
// WRAPPER (Elements Provider)
// ════════════════════════════════════════════

type StripeWrapperProps = {
  amount: number;
  currency?: string;
  bookingId: string;
  bookRef: string;
  cardInfo?: CardInfo;
  onSuccess?: () => void;
};

export default function StripeWrapper({
  amount,
  currency = "USD",
  bookingId,
  bookRef,
  cardInfo,
  onSuccess,
}: StripeWrapperProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        locale: "en",
      }}
    >
      <CheckoutForm
        amount={amount}
        currency={currency}
        bookRef={bookRef}
        bookingId={bookingId}
        cardInfo={cardInfo}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}