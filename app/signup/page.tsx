"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { RegisterFormValues, registerSchema } from "@/validation/zod";

const page = () => {
  const { button } = appTheme;
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Register Data:", data);
    setLoading(false);
    alert("Account Created Successfully!");
  };

  // ইনপুট ফিল্ড স্টাইল (Re-usable class string)
  const inputStyle = (hasError: boolean) => 
    `w-full p-3.5 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none ${hasError ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"}`;

  return (
    <div className="min-h-screen  w-full bg-white">
      

      {/* ================= Right Side: Form ================= */}
      <div className="w-full lg:w-1/2 mx-auto justify-center p-8 md:p-12 lg:p-20 order-1 lg:order-2">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {authData.register.title}
            </h1>
            <p className="text-gray-500">{authData.register.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <input {...register("name")} className={inputStyle(!!errors.name)} placeholder="John Doe" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input {...register("email")} className={inputStyle(!!errors.email)} placeholder="name@email.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <input {...register("phone")} className={inputStyle(!!errors.phone)} placeholder="+880234..." />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input type="password" {...register("password")} className={inputStyle(!!errors.password)} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
              <input type="password" {...register("confirmPassword")} className={inputStyle(!!errors.confirmPassword)} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className={`w-full h-12 text-base font-bold ${button.primary} mt-4`}
              disabled={loading}
            >
              {loading ? "Creating Account..." : authData.register.btnText}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            {authData.register.footerText}{" "}
            <Link href={authData.register.footerLink} className="font-bold text-rose-600 hover:underline">
              {authData.register.footerLinkText}
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default page;