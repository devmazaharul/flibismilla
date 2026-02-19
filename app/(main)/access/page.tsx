'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Smartphone,
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Fingerprint,
  Shield,
  Sparkles,
  CheckCircle2,
  LogIn,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { toast } from 'sonner';

// ─── Schema ───
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// ─── OTP Input Component ───
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^[0-9]?$/.test(char)) return;
      const arr = value.split('');
      arr[index] = char;
      const newVal = arr.join('').replace(/undefined/g, '');
      onChange(newVal.slice(0, 6));
      if (char && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const arr = value.split('');
        arr[index - 1] = '';
        onChange(arr.join(''));
      }
    },
    [value, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    },
    [onChange]
  );

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          className={clsx(
            'w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all duration-300',
            'bg-slate-50/80 border-slate-200/60 text-slate-900 caret-violet-500',
            'focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:shadow-[0_0_20px_-4px_rgba(139,92,246,0.15)]',
            value[i] && 'bg-violet-50 border-violet-300 shadow-sm',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}

// ─── Floating Particles (Hydration Safe) ───
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-slate-400/15"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            top: `${10 + i * 11}%`,
            left: `${5 + i * 12}%`,
            animation: `float ${4 + i * 0.7}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </>
  );
}

// ─── Main Page ───
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [tempUserId, setTempUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/admin';

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // ── Credentials Submit ──
  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rememberMe }),
      });
      const result = await res.json();

      if (!res.ok) {
        setGlobalError(result.message || 'Invalid credentials');
        return;
      }

      if (result.require2FA) {
        setTempUserId(result.userId);
        setLoginStep('2fa');
        toast.message('Security Check', { description: result.message });
        return;
      }

      toast.success('Successfully signed in!');
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Connection failed. Please try again.');
    }
  };

  // ── OTP Verify ──
  const onOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setGlobalError('Please enter a valid 6-digit code.');
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
        setGlobalError(result.message || 'Invalid OTP code.');
        setIsVerifyingOtp(false);
        return;
      }

      toast.success('Identity verified successfully!');
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ════════════ BACKGROUND ════════════ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dot Pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle, #cbd5e1 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-200/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[55%] w-[400px] h-[400px] bg-rose-100/20 rounded-full blur-[130px]" />
        <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] bg-amber-100/25 rounded-full blur-[120px]" />

        {/* Top spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-violet-100/25 to-transparent rounded-full blur-[60px]" />

        {/* Particles */}
        <FloatingParticles />
      </div>

      {/* ════════════ CONTENT ════════════ */}
      <div
        className={clsx(
          'w-full max-w-[460px] z-10 px-4 py-12 transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        )}
      >
        {/* ── Security Badge ── */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full px-4 py-2 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
            <div className="relative flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="absolute w-2 h-2 bg-emerald-400/50 rounded-full animate-ping" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 tracking-[0.12em] uppercase">
              Secure Admin Portal
            </span>
          </div>
        </div>

        {/* ── Logo Icon ── */}
        <div className="flex justify-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-3 bg-gradient-to-r from-violet-400/20 to-sky-400/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-400/30 to-sky-400/30 rounded-[20px] opacity-50 blur-sm" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 ring-1 ring-slate-700/50 shadow-xl shadow-slate-900/20">
              {loginStep === 'credentials' ? (
                <KeyRound className="w-7 h-7 text-white" strokeWidth={2.2} />
              ) : (
                <LockKeyhole className="w-7 h-7 text-white" strokeWidth={2.2} />
              )}
            </div>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="relative group/card">
          {/* Hover glow */}
          <div className="absolute -inset-3 bg-gradient-to-r from-violet-200/20 via-transparent to-sky-200/20 rounded-[40px] blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-white/50 rounded-[32px] blur-xl pointer-events-none" />

          <div className="relative bg-white/70 backdrop-blur-2xl rounded-[32px] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

            <div className="p-8 sm:p-10">
              {/* ── Header ── */}
              <div className="text-center mb-8">
                <h1 className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {loginStep === 'credentials' ? (
                    <span className="inline-flex items-center gap-2">
                      Welcome Back
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Verify Identity
                      <Fingerprint className="w-5 h-5 text-violet-500" />
                    </span>
                  )}
                </h1>
                <p className="text-[13px] sm:text-sm text-slate-500 mt-2.5 font-medium leading-relaxed max-w-[280px] mx-auto">
                  {loginStep === 'credentials'
                    ? 'Sign in to access your admin dashboard'
                    : 'Enter the 6-digit code from your authenticator app'}
                </p>
              </div>

              {/* ── Error ── */}
              {globalError && (
                <div className="mb-6 bg-rose-50 border border-rose-200/60 rounded-2xl p-4 flex items-start gap-3 animate-in zoom-in-95 fade-in duration-300">
                  <div className="bg-rose-100 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rose-700 leading-snug">
                      {globalError}
                    </p>
                    <p className="text-[11px] text-rose-400 mt-1">
                      Please check and try again
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 1: CREDENTIALS ═══════════ */}
              {loginStep === 'credentials' && (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      Email Address
                    </label>
                    <div className="relative group">
                      <div
                        className={clsx(
                          'absolute -inset-[1px] rounded-2xl transition-all duration-500 pointer-events-none',
                          focusedField === 'email'
                            ? 'bg-gradient-to-r from-violet-400/40 via-violet-300/30 to-sky-400/40 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r group-hover:from-violet-300/20 group-hover:to-sky-300/20'
                        )}
                      />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="admin@flybismillah.com"
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={clsx(
                          'relative w-full px-5 py-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-300',
                          'focus:bg-white focus:border-transparent focus:outline-none focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]',
                          errors.email && 'border-rose-300 bg-rose-50/50'
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1 h-1 bg-rose-500 rounded-full flex-shrink-0" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Password
                    </label>
                    <div className="relative group">
                      <div
                        className={clsx(
                          'absolute -inset-[1px] rounded-2xl transition-all duration-500 pointer-events-none',
                          focusedField === 'password'
                            ? 'bg-gradient-to-r from-violet-400/40 via-violet-300/30 to-sky-400/40 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r group-hover:from-violet-300/20 group-hover:to-sky-300/20'
                        )}
                      />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={clsx(
                          'relative w-full px-5 py-4 pr-14 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-300',
                          'focus:bg-white focus:border-transparent focus:outline-none focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]',
                          errors.password && 'border-rose-300 bg-rose-50/50'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 transition-colors duration-200 cursor-pointer rounded-lg hover:bg-slate-100/80"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1 h-1 bg-rose-500 rounded-full flex-shrink-0" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2.5 cursor-pointer group/check"
                    >
                      <div
                        className={clsx(
                          'w-[18px] h-[18px] rounded-md border transition-all duration-300 flex items-center justify-center flex-shrink-0',
                          rememberMe
                            ? 'bg-violet-500 border-violet-500 shadow-[0_2px_8px_-2px_rgba(139,92,246,0.4)]'
                            : 'bg-white border-slate-300 group-hover/check:border-slate-400'
                        )}
                      >
                        {rememberMe && (
                          <svg
                            className="w-3 h-3 text-white animate-in zoom-in duration-200"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[13px] text-slate-500 group-hover/check:text-slate-700 transition-colors font-medium select-none">
                        Remember me
                      </span>
                    </button>
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-semibold text-violet-500 hover:text-violet-700 transition-colors duration-200"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Security Info */}
                  <div className="flex items-start gap-3 bg-violet-50/50 border border-violet-100/60 rounded-xl p-3.5">
                    <div className="bg-violet-100 p-1 rounded-md flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Your session is secured with{' '}
                      <span className="text-violet-600 font-bold">256-bit encryption</span>.
                      We never store your password in plain text.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                    >
                      {/* Glow */}
                      <div
                        className={clsx(
                          'absolute -inset-1 bg-gradient-to-r from-violet-400 to-sky-400 rounded-[20px] blur-lg transition-all duration-500',
                          isSubmitting
                            ? 'opacity-5'
                            : 'opacity-15 group-hover/btn:opacity-30'
                        )}
                      />
                      {/* Surface */}
                      <div
                        className={clsx(
                          'relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300',
                          isSubmitting
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/15 group-hover/btn:shadow-xl group-hover/btn:shadow-slate-900/25 active:scale-[0.98]'
                        )}
                      >
                        {/* Shine */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.06] to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 opacity-70" />
                            Sign In to Dashboard
                            <ArrowRight className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all duration-300" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════ STEP 2: OTP ═══════════ */}
              {loginStep === '2fa' && (
                <form
                  onSubmit={onOtpVerify}
                  className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500"
                >
                  {/* Fingerprint Icon */}
                  <div className="flex justify-center py-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-300/20 rounded-full blur-2xl animate-pulse" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-violet-50 to-sky-50 rounded-full flex items-center justify-center ring-1 ring-violet-200 shadow-[0_8px_30px_-8px_rgba(139,92,246,0.2)]">
                        <Fingerprint
                          className="w-10 h-10 text-violet-500"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] text-center block">
                      Authentication Code
                    </label>
                    <OtpInput
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={isVerifyingOtp}
                    />
                  </div>

                  {/* Hint */}
                  <div className="flex items-center justify-center gap-2 text-[12px] text-slate-500 bg-slate-50/80 border border-slate-100 rounded-xl py-2.5 px-4">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Check your Google Authenticator or Authy app</span>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div
                      className={clsx(
                        'absolute -inset-1 bg-gradient-to-r from-violet-400 to-sky-400 rounded-[20px] blur-lg transition-all duration-500',
                        otpCode.length === 6 && !isVerifyingOtp
                          ? 'opacity-15 group-hover/btn:opacity-30'
                          : 'opacity-5'
                      )}
                    />
                    <div
                      className={clsx(
                        'relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300',
                        isVerifyingOtp || otpCode.length !== 6
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/15 active:scale-[0.98]'
                      )}
                    >
                      {isVerifyingOtp ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 opacity-70" />
                          Verify & Continue
                        </>
                      )}
                    </div>
                  </button>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setGlobalError(null);
                      setOtpCode('');
                    }}
                    className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-slate-900 transition-all duration-300 py-2 cursor-pointer group/back"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform duration-300" />
                    Back to login
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <div className="relative w-1.5 h-1.5">
                <div className="absolute inset-0 bg-emerald-400 rounded-full shadow-[0_0_6px_1px_rgba(16,185,129,0.3)]" />
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60" />
              </div>
              <span>All systems operational</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400">256-bit SSL</span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400">SOC2 Compliant</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Fly Bismillah · Unauthorized access is
            prohibited
          </p>
        </div>
      </div>

      {/* ════════════ KEYFRAMES ════════════ */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 0.1;
          }
          100% {
            transform: translateY(-30px) scale(1.8);
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
}