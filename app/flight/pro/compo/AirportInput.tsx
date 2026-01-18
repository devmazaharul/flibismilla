'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPlaneDeparture, FaPlaneArrival } from 'react-icons/fa';
import { airportSuggestions } from '@/constant/flight';

interface AirportInputProps {
    label: string;
    icon: 'depart' | 'arrive';
    value: string;
    onChange: (val: string) => void;
    error?: string;
    placeholder?: string;
    excludeCode?: string; 
}

const AirportInput = ({ label, icon, value, onChange, error, placeholder, excludeCode }: AirportInputProps) => {
    const [query, setQuery] = useState(value);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter Logic
    const filtered = airportSuggestions.filter(item => 
        (item.city.toLowerCase().includes(query.toLowerCase()) || 
        item.code.toLowerCase().includes(query.toLowerCase())) &&
        item.code !== excludeCode
    ).sort((a,b) => a.city.localeCompare(b.city));

    // Handle Outside Click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync internal state if prop changes
    useEffect(() => {
        setQuery(value);
    }, [value]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg">
                {icon === 'depart' ? <FaPlaneDeparture /> : <FaPlaneArrival />}
            </div>
            
            <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder={placeholder}
                className={`w-full h-16 pl-12 pr-4 bg-gray-50 rounded-2xl border ${error ? 'border-red-500 bg-red-50' : 'border-transparent'} hover:border-rose-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 font-bold text-gray-800 outline-none transition-all uppercase placeholder:normal-case truncate text-lg`}
            />
            
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-1 rounded">
                {label}
            </span>

            {/* Dropdown */}
            {showDropdown && filtered.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-xl border border-gray-100 max-h-60 overflow-y-auto z-50 mt-2 p-1 animate-in fade-in zoom-in-95 duration-200">
                    {filtered.map((item, i) => (
                        <div 
                            key={i} 
                            onClick={() => { onChange(item.code); setQuery(item.code); setShowDropdown(false); }}
                            className="px-4 py-3 flex justify-between items-center hover:bg-rose-50 cursor-pointer rounded-lg transition-colors border-b border-gray-50 last:border-0"
                        >
                            <div>
                                <p className="text-sm font-bold text-gray-800">{item.city}, {item.country}</p>
                                <p className="text-[10px] text-gray-500">{item.name}</p>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{item.code}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {error && <span className="text-xs text-red-500 font-bold ml-2 mt-1 block">{error}</span>}
        </div>
    );
};

export default AirportInput;