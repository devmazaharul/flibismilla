'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Plane,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';
import { MULTICITY_MAX_LEGS } from '@/constant/control';

// Schema Definition
const flightLegSchema = z
  .object({
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    date: z.string().min(1, 'Date is required'),
  })
  .refine((data) => data.origin !== data.destination, {
    message: 'Same airport',
    path: ['destination'],
  });

const multiCitySchema = z.object({
  flights: z.array(flightLegSchema).min(2, 'At least 2 flights required'),
  passengers: z.object({
    adults: z.number().min(1),
    children: z.number(),
    infants: z.number(),
  }),
  cabinClass: z.string(),
});

interface FlightLeg {
  origin: string;
  destination: string;
  date: string;
}

export default function MultiCityForm({
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

  const [flights, setFlights] = useState<FlightLeg[]>([
    { origin: 'DAC', destination: 'DXB', date: '' },
    { origin: 'DXB', destination: 'LAX', date: '' },
  ]);
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState('economy');

  // Populate from URL
  useEffect(() => {
    const flightsParam = searchParams.get('flights');
    if (flightsParam) {
      try {
        const parsedFlights = JSON.parse(flightsParam);
        if (Array.isArray(parsedFlights) && parsedFlights.length > 0) {
          setFlights(parsedFlights);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [searchParams]);

  const handleFlightChange = (
    index: number,
    field: keyof FlightLeg,
    value: string,
  ) => {
    const newFlights = [...flights];
    newFlights[index] = { ...newFlights[index], [field]: value };

    // পরের লেগের origin auto-fill
    if (field === 'destination' && index < flights.length - 1) {
      newFlights[index + 1].origin = value;
    }

    setFlights(newFlights);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`flights.${index}.${field}`];
      delete newErrors['flights']; // general flights error clear
      return newErrors;
    });
  };

  const addFlight = () => {
    if (flights.length < MULTICITY_MAX_LEGS) {
      const lastDest = flights[flights.length - 1].destination;
      const lastDate = flights[flights.length - 1].date || today;
      setFlights([
        ...flights,
        { origin: lastDest, destination: '', date: lastDate },
      ]);
    }
  };

  const removeFlight = (index: number) => {
    if (flights.length > 2) {
      const newFlights = flights.filter((_, i) => i !== index);
      setFlights(newFlights);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = multiCitySchema.safeParse({
      flights,
      passengers,
      cabinClass,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    const params = new URLSearchParams();
    params.set('type', 'multi_city');
    params.set('flights', JSON.stringify(flights));
    params.set('adt', passengers.adults.toString());
    params.set('chd', passengers.children.toString());
    params.set('inf', passengers.infants.toString());
    params.set('class', cabinClass);

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
      <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-100/70">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
              Multi City
            </p>
            <p className="text-sm md:text-base font-semibold text-slate-800">
              Build complex itineraries in one search.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-white/70 border border-slate-200 rounded-full px-3 py-1 shadow-2xl shadow-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Up to {MULTICITY_MAX_LEGS} legs · Smart connection chaining
        </div>
      </div>

      {/* Flights list */}
      <div className="flex flex-col gap-4">
        {flights.map((flight, index) => (
          <div
            key={index}
            className="
              flex flex-col xl:flex-row gap-4 items-center
              p-3 md:p-4
              rounded-2xl
              bg-white/80
   
              transition-all
    
              animate-in slide-in-from-top-2
            "
            style={{ zIndex: 50 - index }}
          >
            {/* Index Badge */}
            <div className="hidden xl:flex w-8 h-8 shrink-0 bg-slate-900 text-white rounded-full items-center justify-center text-xs font-bold shadow-md">
              {index + 1}
            </div>

            {/* Location Inputs */}
            <div className="flex flex-col md:flex-row w-full flex-1 items-center gap-3 relative">
              {/* From */}
              <div className="w-full relative z-30">
                <AirportInput
                  label="From"
                  codeValue={flight.origin}
                  onSelect={(code: string) =>
                    handleFlightChange(index, 'origin', code)
                  }
                  placeholder="Origin"
                  icon={<MapPin className="w-4 h-4 text-rose-500" />}
                  disabledCodes={[flight.destination]}
                  hasError={!!errors[`flights.${index}.origin`]}
                />
              </div>

              {/* To */}
              <div className="w-full relative z-20">
                <AirportInput
                  label="To"
                  codeValue={flight.destination}
                  onSelect={(code: string) =>
                    handleFlightChange(index, 'destination', code)
                  }
                  placeholder="Destination"
                  icon={<Plane className="w-4 h-4 rotate-90 text-rose-500" />}
                  disabledCodes={[flight.origin]}
                  hasError={!!errors[`flights.${index}.destination`]}
                />
              </div>
            </div>

            {/* Date Input */}
            <div
              className={`
                w-full xl:w-[220px] group relative z-10
                h-[56px]
                bg-white/80
                border rounded-2xl px-4
                flex flex-col justify-center
                transition-all
                shadow-sm shadow-slate-100/80
                ${
                  errors[`flights.${index}.date`]
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
                    errors[`flights.${index}.date`]
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
                    ${
                      errors[`flights.${index}.date`]
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }
                  `}
                >
                  Date
                </label>
                <input
                  type="date"
                  min={index > 0 ? flights[index - 1].date || today : today}
                  value={flight.date}
                  onChange={(e) =>
                    handleFlightChange(index, 'date', e.target.value)
                  }
                  className="
                    w-full bg-transparent border-none outline-none p-0
                    text-sm font-semibold text-slate-800
                    uppercase cursor-pointer leading-tight
                  "
                />
              </div>
              {errors[`flights.${index}.date`] && (
                <p className="absolute -bottom-4 left-3 text-[11px] text-red-500 font-medium">
                  {errors[`flights.${index}.date`]}
                </p>
              )}
            </div>

            {/* Remove Button */}
            {index > 1 && (
              <button
                type="button"
                onClick={() => removeFlight(index)}
                className="
                  w-full xl:w-auto
                  h-[42px] xl:h-10
                  xl:w-10
                  rounded-full
                  flex items-center justify-center shrink-0
                  transition-all
                  bg-white/80 border border-red-100
                  hover:bg-red-50 hover:border-red-200
                  cursor-pointer
                "
              >
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-slate-100 relative z-10">
        {/* Add Flight */}
        <button
          type="button"
          onClick={addFlight}
          className="
            w-full md:flex-1 h-[56px]
            border-2 border-dashed border-slate-300
            rounded-2xl
            text-slate-500 font-semibold text-sm
            flex items-center justify-center gap-2
            hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/70
            transition-all cursor-pointer
            bg-white/60
          "
        >
          <Plus className="w-4 h-4" /> Add Flight
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            (Up to {MULTICITY_MAX_LEGS} legs)
          </span>
        </button>

        {/* Passengers */}
        <div className="w-full md:w-[280px] relative z-50">
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
            <PassengerSelector
              onChange={(data: any) => {
                setPassengers(data.passengers);
                setCabinClass(data.cabinClass);
              }}
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="
            w-full md:flex-1 h-[56px]
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
          <span className="text-sm md:text-base">Search Flights</span>
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
          <span>Please fix the highlighted errors before searching.</span>
        </div>
      )}
    </form>
  );
}