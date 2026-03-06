// app/admin/security/page.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Fingerprint,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Copy,
  Check,
  X,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
  Activity,
  Wifi,
  Zap,
  Star,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  QrCode,
  Scan,
  Download,
  Mail,
  Bell,
  BellRing,
  Timer,
  History,
  Trash2,
  RotateCcw,
  BadgeCheck,
  Server,
  Hash,
  ExternalLink,
  Sparkles,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface IProfile {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  adminId: string;
  role: 'admin' | 'editor' | 'viewer';
  status: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  isOnline: boolean;
  lastLogin: string;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  failedLoginAttempts: number;
  lockUntil: string | null;
}

interface ICurrentSession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActive: string;
}

interface IProfileStats {
  totalActiveSessions: number;
  totalLoginHistory: number;
}

interface IRecentActivity {
  _id: string;
  action: string;
  actionLabel: string;
  details: string;
  createdAt: string;
  timeAgo: string;
  ip?: string;
  device?: string;
}

type SecurityStep = 'overview' | 'setup-2fa' | 'verify-2fa' | 'disable-2fa';

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getTimeSince(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function getInitials(name?: string): string {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
}

function getSecurityScore(profile: IProfile, stats: IProfileStats | null): number {
  let score = 30; // base
  if (profile.isVerified) score += 15;
  if (profile.isTwoFactorEnabled) score += 30;
  if (profile.phone) score += 5;
  if ((stats?.totalActiveSessions || 1) <= 3) score += 10;
  if (profile.status === 'active') score += 10;
  return Math.min(score, 100);
}

function getScoreColor(score: number): {
  text: string;
  bg: string;
  bar: string;
  label: string;
  icon: React.ElementType;
} {
  if (score >= 80)
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      bar: 'from-emerald-400 to-emerald-500',
      label: 'Excellent',
      icon: ShieldCheck,
    };
  if (score >= 60)
    return {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      bar: 'from-blue-400 to-blue-500',
      label: 'Good',
      icon: Shield,
    };
  if (score >= 40)
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      bar: 'from-amber-400 to-amber-500',
      label: 'Fair',
      icon: ShieldAlert,
    };
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    bar: 'from-rose-400 to-rose-500',
    label: 'Weak',
    icon: ShieldOff,
  };
}

// ═══════════════════════════════════════
// SECURITY SCORE RING
// ═══════════════════════════════════════

function SecurityScoreRing({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) {
  const scoreColor = getScoreColor(score);
  const ScoreIcon = scoreColor.icon;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const [animatedScore, setAnimatedScore] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= score) {
          clearInterval(interval);
          setAnimatedScore(score);
        } else {
          setAnimatedScore(current);
        }
      }, 15);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              className={clsx(
                score >= 80
                  ? 'text-emerald-400'
                  : score >= 60
                    ? 'text-blue-400'
                    : score >= 40
                      ? 'text-amber-400'
                      : 'text-rose-400'
              )}
              stopColor="currentColor"
            />
            <stop
              offset="100%"
              className={clsx(
                score >= 80
                  ? 'text-emerald-600'
                  : score >= 60
                    ? 'text-blue-600'
                    : score >= 40
                      ? 'text-amber-600'
                      : 'text-rose-600'
              )}
              stopColor="currentColor"
            />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">
          {animatedScore}
        </span>
        <span
          className={clsx(
            'text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
            scoreColor.bg,
            scoreColor.text
          )}
        >
          {scoreColor.label}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SECURITY CHECK ITEM
// ═══════════════════════════════════════

