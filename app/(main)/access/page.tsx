// app/access/page.tsx

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
  Plane,
  Globe,
  Star,
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
      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);
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
            'w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all duration-300',
            'bg-white border-slate-200 text-slate-900 caret-blue-500',
            'focus:bg-blue-50/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:shadow-[0_0_20px_-4px_rgba(59,130,246,0.15)]',
            value[i] &&
              'bg-blue-50/50 border-blue-300 shadow-sm shadow-blue-100',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}

// ─── Animated Grid Background ───
function AnimatedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ── Subtle Grid Pattern ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Dot Pattern ── */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Large Gradient Blobs ── */}
      <div className="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/40 via-sky-50/30 to-transparent blur-[120px] animate-blob-slow" />
      <div className="absolute -bottom-[300px] -right-[200px] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-violet-100/35 via-purple-50/25 to-transparent blur-[120px] animate-blob-slow-reverse" />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-amber-50/30 via-orange-50/20 to-transparent blur-[100px] animate-blob-float" />
      <div className="absolute bottom-[30%] left-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-50/25 via-teal-50/15 to-transparent blur-[100px] animate-blob-drift" />

      {/* ── Top Light Beam ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-blue-50/40 via-sky-50/20 to-transparent rounded-full blur-[80px]" />

      {/* ── Bottom Light ── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-slate-100/50 to-transparent rounded-full blur-[60px]" />

      {/* ── Floating Orbs ── */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: `radial-gradient(circle, ${
              ['#93c5fd', '#a5b4fc', '#86efac', '#fcd34d', '#f9a8d4', '#67e8f9'][
                i
              ]
            } 0%, transparent 70%)`,
            top: `${12 + i * 15}%`,
            left: `${8 + i * 14}%`,
            animation: `floatOrb ${5 + i * 0.8}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.5}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* ── Decorative Shapes ── */}
      <div className="absolute top-[15%] right-[8%] w-16 h-16 border border-blue-200/20 rounded-2xl rotate-12 animate-spin-very-slow" />
      <div className="absolute bottom-[20%] left-[5%] w-12 h-12 border border-violet-200/20 rounded-full animate-bounce-very-slow" />
      <div className="absolute top-[60%] right-[15%] w-8 h-8 border border-amber-200/25 rounded-lg rotate-45 animate-pulse-slow" />
    </div>
  );
}

// ─── Decorative Travel Icons ───
function DecorativeIcons() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <Plane
        className="absolute top-[12%] right-[12%] w-5 h-5 text-blue-200/40 rotate-45 animate-float-icon"
        strokeWidth={1.5}
      />
      <Globe
        className="absolute bottom-[18%] left-[8%] w-6 h-6 text-violet-200/30 animate-spin-very-slow"
        strokeWidth={1}
      />
      <Star
        className="absolute top-[35%] left-[6%] w-4 h-4 text-amber-200/40 animate-pulse-slow"
        strokeWidth={1.5}
      />
      <Shield
        className="absolute bottom-[35%] right-[6%] w-4 h-4 text-emerald-200/35 animate-bounce-very-slow"
        strokeWidth={1.5}
      />
    </>
  );
}

// ─── Main Page ───
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>(
    'credentials'
  );
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
        credentials: 'include',
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

      toast.success('Welcome back! Redirecting...', {
        icon: '🎉',
        duration: 2000,
      });

      router.push(result.data?.redirectUrl || redirectUrl);
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
        credentials: 'include',
        body: JSON.stringify({ userId: tempUserId, code: otpCode }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setGlobalError(result.message || 'Invalid OTP code.');
        setIsVerifyingOtp(false);
        return;
      }

      toast.success('Identity verified!', { icon: '🔐' });
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setGlobalError('Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#f8fafc]">
      {/* ════════════ BACKGROUND ════════════ */}
      <AnimatedGrid />
      <DecorativeIcons />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div
        className={clsx(
          'w-full max-w-[480px] z-10 px-5 py-8 transition-all duration-1000 ease-out',
          mounted
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-[0.98]'
        )}
      >
        {/* ── Top Badge ── */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-2xl border border-white/80 rounded-full px-5 py-2.5 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)]">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_2px_rgba(16,185,129,0.3)]" />
              <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-40" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 tracking-[0.14em] uppercase">
              Secure Admin Portal
            </span>
            <div className="w-px h-3 bg-slate-200" />
            <Shield className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>

        {/* ── Logo ── */}
        <div className="flex justify-center mb-9">
          <div className="relative group cursor-pointer">
            {/* Outer glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/15 via-violet-400/10 to-sky-400/15 rounded-[28px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

            {/* Ring decoration */}
            <div className="absolute -inset-2 rounded-[22px] border border-blue-200/30 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />

            {/* Main icon container */}
            <div className="relative overflow-hidden rounded-2xl">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600" />

              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              {/* Inner pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '8px 8px',
                }}
              />

              <div className="relative p-4.5 sm:p-5">
                {loginStep === 'credentials' ? (
                  <KeyRound
                    className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                    strokeWidth={2}
                  />
                ) : (
                  <LockKeyhole
                    className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                    strokeWidth={2}
                  />
                )}
              </div>
            </div>

            {/* Shadow */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-3 bg-blue-500/10 rounded-full blur-md" />
          </div>
        </div>

        {/* ── Card ── */}
        <div className="relative group/card">
          {/* Card outer glow on hover */}
          <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/20 via-transparent to-violet-100/20 rounded-[40px] blur-3xl opacity-0 group-hover/card:opacity-100 transition-all duration-1000 pointer-events-none" />

          {/* Card shadow layers */}
          <div className="absolute inset-0 bg-white/40 rounded-[28px] blur-xl translate-y-4 pointer-events-none" />

          <div className="relative bg-white/80 backdrop-blur-3xl rounded-[28px] border border-white/70 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 inset-x-0 h-[3px]">
              <div className="h-full bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
              <div className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent blur-sm" />
            </div>

            {/* Subtle inner gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 via-transparent to-violet-50/10 pointer-events-none" />

            <div className="relative p-8 sm:p-10">
              {/* ── Header ── */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {loginStep === 'credentials' ? (
                    <span className="inline-flex items-center gap-2.5">
                      Welcome Back
                      <span className="relative">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 animate-ping opacity-20" />
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2.5">
                      Verify Identity
                      <Fingerprint className="w-6 h-6 text-blue-500" />
                    </span>
                  )}
                </h1>
                <p className="text-[13px] sm:text-sm text-slate-400 mt-3 font-medium leading-relaxed max-w-[300px] mx-auto">
                  {loginStep === 'credentials'
                    ? 'Sign in to access your administration dashboard'
                    : 'Enter the 6-digit code from your authenticator app'}
                </p>
              </div>

              {/* ── Error ── */}
              {globalError && (
                <div className="mb-6 bg-gradient-to-r from-rose-50 to-red-50/80 border border-rose-200/50 rounded-2xl p-4 flex items-start gap-3.5 animate-in zoom-in-95 fade-in duration-300 shadow-[0_4px_16px_-4px_rgba(244,63,94,0.08)]">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-rose-100 flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-rose-700 leading-snug">
                      {globalError}
                    </p>
                    <p className="text-[11px] text-rose-400/80 mt-1 font-medium">
                      Please check your details and try again
                    </p>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 1: CREDENTIALS ═══════════ */}
              {loginStep === 'credentials' && (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-600"
                >
                  {/* Email Field */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </label>
                    <div className="relative group/input">
                      {/* Focus ring animation */}
                      <div
                        className={clsx(
                          'absolute -inset-[2px] rounded-[18px] transition-all duration-500 pointer-events-none',
                          focusedField === 'email'
                            ? 'bg-gradient-to-r from-blue-400/30 via-blue-300/40 to-sky-400/30 opacity-100 blur-[1px]'
                            : 'opacity-0 group-hover/input:opacity-100 group-hover/input:bg-gradient-to-r group-hover/input:from-blue-200/20 group-hover/input:to-sky-200/20 group-hover/input:blur-[1px]'
                        )}
                      />
                      <div className="relative flex items-center">
                        <div
                          className={clsx(
                            'absolute left-4 transition-colors duration-300',
                            focusedField === 'email'
                              ? 'text-blue-500'
                              : 'text-slate-300'
                          )}
                        >
                          <Mail className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="admin@flybismillah.com"
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className={clsx(
                            'relative w-full pl-12 pr-5 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-300',
                            'focus:bg-white focus:border-blue-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.email &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400 focus:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)]'
                          )}
                        />
                      </div>
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0 animate-pulse" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-[0.16em] flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Password
                    </label>
                    <div className="relative group/input">
                      <div
                        className={clsx(
                          'absolute -inset-[2px] rounded-[18px] transition-all duration-500 pointer-events-none',
                          focusedField === 'password'
                            ? 'bg-gradient-to-r from-blue-400/30 via-blue-300/40 to-sky-400/30 opacity-100 blur-[1px]'
                            : 'opacity-0 group-hover/input:opacity-100 group-hover/input:bg-gradient-to-r group-hover/input:from-blue-200/20 group-hover/input:to-sky-200/20 group-hover/input:blur-[1px]'
                        )}
                      />
                      <div className="relative flex items-center">
                        <div
                          className={clsx(
                            'absolute left-4 transition-colors duration-300',
                            focusedField === 'password'
                              ? 'text-blue-500'
                              : 'text-slate-300'
                          )}
                        >
                          <Lock className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className={clsx(
                            'relative w-full pl-12 pr-14 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl text-slate-900 text-[15px] placeholder:text-slate-300 font-medium transition-all duration-300',
                            'focus:bg-white focus:border-blue-300 focus:outline-none focus:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
                            'hover:border-slate-200 hover:bg-white',
                            errors.password &&
                              'border-rose-200 bg-rose-50/30 focus:border-rose-400 focus:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)]'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className={clsx(
                            'absolute right-3 p-2.5 rounded-xl transition-all duration-300 cursor-pointer',
                            showPassword
                              ? 'text-blue-500 bg-blue-50 shadow-sm'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {showPassword ? (
                            <EyeOff className="w-[18px] h-[18px]" />
                          ) : (
                            <Eye className="w-[18px] h-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-500 font-semibold ml-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0 animate-pulse" />
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
                          'w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center flex-shrink-0',
                          rememberMe
                            ? 'bg-blue-500 border-blue-500 shadow-[0_2px_10px_-2px_rgba(59,130,246,0.4)] scale-105'
                            : 'bg-white border-slate-200 group-hover/check:border-blue-300 group-hover/check:bg-blue-50/30'
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
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[13px] text-slate-400 group-hover/check:text-slate-600 transition-colors font-medium select-none">
                        Remember me
                      </span>
                    </button>
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200 hover:underline underline-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Security Info Banner */}
                  <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50/60 to-sky-50/40 border border-blue-100/50 rounded-2xl p-4">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100/80 flex-shrink-0 mt-0.5">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Protected with{' '}
                      <span className="text-blue-600 font-bold">
                        256-bit encryption
                      </span>
                      . Your credentials are never stored in plain text.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                    >
                      {/* Glow effect */}
                      <div
                        className={clsx(
                          'absolute -inset-1.5 rounded-[22px] transition-all duration-500',
                          isSubmitting
                            ? 'opacity-0'
                            : 'bg-gradient-to-r from-blue-500/20 via-blue-400/15 to-violet-500/20 opacity-0 group-hover/btn:opacity-100 blur-xl'
                        )}
                      />

                      {/* Button surface */}
                      <div
                        className={clsx(
                          'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] tracking-wide transition-all duration-300 overflow-hidden',
                          isSubmitting
                            ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                            : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.35)] group-hover/btn:shadow-[0_12px_40px_-6px_rgba(59,130,246,0.45)] active:scale-[0.98] active:shadow-[0_4px_20px_-6px_rgba(59,130,246,0.35)]'
                        )}
                      >
                        {/* Animated shine */}
                        {!isSubmitting && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                        )}

                        {/* Bottom shine line */}
                        {!isSubmitting && (
                          <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        )}

                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Signing in...
                          </span>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 opacity-80" />
                            <span>Sign In to Dashboard</span>
                            <ArrowRight className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1.5 group-hover/btn:opacity-100 transition-all duration-300" />
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
                  {/* Fingerprint Visual */}
                  <div className="flex justify-center py-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-200/25 rounded-full blur-3xl animate-pulse scale-150" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 via-white to-sky-50 rounded-full flex items-center justify-center ring-2 ring-blue-100 shadow-[0_12px_40px_-8px_rgba(59,130,246,0.15)]">
                        <div className="absolute inset-2 border-2 border-dashed border-blue-200/40 rounded-full animate-spin-very-slow" />
                        <Fingerprint
                          className="w-12 h-12 text-blue-500"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-3.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em] text-center block">
                      Authentication Code
                    </label>
                    <OtpInput
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={isVerifyingOtp}
                    />
                  </div>

                  {/* Hint */}
                  <div className="flex items-center justify-center gap-2.5 text-[12px] text-slate-400 bg-slate-50/80 border border-slate-100 rounded-2xl py-3 px-4">
                    <Smartphone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span>
                      Open{' '}
                      <span className="font-semibold text-slate-500">
                        Google Authenticator
                      </span>{' '}
                      or Authy
                    </span>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="relative w-full group/btn cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div
                      className={clsx(
                        'absolute -inset-1.5 rounded-[22px] transition-all duration-500',
                        otpCode.length === 6 && !isVerifyingOtp
                          ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 opacity-0 group-hover/btn:opacity-100 blur-xl'
                          : 'opacity-0'
                      )}
                    />
                    <div
                      className={clsx(
                        'relative flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-[15px] transition-all duration-300 overflow-hidden',
                        isVerifyingOtp || otpCode.length !== 6
                          ? 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_30px_-6px_rgba(59,130,246,0.35)] active:scale-[0.98]'
                      )}
                    >
                      {!isVerifyingOtp && otpCode.length === 6 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                      )}
                      {isVerifyingOtp ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 opacity-80" />
                          Verify & Continue
                        </>
                      )}
                    </div>
                  </button>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('credentials');
                      setGlobalError(null);
                      setOtpCode('');
                    }}
                    className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-blue-600 transition-all duration-300 py-2 cursor-pointer group/back rounded-xl hover:bg-blue-50/50"
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
        <div className="mt-10 text-center space-y-4">
          {/* Status indicators */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { label: 'Systems Online', color: 'emerald' },
              { label: '256-bit SSL', color: 'blue' },
              { label: 'SOC2', color: 'violet' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium"
              >
                <div
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    item.color === 'emerald' &&
                      'bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.3)]',
                    item.color === 'blue' &&
                      'bg-blue-400 shadow-[0_0_6px_1px_rgba(59,130,246,0.3)]',
                    item.color === 'violet' &&
                      'bg-violet-400 shadow-[0_0_6px_1px_rgba(139,92,246,0.3)]'
                  )}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-300 font-medium tracking-wide">
            © {new Date().getFullYear()}{' '}
            <span className="text-slate-400 font-semibold">Fly Bismillah</span>{' '}
            · All rights reserved
          </p>
        </div>
      </div>

      {/* ════════════ CUSTOM KEYFRAMES ════════════ */}
      <style jsx>{`
        @keyframes floatOrb {
          0% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-40px) translateX(15px) scale(1.5);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}