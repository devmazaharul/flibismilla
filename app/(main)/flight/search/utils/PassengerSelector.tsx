'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Users,
  ChevronDown,
  Minus,
  Plus,
  Armchair,
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
  const [cabinClass, setCabinClass] = useState<
    'economy' | 'business' | 'first'
  >('economy');

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
      className={`relative w-full h-full ${isOpen ? 'z-50' : 'z-0'}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* ═══════════ Trigger ═══════════ */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`
          group
          flex items-center gap-3
          h-[56px] w-full
          rounded-xl px-3.5
          text-left cursor-pointer
          bg-white
          border transition-all duration-300
          ${
            isOpen
              ? 'border-gray-900 shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
              : 'border-gray-200 hover:border-gray-300'
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center shrink-0
            transition-all duration-300
            ${
              isOpen
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'
            }
          `}
        >
          <Users className="w-3.5 h-3.5" />
        </div>

        {/* Text */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <label
            className={`
              text-[10px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5
              transition-colors duration-300
              ${isOpen ? 'text-gray-900' : 'text-gray-400'}
            `}
          >
            Travelers
          </label>
          <span className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {totalPax} Guest{totalPax > 1 ? 's' : ''} ·{' '}
            <span className="capitalize text-gray-500">{cabinClass}</span>
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-gray-900' : 'text-gray-300'
          }`}
        />
      </button>

      {/* ═══════════ Dropdown ═══════════ */}
      {isOpen && (
        <div
          className="
            absolute top-[calc(100%+6px)] right-0
            w-[300px] sm:w-[320px]
            rounded-2xl
            bg-white
            shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)]
            overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-200
            cursor-default
          "
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">
                  Passengers
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {totalPax} traveler{totalPax > 1 ? 's' : ''} selected
                </p>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                Max {MAX_TOTAL_PASSENGERS}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(totalPax / MAX_TOTAL_PASSENGERS) * 100}%`,
                  backgroundColor:
                    totalPax >= MAX_TOTAL_PASSENGERS ? '#ef4444' : '#111827',
                }}
              />
            </div>
          </div>

          {/* Counters */}
          <div className="p-5 space-y-1">
            {[
              {
                id: 'adults',
                label: 'Adults',
                sub: '12+ years',
                emoji: '🧑',
              },
              {
                id: 'children',
                label: 'Children',
                sub: '2–11 years',
                emoji: '👦',
              },
              {
                id: 'infants',
                label: 'Infants',
                sub: 'Under 2',
                emoji: '👶',
              },
            ].map((item) => {
              const key = item.id as keyof PassengerCounts;
              const value = counts[key];

              const minusDisabled =
                (item.id === 'adults' &&
                  (counts.adults <= 1 ||
                    counts.adults <= counts.infants)) ||
                value <= 0;

              const plusDisabled =
                totalPax >= MAX_TOTAL_PASSENGERS ||
                value >= LIMITS[key] ||
                (item.id === 'infants' &&
                  counts.infants >= counts.adults);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 group/row"
                >
                  {/* Left: info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover/row:bg-gray-200 flex items-center justify-center text-sm transition-colors duration-200">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {item.sub}
                      </p>
                    </div>
                  </div>

                  {/* Right: counter */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCount(key, 'sub')}
                      disabled={minusDisabled}
                      className="
                        w-8 h-8 rounded-lg
                        bg-white border border-gray-200
                        flex items-center justify-center
                        text-gray-500
                        hover:border-gray-300 hover:text-gray-900
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all duration-200
                        cursor-pointer active:scale-90
                      "
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span
                      className={`
                        w-8 text-center text-sm font-bold
                        ${value > 0 ? 'text-gray-900' : 'text-gray-300'}
                      `}
                    >
                      {value}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateCount(key, 'add')}
                      disabled={plusDisabled}
                      className="
                        w-8 h-8 rounded-lg
                        bg-gray-900 text-white
                        flex items-center justify-center
                        hover:bg-gray-800
                        disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                        transition-all duration-200
                        cursor-pointer active:scale-90
                        shadow-sm
                      "
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cabin Class */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Armchair className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">
                Cabin Class
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-gray-100 rounded-xl">
              {(['economy', 'business', 'first'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setCabinClass(cls)}
                  className={`
                    py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide
                    transition-all duration-300
                    cursor-pointer
                    ${
                      cabinClass === cls
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-white'
                    }
                  `}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="
                w-full h-11
                bg-gray-900 hover:bg-gray-800
                text-white font-bold text-sm
                rounded-xl
                flex items-center justify-center
                transition-all duration-300
                shadow-lg shadow-gray-900/10
                hover:shadow-xl hover:shadow-gray-900/15
                active:scale-[0.98]
                cursor-pointer
              "
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}