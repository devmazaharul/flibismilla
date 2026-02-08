'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Plane,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';

// Schema Definition
const roundTripSchema = z
  .object({
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    departureDate: z.string().min(1, 'Departure date is required'),
    returnDate: z.string().min(1, 'Return date is required'),
    passengers: z.object({
      adults: z.number().min(1),
      children: z.number(),
      infants: z.number(),
    }),
    cabinClass: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.origin === data.destination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Origin and Destination cannot be the same',
        path: ['destination'],
      });
    }
    if (
      data.returnDate &&
      data.departureDate &&
      data.returnDate < data.departureDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Return date cannot be before departure',
        path: ['returnDate'],
      });
    }
  });

export default function RoundTripForm({
  onSearch,
}: {
  onSearch: (params: URLSearchParams) => void;
}) {
  const searchParams = useSearchParams();
  const [today, setToday] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const dt = new Date();
    const offset = dt.getTimezoneOffset() * 60000;
    setToday(new Date(dt.getTime() - offset).toISOString().split('T')[0]);
  }, []);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: { adults: 1, children: 0, infants: 0 },
    cabinClass: 'economy',
  });

  // Populate from URL
  useEffect(() => {
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('dest');
    const dateParam = searchParams.get('date');
    const returnParam = searchParams.get('ret');

    if (originParam || destParam || dateParam) {
      setFormData((prev) => ({
        ...prev,
        origin: originParam || 'DAC',
        destination: destParam || 'LAX',
        departureDate: dateParam || '',
        returnDate: returnParam || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        origin: 'DAC',
        destination: 'LAX',
        departureDate: prev.departureDate || today,
      }));
    }
  }, [searchParams, today]);

  const handlePaxChange = useCallback((data: any) => {
    setFormData((prev) => ({
      ...prev,
      passengers: data.passengers,
      cabinClass: data.cabinClass,
    }));
  }, []);

  const handleSwap = () => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = roundTripSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    const params = new URLSearchParams();
    params.set('type', 'round_trip');
    params.set('origin', formData.origin);
    params.set('dest', formData.destination);
    params.set('date', formData.departureDate);
    params.set('ret', formData.returnDate);
    params.set('adt', formData.passengers.adults.toString());
    params.set('chd', formData.passengers.children.toString());
    params.set('inf', formData.passengers.infants.toString());
    params.set('class', formData.cabinClass);

    onSearch(params);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        w-full relative z-20
        rounded-3xl
        bg-gradient-to-br from-white/90 via-white to-rose-50/70
        border border-slate-100/80
        shadow-[0_24px_60px_rgba(15,23,42,0.08)]
        p-4 md:p-5 lg:p-6
        backdrop-blur-md
      "
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/70">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
              Round Trip
            </p>
            <p className="text-sm md:text-base font-semibold text-slate-800">
              Plan your perfect return journey.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-white/70 border border-slate-200 rounded-full px-3 py-1 shadow-2xl shadow-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Flexible dates · Best return fares
        </div>
      </div>

      {/* Fields row */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
   {/* Locations block (From + To) */}
<div
  className="
    relative
    w-full
   
 
    flex flex-col md:flex-row
    gap-3
  "
>
  {/* From */}
  <div className="flex-1 min-w-[160px] relative ">
    <AirportInput
      label="From"
      codeValue={formData.origin}
      onSelect={(code: string) => {
        setFormData((prev) => ({ ...prev, origin: code }));
        setErrors((prev) => ({ ...prev, origin: '' }));
      }}
      placeholder="Origin"
      icon={<MapPin className="w-4 h-4 text-rose-500" />}
      disabledCodes={[formData.destination]}
      hasError={!!errors.origin}
    />
  </div>

  {/* Mobile swap button: মাঝে, দুই ফিল্ডের মধ্যে */}
  <div className="flex justify-center md:hidden">
    <button
      type="button"
      onClick={handleSwap}
      className="
        mt-1 mb-1
        inline-flex cursor-pointer items-center justify-center
        w-9 h-9
        rounded-full
        bg-white
        border border-slate-200
        text-slate-500
        hover:text-rose-600 hover:border-rose-500
        shadow-md shadow-slate-200/80
        transition-all
      "
    >
      <ArrowRightLeft className="w-4 h-4 cursor-pointer" />
    </button>
  </div>

  {/* To */}
  <div className="flex-1 min-w-[160px] relative ">
    <AirportInput
      label="To"
      codeValue={formData.destination}
      onSelect={(code: string) => {
        setFormData((prev) => ({ ...prev, destination: code }));
        setErrors((prev) => ({ ...prev, destination: '' }));
      }}
      placeholder="Destination"
      icon={<Plane className="w-4 h-4 rotate-90 text-rose-500" />}
      disabledCodes={[formData.origin]}
      hasError={!!errors.destination}
    />
  </div>

  {/* Desktop swap button: দুই ফিল্ডের উপর, একদম মাঝখানে */}
  <button
    type="button"
    onClick={handleSwap}
    className="
      hidden md:flex
      absolute -top-4 cursor-pointer left-1/2 -translate-x-1/2
      z-20
   items-center justify-center
      w-9 h-9
      rounded-full
      bg-white
      border border-slate-200
      text-slate-500
      hover:text-rose-600 hover:border-rose-500
      shadow-md shadow-slate-200/80
      transition-all
      hover:-translate-y-0.5
    "
  >
    <ArrowRightLeft className="w-4 h-4" />
  </button>


</div>

        {/* Departure Date */}
        <div
          className={`
            w-full md:basis-[14%]
            group relative
            h-[56px]
            bg-white/80
            border rounded-2xl
            px-4 flex flex-col justify-center
            transition-all
            shadow-sm shadow-slate-100/80
            ${
              errors.departureDate
                ? 'border-red-400 ring-1 ring-red-400/30 bg-red-50/80'
                : 'border-slate-200 hover:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500'
            }
          `}
        >
          <div
            className={`
              absolute left-3 top-1/2 -translate-y-1/2
              p-1.5 rounded-lg
              transition-colors
              ${
                errors.departureDate
                  ? 'bg-red-100 text-red-500'
                  : 'bg-slate-50 text-rose-500 group-focus-within:bg-rose-50 group-focus-within:text-rose-600'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <div className="ml-10 flex flex-col">
            <label
              className={`
                text-[10px] font-bold uppercase tracking-widest leading-tight
                ${errors.departureDate ? 'text-red-400' : 'text-slate-400'}
              `}
            >
              Departure
            </label>
            <input
              type="date"
              min={today}
              value={formData.departureDate}
              onChange={(e) => {
                setFormData({ ...formData, departureDate: e.target.value });
                setErrors((prev) => ({ ...prev, departureDate: '' }));
              }}
              className="
                w-full bg-transparent border-none outline-none p-0
                text-sm font-semibold text-slate-800
                uppercase cursor-pointer leading-tight
              "
            />
          </div>
          {errors.departureDate && (
            <p className="absolute -bottom-4 left-3 text-[11px] text-red-500 font-medium">
              {errors.departureDate}
            </p>
          )}
        </div>

        {/* Return Date */}
        <div
          className={`
            w-full md:basis-[14%]
            group relative
            h-[56px]
            bg-white/80
            border rounded-2xl
            px-4 flex flex-col justify-center
            transition-all
            shadow-sm shadow-slate-100/80
            ${
              errors.returnDate
                ? 'border-red-400 ring-1 ring-red-400/30 bg-red-50/80'
                : 'border-slate-200 hover:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500'
            }
          `}
        >
          <div
            className={`
              absolute left-3 top-1/2 -translate-y-1/2
              p-1.5 rounded-lg
              transition-colors
              ${
                errors.returnDate
                  ? 'bg-red-100 text-red-500'
                  : 'bg-slate-50 text-rose-500 group-focus-within:bg-rose-50 group-focus-within:text-rose-600'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <div className="ml-10 flex flex-col">
            <label
              className={`
                text-[10px] font-bold uppercase tracking-widest leading-tight
                ${errors.returnDate ? 'text-red-400' : 'text-slate-400'}
              `}
            >
              Return
            </label>
            <input
              type="date"
              min={formData.departureDate || today}
              value={formData.returnDate}
              onChange={(e) => {
                setFormData({ ...formData, returnDate: e.target.value });
                setErrors((prev) => ({ ...prev, returnDate: '' }));
              }}
              className="
                w-full bg-transparent border-none outline-none p-0
                text-sm font-semibold text-slate-800
                uppercase cursor-pointer leading-tight
              "
            />
          </div>
          {errors.returnDate && (
            <p className="absolute -bottom-4 left-3 text-[11px] text-red-500 font-medium">
              {errors.returnDate}
            </p>
          )}
        </div>

        {/* Travelers */}
        <div className="w-full md:basis-[14%] relative">
          <div
            className="
              h-[56px]
              bg-white/80
              border border-slate-200
              rounded-2xl
              hover:border-rose-400
              transition-all
              shadow-sm shadow-slate-100/80
              flex items-stretch
            "
          >
            <PassengerSelector onChange={handlePaxChange} />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="
            w-full md:basis-[14%] h-[56px]
            bg-gradient-to-r from-rose-600 to-rose-500
            hover:from-rose-700 hover:to-rose-600
            text-white font-semibold
            rounded-2xl
            flex items-center justify-center gap-2
            transition-all
            shadow-lg shadow-rose-200/80
            active:scale-95
            cursor-pointer
          "
        >
          <Search className="w-5 h-5" />
         
        </button>
      </div>

      {/* Global Error */}
      {Object.keys(errors).length > 0 && (
        <div
          className="
            mt-4
            inline-flex items-center gap-2
            px-3 py-2
            rounded-full
            bg-red-50/95
            border border-red-200/90
            text-[11px] md:text-xs font-semibold text-red-700
            shadow-sm shadow-red-100
          "
        >
          <AlertCircle className="w-4 h-4" />
          <span>
            {errors.origin ||
              errors.destination ||
              errors.departureDate ||
              errors.returnDate ||
              'Please check all fields.'}
          </span>
        </div>
      )}
    </form>
  );
}