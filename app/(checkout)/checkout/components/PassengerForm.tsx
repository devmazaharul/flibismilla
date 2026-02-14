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

  // ✅ Shared input class
  const inputClass = `
    w-full min-w-0 p-3 bg-slate-50 border border-slate-200 rounded-xl
    text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent
    outline-none transition-all placeholder:font-normal
    box-border
  `;

  // ✅ Date input class — iOS fix
  const dateInputClass = `
    w-full min-w-0 p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl
    text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:border-transparent
    outline-none transition-all text-slate-700
    box-border
    appearance-none
    [&::-webkit-date-and-time-value]:text-left
    [&::-webkit-date-and-time-value]:text-sm
    [&::-webkit-datetime-edit]:p-0
    [&::-webkit-datetime-edit]:text-sm
    [&::-webkit-datetime-edit-fields-wrapper]:p-0
    [&::-webkit-calendar-picker-indicator]:opacity-0
    [&::-webkit-calendar-picker-indicator]:absolute
    [&::-webkit-calendar-picker-indicator]:inset-0
    [&::-webkit-calendar-picker-indicator]:w-full
    [&::-webkit-calendar-picker-indicator]:h-full
    [&::-webkit-calendar-picker-indicator]:cursor-pointer
    [-webkit-appearance:none]
    [-moz-appearance:none]
  `;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-slate-200/70 mb-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
        <div className={`p-2 rounded-lg shrink-0 ${type === 'adult' ? 'bg-rose-100 text-rose-600' : type === 'child' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
          <User className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-slate-800 capitalize">
            Passenger {index + 1}{' '}
            <span className="text-sm font-medium text-slate-500">({type})</span>
          </h3>
          <p className="text-xs text-slate-400">
            Enter details exactly as they appear on the passport
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Fields marked with <span className="text-rose-500 font-bold">*</span> are required
          </p>
        </div>
      </div>

      {/* ✅ overflow-hidden prevents iOS date picker overflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-hidden">

        {/* First Name */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">
            First Name / Given Name
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            {...register(`passengers.${index}.firstName`)}
            placeholder="e.g. JOHN"
            className={`${inputClass} uppercase`}
          />
          {error?.firstName && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.firstName.message}
            </p>
          )}
        </div>

        {/* Middle Name */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
            Middle Name
            <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            {...register(`passengers.${index}.middleName`)}
            placeholder="e.g. QUINCY"
            className={`${inputClass} uppercase`}
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Last Name / Surname
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            {...register(`passengers.${index}.lastName`)}
            placeholder="e.g. DOE"
            className={`${inputClass} uppercase`}
          />
          {error?.lastName && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.lastName.message}
            </p>
          )}
        </div>

        {/* ✅ Date of Birth — iOS Fixed */}
        <div className="space-y-1.5 min-w-0 overflow-hidden">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            Date of Birth
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative w-full overflow-hidden rounded-xl">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
            <input
              type="date"
              {...register(`passengers.${index}.dob`)}
              className={dateInputClass}
              style={{
                // ✅ iOS-specific inline fix
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            />
            {/* ✅ Custom calendar icon (replaces native) */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          {error?.dob && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.dob.message}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Gender
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="flex gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 w-full transition-all">
              <input
                type="radio"
                value="male"
                {...register(`passengers.${index}.gender`)}
                className="accent-rose-600 w-4 h-4 cursor-pointer shrink-0"
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">
                Male
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 w-full transition-all">
              <input
                type="radio"
                value="female"
                {...register(`passengers.${index}.gender`)}
                className="accent-rose-600 w-4 h-4 cursor-pointer shrink-0"
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">
                Female
              </span>
            </label>
          </div>
          {error?.gender && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.gender.message}
            </p>
          )}
        </div>

        {/* Passport Number */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Passport Number
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              {...register(`passengers.${index}.passportNumber`)}
              placeholder="A12345678"
              className={`${inputClass} pl-10 uppercase font-mono placeholder:normal-case`}
            />
          </div>
          {error?.passportNumber && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.passportNumber.message}
            </p>
          )}
        </div>

        {/* ✅ Passport Expiry — iOS Fixed */}
        <div className="space-y-1.5 min-w-0 overflow-hidden">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Passport Expiry Date
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="relative w-full overflow-hidden rounded-xl">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
            <input
              type="date"
              {...register(`passengers.${index}.passportExpiry`)}
              className={dateInputClass}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          {error?.passportExpiry && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.passportExpiry.message}
            </p>
          )}
        </div>

        {/* Passport Country */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            Passport Country
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              {...register(`passengers.${index}.passportCountry`)}
              defaultValue="US"
              className={`${inputClass} pl-10 appearance-none cursor-pointer text-slate-700`}
            >
              <option value="" disabled>
                Select Country
              </option>
              {COUNTRY_LIST.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
          {error?.passportCountry && (
            <p className="text-[10px] text-red-500 font-bold ml-1">
              {error.passportCountry.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};