'use client';
import { TRAVALERS_MAX_QUANTITY } from '@/constant/flight';
import { useState, useRef, useEffect } from 'react';
import { FaUser, FaChevronDown, FaChair, FaPlus, FaMinus } from 'react-icons/fa';

const TravelerInput = ({ register, setValue, watch }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {maxAdults,maxChildren,maxInfants}=TRAVALERS_MAX_QUANTITY

    // Watch values to update UI
    const adults = parseInt(watch('adults') || "1");
    const children = parseInt(watch('children') || "0");
    const infants = parseInt(watch('infants') || "0");
    const travelClass = watch('travelClass') || "ECONOMY";

    const totalTravelers = adults + children + infants;



    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper for counters
    const handleCounter = (field: string, operation: 'inc' | 'dec') => {
        let currentVal = 0;
        let maxLimit = 0;

        // Determine current value and limit based on field
        if (field === 'adults') {
            currentVal = adults;
            maxLimit = maxAdults;
        } else if (field === 'children') {
            currentVal = children;
            maxLimit = maxChildren;
        } else if (field === 'infants') {
            currentVal = infants;
            maxLimit = maxInfants;
        }

        let newVal = currentVal;
        
        if (operation === 'inc') {
            if (newVal < maxLimit) {
                newVal = currentVal + 1;
            }
        } 
        else if (operation === 'dec') {
            if (currentVal > 0) {
                newVal = currentVal - 1;
            }
        }

        // Special rule: Minimum 1 adult required
        if (field === 'adults' && newVal < 1) newVal = 1;

        setValue(field, newVal.toString());
    };

    return (
        <div className="relative w-full z-40" ref={dropdownRef}>
            {/* Trigger Button */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 px-4 bg-gray-50 rounded-2xl flex items-center justify-between cursor-pointer border border-transparent hover:border-rose-200 transition-all group select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                        <FaUser size={14} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-rose-500 transition-colors">
                            Travelers & Class
                        </span>
                        <span className="text-sm font-bold text-gray-800 truncate">
                            {totalTravelers} Pax, {travelClass.charAt(0) + travelClass.slice(1).toLowerCase().replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
                <FaChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white shadow-2xl rounded-3xl p-5 z-50 border border-gray-100 animate-in fade-in zoom-in-95 origin-top-right">
                    
                    {/* Class Selection */}
                    <div className="mb-6">
                        <span className="text-xs font-black text-gray-400 uppercase block mb-3 flex items-center gap-2">
                            <FaChair /> Travel Class
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {['ECONOMY', 'BUSINESS', 'FIRST', 'PREMIUM_ECONOMY'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setValue('travelClass', c)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border uppercase ${
                                        travelClass === c 
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {c.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-4"></div>

                    {/* Travelers Counters */}
                    <div className="space-y-4">
                        {[
                            { label: 'Adults', sub: '(12+ yrs)', field: 'adults', max: maxAdults },
                            { label: 'Children', sub: '(2-12 yrs)', field: 'children', max: maxChildren },
                            { label: 'Infants', sub: '(0-2 yrs)', field: 'infants', max: maxInfants },
                        ].map((item) => {
                            const currentValue = parseInt(watch(item.field) || "0");
                            const isMax = currentValue >= item.max;
                            const isMin = item.field === 'adults' ? currentValue <= 1 : currentValue <= 0;

                            return (
                                <div key={item.field} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                        <button 
                                            type="button" 
                                            disabled={isMin}
                                            onClick={() => handleCounter(item.field, 'dec')}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <FaMinus size={10} />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{currentValue}</span>
                                        <button 
                                            type="button" 
                                            disabled={isMax}
                                            onClick={() => handleCounter(item.field, 'inc')}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Max Limit Info */}
                    <div className="mt-4 text-[10px] text-center text-gray-400 bg-gray-50 py-1 rounded">
                        Max: {maxAdults} Adults, {maxChildren} Children, {maxInfants} Infants
                    </div>

                    <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-lg active:scale-95"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default TravelerInput;