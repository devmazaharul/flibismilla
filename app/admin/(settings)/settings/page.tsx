'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Lock,
  User,
  Mail,
  Key,
  Smartphone,
  Loader2,
  CheckCircle2,
  UserPlus,
  Users,
  Eye,
  BadgeCheck,
  AlertOctagon,
  Clock,
  Activity,
  AlertCircle,
  Laptop,
  MapPin,
  Globe,
  QrCode,
  X,
  ArrowRight,
  ShieldAlert,
  FileEdit,
  Settings,
  Shield,
  Fingerprint,
  Monitor,
  Info,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  changePasswordSchema,
  ChangePasswordInput,
} from '@/app/api/controller/helper/validation';
import Link from 'next/link';

// ─── Schemas & Types ───
const newUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['editor', 'viewer']),
});

type NewUserValues = z.infer<typeof newUserSchema>;

interface LoginLog {
  device: string;
  browser: string;
  ip: string;
  location: string;
  time: string;
  status: 'current' | 'completed';
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastLogin?: string;
  failedLoginAttempts?: number;
  loginHistory?: LoginLog[];
  isTwoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fetchingUser, setFetchingUser] = useState(true);

  // 2FA States
  const [is2FASetupMode, setIs2FASetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Forms
  const {
    register: registerPass,
    handleSubmit: handleSubmitPass,
    reset: resetPass,
    setError: setPassError,
    clearErrors: clearPassErrors,
    formState: { errors: errorsPass },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser,
    watch: watchUser,
    setError: setUserError,
    clearErrors: clearUserErrors,
    setValue: setValueUser,
    formState: { errors: errorsUser },
  } = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'viewer' },
  });

  const selectedRole = watchUser('role');

  // ─── Fetch Data ───
  const fetchUser = async () => {
    try {
      const { data, status } = await axios.get('/api/auth/me');
      if (data.user && status === 200) {
        setUserData(data.user);
      }
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ─── 2FA Logic ───
  const handle2FAToggleClick = () => {
    if (userData?.isTwoFactorEnabled) {
      setIsDisableModalOpen(true);
      return;
    }
    start2FASetup();
  };

  const start2FASetup = async () => {
    try {
      setVerifying2FA(true);
      const { data } = await axios.get('/api/auth/2fa/setup');
      if (data.success && data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        setTempSecret(data.secret);
        setIs2FASetupMode(true);
      } else {
        toast.error('Could not generate QR Code');
      }
    } catch (error) {
      toast.error('Failed to start 2FA setup');
    } finally {
      setVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data } = await axios.post('/api/auth/2fa/disable');
      if (data.success) {
        toast.success('Two-Factor Authentication Disabled');
        setUserData((prev) =>
          prev ? { ...prev, isTwoFactorEnabled: false } : null
        );
        setIsDisableModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to disable 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setVerifying2FA(true);
    try {
      const { data } = await axios.post('/api/auth/2fa/enable', {
        code: twoFactorCode,
        secret: tempSecret,
      });
      if (data.success) {
        toast.success('2FA Enabled Successfully!');
        setIs2FASetupMode(false);
        setTwoFactorCode('');
        setTempSecret('');
        setUserData((prev) =>
          prev ? { ...prev, isTwoFactorEnabled: true } : null
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid Code');
    } finally {
      setVerifying2FA(false);
    }
  };

  const cancel2FASetup = () => {
    setIs2FASetupMode(false);
    setTwoFactorCode('');
    setTempSecret('');
  };

  // ─── Password Submit ───
  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setLoading(true);
    clearPassErrors('root');
    try {
      await axios.put('/api/auth/change-password', data);
      toast.success('Password updated successfully');
      resetPass();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update password';
      setPassError('root', { message: errorMessage });
      if (error.response?.data?.details?.fieldErrors) {
        const fields = error.response.data.details.fieldErrors;
        if (fields.oldPassword)
          setPassError('currentPassword', { message: fields.oldPassword[0] });
        if (fields.newPassword)
          setPassError('newPassword', { message: fields.newPassword[0] });
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── User Submit ───
  const onUserSubmit = async (data: NewUserValues) => {
    setLoading(true);
    clearUserErrors('root');
    try {
      await axios.post('/api/auth/register', data);
      toast.success(`Invitation sent to ${data.email}`);
      resetUser();
      setValueUser('role', 'viewer');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create user';
      setUserError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ─── Reusable classes ───
  const inputBase =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none';
  const inputWithIcon = cn(inputBase, 'pl-10');

  // ─── Loading State ───
  if (fetchingUser) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded" />
            </div>
          </div>
          {/* Tabs */}
          <Skeleton className="h-12 w-80 rounded-2xl" />
          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <Skeleton className="h-[320px] w-full rounded-2xl" />
              <Skeleton className="h-[240px] w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-[420px] w-full rounded-2xl" />
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* ─── Disable 2FA Modal ─── */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-gray-200/70 bg-white p-0 shadow-2xl shadow-gray-100 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
                <ShieldAlert className="h-6 w-6 text-rose-600" />
              </div>
              <DialogTitle className="text-center text-[17px] font-bold text-gray-900">
                Disable Two-Factor Authentication?
              </DialogTitle>
              <DialogDescription className="text-center text-[13px] text-gray-500 leading-relaxed">
                Disabling 2FA will make your account less secure. You will only
                need your password to sign in.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 p-6 pt-4 border-t border-gray-100 bg-gray-50/30 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
              className="w-full sm:w-1/2 h-10 rounded-xl border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisable2FA}
              disabled={disabling2FA}
              className="w-full sm:w-1/2 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-[13px] font-bold cursor-pointer"
            >
              {disabling2FA ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling...
                </span>
              ) : (
                'Yes, Disable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl shadow-gray-100">
                <Settings className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Settings
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
              Account Settings
            </h1>
            <p className="text-[13px] text-gray-500">
              Manage your profile, security preferences, and team members.
            </p>
          </div>
        </header>

        {/* ═══════════════════ TABS ═══════════════════ */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl border border-gray-200/70 shadow-2xl shadow-gray-100 inline-flex h-auto gap-1">
            <TabsTrigger
              value="overview"
              className="h-9 px-5 rounded-lg text-[13px] font-semibold data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 transition-all duration-200 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 mr-2" /> Profile & Security
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="h-9 px-5 rounded-lg text-[13px] font-semibold data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-500 transition-all duration-200 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 mr-2" /> Team Management
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════ TAB 1: OVERVIEW ═══════════════════ */}
          <TabsContent
            value="overview"
            className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ═══════════════ LEFT COLUMN ═══════════════ */}
              <div className="lg:col-span-4 space-y-6">
                {/* ──── Profile Card ──── */}
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 shadow-2xl shadow-gray-100">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Profile
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Your account overview
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-2xl font-bold text-white shadow-2xl shadow-gray-200">
                          {userData?.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-white bg-emerald-500">
                          <span className="sr-only">Online</span>
                        </div>
                      </div>
                      <h3 className="mt-3 text-[15px] font-bold text-gray-900">
                        {userData?.name}
                      </h3>
                      <p className="text-[12px] text-gray-400">
                        {userData?.email}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                            userData?.role === 'admin'
                              ? 'bg-gray-900 text-white'
                              : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                          )}
                        >
                          {userData?.role}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[12px] text-gray-400">
                          <Clock className="h-3.5 w-3.5" /> Last Login
                        </span>
                        <span className="text-[11px] font-semibold text-gray-700">
                          {userData?.lastLogin
                            ? format(new Date(userData.lastLogin), 'PP p')
                            : 'First Login'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[12px] text-gray-400">
                          <Activity className="h-3.5 w-3.5" /> Failed Attempts
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                            (userData?.failedLoginAttempts || 0) > 0
                              ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                              : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                          )}
                        >
                          {userData?.failedLoginAttempts || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ──── 2FA Card ──── */}
                <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-gray-900/20">
                  <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-800/40 px-6 py-4">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl shadow-lg',
                        userData?.isTwoFactorEnabled
                          ? 'bg-emerald-500'
                          : 'bg-gray-700'
                      )}
                    >
                      <Fingerprint className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-white">
                        Two-Factor Auth
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        {userData?.isTwoFactorEnabled
                          ? 'Currently enabled'
                          : 'Not configured'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    {!is2FASetupMode ? (
                      // ─── Normal State ───
                      <div className="space-y-4">
                        <p className="text-[13px] leading-relaxed text-gray-400">
                          {userData?.isTwoFactorEnabled
                            ? 'Your account is protected with an authenticator app.'
                            : 'Add an extra layer of security using an authenticator app.'}
                        </p>

                        <label className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 transition-all hover:border-gray-600 hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                userData?.isTwoFactorEnabled
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-gray-700 text-gray-400'
                              )}
                            >
                              <Shield className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-white">
                                {userData?.isTwoFactorEnabled
                                  ? 'Enabled'
                                  : 'Disabled'}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {userData?.isTwoFactorEnabled
                                  ? 'Tap to disable'
                                  : 'Tap to enable'}
                              </p>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={userData?.isTwoFactorEnabled || false}
                              onChange={handle2FAToggleClick}
                              disabled={verifying2FA || disabling2FA}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-gray-700 shadow-sm transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-gray-400 after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-checked:after:bg-white" />
                          </div>
                        </label>

                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                              userData?.isTwoFactorEnabled
                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                                : 'bg-gray-800 text-gray-500 ring-1 ring-gray-700'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                userData?.isTwoFactorEnabled
                                  ? 'bg-emerald-400'
                                  : 'bg-gray-500'
                              )}
                            />
                            {userData?.isTwoFactorEnabled
                              ? 'PROTECTED'
                              : 'UNPROTECTED'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // ─── Setup State ───
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-[13px] font-bold text-white">
                            <QrCode className="h-4 w-4 text-gray-400" /> Scan
                            QR Code
                          </h4>
                          <button
                            onClick={cancel2FASetup}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-800 hover:text-white cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mx-auto w-fit rounded-xl bg-white p-2.5 shadow-lg">
                          {qrCodeUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qrCodeUrl}
                              alt="2FA QR Code"
                              className="h-32 w-32 object-contain"
                            />
                          ) : (
                            <Skeleton className="h-32 w-32 rounded-lg" />
                          )}
                        </div>

                        <p className="text-center text-[11px] leading-relaxed text-gray-500">
                          Scan with Google Authenticator
                          <br />
                          then enter the 6-digit code below.
                        </p>

                        <div className="flex gap-2">
                          <Input
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            placeholder="000000"
                            className="h-10 rounded-xl border-gray-700 bg-gray-800 text-center text-[15px] font-bold tracking-[0.3em] text-white placeholder:text-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-700"
                            maxLength={6}
                          />
                          <Button
                            onClick={verifyAndEnable2FA}
                            disabled={
                              verifying2FA || twoFactorCode.length !== 6
                            }
                            className="h-10 w-12 shrink-0 rounded-xl bg-white p-0 text-gray-900 hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                          >
                            {verifying2FA ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
              <div className="lg:col-span-8 space-y-6">
                {/* ──── Password Card ──── */}
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-2xl shadow-gray-100">
                      <Key className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Security & Password
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Update your password regularly for safety
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <form
                      onSubmit={handleSubmitPass(onPasswordSubmit)}
                      className="space-y-5 max-w-2xl"
                    >
                      {errorsPass.root && (
                        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 animate-in fade-in slide-in-from-top-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                          <p className="text-[12px] font-medium text-rose-600">
                            {errorsPass.root.message}
                          </p>
                        </div>
                      )}

                      {/* Current Password */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[13px] font-semibold text-gray-700">
                            Current Password{' '}
                            <span className="text-rose-400">*</span>
                          </label>
                          <Link
                            href="/forgot-password"
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                          <input
                            type="password"
                            {...registerPass('currentPassword')}
                            className={cn(
                              inputWithIcon,
                              (errorsPass.currentPassword ||
                                errorsPass.root) &&
                                'border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-100'
                            )}
                            placeholder="Enter current password"
                          />
                        </div>
                        {errorsPass.currentPassword && (
                          <p className="text-[11px] font-medium text-rose-500">
                            {errorsPass.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-semibold text-gray-700">
                            New Password{' '}
                            <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                            <input
                              type="password"
                              {...registerPass('newPassword')}
                              className={inputWithIcon}
                              placeholder="Min 8 characters"
                            />
                          </div>
                          {errorsPass.newPassword && (
                            <p className="text-[11px] font-medium text-rose-500">
                              {errorsPass.newPassword.message}
                            </p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-semibold text-gray-700">
                            Confirm Password{' '}
                            <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <CheckCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                            <input
                              type="password"
                              {...registerPass('confirmPassword')}
                              className={inputWithIcon}
                              placeholder="Repeat password"
                            />
                          </div>
                          {errorsPass.confirmPassword && (
                            <p className="text-[11px] font-medium text-rose-500">
                              {errorsPass.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          disabled={loading}
                          className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Updating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Lock className="h-3.5 w-3.5" />
                              Update Password
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* ──── Device Log ──── */}
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow-2xl shadow-gray-100">
                        <Monitor className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900">
                          Device Log
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          Recent sign-in activity
                        </p>
                      </div>
                    </div>
                    {userData?.loginHistory &&
                      userData.loginHistory.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 tabular-nums ring-1 ring-sky-200">
                          {userData.loginHistory.length} sessions
                        </span>
                      )}
                  </div>

                  <div className="p-6">
                    {userData?.loginHistory &&
                    userData.loginHistory.length > 0 ? (
                      <div className="space-y-2.5">
                        {userData.loginHistory.map((log, index) => (
                          <div
                            key={index}
                            className="group flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-9 w-9 items-center justify-center rounded-lg',
                                  index === 0
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-gray-100 text-gray-400'
                                )}
                              >
                                {log.device
                                  .toLowerCase()
                                  .includes('mobile') ? (
                                  <Smartphone className="h-4 w-4" />
                                ) : (
                                  <Laptop className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-semibold text-gray-700">
                                    {log.device}
                                  </p>
                                  <span className="text-[11px] text-gray-400">
                                    {log.browser}
                                  </span>
                                  {index === 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <MapPin className="h-3 w-3" />{' '}
                                    {log.location}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Globe className="h-3 w-3" /> {log.ip}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-[11px] font-medium text-gray-400 tabular-nums">
                              {format(new Date(log.time), 'MMM d, p')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-200/70 py-10 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                          <Monitor className="h-5 w-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-400">
                            No login history
                          </p>
                          <p className="text-[10px] text-gray-300">
                            Recent sign-in sessions will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════ TAB 2: TEAM ═══════════════════ */}
          <TabsContent
            value="team"
            className="outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
          >
            {userData?.role !== 'admin' ? (
              // ─── Access Restricted ───
              <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                <div className="relative flex min-h-[400px] flex-col items-center justify-center p-10 text-center">
                  <div className="absolute inset-0 bg-gray-50/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 shadow-lg mb-5">
                    <AlertOctagon className="h-7 w-7 text-rose-500" />
                  </div>
                  <h3 className="relative z-10 text-[20px] font-bold text-gray-900 mb-1.5">
                    Access Restricted
                  </h3>
                  <p className="relative z-10 max-w-md text-[13px] leading-relaxed text-gray-500 mb-6">
                    You do not have administrative privileges to manage team
                    members. Please contact your system administrator.
                  </p>
                  <Button
                    variant="outline"
                    className="relative z-10 h-10 rounded-xl border-gray-200 px-5 text-[13px] font-semibold text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    Contact Administrator
                  </Button>
                </div>
              </div>
            ) : (
              // ─── Team Management ───
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
                {/* Info Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-gray-900/20">
                  <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-800/40 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 shadow-lg">
                      <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-white">
                        Invite Member
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Add editors or viewers
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <p className="text-[13px] leading-relaxed text-gray-400">
                      Add new team members to help manage your dashboard. Choose
                      the right role for each person.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/50 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <FileEdit className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-white">
                            Editor
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Can modify content
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/50 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-white">
                            Viewer
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Read-only access
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
                  <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-2xl shadow-gray-100">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">
                        New Team Member
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Fill in the details below
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <form
                      onSubmit={handleSubmitUser(onUserSubmit)}
                      className="space-y-5"
                    >
                      {errorsUser.root && (
                        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 animate-in fade-in slide-in-from-top-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                          <p className="text-[12px] font-medium text-rose-600">
                            {errorsUser.root.message}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Name */}
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-semibold text-gray-700">
                            Full Name{' '}
                            <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                            <input
                              {...registerUser('name')}
                              className={inputWithIcon}
                              placeholder="Jane Doe"
                            />
                          </div>
                          {errorsUser.name && (
                            <p className="text-[11px] font-medium text-rose-500">
                              {errorsUser.name.message}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-semibold text-gray-700">
                            Email Address{' '}
                            <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                            <input
                              {...registerUser('email')}
                              className={inputWithIcon}
                              placeholder="colleague@agency.com"
                            />
                          </div>
                          {errorsUser.email && (
                            <p className="text-[11px] font-medium text-rose-500">
                              {errorsUser.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-gray-700">
                          Temporary Password{' '}
                          <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                          <input
                            type="password"
                            {...registerUser('password')}
                            className={inputWithIcon}
                            placeholder="Create a strong password"
                          />
                        </div>
                        {errorsUser.password && (
                          <p className="text-[11px] font-medium text-rose-500">
                            {errorsUser.password.message}
                          </p>
                        )}
                      </div>

                      {/* Role Selection */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">
                          Role Assignment{' '}
                          <span className="text-rose-400">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Editor */}
                          <div
                            onClick={() => setValueUser('role', 'editor')}
                            className={cn(
                              'group relative flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm',
                              selectedRole === 'editor'
                                ? 'border-gray-900 bg-gray-50/50'
                                : 'border-gray-200/70 bg-white hover:border-gray-300'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                selectedRole === 'editor'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-400'
                              )}
                            >
                              <FileEdit className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-gray-900">
                                Editor
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Can edit content but cannot manage users.
                              </p>
                            </div>
                            <input
                              type="radio"
                              value="editor"
                              {...registerUser('role')}
                              className="sr-only"
                            />
                            {selectedRole === 'editor' && (
                              <div className="absolute right-3 top-3">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Viewer */}
                          <div
                            onClick={() => setValueUser('role', 'viewer')}
                            className={cn(
                              'group relative flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm',
                              selectedRole === 'viewer'
                                ? 'border-gray-900 bg-gray-50/50'
                                : 'border-gray-200/70 bg-white hover:border-gray-300'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                selectedRole === 'viewer'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-400'
                              )}
                            >
                              <Eye className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-gray-900">
                                Viewer
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Read-only access. No editing rights.
                              </p>
                            </div>
                            <input
                              type="radio"
                              value="viewer"
                              {...registerUser('role')}
                              className="sr-only"
                            />
                            {selectedRole === 'viewer' && (
                              <div className="absolute right-3 top-3">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          disabled={loading}
                          className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5" />
                              Create Account
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}