'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FaSearch, FaPlaneDeparture, FaPlaneArrival, FaCalendarAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { airportSuggestions } from '@/constant/flight';

// Form Types
type Inputs = {
    from: string;
    to: string;
    date: string;
};

const FlightSearchCompact = ({ initialValues }: { initialValues?: any }) => {
    const router = useRouter();

    // States
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState('');
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Refs
    const fromRef = useRef<HTMLDivElement>(null);
    const toRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, setValue, watch } = useForm<Inputs>({
        defaultValues: initialValues || { from: '', to: '', date: '' },
    });

    const selectedFrom = watch('from');
    const selectedTo = watch('to');

    // Initialize values
    useEffect(() => {
        if (initialValues?.from) {
            setFromQuery(initialValues.from);
            setValue('from', initialValues.from);
        }
        if (initialValues?.to) {
            setToQuery(initialValues.to);
            setValue('to', initialValues.to);
        }
    }, [initialValues, setValue]);

    // Outside Click Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
                setShowFromDropdown(false);
            }
            if (toRef.current && !toRef.current.contains(event.target as Node)) {
                setShowToDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Logic
    const filterAirports = (query: string) => {
        return airportSuggestions.filter(
            (item) =>
                item.city.toLowerCase().includes(query.toLowerCase()) ||
                item.code.toLowerCase().includes(query.toLowerCase()) ||
                item.country.toLowerCase().includes(query.toLowerCase()),
        );
    };

    const filteredFrom = filterAirports(fromQuery);
    const filteredTo = filterAirports(toQuery);

    // Handlers
    const handleSelect = (type: 'from' | 'to', airport: (typeof airportSuggestions)[0]) => {
        const displayValue = `${airport.city} (${airport.code})`;
        const codeValue = airport.code;

        if (type === 'from') {
            setFromQuery(displayValue);
            setValue('from', codeValue);
            setShowFromDropdown(false);
        } else {
            setToQuery(displayValue);
            setValue('to', codeValue);
            setShowToDropdown(false);
        }
    };

    const handleInput = (type: 'from' | 'to', val: string) => {
        if (type === 'from') {
            setFromQuery(val);
            setValue('from', val.toUpperCase());
        } else {
            setToQuery(val);
            setValue('to', val.toUpperCase());
        }
    };

    const onSubmit: SubmitHandler<Inputs> = (data) => {
        router.push(`/flight?from=${data.from}&to=${data.to}&date=${data.date}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className=" p-3 rounded-3xl   flex flex-col lg:flex-row gap-3 items-center w-full"
            >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                    {/* FROM */}
                    <div className="md:col-span-4 relative" ref={fromRef}>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 text-lg">
                            <FaPlaneDeparture />
                        </div>
                        <input
                            type="text"
                            placeholder="From (City or Code)"
                            value={fromQuery}
                            onChange={(e) => {
                                handleInput('from', e.target.value);
                                setShowFromDropdown(true);
                            }}
                            onFocus={() => setShowFromDropdown(true)}
                            className="w-full h-16 pl-14 pr-4 bg-gray-50 rounded-2xl border border-transparent hover:border-rose-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 font-bold text-gray-800 outline-none transition-all uppercase placeholder:normal-case truncate text-lg"
                            autoComplete="off"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-1 rounded">
                            Origin
                        </span>
                        <input type="hidden" {...register('from')} />

                        {/* From Dropdown */}
                        {showFromDropdown && filteredFrom.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-xl border border-gray-100 max-h-60 overflow-y-auto z-50 mt-2 p-1 animate-in fade-in zoom-in-95 duration-200">
                                {filteredFrom.sort((a, b) => a.city.localeCompare(b.city)).map((airport, i) => {
                                    const isDisabled = selectedTo === airport.code;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() =>
                                                !isDisabled && handleSelect('from', airport)
                                            }
                                            className={`px-4 py-3 flex justify-between items-center rounded-lg transition-colors ${
                                                isDisabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'cursor-pointer hover:bg-rose-50'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {airport.city}, {airport.country}
                                                </p>

                                                <p className="text-[10px] text-left text-gray-500">
                                                    {airport.name}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {airport.code}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* TO */}
                    <div className="md:col-span-4 relative" ref={toRef}>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 text-lg">
                            <FaPlaneArrival />
                        </div>
                        <input
                            type="text"
                            placeholder="To (City or Code)"
                            value={toQuery}
                            onChange={(e) => {
                                handleInput('to', e.target.value);
                                setShowToDropdown(true);
                            }}
                            onFocus={() => setShowToDropdown(true)}
                            className="w-full h-16 pl-14 pr-4 bg-gray-50 rounded-2xl border border-transparent hover:border-rose-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 font-bold text-gray-800 outline-none transition-all uppercase placeholder:normal-case truncate text-lg"
                            autoComplete="off"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-1 rounded">
                            Dest
                        </span>
                        <input type="hidden" {...register('to')} />

                        {/* To Dropdown */}
                        {showToDropdown && filteredTo.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-xl border border-gray-100 max-h-60 overflow-y-auto z-50 mt-2 p-1 animate-in fade-in zoom-in-95 duration-200">
                                {filteredTo.sort((a, b) => a.city.localeCompare(b.city)).map((airport, i) => {
                                    const isDisabled = selectedFrom === airport.code;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() =>
                                                !isDisabled && handleSelect('to', airport)
                                            }
                                            className={`px-4 py-3 flex justify-between items-center rounded-lg transition-colors ${
                                                isDisabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'cursor-pointer hover:bg-rose-50'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {airport.city}, {airport.country}
                                                </p>

                                                <p className="text-[10px] text-left text-gray-500">
                                                    {airport.name}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {airport.code}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* DATE */}
                  <div className="md:col-span-4 relative w-full">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 text-lg z-10">
        <FaCalendarAlt />
    </div>

    <input
        {...register('date')}
        type="date"
        min={new Date().toISOString().split('T')[0]}
        className="
            w-full
            h-16
            pl-14
            pr-4
            bg-gray-50
            rounded-2xl
            border border-transparent
            hover:border-rose-200
            focus:bg-white
            focus:border-rose-500
            focus:ring-4
            focus:ring-rose-500/10
            font-bold
            text-gray-800
            outline-none
            cursor-pointer
            transition-all
            text-lg
            appearance-none
        "
    />
</div>

                </div>

                {/* SEARCH BUTTON */}
                <Button
                    type="submit"
                    className="bg-red-700 hover:bg-red-800 w-full lg:w-auto px-12 h-12 rounded-2xl font-bold shadow-xl shadow-gray-900/10 text-lg transition-all hover:scale-105 active:scale-95 border-2 border-transparent"
                >
                    <FaSearch className="mr-2" /> Search
                </Button>
            </form>
        </div>
    );
};

export default FlightSearchCompact;
