"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { newPasswordSchema, NewPasswordValues } from "@/validation/zod";
import { authStaticData } from "@/constant/others";

const ResetPasswordContent = () => {
  const { button } = appTheme;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); 

  // States
  const [pageState, setPageState] = useState<"verifying" | "valid" | "invalid" | "success">("verifying");
  const [loading, setLoading] = useState(false);

  // ================= 1. Token Verification Logic =================
  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    const verifyToken = async () => {
      try {
    
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setPageState("valid");
        
      } catch (error) {
        setPageState("invalid");
      }
    };

    verifyToken();
  }, [token, router]);


  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
  });

  // ================= 2. Form Submit Logic =================
  const onSubmit = async (data: NewPasswordValues) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    setPageState("success");
    
    // Redirect after success
    setTimeout(() => router.push("/login"), 3000);
  };

  // Input Style Helper
  const inputStyle = (hasError: boolean) =>
    `w-full p-3.5 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none ${
      hasError
        ? "border-red-500 bg-red-50 focus:ring-red-200"
        : "border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
    }`;

  // ================= 3. Render UI based on State =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/70 min-h-[400px] flex flex-col justify-center">
        
        {/* CASE 1: Verifying Token (Loading) */}
        {pageState === "verifying" && (
          <div className="text-center space-y-4">
            <FaSpinner className="text-4xl text-rose-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">Verifying Security Token...</h2>
            <p className="text-gray-500 text-sm">Please wait while we validate your request.</p>
          </div>
        )}

        {/* CASE 2: Invalid Token */}
        {pageState === "invalid" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16  rounded-full flex items-center justify-center">
               <FaExclamationTriangle className="text-3xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invalid or Expired Link</h2>
            <p className="text-gray-500 text-sm">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password">
               <Button className={`w-full h-12 font-bold ${button.primary} mt-4`}>
                 Request New Link
               </Button>
            </Link>
          </div>
        )}

        {/* CASE 3: Valid Token (Show Form) */}
        {pageState === "valid" && (
            <>
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16  rounded-full flex items-center justify-center  ">
                        <FaLock className="text-3xl text-rose-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        {authStaticData.resetNewPassword.title}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {authStaticData.resetNewPassword.subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                        <input
                        type="password"
                        {...register("password")}
                        className={inputStyle(!!errors.password)}
                        placeholder="••••••••"
                        />
                        {errors.password && <p className="text-xs text-red-500 ml-1 mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                        <input
                        type="password"
                        {...register("confirmPassword")}
                        className={inputStyle(!!errors.confirmPassword)}
                        placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500 ml-1 mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    <Button
                        type="submit"
                        className={`w-full h-12 text-base font-bold ${button.primary} mt-4 shadow-lg shadow-rose-500/20`}
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : authStaticData.resetNewPassword.btnText}
                    </Button>
                </form>
            </>
        )}

        {/* CASE 4: Success */}
        {pageState === "success" && (
           <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center ">
                    <FaCheckCircle className="text-3xl text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                <p className="text-gray-500 text-sm mb-6">
                   {authStaticData.resetNewPassword.successMessage}
                </p>
                <p className="text-sm text-gray-400">Redirecting to login...</p>
           </div>
        )}

      </div>
    </div>
  );
};


const ResetPasswordPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

export default ResetPasswordPage;