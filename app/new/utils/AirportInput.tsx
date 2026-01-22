"use client"
import { airportSuggestions } from "@/constant/flight";
import { Plane } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// আপনার ডাটা সোর্স
export const AIRPORTS = airportSuggestions;

const getFullName = (code: string) => {
    const airport = AIRPORTS.find(a => a.code === code);
    return airport ? `${airport.city} (${airport.code})` : '';
};

export const AirportInput = ({ label, codeValue, onSelect, placeholder, icon, disabledCodes = [], hasError }: any) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!isTypingRef.current) {
            if (codeValue) {
                const formattedName = getFullName(codeValue);
                if (formattedName && formattedName !== inputValue) setInputValue(formattedName);
            } else {
                setInputValue('');
            }
        }
    }, [codeValue]);

    const filteredAirports = AIRPORTS.filter(item => {
        const search = inputValue.toLowerCase();
        return (
            item.code.toLowerCase().includes(search) ||
            item.city.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search) ||
            item.country.toLowerCase().includes(search)
        );
    });

    const handleSelect = (airport: any) => {
        if (disabledCodes.includes(airport.code)) return;
        isTypingRef.current = false;
        setInputValue(`${airport.city} (${airport.code})`);
        onSelect(airport.code);
        setIsOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isTypingRef.current = true;
        setInputValue(e.target.value);
        setIsOpen(true);
    };

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                isTypingRef.current = false;
                if (codeValue) setInputValue(getFullName(codeValue));
                else setInputValue('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [codeValue]);

    return (
        <div className="relative w-full h-full group" ref={wrapperRef}>
            {/* Icon positioning */}
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <div className={`p-1.5 rounded-lg transition-colors duration-300 ${hasError ? 'bg-red-50 text-red-500' : 'text-slate-500 group-focus-within:bg-rose-50 group-focus-within:text-rose-600'}`}>
                    {icon}
                </div>
            </div>

            <div
                className={`flex flex-col justify-center h-[56px] w-full bg-white border rounded-xl transition-all duration-300 cursor-text relative
                ${hasError
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-slate-200 hover:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500'
                } 
                pl-11 pr-3`} // 👈 CHANGE: px-10 সরিয়ে pl-11 এবং pr-3 দেওয়া হয়েছে
                onClick={() => setIsOpen(true)}
            >
                <label className={`text-[10px] font-bold uppercase tracking-widest cursor-pointer leading-tight ${hasError ? 'text-red-400' : 'text-slate-400'}`}>
                    {label}
                </label>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-slate-800 placeholder-slate-300 truncate leading-tight"
                    placeholder={placeholder}
                />
            </div>

            {isOpen && filteredAirports.length > 0 && (
                <div className="absolute top-[110%] left-0 w-full min-w-[280px] bg-white rounded-xl shadow-xl shadow-slate-300/50 border border-slate-100 z-[60] max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-50 z-10">
                        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Select Location</span>
                    </div>
                    {filteredAirports.map((airport, i) => {
                        const isDisabled = disabledCodes.includes(airport.code);
                        return (
                            <div
                                key={i}
                                onClick={() => handleSelect(airport)}
                                className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-none transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-rose-50 cursor-pointer group'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDisabled ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                                    <Plane className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col text-left flex-1">
                                    <span className={`text-sm font-bold flex items-center gap-2 ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}>
                                        {airport.city}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${isDisabled ? 'bg-slate-200 text-slate-500' : 'bg-rose-100 text-rose-700'}`}>{airport.code}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">{airport.name}, {airport.country}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};