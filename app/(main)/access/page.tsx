'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, ShieldAlert, KeyRound, Smartphone, ArrowLeft, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { toast } from 'sonner';

// Validation Schema for Step 1
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // --- New States for 2FA ---
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempUserId, setTempUserId] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- Step 1: Submit Credentials ---
  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setGlobalError(result.message || "Invalid credentials");
        return;
      }

      // 🔍 Check if 2FA is required
      if (result.require2FA) {
        setTempUserId(result.userId);
        setLoginStep('2fa');
        toast.message("Security Check", { description: result.message });
        return;
      }

      // Normal Login Success
      toast.success("Successfully signed in!");
      router.push(redirectUrl);
      router.refresh();
      
    } catch (error) {
      setGlobalError("Connection failed. Please try again.");
    }
  };

  // --- Step 2: Verify OTP ---
  const onOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
        setGlobalError("Please enter a valid 6-digit code.");
        return;
    }

    setGlobalError(null);
    setIsVerifyingOtp(true);

    try {
        const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: tempUserId, code: otpCode }),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            setGlobalError(result.message || "Invalid OTP code.");
            setIsVerifyingOtp(false);
            return;
        }

        // 2FA Login Success
        toast.success("Identity verified successfully!");
        router.push(redirectUrl);
        router.refresh();

    } catch (error) {
        setGlobalError("Verification failed. Please try again.");
        setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] p-4 relative overflow-hidden">
      
      {/* Subtle Premium Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] z-10">
        
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
            <div className=" p-3">
                <div className="bg-slate-900 rounded-xl p-2.5">
                    {loginStep === 'credentials' ? (
                        <KeyRound className="w-6 h-6 text-white" />
                    ) : (
                        <LockKeyhole className="w-6 h-6 text-white" />
                    )}
                </div>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300">
          
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loginStep === 'credentials' ? "Admin Sign In" : "Two-Factor Auth"}
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                {loginStep === 'credentials' 
                    ? "Enter your details to access the dashboard." 
                    : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>

            {/* Error State */}
            {globalError && (
              <div className="mb-6 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 animate-in zoom-in-95 duration-200">
                <div className="bg-rose-100 p-1.5 rounded-full flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-sm font-semibold text-rose-700">{globalError}</p>
              </div>
            )}

            {/* === STEP 1: EMAIL & PASSWORD FORM === */}
            {loginStep === 'credentials' && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                
                {/* Email Input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email</label>
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

                {/* Password Input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
                    <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••••••"
                    className={clsx(
                        "w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 focus:outline-none",
                        errors.password && "bg-rose-50 focus:ring-rose-100 placeholder:text-rose-300"
                    )}
                    />
                    {errors.password && (
                    <p className="text-xs text-rose-500 font-bold ml-2">{errors.password.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                    {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                    <>
                        Sign In
                        <ArrowRight className="w-5 h-5 opacity-50" />
                    </>
                    )}
                </button>
                </form>
            )}

            {/* === STEP 2: OTP FORM === */}
            {loginStep === '2fa' && (
                <form onSubmit={onOtpVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    <div className="flex justify-center py-2">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2 ring-8 ring-blue-50/50">
                            <Smartphone className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider text-center block">Authenticator Code</label>
                        <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 6) setOtpCode(val);
                            }}
                            maxLength={6}
                            placeholder="000000"
                            autoFocus
                            className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 text-center text-2xl tracking-[0.5em] font-bold transition-all duration-200 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-100 focus:outline-none placeholder:tracking-normal placeholder:text-base placeholder:font-medium"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isVerifyingOtp ? (
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        ) : (
                            "Verify Identity"
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setLoginStep('credentials');
                            setGlobalError(null);
                            setOtpCode('');
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to login
                    </button>
                </form>
            )}

            {/* Reset Password Link (Only Show on Step 1) */}
            {loginStep === 'credentials' && (
                <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                    <p className="text-sm text-slate-500 mb-2">Trouble signing in?</p>
                    <Link 
                        href="/forgot-password" 
                        className="inline-flex items-center text-sm font-bold text-slate-900 hover:text-rose-600 transition-colors"
                    >
                        Forgot your password
                    </Link>
                </div>
            )}

          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs font-medium text-slate-400 mt-8 opacity-60">
           System secured by 256-bit encryption. <br/> Unauthorized access is prohibited.
        </p>

      </div>
    </div>
  );
}