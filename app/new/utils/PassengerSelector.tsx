'use client';

import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Minus, Plus, Armchair } from 'lucide-react';

interface Props {
  onChange: (data: { passengers: any; cabinClass: string }) => void;
}

export default function PassengerSelector({ onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [counts, setCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('economy');
  
  const MAX_TOTAL_PASSENGERS = 9;
  const LIMITS = { adults: 9, children: 8, infants: 8 };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    onChange({ passengers: counts, cabinClass });
  }, [counts, cabinClass, onChange]);

  const totalPax = counts.adults + counts.children + counts.infants;

  const updateCount = (type: keyof typeof counts, op: 'add' | 'sub') => {
    setCounts(prev => {
      const currentTotal = prev.adults + prev.children + prev.infants;
      const val = prev[type];

      if (op === 'add') {
        // Global Limit Check
        if (currentTotal >= MAX_TOTAL_PASSENGERS) return prev;
        if (val >= LIMITS[type]) return prev;

        if (type === 'infants' && val >= prev.adults) {
            return prev; // Block adding infant if no adult available
        }

        return { ...prev, [type]: val + 1 };
      }
      
      if (op === 'sub') {
         // Min limit check
         if (val <= (type === 'adults' ? 1 : 0)) return prev;

         // 🟢 FIX 2: Cannot reduce Adult if it becomes less than Infants
         if (type === 'adults' && val <= prev.infants) {
            return prev; // Block removing adult if they are holding an infant
         }

         return { ...prev, [type]: val - 1 };
      }
      return prev;
    });
  };

  return (
    <div className={`relative w-full h-full group ${isOpen ? 'z-50' : 'z-0'}`} ref={dropdownRef}>
      
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <div className={`p-1.5 rounded-lg transition-colors duration-300 ${isOpen ? 'bg-rose-50 text-rose-600' : ' text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-600'}`}>
           <Users className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex flex-col justify-center h-[56px] w-full bg-white border rounded-xl pl-11 pr-4 transition-all duration-300 cursor-pointer text-left
        ${isOpen 
            ? 'border-rose-500 ring-2 ring-rose-500/20' 
            : 'border-slate-300 hover:border-rose-400'
        }`}
      >
        <label className={`text-[10px] font-bold uppercase tracking-widest cursor-pointer leading-tight ${isOpen ? 'text-rose-500' : 'text-slate-400'}`}>
            Travelers & Class
        </label>
        <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-slate-800 truncate">
                {totalPax} Traveler{totalPax > 1 ? 's' : ''}, <span className="capitalize">{cabinClass}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[115%] right-0 w-[300px] sm:w-[320px] bg-white rounded-2xl shadow-2xl shadow-slate-300/50 border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200 cursor-default">
          
          <div className="space-y-5">
            {[
              { id: 'adults', label: 'Adults', sub: '12+ yrs' },
              { id: 'children', label: 'Children', sub: '2-11 yrs' },
              { id: 'infants', label: 'Infants', sub: '0-2 yrs' },
            ].map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-800">{item.label}</p>
                  <p className="text-[10px] font-medium text-slate-400">{item.sub}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                  
                  {/* Minus Button */}
                  <button 
                    type="button" 
                    onClick={() => updateCount(item.id as any, 'sub')} 
                    // 🟢 Disable Logic Updated
                    disabled={
                        (item.id === 'adults' && (counts.adults <= 1 || counts.adults <= counts.infants)) || 
                        counts[item.id as keyof typeof counts] <= 0
                    }
                    className="w-8 h-8 rounded-md bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:border-rose-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  
                  <span className="font-black text-slate-800 w-5 text-center text-sm">{counts[item.id as keyof typeof counts]}</span>
                  
                  {/* Plus Button */}
                  <button 
                    type="button" 
                    onClick={() => updateCount(item.id as any, 'add')} 
                    // 🟢 Disable Logic Updated
                    disabled={
                        totalPax >= MAX_TOTAL_PASSENGERS || 
                        counts[item.id as keyof typeof counts] >= LIMITS[item.id as keyof typeof LIMITS] ||
                        (item.id === 'infants' && counts.infants >= counts.adults)
                    }
                    className="w-8 h-8 rounded-md cursor-pointer bg-slate-900 shadow-sm flex items-center justify-center text-white hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="my-5 border-t border-dashed border-slate-200"></div>

          <div>
            <div className="flex items-center gap-2 mb-3">
                <Armchair className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cabin Class</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['economy', 'business', 'first'].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setCabinClass(cls)}
                  className={`py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border shadow-2xl shadow-gray-100 cursor-pointer ${
                    cabinClass === cls
                      ? 'bg-slate-900 border-slate-900 text-white shadow-slate-200'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
 
          <button 
             type="button" 
             onClick={() => setIsOpen(false)}
             className="w-full mt-6 bg-rose-600 cursor-pointer hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}