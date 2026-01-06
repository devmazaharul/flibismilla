"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { LoginFormValues, loginSchema } from "@/validation/zod";

const LoginPage = () => {
  const { colors, layout, button } = appTheme;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    // Simulate API Call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Login Data:", data);
    setLoading(false);
    alert("Login Successful!");
  };

  return (
    <div className="min-h-screen flex w-full bg-white py-10">
      
      {/* ================= Left Side: Form ================= */}
      <div className="w-full lg:w-1/2 mx-auto p-8 md:p-12 lg:p-20">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {authData.login.title}
            </h1>
            <p className="text-gray-500">{authData.login.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                {...register("email")}
                className={`w-full p-3.5 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none ${errors.email ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"}`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="#" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full p-3.5 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none ${errors.password ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full h-12 text-base font-bold ${button.primary} shadow-rose-500/25`}
              disabled={loading}
            >
              {loading ? "Signing in..." : authData.login.btnText}
            </Button>
          </form>

  

          {/* Footer */}
          <p className="text-center text-sm text-gray-600">
            {authData.login.footerText}{" "}
            <Link href={authData.login.footerLink} className="font-bold text-rose-600 hover:underline">
              {authData.login.footerLinkText}
            </Link>
          </p>
        </div>
      </div>


    </div>
  );
};

export default LoginPage;