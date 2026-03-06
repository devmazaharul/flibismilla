// app/(auth)/register/page.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Lock, Phone, Eye, EyeOff, Loader2, Check, X,
  ArrowRight, Shield, Plane, Globe, Sparkles, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// Password Strength
// ==========================================
function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '', bg: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(score, 4);

  const levels = [
    { label: '', color: '', bg: '' },
    { label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-500' },
    { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-500' },
    { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' },
    { label: 'Strong', color: 'text-emerald-600', bg: 'bg-emerald-500' },
  ];
  return { score, ...levels[score] };
}

// ==========================================
// Password Requirements
// ==========================================
function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  const reqs = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {reqs.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5">
          {r.met
            ? <Check size={11} className="text-emerald-500 flex-shrink-0" />
            : <X size={11} className="text-slate-300 flex-shrink-0" />
          }
          <span className={`text-[10px] font-medium ${r.met ? 'text-emerald-600' : 'text-slate-400'}`}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// Input Field
// ==========================================
function InputField({
  label, type = 'text', value, onChange, placeholder, icon,
  required = false, error, disabled, autoComplete, children,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; required?: boolean; error?: string;
  disabled?: boolean; autoComplete?: string; children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required} disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full h-11 pl-10 pr-4 border rounded-xl text-sm outline-none transition-all duration-200
            ${error
              ? 'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
              : 'border-slate-200 bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100'}
            placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {children}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ==========================================
// Feature Card (Left Panel)
// ==========================================
function FeatureCard({ icon, title, desc }: {
  icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=success

  const pwStrength = getPasswordStrength(form.password);

  // Clear error on type
  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  // ═══ Validate ═══
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be 2+ characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Min 6 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Need uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Need lowercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Need a number';

    if (!form.confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";

    if (form.phone) {
      const c = form.phone.replace(/[\s\-()]/g, '');
      if (c.length < 10) errs.phone = 'Invalid phone number';
    }

    if (!form.agreeToTerms) errs.terms = 'You must agree to terms';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ═══ Submit ═══
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          phone: form.phone.trim() || null,
          agreeToTerms: form.agreeToTerms,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Account created successfully!');
        setStep(2);
        setTimeout(() => router.push('/dashboard'), 2500);
      } else {
        if (data.field) setErrors((prev) => ({ ...prev, [data.field]: data.message }));
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════
  // SUCCESS STATE
  // ═══════════════════════════════
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] p-4">
        <div className="w-full max-w-md text-center">
          {/* Animated check */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/25">
              <Check size={36} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Aboard! 🎉</h1>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            Your admin account has been created successfully. Redirecting you to the dashboard…
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-[progressBar_2.5s_ease-in-out]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-4">
            <Loader2 size={14} className="animate-spin" />
            <span>Redirecting…</span>
          </div>

          <style jsx>{`
            @keyframes progressBar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  // REGISTRATION FORM
  // ═══════════════════════════════
  return (
    <div className="min-h-screen flex">

      {/* ═══════════════════════════════
          LEFT PANEL — Branding
      ═══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />

        {/* Decorative blurs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Plane size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg tracking-tight">FlyBismillah</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Admin Panel</p>
              </div>
            </div>

            {/* Hero */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/10">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-white/80">Trusted by travel agencies</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
                Manage Your<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Travel Business
                </span><br />
                With Confidence
              </h2>

              <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                Create your admin account to access the complete travel management
                dashboard — bookings, customers, destinations and more.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 my-8">
            <FeatureCard
              icon={<Shield size={16} className="text-emerald-400" />}
              title="Role-Based Access"
              desc="Granular permissions for every team member"
            />
            <FeatureCard
              icon={<Globe size={16} className="text-blue-400" />}
              title="Multi-Location"
              desc="Manage destinations and packages worldwide"
            />
            <FeatureCard
              icon={<Sparkles size={16} className="text-amber-400" />}
              title="Real-Time Analytics"
              desc="Live dashboard with booking insights"
            />
          </div>

          {/* Bottom */}
          <div className="flex items-center justify-between text-[11px] text-white/30 pt-6 border-t border-white/5">
            <p>© {new Date().getFullYear()} FlyBismillah</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
          RIGHT PANEL — Form
      ═══════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[440px]">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <Plane size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">FlyBismillah</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* ═══ Form ═══ */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <InputField label="Full Name" value={form.name}
              onChange={(v) => updateField('name', v)} placeholder="Enter your full name"
              icon={<User size={16} />} required error={errors.name}
              disabled={loading} autoComplete="name" />

            {/* Email */}
            <InputField label="Email Address" type="email" value={form.email}
              onChange={(v) => updateField('email', v)} placeholder="admin@company.com"
              icon={<Mail size={16} />} required error={errors.email}
              disabled={loading} autoComplete="email" />

            {/* Phone */}
            <InputField label="Phone Number" type="tel" value={form.phone}
              onChange={(v) => updateField('phone', v)} placeholder="+880 1XXX XXXXXX (optional)"
              icon={<Phone size={16} />} error={errors.phone}
              disabled={loading} autoComplete="tel" />

            {/* Password */}
            <div>
              <InputField label="Password" type={showPw ? 'text' : 'password'}
                value={form.password} onChange={(v) => updateField('password', v)}
                placeholder="Create a strong password"
                icon={<Lock size={16} />} required error={errors.password}
                disabled={loading} autoComplete="new-password">
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </InputField>

              {/* Strength Bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex gap-1 flex-1 mr-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${i <= pwStrength.score ? pwStrength.bg : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${pwStrength.color}`}>
                      {pwStrength.label}
                    </span>
                  </div>
                  <PasswordRequirements password={form.password} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <InputField label="Confirm Password" type={showConfirmPw ? 'text' : 'password'}
                value={form.confirmPassword} onChange={(v) => updateField('confirmPassword', v)}
                placeholder="Re-enter your password"
                icon={<Lock size={16} />} required error={errors.confirmPassword}
                disabled={loading} autoComplete="new-password">
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </InputField>

              {/* Match indicator */}
              {form.confirmPassword && form.password && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {form.password === form.confirmPassword ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X size={12} className="text-rose-500" />
                      <span className="text-[11px] text-rose-600 font-medium">Passwords don&apos;t match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={form.agreeToTerms}
                    onChange={(e) => updateField('agreeToTerms', e.target.checked)}
                    className="sr-only" disabled={loading} />
                  <div className={`w-[18px] h-[18px] rounded-md border-2 transition-all duration-200
                    flex items-center justify-center
                    ${form.agreeToTerms
                      ? 'bg-slate-900 border-slate-900'
                      : errors.terms
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                    {form.agreeToTerms && <Check size={12} className="text-white" />}
                  </div>
                </div>
                <span className="text-[12px] text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <button type="button" className="text-blue-600 font-medium hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="text-blue-600 font-medium hover:underline">Privacy Policy</button>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 ml-[30px] text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm
                font-semibold flex items-center justify-center gap-2 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15
                active:scale-[0.99]">
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#f8f9fb] px-3 text-slate-400 font-medium">Secure registration</span>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield size={12} /> <span>256-bit SSL</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Lock size={12} /> <span>Encrypted</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>GDPR Compliant</span>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 mt-6">
            © {new Date().getFullYear()} FlyBismillah. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}