'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Lock, User, Mail, Key, Smartphone, 
  Loader2, CheckCircle2, UserPlus, Users, Eye, 
  BadgeCheck, AlertOctagon,
  Clock, Activity, AlertCircle, Laptop, MapPin, Globe, QrCode, X, ArrowRight, ShieldAlert,
  FileEdit
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
  DialogTitle 
} from "@/components/ui/dialog"; 
import { changePasswordSchema, ChangePasswordInput } from '@/app/api/controller/helper/validation';
import Link from 'next/link';

// --- Schemas & Types ---
const newUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["editor", "viewer"]), 
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
    formState: { errors: errorsPass } 
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const { 
    register: registerUser, 
    handleSubmit: handleSubmitUser, 
    reset: resetUser,
    watch: watchUser,
    setError: setUserError,
    clearErrors: clearUserErrors,
    setValue: setValueUser,
    formState: { errors: errorsUser } 
  } = useForm<NewUserValues>({ 
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'viewer' }
  });

  const selectedRole = watchUser('role');

  // --- Fetch Data ---
  const fetchUser = async () => {
    try {
      const { data, status } = await axios.get('/api/auth/me');
      if (data.user && status === 200) {
        setUserData(data.user);
      }
    } catch (error) {
      toast.error("Failed to load user profile");
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // --- 2FA Logic ---
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
        toast.error("Could not generate QR Code");
      }
    } catch (error) {
      toast.error("Failed to start 2FA setup");
    } finally {
      setVerifying2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
      setDisabling2FA(true);
      try {
        const { data } = await axios.post('/api/auth/2fa/disable');
        if (data.success) {
            toast.success("Two-Factor Authentication Disabled");
            setUserData(prev => prev ? { ...prev, isTwoFactorEnabled: false } : null);
            setIsDisableModalOpen(false);
        }
      } catch (error) {
        toast.error("Failed to disable 2FA");
      } finally {
        setDisabling2FA(false);
      }
  };

  const verifyAndEnable2FA = async () => {
    if(!twoFactorCode || twoFactorCode.length !== 6) {
        toast.error("Please enter a valid 6-digit code");
        return;
    }

    setVerifying2FA(true);
    try {
      const { data } = await axios.post('/api/auth/2fa/enable', { 
        code: twoFactorCode,
        secret: tempSecret 
      });

      if (data.success) {
        toast.success("2FA Enabled Successfully!");
        setIs2FASetupMode(false); 
        setTwoFactorCode('');
        setTempSecret('');
        setUserData(prev => prev ? { ...prev, isTwoFactorEnabled: true } : null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid Code");
    } finally {
      setVerifying2FA(false);
    }
  };

  const cancel2FASetup = () => {
      setIs2FASetupMode(false);
      setTwoFactorCode('');
      setTempSecret('');
  };

  // --- Password Submit ---
  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setLoading(true);
    clearPassErrors('root');
    try {
      await axios.put('/api/auth/change-password', data);
      toast.success("Password updated successfully");
      resetPass();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to update password";
      setPassError("root", { message: errorMessage });
      if (error.response?.data?.details?.fieldErrors) {
         const fields = error.response.data.details.fieldErrors;
         if(fields.oldPassword) setPassError("currentPassword", { message: fields.oldPassword[0] });
         if(fields.newPassword) setPassError("newPassword", { message: fields.newPassword[0] });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- User Submit ---
  const onUserSubmit = async (data: NewUserValues) => {
    setLoading(true);
    clearUserErrors('root');
    
    try {
      await axios.post('/api/auth/register', data);
      
      toast.success(`Invitation sent to ${data.email}`);
      resetUser();
      setValueUser('role', 'viewer');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to create user";
      setUserError("root", { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 lg:p-12 space-y-8 max-w-6xl mx-auto">
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full lg:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-gray-900 selection:text-white pb-20">
      
      {/* --- Confirmation Modal --- */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-6">
            <DialogHeader className="space-y-3">
                <div className="mx-auto bg-red-100 h-12 w-12 rounded-full flex items-center justify-center mb-2">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-center text-xl font-bold text-gray-900">Disable Two-Factor Authentication?</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                    Disabling 2FA will make your account less secure. You will only need your password to sign in. Are you sure?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <Button 
                    variant="outline" 
                    onClick={() => setIsDisableModalOpen(false)}
                    className="w-full sm:w-1/2 h-11 rounded-xl border-gray-200 font-medium hover:bg-gray-50 cursor-pointer"
                >
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    onClick={confirmDisable2FA}
                    disabled={disabling2FA}
                    className="w-full sm:w-1/2 h-11 rounded-xl bg-red-600 hover:bg-red-700 font-medium cursor-pointer"
                >
                    {disabling2FA ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                    {disabling2FA ? "Disabling..." : "Yes, Disable 2FA"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
            <p className="text-gray-500 mt-2 text-base">Manage your profile, security preferences, and team members.</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          
          <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 inline-flex h-auto gap-1">
            <TabsTrigger value="overview" className="h-10 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 text-gray-500 font-medium transition-all duration-300 cursor-pointer">
              <User className="w-4 h-4 mr-2.5"/> Profile & Security
            </TabsTrigger>
            <TabsTrigger value="team" className="h-10 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 text-gray-500 font-medium transition-all duration-300 cursor-pointer">
              <Users className="w-4 h-4 mr-2.5"/> Team Management
            </TabsTrigger>
          </TabsList>

          {/* ================= TAB 1: OVERVIEW ================= */}
          <TabsContent value="overview" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Profile Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                   
                   <div className="relative flex flex-col items-center ">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-[4px] border-white shadow-lg bg-gray-900 flex items-center justify-center text-3xl font-bold text-white">
                            {userData?.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-[3px] border-white"></div>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-gray-900">{userData?.name}</h3>
                      <p className="text-sm text-gray-500">{userData?.email}</p>
                      <div className="mt-4 flex gap-2">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                            userData?.role === 'admin' 
                            ? "bg-gray-900 text-white border-gray-900" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                            {userData?.role}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <BadgeCheck size={10} /> Verified
                        </span>
                      </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-gray-500 flex items-center gap-2"><Clock size={14}/> Last Login</span>
                         <span className="font-medium text-gray-900 text-xs">
                            {userData?.lastLogin 
                                ? format(new Date(userData.lastLogin), 'PP p')
                                : 'First Login'}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-gray-500 flex items-center gap-2"><Activity size={14}/> Failed Attempts</span>
                         <span className={cn("font-bold text-xs px-2 py-0.5 rounded-full", (userData?.failedLoginAttempts || 0) > 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600")}>
                            {userData?.failedLoginAttempts || 0}
                         </span>
                      </div>
                   </div>
                </div>

                {/* 2FA Status Card */}
                <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/20 relative overflow-hidden transition-all duration-300">
                   
                   {!is2FASetupMode ? (
                      // 1. Normal State (Show Status & Toggle)
                      <div className="flex items-start justify-between relative z-10">
                        <div className='pr-4'>
                          <Smartphone className="w-8 h-8 opacity-80 mb-4"/>
                          <h4 className="font-bold text-lg">Two-Factor Auth</h4>
                          <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                             {userData?.isTwoFactorEnabled 
                                ? "Your account is secure with 2FA."
                                : "Add an extra layer of security to your account."}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer mt-2">
                          <input 
                              type="checkbox" 
                              checked={userData?.isTwoFactorEnabled || false} 
                              onChange={handle2FAToggleClick}
                              disabled={verifying2FA || disabling2FA}
                              className="sr-only peer" 
                          />
                          <div className="w-10 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-gray-900"></div>
                        </label>
                      </div>
                   ) : (
                      // 2. Setup State (Show QR Code & Verify Input)
                      <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className='flex items-center justify-between mb-4'>
                             <h4 className="font-bold text-lg flex items-center gap-2"><QrCode size={18}/> Scan QR Code</h4>
                             <Button onClick={cancel2FASetup} variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full cursor-pointer">
                                <X size={14} />
                             </Button>
                          </div>
                          
                          <div className='bg-white p-2 rounded-xl w-fit mx-auto mb-4'>
                             {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 object-contain" />
                             ) : (
                                <Skeleton className="w-32 h-32 rounded-lg" />
                             )}
                          </div>
                          
                          <p className="text-xs text-center text-gray-400 mb-3">
                             Scan with Google Authenticator <br/> and enter the code below.
                          </p>

                          <div className='flex gap-2'>
                             <Input 
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                placeholder="123456" 
                                className="bg-gray-800 border-gray-700 text-white text-center font-bold tracking-widest focus:ring-gray-600 focus:border-gray-500 h-10"
                                maxLength={6}
                             />
                             <Button 
                                onClick={verifyAndEnable2FA}
                                disabled={verifying2FA || twoFactorCode.length !== 6}
                                className="bg-white text-gray-900 hover:bg-gray-200 h-10 w-12 shrink-0 p-0 cursor-pointer"
                             >
                                {verifying2FA ? <Loader2 size={16} className='animate-spin'/> : <ArrowRight size={18}/>}
                             </Button>
                          </div>
                      </div>
                   )}
                </div>
              </div>

              {/* Password Form */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 p-8">
                   <div className="mb-8 pb-6 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                         <Key className="w-5 h-5 text-gray-400"/> Security & Password
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Update your password regularly to keep your account safe.</p>
                   </div>

                   <form onSubmit={handleSubmitPass(onPasswordSubmit)} className="space-y-6 max-w-2xl">
                      
                      {errorsPass.root && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-600 font-medium">
                                {errorsPass.root.message}
                            </div>
                        </div>
                      )}

                      <div className="space-y-2">
                         {/* ✅ ADDED: Forgot Password Link */}
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                            <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors">
                                Forgot Password?
                            </Link>
                         </div>
                         <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                            <Input 
                                type="password" 
                                {...registerPass('currentPassword')} 
                                className={cn(
                                    "pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all",
                                    (errorsPass.currentPassword || errorsPass.root) && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                                )}
                                placeholder="Enter current password" 
                            />
                         </div>
                         {errorsPass.currentPassword && <p className="text-red-500 text-xs font-medium">{errorsPass.currentPassword.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                            <div className="relative group">
                                <Key className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                                <Input 
                                    type="password" 
                                    {...registerPass('newPassword')} 
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all" 
                                    placeholder="Min 8 chars" 
                                />
                            </div>
                            {errorsPass.newPassword && <p className="text-red-500 text-xs font-medium">{errorsPass.newPassword?.message}</p>}
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative group">
                                <CheckCircle2 className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                                <Input 
                                    type="password" 
                                    {...registerPass('confirmPassword')} 
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all" 
                                    placeholder="Repeat password" 
                                />
                            </div>
                            {errorsPass.confirmPassword && <p className="text-red-500 text-xs font-medium">{errorsPass.confirmPassword.message}</p>}
                         </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button disabled={loading} className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/10 transition-all w-full md:w-auto cursor-pointer">
                           {loading ? <Loader2 className="animate-spin w-4 h-4"/> : "Update Password"}
                        </Button>
                      </div>
                   </form>
                </div>

                {/* Device Login Log Section */}
                <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 p-8">
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Laptop className="w-5 h-5 text-gray-400"/> Device Log
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Recent devices that have logged into your account.</p>
                    </div>
                    
                    <div className="space-y-4">
                        {userData?.loginHistory && userData.loginHistory.length > 0 ? (
                            userData.loginHistory.map((log, index) => (
                                <div key={index} className="flex items-start justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                                            {log.device.toLowerCase().includes('mobile') ? <Smartphone size={20}/> : <Laptop size={20}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{log.device} <span className="text-xs font-normal text-gray-500">({log.browser})</span></p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/> {log.location}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><Globe size={10}/> {log.ip}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* Logic updated: First item is active */}
                                        <p className="text-xs text-gray-400 font-medium">
                                                {format(new Date(log.time), 'MMM d, p')}
                                            </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic text-center py-4">No recent login history found.</p>
                        )}
                    </div>
                </div>

              </div>

            </div>
          </TabsContent>

          {/* ================= TAB 2: TEAM MANAGEMENT ================= */}
          <TabsContent value="team" className="outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* ✅ এখানে চেক করা হচ্ছে: ইউজার কি Admin? না হলে Access Restricted দেখাবে। */}
            {userData?.role !== 'admin' ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-gray-100 p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                    <div className="relative z-10 bg-white p-4 rounded-full shadow-lg mb-6">
                        <AlertOctagon className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="relative z-10 text-2xl font-bold text-gray-900 mb-2">Access Restricted</h3>
                    <p className="relative z-10 text-gray-500 max-w-md mx-auto mb-8">
                        You do not have administrative privileges to manage team members. Please contact your system administrator.
                    </p>
                    <Button variant="outline" className="relative z-10 rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer" disabled>
                        Contact Administrator
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gray-800 rounded-full blur-3xl opacity-50"></div>
                            <UserPlus className="w-10 h-10 mb-6"/>
                            <h3 className="text-2xl font-bold mb-2">Invite Member</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                Add new Editors or Viewers to help manage your dashboard. Admins have full access, Editors can modify content, and Viewers are read-only.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <FileEdit className="w-5 h-5 text-emerald-400"/>
                                    <span>Editor (Can Modify Content)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Eye className="w-5 h-5 text-blue-400"/>
                                    <span>Viewer (Read-only Access)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-100/50 p-8">
                            <form onSubmit={handleSubmitUser(onUserSubmit)} className="space-y-6">
                                
                                {errorsUser.root && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-600 font-medium">
                                            {errorsUser.root.message}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                                            <Input {...registerUser('name')} className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all" placeholder="Jane Doe" />
                                        </div>
                                        {errorsUser.name && <p className="text-red-500 text-xs font-medium">{errorsUser.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                                            <Input {...registerUser('email')} className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all" placeholder="colleague@agency.com" />
                                        </div>
                                        {errorsUser.email && <p className="text-red-500 text-xs font-medium">{errorsUser.email.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Temporary Password</label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-gray-800 transition-colors"/>
                                        <Input type="password" {...registerUser('password')} className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 rounded-xl transition-all" placeholder="Create a strong password" />
                                    </div>
                                    {errorsUser.password && <p className="text-red-500 text-xs font-medium">{errorsUser.password.message}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role Assignment</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        
                                        {/* Editor Option */}
                                        <div 
                                            onClick={() => setValueUser('role', 'editor')}
                                            className={cn(
                                                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:shadow-md",
                                                selectedRole === 'editor' 
                                                ? "border-gray-900 bg-gray-50 shadow-sm" 
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg shrink-0", selectedRole === 'editor' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500")}>
                                                <FileEdit size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">Editor</h4>
                                                <p className="text-xs text-gray-500 mt-1">Can edit content but cannot manage users.</p>
                                            </div>
                                            <input type="radio" value="editor" {...registerUser('role')} className="sr-only" />
                                        </div>

                                        {/* Viewer Option */}
                                        <div 
                                            onClick={() => setValueUser('role', 'viewer')}
                                            className={cn(
                                                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:shadow-md",
                                                selectedRole === 'viewer' 
                                                ? "border-gray-900 bg-gray-50 shadow-sm" 
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg shrink-0", selectedRole === 'viewer' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500")}>
                                                <Eye size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">Viewer</h4>
                                                <p className="text-xs text-gray-500 mt-1">Read-only access. No editing rights.</p>
                                            </div>
                                            <input type="radio" value="viewer" {...registerUser('role')} className="sr-only" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button disabled={loading} className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/10 transition-all w-full md:w-auto cursor-pointer">
                                        {loading ? <Loader2 className="animate-spin w-4 h-4"/> : "Create Account"}
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