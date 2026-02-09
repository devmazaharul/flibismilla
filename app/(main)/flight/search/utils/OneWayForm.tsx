'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Plane,
  ArrowLeftRight,
  AlertCircle,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';

const oneWaySchema = z
  .object({
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    date: z.string().min(1, 'Departure date is required'),
    passengers: z.object({
      adults: z.number().min(1),
      children: z.number(),
      infants: z.number(),
    }),
    cabinClass: z.string(),
  })
  .refine((data) => data.origin !== data.destination, {
    message: 'Origin and destination cannot be the same',
    path: ['destination'],
  });

export default function OneWayForm({
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
    date: '',
    passengers: { adults: 1, children: 0, infants: 0 },
    cabinClass: 'economy',
  });

  useEffect(() => {
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('dest');
    const dateParam = searchParams.get('date');

    if (originParam || destParam || dateParam) {
      setFormData((prev) => ({
        ...prev,
        origin: originParam || 'DAC',
        destination: destParam || 'LAX',
        date: dateParam || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        origin: 'DAC',
        destination: 'LAX',
        date: prev.date || today,
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

    const result = oneWaySchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error?.issues.forEach((err) => {
        const path = err.path[0] as string;
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    const params = new URLSearchParams();
    params.set('type', 'one_way');
    params.set('origin', formData.origin);
    params.set('dest', formData.destination);
    params.set('date', formData.date);
    params.set('adt', formData.passengers.adults.toString());
    params.set('chd', formData.passengers.children.toString());
    params.set('inf', formData.passengers.infants.toString());
    params.set('class', formData.cabinClass);

    onSearch(params);
  };

  const hasErrors = Object.values(errors).some((e) => e);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full relative z-20 bg-white p-4 md:p-5 rounded-b-3xl"
    >
      {/* ═══════════ All fields — single row on desktop ═══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0">
        {/* ── From ── */}
        <div className="flex-[1.3] lg:min-w-0">
          <AirportInput
            label="From"
            codeValue={formData.origin}
            onSelect={(code: string) => {
              setFormData((prev) => ({ ...prev, origin: code }));
              setErrors((prev) => ({ ...prev, origin: '' }));
            }}
            placeholder="City or airport"
            icon={<MapPin className="w-3.5 h-3.5" />}
            disabledCodes={[formData.destination]}
            hasError={!!errors.origin}
          />
        </div>

             {/* ── Swap ── */}
        <div className="flex items-center justify-center lg:mx-[-6px] z-10 -my-1 lg:my-0">
          <button
            type="button"
            onClick={handleSwap}
            className="
              w-7 h-7 lg:w-8 lg:h-8 rounded-full
              bg-white border border-gray-200
              text-gray-400
              hover:text-gray-900 hover:border-gray-300
              lg:hover:bg-gray-900 lg:hover:text-white lg:hover:border-gray-900
              flex items-center justify-center
              shadow-sm transition-all duration-300
              cursor-pointer active:scale-90
              lg:hover:-translate-y-px
            "
            title="Swap"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>


        {/* ── To ── */}
        <div className="flex-[1.3] lg:min-w-0">
          <AirportInput
            label="To"
            codeValue={formData.destination}
            onSelect={(code: string) => {
              setFormData((prev) => ({ ...prev, destination: code }));
              setErrors((prev) => ({ ...prev, destination: '' }));
            }}
            placeholder="City or airport"
            icon={<Plane className="w-3.5 h-3.5" />}
            disabledCodes={[formData.origin]}
            hasError={!!errors.destination}
          />
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

        {/* ── Date ── */}
        <div className="flex-[1] lg:min-w-0">
          <div
            className={`
              group relative
              h-[56px] w-full
              bg-white rounded-xl
              border transition-all duration-300
              flex items-center gap-3
              px-3.5
              cursor-pointer
              ${
                errors.date
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-gray-200 hover:border-gray-300 focus-within:border-gray-900 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
              }
            `}
          >
            <div
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                transition-all duration-300
                ${
                  errors.date
                    ? 'bg-red-100 text-red-500'
                    : 'bg-gray-100 text-gray-400 group-focus-within:bg-gray-900 group-focus-within:text-white'
                }
              `}
            >
              <Calendar className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col justify-center flex-1 min-w-0">
              <label
                className={`
                  text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5
                  ${errors.date ? 'text-red-400' : 'text-gray-400 group-focus-within:text-gray-900'}
                `}
              >
                Departure
              </label>
              <input
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className="
                  w-full bg-transparent border-none outline-none p-0
                  text-[13px] font-semibold text-gray-900
                  uppercase cursor-pointer leading-tight
                "
              />
            </div>

            {formData.date && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </div>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

        {/* ── Passengers ── */}
        <div className="flex-[1] lg:min-w-0">
          <div
            className="
              h-[56px] w-full
              bg-white rounded-xl
              border border-gray-200
              hover:border-gray-300
              transition-all duration-300
              flex items-stretch
             
            "
          >
            <PassengerSelector onChange={handlePaxChange} />
          </div>
        </div>

        {/* ── Divider (desktop) ── */}
        <div className="hidden lg:block w-3 shrink-0" />

        {/* ── Search ── */}
        <div className="lg:shrink-0">
          <button
            type="submit"
            className="
              w-full lg:w-auto h-[56px]
              bg-rose-600 hover:bg-rose-700
              text-white font-bold text-sm
              rounded-xl
              px-6
              flex items-center justify-center gap-2
              transition-all duration-300
              shadow-lg shadow-gray-900/10
              hover:shadow-xl hover:shadow-gray-900/15
              hover:-translate-y-px
              active:scale-[0.98]
              cursor-pointer
            "
          >
            <Search className="w-4 h-4" />
            <span className="lg:hidden xl:inline">Search</span>
          </button>
        </div>
      </div>

      {/* ═══════════ Error ═══════════ */}
      {hasErrors && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3 h-3 text-red-500" />
          </div>
          <p className="text-[11px] font-semibold text-red-600">
            {errors.origin ||
              errors.destination ||
              errors.date ||
              'Please fill all required fields.'}
          </p>
        </div>
      )}
    </form>
  );
}