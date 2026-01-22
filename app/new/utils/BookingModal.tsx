'use client';

import { useState } from 'react';
import { X, User, Phone, Loader2, AlertCircle, Calendar, CreditCard, Users } from 'lucide-react';
import { z } from 'zod';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isInternational?: boolean;
}

export default function BookingModal({ isOpen, onClose, onSubmit, isInternational = false }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    dob: '',
    passport: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const bookingSchema = z.object({
      name: z.string().min(2, "Minimum 2 characters"),
      phone: z.string().min(7).max(15).regex(/^\+?[0-9]+$/, "Invalid number"),
      gender: z.enum(["Male", "Female", "Other"]),
      dob: z.string().min(1, "Required").refine((date) => new Date(date) < new Date(), "Invalid Date"),
      passport: isInternational 
        ? z.string().min(6, "Required").regex(/^[A-Z0-9]+$/i, "Invalid format")
        : z.string().optional()
    });

    const result = bookingSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    onSubmit(formData);
    setTimeout(() => {
        setLoading(false);
        onClose();
    }, 2000); 
  };

  return (
    // 🟢 Overlay
    <div className="fixed h-screen inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* 🟢 Main Modal: w-full with max-w-md to control width strictly */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Passenger Info
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${isInternational ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isInternational ? 'INTL' : 'DOM'}
                </span>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Input */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name <span className="text-rose-500">*</span></label>
                <div className="relative group w-full">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? 'text-red-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} />
                    <input 
                        type="text" 
                        placeholder="As on Passport / NID"
                        value={formData.name}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all min-w-0
                        ${errors.name 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-slate-200 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                        }`}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
            </div>

            {/* 🟢 Grid System: Mobile -> 1 Column (Stacked), Desktop -> 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Gender Select */}
                <div className="w-full min-w-0">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Gender <span className="text-rose-500">*</span></label>
                    <div className="relative group w-full">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none" />
                        <select 
                            value={formData.gender}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none appearance-none cursor-pointer transition-all focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 min-w-0"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Date of Birth */}
                <div className="w-[85%] md:w-full min-w-0">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date of Birth <span className="text-rose-500">*</span></label>
                    <div className="relative group w-full">
                        <Calendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.dob ? 'text-red-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} />
                        <input 
                            type="date" 
                            max={today}
                            value={formData.dob}
                            // 🟢 Ensure w-full and box-sizing are handled
                            className={`w-full pl-10 pr-3 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all cursor-pointer min-w-0
                            ${errors.dob 
                                ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                                : 'border-slate-200 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                            }`}
                            onChange={(e) => handleChange('dob', e.target.value)}
                        />
                    </div>
                    {errors.dob && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.dob}</p>}
                </div>
            </div>

            {/* Phone Input */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone <span className="text-rose-500">*</span></label>
                <div className="relative group w-full">
                    <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.phone ? 'text-red-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} />
                    <input 
                        type="tel" 
                        placeholder="+880 17..."
                        value={formData.phone}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all min-w-0
                        ${errors.phone 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-slate-200 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                        }`}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
            </div>

            {/* Passport Input */}
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Passport No. {isInternational ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal lowercase">(optional)</span>}
                </label>
                <div className="relative group w-full">
                    <CreditCard className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.passport ? 'text-red-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} />
                    <input 
                        type="text" 
                        placeholder="Ex: A12345678"
                        value={formData.passport}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all min-w-0
                        ${errors.passport 
                            ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                            : 'border-slate-200 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                        }`}
                        onChange={(e) => handleChange('passport', e.target.value)}
                    />
                </div>
                {errors.passport && <p className="text-red-500 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.passport}</p>}
            </div>
            </form>
        </div>
        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 sticky bottom-0 z-20">
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        Book via WhatsApp
                        <Phone className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    )
}