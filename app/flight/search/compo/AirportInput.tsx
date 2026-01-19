'use client';
import { useState, useEffect, useRef } from 'react';
import { FaPlaneDeparture, FaPlaneArrival, FaMapMarkerAlt } from 'react-icons/fa';
import { airportSuggestions } from '@/constant/flight';

interface AirportInputProps {
    label: string;
    icon: 'depart' | 'arrive';
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    excludeCode?: string;
}

const AirportInput = ({ label, icon, placeholder, value, onChange, error, excludeCode }: AirportInputProps) => {
    const [query, setQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial value
    useEffect(() => {
        if (value) {
            const found = airportSuggestions.find(a => a.code === value);
            if (found) setQuery(`${found.city} (${found.code})`);
        }
    }, [value]);

    // Outside Click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Logic
    const filteredAirports = airportSuggestions.filter(item => {
        if (excludeCode && item.code === excludeCode) return false;
        const search = query.toLowerCase();
        return (
            item.city.toLowerCase().includes(search) ||
            item.code.toLowerCase().includes(search) ||
            item.country.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search)
        );
    });

    return (
        // 🟢 FIX 1: 'relative z-50' added to wrapper
        <div className="relative w-full z-20" ref={wrapperRef}>
            
            {/* Input Box */}
            <div className={`relative h-16 bg-white rounded-2xl border transition-all duration-300 ${error ? 'border-red-500 bg-red-50/10' : 'border-gray-200 hover:border-rose-300 focus-within:border-rose-500 focus-within:shadow-lg focus-within:shadow-rose-500/10'}`}>
                
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 pointer-events-none">
                    {icon === 'depart' ? <FaPlaneDeparture /> : <FaPlaneArrival />}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                        if (e.target.value === '') onChange('');
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full h-full pl-12 pr-4 bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 text-base rounded-2xl"
                />

                <span className={`absolute left-12 transition-all duration-200 pointer-events-none ${query || showDropdown ? 'top-2 text-[10px] text-rose-500 font-bold uppercase tracking-wider' : 'top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold'}`}>
                    {query || showDropdown ? label : placeholder}
                </span>

                {value && !showDropdown && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded">
                        {value}
                    </div>
                )}
            </div>

            {error && <span className="absolute -bottom-5 left-2 text-[10px] text-red-500 font-bold">{error}</span>}

            {/* 🟢 FIX 2: Fixed Width & Highest Z-Index */}
            {showDropdown && (
                <div className="absolute top-[110%] left-0 z-50 min-w-[320px] md:min-w-[400px] w-max max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                    
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0">
                        Select {label === 'Origin' ? 'Departure' : 'Destination'}
                    </div>

                    {filteredAirports.length > 0 ? (
                        filteredAirports.map((airport, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    onChange(airport.code);
                                    setQuery(`${airport.city} (${airport.code})`);
                                    setShowDropdown(false);
                                }}
                                className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 min-w-[16px] text-gray-300 group-hover:text-rose-500">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-rose-700">
                                                {airport.city}, {airport.country}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate w-48 md:w-60">
                                                {airport.name}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="bg-gray-100 group-hover:bg-white group-hover:text-rose-600 group-hover:shadow-sm text-gray-600 font-bold text-xs px-2 py-1 rounded">
                                        {airport.code}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No airports found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AirportInput;