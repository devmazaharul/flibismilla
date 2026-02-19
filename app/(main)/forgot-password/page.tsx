'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  ArrowRight,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Send,
  Inbox,
  MailCheck,
  Clock,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import axios, { isAxiosError } from 'axios';

// ─── Schema ───
const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});
type ForgotFormData = z.infer<typeof forgotSchema>;

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
export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => setMounted(true), []);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
      await axios.post('/api/auth/forgot-password', data);
      setSentEmail(data.email);
      setIsSent(true);
      setCountdown(60);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        setServerError(
          error.response.data.message || 'Something went wrong. Please try again.'
        );
      } else {
        setServerError('Connection failed. Please check your internet.');
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setServerError(null);
    try {
      await axios.post('/api/auth/forgot-password', { email: sentEmail });
      setCountdown(60);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        setServerError(error.response.data.message || 'Failed to resend.');
      }
    }
  };

  // Mask email for display
  const maskedEmail = sentEmail
    ? sentEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '•'.repeat(b.length) + c)
    : '';

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
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-200/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[55%] w-[400px] h-[400px] bg-rose-100/20 rounded-full blur-[130px]" />
        <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] bg-sky-100/25 rounded-full blur-[120px]" />

        {/* Radial spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-100/20 to-transparent rounded-full blur-[60px]" />

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
        {/* ── Badge ── */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full px-4 py-2 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
            <div className="relative flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="absolute w-2 h-2 bg-emerald-400/50 rounded-full animate-ping" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 tracking-[0.12em] uppercase">
              Account Recovery
            </span>
          </div>
        </div>

        {/* ── Logo Icon ── */}
        <div className="flex justify-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/20 to-violet-400/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="absolute -inset-1 bg-gradient-to-br from-amber-400/30 to-violet-400/30 rounded-[20px] opacity-50 blur-sm" />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 ring-1 ring-slate-700/50 shadow-xl shadow-slate-900/20">
              {isSent ? (
                <MailCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
              ) : (
                <KeyRound className="w-7 h-7 text-white" strokeWidth={2.2} />
              )}
            </div>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="relative group/card">
          {/* Card shadow layers */}
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-200/20 via-transparent to-violet-200/20 rounded-[40px] blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-white/50 rounded-[32px] blur-xl pointer-events-none" />

          <div className="relative bg-white/70 backdrop-blur-2xl rounded-[32px] border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            <div className="p-8 sm:p-10">
              {/* ═══════════ SUCCESS STATE ═══════════ */}
              {isSent ? (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
                      <span className="inline-flex items-center gap-2">
                        Check Your Inbox
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      </span>
                    </h1>
                    <p className="text-[13px] sm:text-sm text-slate-500 mt-2.5 font-medium leading-relaxed max-w-[300px] mx-auto">
                      We&apos;ve sent a password reset link to your email
                    </p>
                  </div>

                  {/* Success Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400/15 rounded-full blur-2xl animate-pulse" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center ring-1 ring-emerald-200 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.25)]">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Email Display Card */}
                  <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-100 p-2.5 rounded-xl ring-1 ring-violet-200/60 flex-shrink-0">
                        <Inbox className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                          Sent to
                        </p>
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {maskedEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step Instructions */}
                  <div className="space-y-2.5 mb-8">
                    {[
                      { step: '1', text: 'Open the email we just sent you', icon: Mail },
                      { step: '2', text: 'Click the password reset link', icon: ArrowRight },
                      { step: '3', text: 'Create your new password', icon: KeyRound },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="flex items-center gap-3 bg-slate-50/60 border border-slate-100 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-[11px] font-bold text-white">
                            {item.step}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-600 font-medium">
                          {item.text}
                        </p>
                        <item.icon className="w-3.5 h-3.5 text-slate-300 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Resend */}
                    <button
                      onClick={handleResend}
                      disabled={countdown > 0}
                      className={clsx(
                        'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-[13px] transition-all duration-300 border cursor-pointer disabled:cursor-not-allowed',
                        countdown > 0
                          ? 'bg-slate-50 border-slate-100 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]'
                      )}
                    >
                      {countdown > 0 ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Resend in {countdown}s
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Didn&apos;t receive? Resend
                        </>
                      )}
                    </button>

                    {/* Back to Login */}
                    <Link href="/access" className="block">
                      <div className="relative w-full group/btn cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-violet-500 rounded-[20px] blur-lg opacity-15 group-hover/btn:opacity-30 transition-all duration-500" />
                        <div className="relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/15 group-hover/btn:shadow-xl group-hover/btn:shadow-slate-900/20 active:scale-[0.98] transition-all duration-300">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.05] to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          <ArrowLeft className="w-5 h-5 opacity-70 group-hover/btn:-translate-x-1 group-hover/btn:opacity-100 transition-all duration-300" />
                          Back to Login
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Spam notice */}
                  <div className="flex items-start gap-2 mt-5 bg-amber-50/60 border border-amber-100/80 rounded-xl p-3">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Can&apos;t find the email? Check your{' '}
                      <span className="font-semibold text-slate-700">spam folder</span>{' '}
                      or make sure you entered the correct address.
                    </p>
                  </div>
                </div>
              ) : (
                /* ═══════════ FORM STATE ═══════════ */
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[11px] font-bold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full ring-1 ring-amber-200/60 mb-4">
                      <KeyRound className="w-3 h-3" />
                      Password Recovery
                    </div>
                    <h1 className="text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
                      <span className="inline-flex items-center gap-2">
                        Forgot Password?
                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      </span>
                    </h1>
                    <p className="text-[13px] sm:text-sm text-slate-500 mt-2.5 font-medium leading-relaxed max-w-[300px] mx-auto">
                      No worries! Enter your email and we&apos;ll send you reset
                      instructions.
                    </p>
                  </div>

                  {/* Server Error */}
                  {serverError && (
                    <div className="mb-6 bg-rose-50 border border-rose-200/60 rounded-2xl p-4 flex items-start gap-3 animate-in zoom-in-95 fade-in duration-300">
                      <div className="bg-rose-100 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-rose-700 leading-snug">
                          {serverError}
                        </p>
                        <p className="text-[11px] text-rose-400 mt-1">
                          Please check and try again
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Email Field */}
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
                              ? 'bg-gradient-to-r from-amber-400/40 via-amber-300/30 to-violet-400/40 opacity-100'
                              : 'opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-r group-hover:from-amber-300/20 group-hover:to-violet-300/20'
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
                            'focus:bg-white focus:border-transparent focus:outline-none focus:shadow-[0_0_0_4px_rgba(245,158,11,0.1)]',
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

                    {/* Security Info Box */}
                    <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-200/40 rounded-xl p-3.5">
                      <div className="bg-amber-100 p-1 rounded-md flex-shrink-0 mt-0.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">
                        For security, the reset link will expire in{' '}
                        <span className="text-amber-600 font-bold">15 minutes</span>.
                        You can only request 3 resets per hour.
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
                            'absolute -inset-1 bg-gradient-to-r from-amber-400 to-violet-500 rounded-[20px] blur-lg transition-all duration-500',
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
                          {/* Shine overlay */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.06] to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none" />

                          {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              Send Reset Link
                              <ArrowRight className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all duration-300" />
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </form>

                  {/* Divider & Back */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <Link
                      href="/access"
                      className="flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-slate-900 transition-all duration-300 group/back"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform duration-300" />
                      Back to Login
                    </Link>
                  </div>
                </div>
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