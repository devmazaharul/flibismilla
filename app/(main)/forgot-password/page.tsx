'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Validation Schema
const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });


      if (res.ok) {
        setIsSent(true);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } catch (error) {
      setServerError("Connection failed.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] p-4 relative overflow-hidden">
      
      {/* Background Blobs (Consistent with Login) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-10">
        
        {/* Main Card */}
        <div className="bg-white rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            
            {/* Header Icon */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-100">
                    <div className="bg-slate-900 rounded-xl p-2.5">
                        <Mail className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* 🟢 STATE 1: SUCCESS MESSAGE */}
            {isSent ? (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
                <p className="text-sm text-slate-500 mt-2 mb-6">
                  We have sent a password reset link to your email address.
                </p>
                <Link 
                  href="/access"
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 py-3 px-6 rounded-xl transition-colors w-full"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            ) : (
              /* 🔵 STATE 2: INPUT FORM */
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
                  <p className="text-sm text-slate-500 mt-2 font-medium">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {serverError && (
                  <p className="mb-4 text-xs text-center text-rose-500 font-bold bg-rose-50 p-2 rounded-lg">
                    {serverError}
                  </p>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="admin@flybismillah.com"
                      className={clsx(
                        "w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 focus:outline-none",
                        errors.email && "bg-rose-50 focus:ring-rose-100 placeholder:text-rose-300"
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-500 font-bold ml-2">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-slate-900/20 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-5 h-5 opacity-50" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                    <Link 
                        href="/access" 
                        className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}