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
  ArrowRight,
} from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { z } from 'zod';
import { AirportInput } from './AirportInput';
import { MULTICITY_MAX_LEGS } from '@/constant/control';

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
    value: string
  ) => {
    const newFlights = [...flights];
    newFlights[index] = { ...newFlights[index], [field]: value };

    if (field === 'destination' && index < flights.length - 1) {
      newFlights[index + 1].origin = value;
    }

    setFlights(newFlights);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`flights.${index}.${field}`];
      delete newErrors['flights'];
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
      setFlights(flights.filter((_, i) => i !== index));
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

  const hasErrors = Object.values(errors).some((e) => e);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full relative z-20 bg-white p-4 md:p-5 rounded-b-3xl"
    >
      {/* ═══════════ Flight Legs ═══════════ */}
      <div className="space-y-2">
        {flights.map((flight, index) => (
          <div
            key={index}
            className="
              flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0
              p-3 rounded-2xl
              bg-gray-50/70 border border-gray-100
              transition-all duration-300
              hover:border-gray-200
              animate-in fade-in slide-in-from-top-1 duration-300
            "
            style={{ zIndex: 50 - index }}
          >
            {/* ── Badge ── */}
            <div className="flex items-center gap-2 lg:mr-3 shrink-0">
              <div
                className="
                  w-7 h-7 rounded-lg
                  bg-gray-900 text-white
                  flex items-center justify-center
                  text-[11px] font-bold
                  shadow-sm
                "
              >
                {index + 1}
              </div>

              {/* Mobile label */}
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider lg:hidden">
                Flight {index + 1}
              </span>

              {/* Mobile remove */}
              {index > 1 && (
                <button
                  type="button"
                  onClick={() => removeFlight(index)}
                  className="
                    ml-auto lg:hidden
                    w-7 h-7 rounded-lg
                    bg-white border border-red-100
                    hover:bg-red-50 hover:border-red-200
                    flex items-center justify-center
                    transition-all cursor-pointer active:scale-90
                  "
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>

            {/* ── From ── */}
            <div className="flex-[1.2] lg:min-w-0">
              <AirportInput
                label="From"
                codeValue={flight.origin}
                onSelect={(code: string) =>
                  handleFlightChange(index, 'origin', code)
                }
                placeholder="City or airport"
                icon={<MapPin className="w-3.5 h-3.5" />}
                disabledCodes={[flight.destination]}
                hasError={!!errors[`flights.${index}.origin`]}
              />
            </div>

            {/* ── Arrow ── */}
            <div className="hidden lg:flex items-center justify-center mx-1 shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            </div>

            {/* ── To ── */}
            <div className="flex-[1.2] lg:min-w-0">
              <AirportInput
                label="To"
                codeValue={flight.destination}
                onSelect={(code: string) =>
                  handleFlightChange(index, 'destination', code)
                }
                placeholder="City or airport"
                icon={<Plane className="w-3.5 h-3.5" />}
                disabledCodes={[flight.origin]}
                hasError={!!errors[`flights.${index}.destination`]}
              />
            </div>

            {/* ── Divider ── */}
            <div className="hidden lg:block w-px h-8 bg-gray-200 mx-3 shrink-0" />

            {/* ── Date ── */}
            <div className="flex-1 lg:min-w-0 lg:max-w-[200px]">
              <div
                className={`
                  group relative
                  h-[56px] w-full
                  bg-white rounded-xl
                  border transition-all duration-300
                  flex items-center gap-3
                  px-3.5 cursor-pointer
                  ${
                    errors[`flights.${index}.date`]
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
                      errors[`flights.${index}.date`]
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
                      transition-colors duration-300
                      ${
                        errors[`flights.${index}.date`]
                          ? 'text-red-400'
                          : 'text-gray-400 group-focus-within:text-gray-900'
                      }
                    `}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    min={
                      index > 0
                        ? flights[index - 1].date || today
                        : today
                    }
                    value={flight.date}
                    onChange={(e) =>
                      handleFlightChange(index, 'date', e.target.value)
                    }
                    className="
                      w-full bg-transparent border-none outline-none p-0
                      text-[13px] font-semibold text-gray-900
                      uppercase cursor-pointer leading-tight
                    "
                  />
                </div>

                {flight.date && !errors[`flights.${index}.date`] && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                )}
              </div>
            </div>

            {/* ── Remove (desktop) ── */}
            {index > 1 && (
              <div className="hidden lg:flex items-center ml-2 shrink-0">
                <button
                  type="button"
                  onClick={() => removeFlight(index)}
                  className="
                    w-9 h-9 rounded-xl
                    bg-white border border-gray-200
                    hover:bg-red-50 hover:border-red-200
                    flex items-center justify-center
                    text-gray-400 hover:text-red-500
                    transition-all duration-300
                    cursor-pointer active:scale-90
                  "
                  title="Remove flight"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════ Bottom Controls ═══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4 pt-4 border-t border-gray-100 relative z-10">
        {/* Add Flight */}
        {flights.length < MULTICITY_MAX_LEGS && (
          <button
            type="button"
            onClick={addFlight}
            className="
              flex-1 h-[52px]
              border border-dashed border-gray-300
              rounded-xl
              text-gray-500 font-semibold text-sm
              flex items-center justify-center gap-2
              hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50
              transition-all duration-300
              cursor-pointer active:scale-[0.98]
            "
          >
            <Plus className="w-4 h-4" />
            Add Flight
            <span className="text-[10px] font-medium text-gray-400 hidden sm:inline">
              ({flights.length}/{MULTICITY_MAX_LEGS})
            </span>
          </button>
        )}

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1 shrink-0" />

        {/* Passengers */}
        <div className="lg:w-[240px] shrink-0">
          <div
            className="
              h-[52px] w-full
              bg-white rounded-xl
              border border-gray-200
              hover:border-gray-300
              transition-all duration-300
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

        {/* Divider */}
        <div className="hidden lg:block w-2 shrink-0" />

        {/* Search */}
        <div className="lg:shrink-0">
          <button
            type="submit"
            className="
              w-full lg:w-auto h-[52px]
             bg-rose-600 hover:bg-rose-700
              text-white font-bold text-sm
              rounded-xl
              px-7
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
            <span>Search</span>
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
            Please fix the highlighted errors before searching.
          </p>
        </div>
      )}
    </form>
  );
}