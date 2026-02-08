"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { airportSuggestions } from "@/constant/flight";

export const AIRPORTS = airportSuggestions;
export type Airport = (typeof AIRPORTS)[number];

type AirportInputProps = {
  label: string;
  codeValue?: string;
  onSelect: (code: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  disabledCodes?: string[];
  hasError?: boolean;
  helperText?: string;
};

const getFullName = (code: string | undefined, airports: readonly Airport[]) => {
  if (!code) return "";
  const airport = airports.find((a) => a.code === code);
  return airport ? `${airport.city} (${airport.code})` : "";
};

export const AirportInput: React.FC<AirportInputProps> = ({
  label,
  codeValue,
  onSelect,
  placeholder = "Search city, airport or country",
  icon,
  disabledCodes = [],
  hasError = false,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isTypingRef = useRef(false);

  // external value sync
  useEffect(() => {
    if (!isTypingRef.current) {
      if (codeValue) {
        const formattedName = getFullName(codeValue, AIRPORTS);
        if (formattedName && formattedName !== inputValue) {
          setInputValue(formattedName);
        }
      } else {
        if (inputValue !== "") setInputValue("");
      }
    }
  }, [codeValue, inputValue]);

  const filteredAirports = AIRPORTS.filter((item) => {
    const search = inputValue.toLowerCase();
    if (!search) return true;
    return (
      item.code.toLowerCase().includes(search) ||
      item.city.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search) ||
      item.country.toLowerCase().includes(search)
    );
  });

  const handleSelect = (airport: Airport) => {
    if (disabledCodes.includes(airport.code)) return;
    isTypingRef.current = false;
    setInputValue(`${airport.city} (${airport.code})`);
    onSelect(airport.code);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true;
    setInputValue(e.target.value);
    if (codeValue) onSelect("");
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && codeValue) {
      e.preventDefault();
      setInputValue("");
      onSelect("");
      isTypingRef.current = true;
      setIsOpen(true);
    }
  };

  // click outside close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        isTypingRef.current = false;
        if (codeValue) setInputValue(getFullName(codeValue, AIRPORTS));
        else setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [codeValue]);

  return (
    <div className="relative w-full h-full" ref={wrapperRef}>
      {/* Icon */}
      <div className="absolute inset-y-0 left-3 flex items-center z-10 pointer-events-none">
        <div
          className={`
            w-8 h-8 rounded-full
            flex items-center justify-center
            text-slate-500
            border
            transition-colors
            ${hasError
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-slate-50 border-slate-200 group-focus-within:bg-rose-50 group-focus-within:border-rose-200 group-focus-within:text-rose-600"
            }
          `}
        >
          {icon ?? <Plane className="w-4 h-4" />}
        </div>
      </div>

      {/* Input shell */}
      <div
        className={`
          group
          flex flex-col justify-center
          h-[56px] w-full
          bg-white
          rounded-2xl
          border
          transition-all
          cursor-text
          pl-12 pr-3
          ${hasError
            ? "border-red-500 shadow-sm shadow-red-100"
            : "border-slate-200 hover:border-slate-300 focus-within:border-rose-500 focus-within:shadow-md focus-within:shadow-rose-100"
          }
        `}
        onClick={() => setIsOpen(true)}
      >
        <label
          className={`
            text-[10px] font-bold uppercase tracking-[0.16em] leading-tight
            ${hasError ? "text-red-400" : "text-slate-400"}
          `}
        >
          {label}
        </label>

        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="
            w-full bg-transparent border-none outline-none p-0
            text-sm font-semibold text-slate-900
            placeholder-slate-300 truncate leading-tight
          "
          placeholder={placeholder}
        />
      </div>

      {helperText && (
        <p
          className={`mt-1 text-xs ${
            hasError ? "text-red-500" : "text-slate-400"
          }`}
        >
          {helperText}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && filteredAirports.length > 0 && (
        <div
          className="
            absolute top-[110%] left-0
            w-full min-w-[260px]
            bg-white
            rounded-2xl
            shadow-lg shadow-slate-200/80
            border border-slate-100
            z-[60]
            max-h-72 overflow-y-auto custom-scrollbar
            animate-in fade-in zoom-in-95 duration-200
          "
        >
          <div className="p-2 sticky top-0 bg-white border-b border-slate-50 z-10">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-[0.18em]">
              Select location
            </span>
          </div>

          {filteredAirports.map((airport, i) => {
            const isDisabled = disabledCodes.includes(airport.code);
            return (
              <div
                key={i}
                onClick={() => !isDisabled && handleSelect(airport)}
                className={`
                  flex items-center gap-3
                  px-4 py-2.5
                  border-b border-slate-50 last:border-none
                  transition-colors
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed bg-slate-50"
                      : "cursor-pointer hover:bg-slate-50"
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isDisabled
                      ? "bg-slate-200 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                    }
                  `}
                >
                  <Plane className="w-4 h-4" />
                </div>

                <div className="flex flex-col text-left flex-1">
                  <span
                    className={`
                      text-sm font-semibold flex items-center gap-2
                      ${isDisabled ? "text-slate-400" : "text-slate-900"}
                    `}
                  >
                    {airport.city}
                    <span
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded-full font-extrabold
                        ${isDisabled
                          ? "bg-slate-200 text-slate-500"
                          : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >
                      {airport.code}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {airport.name}, {airport.country}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};