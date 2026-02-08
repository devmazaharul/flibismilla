'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Users,
  ChevronDown,
  Minus,
  Plus,
  Armchair,
  Info,
} from 'lucide-react';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '@/constant/control';

type PassengerCounts = {
  adults: number;
  children: number;
  infants: number;
};

interface Props {
  onChange: (data: { passengers: PassengerCounts; cabinClass: string }) => void;
}

export default function PassengerSelector({ onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [counts, setCounts] = useState<PassengerCounts>({
    adults: MIN_PASSENGERS,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>(
    'economy',
  );

  const MAX_TOTAL_PASSENGERS = MAX_PASSENGERS;
  const LIMITS = { adults: 9, children: 8, infants: 8 };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onChange({ passengers: counts, cabinClass });
  }, [counts, cabinClass, onChange]);

  const totalPax = counts.adults + counts.children + counts.infants;

  const updateCount = (type: keyof PassengerCounts, op: 'add' | 'sub') => {
    setCounts((prev) => {
      const currentTotal = prev.adults + prev.children + prev.infants;
      const val = prev[type];

      if (op === 'add') {
        if (currentTotal >= MAX_TOTAL_PASSENGERS) return prev;
        if (val >= LIMITS[type]) return prev;
        if (type === 'infants' && val >= prev.adults) return prev;

        return { ...prev, [type]: val + 1 };
      }

      if (op === 'sub') {
        if (val <= (type === 'adults' ? 1 : 0)) return prev;
        if (type === 'adults' && val <= prev.infants) return prev;
        return { ...prev, [type]: val - 1 };
      }

      return prev;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div
      className={`relative w-full h-full group ${
        isOpen ? 'z-50' : 'z-0'
      }`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Left icon */}
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <div
          className={`p-1.5 rounded-lg transition-colors duration-300 ${
            isOpen
              ? 'bg-rose-50 text-rose-600'
              : 'text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-600'
          }`}
        >
          <Users className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`
          flex flex-col justify-center h-[56px] w-full
          rounded-2xl pl-11 pr-4
          text-left cursor-pointer
          bg-white/85
          border
          transition-all duration-300
          shadow-sm shadow-slate-100
          ${
            isOpen
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50/40'
          }
        `}
      >
        <label
          className={`text-[10px] font-bold uppercase tracking-widest leading-tight ${
            isOpen ? 'text-rose-500' : 'text-slate-400'
          }`}
        >
          Travelers & Class
        </label>
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {totalPax} Traveler{totalPax > 1 ? 's' : ''},{' '}
            <span className="capitalize">{cabinClass}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? 'rotate-180 text-rose-500' : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-[115%] right-0
            w-[300px] sm:w-[320px]
            rounded-3xl
            border border-slate-100/80
            bg-gradient-to-b from-white/95 via-white to-slate-50/90
            shadow-[0_22px_60px_rgba(15,23,42,0.18)]
            p-5
            animate-in fade-in zoom-in-95 duration-200
            backdrop-blur-xl
            cursor-default
          "
        >
          {/* Header / Summary */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                Travelers
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {totalPax} guest{totalPax > 1 ? 's' : ''} ·{' '}
                <span className="capitalize">{cabinClass}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900 text-[10px] font-medium text-white/90 shadow-sm">
              <Info className="w-3.5 h-3.5" />
              <span>
                Max {MAX_TOTAL_PASSENGERS}
              </span>
            </div>
          </div>

          {/* Passenger counters */}
          <div className="space-y-4">
            {[
              { id: 'adults', label: 'Adults', sub: '12+ years' },
              { id: 'children', label: 'Children', sub: '2–11 years' },
              { id: 'infants', label: 'Infants', sub: 'Under 2 years' },
            ].map((item) => {
              const key = item.id as keyof PassengerCounts;
              const value = counts[key];

              const minusDisabled =
                (item.id === 'adults' &&
                  (counts.adults <= 1 || counts.adults <= counts.infants)) ||
                value <= 0;

              const plusDisabled =
                totalPax >= MAX_TOTAL_PASSENGERS ||
                value >= LIMITS[key] ||
                (item.id === 'infants' && counts.infants >= counts.adults);

              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {item.sub}
                    </p>
                  </div>
                  <div
                    className="
                      flex items-center gap-3
                      bg-slate-50/90
                      rounded-xl
                      px-2 py-1.5
                      border border-slate-100
                    "
                  >
                    {/* Minus */}
                    <button
                      type="button"
                      onClick={() => updateCount(key, 'sub')}
                      disabled={minusDisabled}
                      className="
                        w-8 h-8 rounded-xl
                        bg-white
                        border border-slate-200
                        flex items-center justify-center
                        text-slate-600
                        hover:text-rose-600 hover:border-rose-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-sm
                        transition-all active:scale-95
                      "
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-black text-slate-900 w-5 text-center text-sm">
                      {value}
                    </span>

                    {/* Plus */}
                    <button
                      type="button"
                      onClick={() => updateCount(key, 'add')}
                      disabled={plusDisabled}
                      className="
                        w-8 h-8 rounded-xl
                        bg-slate-900
                        text-white
                        flex items-center justify-center
                        hover:bg-rose-600
                        disabled:bg-slate-300 disabled:cursor-not-allowed
                        shadow-sm shadow-slate-500/30
                        transition-all active:scale-95
                      "
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-dashed border-slate-200" />

          {/* Cabin class */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Armchair className="w-4 h-4 text-slate-400" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">
                Cabin Class
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['economy', 'business', 'first'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setCabinClass(cls)}
                  className={`
                    py-2.5 rounded-xl text-[10px] font-bold uppercase
                    border
                    transition-all
                    cursor-pointer
                    ${
                      cabinClass === cls
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-300/60'
                        : 'bg-white/90 border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                    }
                  `}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="
              w-full mt-6
              bg-gradient-to-r from-rose-600 to-rose-500
              hover:from-rose-700 hover:to-rose-600
              text-white font-semibold
              py-3 rounded-2xl text-sm
              shadow-lg shadow-rose-200
              transition-all active:scale-95
              cursor-pointer
            "
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}