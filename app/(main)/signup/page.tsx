'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// ১. Zod Validation Schema (আপনার মডেল অনুযায়ী)
const signupSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Something went wrong");
        return;
      }

      router.push('/access');
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col justify-center py-12 px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Simple Brand Icon */}
        <div className="flex justify-center">
            <div className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-gray-200">
                <User className="text-white w-6 h-6" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Admin Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Start managing your travel business with Flybismillah.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="bg-white py-10 px-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] border border-gray-100 rounded-[2.5rem]">
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-sm text-red-600 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 rotate-180" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
              <div className="relative">
                <input
                  {...register('name')}
                  placeholder="e.g. John Doe"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 font-bold ml-2">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@flybismillah.com"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
              />
              {errors.email && <p className="text-[11px] text-red-500 font-bold ml-2">{errors.email.message}</p>}
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                />
                {errors.password && <p className="text-[11px] text-red-500 font-bold ml-2">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                />
                {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold ml-2">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-black font-bold hover:underline transition-all">
                    Sign in here
                </Link>
            </p>
        </div>
      </div>
      
      {/* Bottom spacing for better balance */}
      <div className="h-20"></div>
    </div>
  );
}