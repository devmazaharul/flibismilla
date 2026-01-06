"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaKey, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/validation/zod";
import {authStaticData } from "@/constant/others";

const ForgotPasswordPage = () => {
  const { button } = appTheme;
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    // Simulate API Call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Reset Request for:", data.email);
    setLoading(false);
    setIsSent(true); // Show success state
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/70 text-center">
        
        {/* Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
          {isSent ? (
            <FaCheckCircle className="text-3xl text-green-500" />
          ) : (
            <FaKey className="text-3xl text-rose-600" />
          )}
        </div>

        {/* Dynamic Content based on State */}
        {!isSent ? (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              {authStaticData.forgotPassword.title}
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              {authStaticData.forgotPassword.subtitle}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                <input
                  {...register("email")}
                  className={`w-full p-3.5 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none ${
                    errors.email
                      ? "border-red-500 bg-red-50 focus:ring-red-200"
                      : "border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  }`}
                  placeholder="name@email.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className={`w-full h-12 text-base font-bold ${button.primary} shadow-lg shadow-rose-500/20`}
                disabled={loading}
              >
                {loading ? "Sending..." : authStaticData.forgotPassword.btnText}
              </Button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-8">
              {authStaticData.forgotPassword.successMessage}
            </p>
            <Button
              variant="outline"
              className="w-full h-12 shadow-2xl shadow-gray-100 border-gray-200/70 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsSent(false)} // Reset to try again
            >
              Try another email
            </Button>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href={authStaticData.forgotPassword.backLink}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-rose-600 transition-colors"
          >
            <FaArrowLeft className="text-xs" /> {authStaticData.forgotPassword.backLinkText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;