'use client';

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { User, CreditCard, Calendar, Globe } from "lucide-react"; 
import { BookingFormData } from "../utils/validation";
import { COUNTRY_LIST } from "../utils";




interface PassengerFormProps {
  index: number;
  type: "adult" | "child" | "infant";
  register: UseFormRegister<BookingFormData>;
  errors: FieldErrors<BookingFormData>;
}

export const PassengerForm = ({ index, type, register, errors }: PassengerFormProps) => {
  const error = errors.passengers?.[index];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/70 mb-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
        <div className={`p-2 rounded-lg ${type === 'adult' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 capitalize">
            Passenger {index + 1} <span className="text-sm font-medium text-slate-500">({type})</span>
          </h3>
          <p className="text-xs text-slate-400">Enter details exactly as they appear on the passport</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        


        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">First Name / Given Name</label>
          <input
            {...register(`passengers.${index}.firstName`)}
            placeholder="e.g. JOHN"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal uppercase"
          />
          {error?.firstName && <p className="text-[10px] text-red-500 font-bold ml-1">{error.firstName.message}</p>}
        </div>

        {/* Middle Name (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
            Middle Name
            <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            {...register(`passengers.${index}.middleName`)} 
            placeholder="e.g. QUINCY"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal uppercase"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Last Name / Surname</label>
          <input
            {...register(`passengers.${index}.lastName`)}
            placeholder="e.g. DOE"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:font-normal uppercase"
          />
          {error?.lastName && <p className="text-[10px] text-red-500 font-bold ml-1">{error.lastName.message}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
             Date of Birth
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
                type="date"
                {...register(`passengers.${index}.dob`)}
                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-slate-700"
            />
          </div>
          {error?.dob && <p className="text-[10px] text-red-500 font-bold ml-1">{error.dob.message}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-rose-200 w-full transition-all">
              <input type="radio" value="male" {...register(`passengers.${index}.gender`)} className="accent-rose-600 w-4 h-4 cursor-pointer" />
              <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-rose-200 w-full transition-all">
              <input type="radio" value="female" {...register(`passengers.${index}.gender`)} className="accent-rose-600 w-4 h-4 cursor-pointer" />
              <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">Female</span>
            </label>
          </div>
          {error?.gender && <p className="text-[10px] text-red-500 font-bold ml-1">{error.gender.message}</p>}
        </div>

        {/* Passport Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Passport Number</label>
          <div className="relative">
             <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               {...register(`passengers.${index}.passportNumber`)}
               placeholder="A12345678"
               className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all uppercase placeholder:normal-case font-mono"
             />
          </div>
          {error?.passportNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{error.passportNumber.message}</p>}
        </div>

        {/* Passport Expiry */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Passport Expiry Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
                type="date"
                {...register(`passengers.${index}.passportExpiry`)}
                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-slate-700"
            />
          </div>
          {error?.passportExpiry && <p className="text-[10px] text-red-500 font-bold ml-1">{error.passportExpiry.message}</p>}
        </div>

        {/* 🟢 NEW: Passport Issuing Country Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
             Passport Country
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <select
                {...register(`passengers.${index}.passportCountry`)}
                defaultValue="US" // ডিফল্ট বাংলাদেশ
                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
            >
                <option value="" disabled>Select Country</option>
                {COUNTRY_LIST.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>
          {/* Error Message if needed */}
          {error?.passportCountry && <p className="text-[10px] text-red-500 font-bold ml-1">{error.passportCountry.message}</p>}
        </div>

      </div>
    </div>
  );
};