'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { MAX_PASSWORD, MIN_PASSWORD } from '@/app/api/controller/constant';

// 1. Zod Schema for Strong Password
const resetSchema = z
    .object({
        password: z
            .string()
        .min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters`)
        .max(MAX_PASSWORD, `Password must be at most ${MAX_PASSWORD} characters`)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetFormData = z.infer<typeof resetSchema>;

// 2. Main Form Component
function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get token from URL (?token=xyz)
    const token = searchParams.get('token');

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 3. Security Check: Redirect if token is missing
    useEffect(() => {
        if (!token) {
            router.push('/access?error=Invalid reset link');
        }
    }, [token, router]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: ResetFormData) => {
        setError(null);

        if (!token) return; // Double check

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token, // Send token from URL
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Failed to reset password');
                return;
            }

            setSuccess(true);

            // Auto redirect after 3 seconds
            setTimeout(() => {
                router.push('/access?message=Password reset successful');
            }, 3000);
        } catch (err) {
            setError('Unable to connect to server.');
        }
    };

    // If token is missing, show nothing (while redirecting)
    if (!token) return null;

    return (
        <div className="w-full max-w-[440px] z-10">
            <div className="bg-white rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 overflow-hidden">
                <div className="p-8 sm:p-10">
                    {/* Icon Header */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-100">
                            <div className="bg-slate-900 rounded-xl p-2.5">
                                <LockKeyhole className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="text-center animate-in zoom-in duration-300">
                            <div className="mx-auto w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-slate-200">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">All Set!</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                Your password has been updated. Redirecting you to login...
                            </p>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    Set New Password
                                </h1>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    Create a strong password to secure your account.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 justify-center">
                                    <AlertCircle className="w-4 h-4 text-rose-600" />
                                    <p className="text-xs font-bold text-rose-600">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                                        New Password
                                    </label>
                                    <input
                                        {...register('password')}
                                        type="password"
                                        placeholder="••••••••••••"
                                        className={clsx(
                                            'w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 focus:outline-none',
                                            errors.password &&
                                                'bg-rose-50 focus:ring-rose-100 placeholder:text-rose-300',
                                        )}
                                    />
                                    {errors.password && (
                                        <p className="text-[10px] text-rose-500 font-bold ml-2 mt-1">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                                        Confirm Password
                                    </label>
                                    <input
                                        {...register('confirmPassword')}
                                        type="password"
                                        placeholder="••••••••••••"
                                        className={clsx(
                                            'w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 focus:outline-none',
                                            errors.confirmPassword &&
                                                'bg-rose-50 focus:ring-rose-100 placeholder:text-rose-300',
                                        )}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-rose-500 font-bold ml-2">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                    ) : (
                                        <>
                                            Reset Password
                                            <ArrowRight className="w-5 h-5 opacity-50" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/access"
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// 4. Wrapper Component (Required for useSearchParams in Next.js)
export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Suspense Boundary */}
            <Suspense
                fallback={
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Loader2 className="animate-spin" /> Verifying link...
                    </div>
                }
            >
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