function SecurityCheckItem({
  icon: Icon,
  title,
  description,
  status,
  action,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
  action?: React.ReactNode;
  color: string;
}) {
  const statusConfig = {
    pass: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-100',
      label: 'Secure',
    },
    warn: {
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-100',
      label: 'Warning',
    },
    fail: {
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50 border-rose-100',
      label: 'Action Required',
    },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-all duration-300">
      {/* Icon */}
      <div
        className={clsx(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              {title}
              <StatusIcon className={clsx('w-4 h-4', statusConfig[status].color)} />
            </h4>
            <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 2FA SETUP STEP
// ═══════════════════════════════════════

function TwoFactorSetup({
  profile,
  onComplete,
  onCancel,
}: {
  profile: IProfile;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = React.useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');
  const [secret, setSecret] = React.useState<string>('');
  const [otpCode, setOtpCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [copiedSecret, setCopiedSecret] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Generate QR code
  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        '/api/auth/2fa/setup',
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        setQrCodeUrl(response.data.data.qrCode || '');
        setSecret(response.data.data.secret || '');
        setStep('qr');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to setup 2FA');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await axios.post(
        '/api/auth/2fa/verify',
        { code: otpCode },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Two-factor authentication enabled! 🎉');
        onComplete();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Invalid code. Try again.');
      }
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  // OTP input handler
  const handleOtpChange = (index: number, char: string) => {
    if (!/^[0-9]?$/.test(char)) return;
    const arr = otpCode.split('');
    arr[index] = char;
    const newVal = arr.join('').replace(/undefined/g, '');
    setOtpCode(newVal.slice(0, 6));
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const arr = otpCode.split('');
      arr[index - 1] = '';
      setOtpCode(arr.join(''));
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtpCode(pasted);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success('Secret key copied!');
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* ── Intro Step ── */}
      {step === 'intro' && (
        <div className="text-center space-y-6 py-4">
          {/* Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200/20 rounded-full blur-3xl scale-150" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-blue-50 via-white to-violet-50 rounded-full flex items-center justify-center ring-2 ring-blue-100 shadow-[0_12px_40px_-8px_rgba(59,130,246,0.15)]">
                <div className="absolute inset-3 border-2 border-dashed border-blue-200/40 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
                <Fingerprint className="w-14 h-14 text-blue-500" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Enable Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
              Add an extra layer of security. You&apos;ll need to enter a code from your
              authenticator app each time you sign in.
            </p>
          </div>

          {/* Steps preview */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { step: '1', label: 'Install App', icon: Smartphone },
              { step: '2', label: 'Scan QR Code', icon: QrCode },
              { step: '3', label: 'Enter Code', icon: Hash },
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-[11px] font-extrabold text-blue-700">
                      {item.step}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[12px] font-bold text-gray-700">{item.label}</p>
                  </div>
                </div>
                {index < 2 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Supported apps */}
          <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Supported Apps
            </p>
            <div className="flex items-center justify-center gap-3">
              {['Google Authenticator', 'Authy', 'Microsoft Authenticator'].map(
                (app) => (
                  <span
                    key={app}
                    className="text-[11px] font-semibold text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200"
                  >
                    {app}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-[14px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSetup}
              disabled={isLoading}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed',
                isLoading
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Get Started
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── QR Code Step ── */}
      {step === 'qr' && (
        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
              1
            </div>
            <div className="w-16 h-1 bg-blue-500 rounded-full" />
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
              2
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full" />
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[11px] font-bold">
              3
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-extrabold text-gray-900">Scan QR Code</h3>
            <p className="text-[13px] text-gray-400 mt-1">
              Open your authenticator app and scan this QR code
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-lg">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-300" />
                </div>
              )}
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
            </div>
          </div>

          {/* Manual entry */}
          <div className="max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Or enter manually
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <code className="flex-1 text-[13px] font-mono font-bold text-gray-700 break-all select-all">
                {secret || 'XXXX XXXX XXXX XXXX'}
              </code>
              <button
                onClick={copySecret}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer shrink-0"
              >
                {copiedSecret ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="max-w-sm mx-auto bg-amber-50 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <span className="font-bold">Important:</span> Save this secret key in a safe place.
              You&apos;ll need it to recover your account if you lose your authenticator app.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setStep('intro')}
              className="px-5 py-3 rounded-xl text-[14px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep('verify')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98] transition-all cursor-pointer"
            >
              I&apos;ve Scanned It
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Verify Step ── */}
      {step === 'verify' && (
        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
              ✓
            </div>
            <div className="w-16 h-1 bg-blue-500 rounded-full" />
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
              ✓
            </div>
            <div className="w-16 h-1 bg-blue-500 rounded-full" />
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
              3
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-extrabold text-gray-900">Enter Verification Code</h3>
            <p className="text-[13px] text-gray-400 mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Fingerprint visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200/20 rounded-full blur-2xl scale-150 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-50 to-violet-50 rounded-full flex items-center justify-center ring-2 ring-blue-100">
                <Fingerprint className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* OTP Input */}
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
                disabled={isVerifying}
                value={otpCode[i] || ''}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                autoFocus={i === 0}
                className={clsx(
                  'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-300',
                  'bg-white text-gray-900 caret-blue-500',
                  'focus:border-blue-400 focus:ring-4 focus:ring-blue-50 focus:shadow-[0_0_20px_-4px_rgba(59,130,246,0.15)]',
                  otpCode[i]
                    ? 'bg-blue-50/50 border-blue-300 shadow-sm'
                    : 'border-gray-200',
                  isVerifying && 'opacity-50 cursor-not-allowed'
                )}
              />
            ))}
          </div>

          {/* Helper text */}
          <div className="flex items-center justify-center gap-2 text-[12px] text-gray-400">
            <Smartphone className="w-4 h-4 text-gray-300" />
            <span>
              Check your{' '}
              <span className="font-semibold text-gray-500">authenticator app</span> for the code
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStep('qr');
                setOtpCode('');
              }}
              className="px-5 py-3 rounded-xl text-[14px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isVerifying || otpCode.length !== 6}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed',
                isVerifying || otpCode.length !== 6
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-[0.98]'
              )}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Enable
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SECURITY RECOMMENDATION
// ═══════════════════════════════════════

function RecommendationCard({
  icon: Icon,
  title,
  description,
  priority,
  action,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: React.ReactNode;
  color: string;
}) {
  const priorityConfig = {
    high: { label: 'High', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { label: 'Low', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300">
      <div
        className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-[14px] font-bold text-gray-900">{title}</h4>
          <span
            className={clsx(
              'px-1.5 py-0.5 rounded-md text-[9px] font-bold border',
              priorityConfig[priority].color
            )}
          >
            {priorityConfig[priority].label}
          </span>
        </div>
        <p className="text-[12px] text-gray-400 leading-relaxed">{description}</p>
        <div className="mt-3">{action}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function SecurityPage() {
  const router = useRouter();

  const [profile, setProfile] = React.useState<IProfile | null>(null);
  const [currentSession, setCurrentSession] = React.useState<ICurrentSession | null>(null);
  const [profileStats, setProfileStats] = React.useState<IProfileStats | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<IRecentActivity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showSetup2FA, setShowSetup2FA] = React.useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = React.useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = React.useState(false);
  const [disableCode, setDisableCode] = React.useState('');

  // Fetch profile
  const fetchProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/auth/profile', { withCredentials: true });
      if (response.data.success && response.data.data) {
        setProfile(response.data.data.profile);
        setCurrentSession(response.data.data.currentSession || null);
        setProfileStats(response.data.data.stats || null);
        setRecentActivity(response.data.data.recentActivity || []);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/access');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error('Enter your 6-digit code');
      return;
    }
    setIsDisabling2FA(true);
    try {
      const response = await axios.post(
        '/api/auth/2fa/disable',
        { code: disableCode },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Two-factor authentication disabled');
        setShowDisable2FADialog(false);
        setDisableCode('');
        fetchProfile();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to disable 2FA');
      }
    } finally {
      setIsDisabling2FA(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="w-40 h-5 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-56 h-3 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center h-80 animate-pulse">
              <div className="w-40 h-40 bg-gray-100 rounded-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="w-40 h-4 bg-gray-100 rounded" />
                      <div className="w-64 h-3 bg-gray-50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const securityScore = getSecurityScore(profile, profileStats);
  const scoreColor = getScoreColor(securityScore);

  // Build security checks
  const securityChecks = [
    {
      icon: Lock,
      title: 'Password Protection',
      description: 'Your account is password protected',
      status: 'pass' as const,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Fingerprint,
      title: 'Two-Factor Authentication',
      description: profile.isTwoFactorEnabled
        ? '2FA is enabled and protecting your account'
        : 'Enable 2FA for an extra layer of security',
      status: profile.isTwoFactorEnabled ? ('pass' as const) : ('fail' as const),
      color: profile.isTwoFactorEnabled
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-rose-50 text-rose-600',
      action: (
        <button
          onClick={() =>
            profile.isTwoFactorEnabled
              ? setShowDisable2FADialog(true)
              : setShowSetup2FA(true)
          }
          className={clsx(
            'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer active:scale-[0.97]',
            profile.isTwoFactorEnabled
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-blue-500 text-white shadow-md shadow-blue-500/20 hover:bg-blue-600'
          )}
        >
          {profile.isTwoFactorEnabled ? 'Manage' : 'Enable'}
        </button>
      ),
    },
    {
      icon: BadgeCheck,
      title: 'Email Verification',
      description: profile.isVerified
        ? `${profile.email} is verified`
        : 'Verify your email address',
      status: profile.isVerified ? ('pass' as const) : ('warn' as const),
      color: profile.isVerified
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-amber-50 text-amber-600',
    },
    {
      icon: Monitor,
      title: 'Active Sessions',
      description: `${profileStats?.totalActiveSessions || 1} active session(s) detected`,
      status:
        (profileStats?.totalActiveSessions || 1) <= 3
          ? ('pass' as const)
          : ('warn' as const),
      color:
        (profileStats?.totalActiveSessions || 1) <= 3
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-amber-50 text-amber-600',
      action: (
        <Link
          href="/admin/sessions"
          className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1"
        >
          View
          <ChevronRight className="w-3 h-3" />
        </Link>
      ),
    },
    {
      icon: Smartphone,
      title: 'Phone Number',
      description: profile.phone
        ? 'Recovery phone number is set'
        : 'Add a phone for account recovery',
      status: profile.phone ? ('pass' as const) : ('warn' as const),
      color: profile.phone
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-amber-50 text-amber-600',
      action: !profile.phone ? (
        <Link
          href="/admin/profile"
          className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1"
        >
          Add
          <ChevronRight className="w-3 h-3" />
        </Link>
      ) : undefined,
    },
  ];

  // Build recommendations
  const recommendations = [];
  if (!profile.isTwoFactorEnabled) {
    recommendations.push({
      icon: Fingerprint,
      title: 'Enable Two-Factor Authentication',
      description:
        'Protect your account with an authenticator app. This is the most important security measure.',
      priority: 'high' as const,
      color: 'bg-rose-50 text-rose-600',
      action: (
        <button
          onClick={() => setShowSetup2FA(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-all cursor-pointer active:scale-[0.97]"
        >
          <Zap className="w-3 h-3" />
          Enable Now
        </button>
      ),
    });
  }
  if (!profile.phone) {
    recommendations.push({
      icon: Smartphone,
      title: 'Add Recovery Phone',
      description: 'A phone number helps you recover your account if you lose access.',
      priority: 'medium' as const,
      color: 'bg-amber-50 text-amber-600',
      action: (
        <Link
          href="/admin/profile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          Add Phone
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    });
  }
  if ((profileStats?.totalActiveSessions || 1) > 3) {
    recommendations.push({
      icon: Monitor,
      title: 'Review Active Sessions',
      description: `You have ${profileStats?.totalActiveSessions} active sessions. Review and remove unused ones.`,
      priority: 'medium' as const,
      color: 'bg-amber-50 text-amber-600',
      action: (
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          Review
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    });
  }

  // Filter security-related activities
  const securityActivities = recentActivity
    .filter((a) =>
      [
        'login',
        'failed_login',
        'changed_password',
        'failed_password_change',
        'self_logout',
        'self_logout_all',
        'force_logout_session',
        'password_reset_requested',
        'password_reset_completed',
      ].includes(a.action)
    )
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Security
            </h1>
            <p className="text-sm text-gray-400 mt-1 ml-[52px]">
              Manage your account security and authentication
            </p>
          </div>
          <button
            onClick={() => fetchProfile()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-sm active:scale-[0.97] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* 2FA Setup Flow */}
        {showSetup2FA && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <TwoFactorSetup
              profile={profile}
              onComplete={() => {
                setShowSetup2FA(false);
                fetchProfile();
              }}
              onCancel={() => setShowSetup2FA(false)}
            />
          </div>
        )}

        {/* Main Content (hidden during 2FA setup) */}
        {!showSetup2FA && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Left: Security Score ── */}
            <div className="space-y-6">
              {/* Score Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Security Score
                </h3>
                <div className="flex justify-center mb-5">
                  <SecurityScoreRing score={securityScore} />
                </div>
                <p className="text-center text-[12px] text-gray-400 leading-relaxed">
                  {securityScore >= 80
                    ? 'Great job! Your account is well protected.'
                    : securityScore >= 60
                      ? 'Good, but there are ways to improve.'
                      : 'Your security needs attention. Take action now.'}
                </p>

                {/* Score breakdown */}
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  {[
                    { label: 'Password', value: 30, max: 30, enabled: true },
                    {
                      label: 'Two-Factor Auth',
                      value: profile.isTwoFactorEnabled ? 30 : 0,
                      max: 30,
                      enabled: profile.isTwoFactorEnabled,
                    },
                    {
                      label: 'Email Verified',
                      value: profile.isVerified ? 15 : 0,
                      max: 15,
                      enabled: profile.isVerified,
                    },
                    {
                      label: 'Phone Number',
                      value: profile.phone ? 5 : 0,
                      max: 5,
                      enabled: !!profile.phone,
                    },
                    {
                      label: 'Session Control',
                      value: (profileStats?.totalActiveSessions || 1) <= 3 ? 10 : 0,
                      max: 10,
                      enabled: (profileStats?.totalActiveSessions || 1) <= 3,
                    },
                    {
                      label: 'Account Status',
                      value: profile.status === 'active' ? 10 : 0,
                      max: 10,
                      enabled: profile.status === 'active',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-500 truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            +{item.value}/{item.max}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all duration-700',
                              item.enabled
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : 'bg-gray-200'
                            )}
                            style={{
                              width: `${(item.value / item.max) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      {item.enabled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/admin/change-password"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <KeyRound className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800">Change Password</p>
                      <p className="text-[10px] text-gray-400">Update your password</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>

                  <Link
                    href="/admin/sessions"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Monitor className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
                        Active Sessions
                        {(profileStats?.totalActiveSessions || 1) > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                            {profileStats?.totalActiveSessions}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400">Manage devices</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>

                  <Link
                    href="/admin/activity-log"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Activity className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800">Activity Log</p>
                      <p className="text-[10px] text-gray-400">View security events</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Right: Main Content ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Security Checks */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    Security Checklist
                  </h3>
                  <span
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold',
                      securityScore >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : securityScore >= 60
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {securityChecks.filter((c) => c.status === 'pass').length}/
                    {securityChecks.length} Passed
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {securityChecks.map((check) => (
                    <SecurityCheckItem key={check.title} {...check} />
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommendations
                  </h3>
                  <div className="space-y-3">
                    {recommendations.map((rec) => (
                      <RecommendationCard key={rec.title} {...rec} />
                    ))}
                  </div>
                </div>
              )}

              {/* 2FA Status Card */}
              <div
                className={clsx(
                  'rounded-2xl border p-6 overflow-hidden relative',
                  profile.isTwoFactorEnabled
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-200/50'
                    : 'bg-gradient-to-br from-rose-50 via-white to-orange-50 border-rose-200/50'
                )}
              >
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={clsx(
                        'w-14 h-14 rounded-2xl flex items-center justify-center ring-1 shadow-lg',
                        profile.isTwoFactorEnabled
                          ? 'bg-emerald-500 ring-emerald-600/20 shadow-emerald-500/20'
                          : 'bg-rose-500 ring-rose-600/20 shadow-rose-500/20'
                      )}
                    >
                      <Fingerprint className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        Two-Factor Authentication
                        {profile.isTwoFactorEnabled && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </h3>
                      <p className="text-[13px] text-gray-500 mt-1 max-w-md leading-relaxed">
                        {profile.isTwoFactorEnabled
                          ? 'Your account is secured with two-factor authentication. A code is required from your authenticator app when signing in.'
                          : 'Your account is not protected by two-factor authentication. Enable it to significantly improve your security.'}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        {profile.isTwoFactorEnabled ? (
                          <button
                            onClick={() => setShowDisable2FADialog(true)}
                            className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.97] shadow-sm"
                          >
                            Disable 2FA
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowSetup2FA(true)}
                            className="px-4 py-2 rounded-xl text-[13px] font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-all cursor-pointer active:scale-[0.97] flex items-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Enable Two-Factor Auth
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Activity */}
              {securityActivities.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-400" />
                      Security Activity
                    </h3>
                    <Link
                      href="/admin/activity-log?category=auth"
                      className="text-[12px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      View all
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {securityActivities.map((activity) => {
                      const isFailure = activity.action.includes('failed');
                      return (
                        <div
                          key={activity._id}
                          className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-gray-50/50 transition-colors"
                        >
                          <div
                            className={clsx(
                              'w-2 h-2 rounded-full shrink-0',
                              isFailure ? 'bg-rose-400' : 'bg-emerald-400'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 truncate">
                              {activity.actionLabel || activity.action.replace(/_/g, ' ')}
                            </p>
                            {activity.details && (
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                {activity.details}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0">
                            {activity.timeAgo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current Session Info */}
              {currentSession && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    Current Session Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        icon: Monitor,
                        label: 'Device',
                        value: currentSession.device,
                        color: 'bg-blue-50 text-blue-600',
                      },
                      {
                        icon: Globe,
                        label: 'Browser',
                        value: currentSession.browser,
                        color: 'bg-violet-50 text-violet-600',
                      },
                      {
                        icon: Server,
                        label: 'IP Address',
                        value: currentSession.ip,
                        color: 'bg-gray-50 text-gray-600',
                      },
                      {
                        icon: MapPin,
                        label: 'Location',
                        value: currentSession.location,
                        color: 'bg-amber-50 text-amber-600',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-3.5 rounded-xl bg-gray-50/50 border border-gray-100"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <item.icon className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700 truncate">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Logged in {getTimeSince(currentSession.loginTime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Last active {getTimeSince(currentSession.lastActive)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>

      {/* ── Disable 2FA Dialog ── */}
      <AlertDialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <AlertDialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <AlertDialogContent className="max-w-[400px] rounded-2xl border-0 p-0 shadow-2xl overflow-hidden gap-0 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="relative bg-gradient-to-b from-rose-50 to-white px-6 pt-7 pb-5">
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 shadow-sm ring-1 ring-rose-200/60">
                <ShieldOff className="h-5 w-5 text-rose-500" />
              </div>

              <AlertDialogHeader className="mt-4 space-y-2 text-left">
                <AlertDialogTitle className="text-[17px] font-extrabold text-gray-900">
                  Disable Two-Factor Auth?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12.5px] leading-relaxed text-gray-400">
                  This will <span className="font-bold text-rose-600">remove the extra security</span>{' '}
                  from your account. Enter your authenticator code to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* OTP input for disable */}
              <div className="mt-4 space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-center text-xl font-mono font-bold text-gray-900 tracking-[0.5em] focus:border-rose-400 focus:outline-none transition-all"
                  placeholder="000000"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100">
            <AlertDialogFooter className="gap-2.5 sm:gap-2.5">
              <AlertDialogCancel
                className="cursor-pointer flex-1 h-10 rounded-xl border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-all shadow-sm"
                disabled={isDisabling2FA}
                onClick={() => setDisableCode('')}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDisable2FA();
                }}
                className={clsx(
                  'cursor-pointer flex-1 h-10 rounded-xl text-[13px] font-bold transition-all border-0',
                  disableCode.length === 6
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 hover:bg-rose-600 active:scale-[0.97]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
                disabled={disableCode.length !== 6 || isDisabling2FA}
              >
                {isDisabling2FA ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Disabling...
                  </span>
                ) : (
                  'Disable 2FA'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}