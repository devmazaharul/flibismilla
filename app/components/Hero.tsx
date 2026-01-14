'use client';
import Image from 'next/image';
import { heroData } from '@/constant/data';
import {
    FaSearch,
    FaCalendarAlt,
    FaPlaneDeparture,
    FaPlaneArrival,
    FaExchangeAlt,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { appTheme } from '@/constant/theme/global';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { SearchInputs, searchSchema } from '@/validation/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { airportSuggestions } from '@/constant/flight';

const Hero = () => {
    const { colors, layout, typography, button } = appTheme;
    const [isSwapping, setIsSwapping] = useState(false);
    const router = useRouter();

    // Search States
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState('');
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Dropdown Refs
    const fromRef = useRef<HTMLDivElement>(null);
    const toRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<SearchInputs>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            from: '',
            to: '',
            date: new Date().toISOString().split('T')[0],
        },
    });

    // Close dropdowns on click outside
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

    // Selection Handler (Dropdown click)
    const handleSelect = (type: 'from' | 'to', airport: (typeof airportSuggestions)[0]) => {
        const val = `${airport.city} (${airport.code})`;

        if (type === 'from') {
            setFromQuery(val);
            setValue('from', airport.code);
            setShowFromDropdown(false);
            clearErrors('from');
        } else {
            setToQuery(val);
            setValue('to', airport.code);
            setShowToDropdown(false);
            clearErrors('to');
        }
    };

    // Swap Logic
    const handleSwap = () => {
        setIsSwapping(true);
        const currentFromCode = getValues('from');
        const currentToCode = getValues('to');
        const currentFromDisplay = fromQuery;
        const currentToDisplay = toQuery;

        setValue('from', currentToCode);
        setValue('to', currentFromCode);

        setFromQuery(currentToDisplay);
        setToQuery(currentFromDisplay);

        setTimeout(() => setIsSwapping(false), 300);
    };

    // Submit Handler
    const onSubmit: SubmitHandler<SearchInputs> = (data) => {
        // Basic Validation
        if (!data.from || !data.to) {
            toast.error('Please select or type valid airport codes.');
            return;
        }

        if (data.from.toUpperCase() === data.to.toUpperCase()) {
            toast.error('Origin and Destination cannot be the same airport.');
            setError('to', { type: 'manual', message: 'Same as origin' });
            return;
        }

        router.push(
            `/flight?from=${data.from.toUpperCase()}&to=${data.to.toUpperCase()}&date=${data.date}`,
        );
    };

    return (
        <section className="relative w-full min-h-[85vh] flex items-center justify-center">
            {/* ================= Background ================= */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/asset/others/hero.webp"
                    alt="Travel Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className={`absolute inset-0 ${colors.background.overlay}`} />
            </div>

            {/* ================= Main Content ================= */}
            <div
                className={`relative z-10 w-full ${layout.container} flex flex-col items-center text-center mt-10`}
            >
                <span className={`${typography.subtitle} text-white mb-2 animate-fade-in-up`}>
                    {heroData.subtitle}
                </span>

                <h1 className={`${typography.h1} text-white max-w-4xl mb-6 drop-shadow-md`}>
                    Your Best <span className="text-gray-200">Travel Partner</span>
                </h1>

                <p className="text-gray-200 text-lg mb-10 max-w-2xl mx-auto">
                    Explore the world with our exclusive Hajj, Umrah, and Holiday packages.
                </p>

                {/* ================= Search Form ================= */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className={`bg-white w-full max-w-6xl ${layout.radius.card} shadow-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative mb-10 md:mb-5`}
                >
                    {/* Input 1: From Location */}
                    <div
                        className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2 relative"
                        ref={fromRef}
                    >
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
                            <FaPlaneDeparture className="text-blue-500" />
                            <label className="font-bold uppercase text-xs tracking-wider text-gray-500">
                                From
                            </label>
                        </div>
                        <input
                            type="text"
                            value={fromQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFromQuery(val);
                                setShowFromDropdown(true);
                                // 🟢 Update: Set value immediately to allow custom input
                                setValue('from', val.toUpperCase());
                                if (val) clearErrors('from');
                            }}
                            onFocus={() => setShowFromDropdown(true)}
                            placeholder="City or Airport (e.g. DAC)"
                            className="w-full  font-bold text-lg outline-none placeholder-gray-300 bg-transparent truncate"
                        />
                        <input type="hidden" {...register('from')} />
                        {errors.from && (
                            <span className="text-[10px] text-red-500 absolute bottom-0 left-4">
                                Required
                            </span>
                        )}

                        {/* Dropdown Suggestions (FROM) */}
                        {showFromDropdown && filteredFrom.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                {filteredFrom
                                    .sort((a, b) => a.city.localeCompare(b.city))
                                    .map((airport, i) => {
                                        const isSelectedInTo = getValues('to') === airport.code;

                                        return (
                                            <div
                                                key={i + 1}
                                                onClick={() =>
                                                    !isSelectedInTo && handleSelect('from', airport)
                                                }
                                                className={`px-4 py-3 flex justify-between items-center text-left border-b border-gray-50 last:border-0 ${
                                                    isSelectedInTo
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                        : 'hover:bg-gray-50 cursor-pointer'
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {airport.city}, {airport.country}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {airport.name}
                                                    </p>
                                                </div>
                                                <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-1 rounded">
                                                    {airport.code}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* Swap Button */}
                    <div className="hidden md:flex absolute left-[25%] top-1/2 -translate-y-1/2 z-20 justify-center">
                        <button
                            type="button"
                            onClick={handleSwap}
                            className={`bg-white border border-gray-200 rounded-full p-2 text-gray-500 hover:text-rose-600 hover:shadow-md transition-all duration-300 ${
                                isSwapping ? 'rotate-180' : ''
                            }`}
                        >
                            <FaExchangeAlt size={12} />
                        </button>
                    </div>

                    {/* Input 2: To Location */}
                    <div
                        className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2 relative md:pl-8"
                        ref={toRef}
                    >
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
                            <FaPlaneArrival className="text-green-500" />
                            <label className="font-bold uppercase text-xs tracking-wider text-gray-500">
                                To
                            </label>
                        </div>
                        <input
                            type="text"
                            value={toQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setToQuery(val);
                                setShowToDropdown(true);
                                // 🟢 Update: Set value immediately to allow custom input
                                setValue('to', val.toUpperCase());
                                if (val) clearErrors('to');
                            }}
                            onFocus={() => setShowToDropdown(true)}
                            placeholder="City or Airport (e.g. JFK)"
                            className="w-full  font-bold text-lg outline-none placeholder-gray-300 bg-transparent truncate"
                        />
                        <input type="hidden" {...register('to')} />

                        {errors.to && (
                            <span className="text-[10px] text-red-500 absolute bottom-0 left-8">
                                {errors.to.message || 'Required'}
                            </span>
                        )}

                        {/* Dropdown Suggestions (TO) */}
                        {showToDropdown && filteredTo.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                {filteredTo
                                    .sort((a, b) => a.city.localeCompare(b.city))
                                    .map((airport, i) => {
                                        const isSelectedInFrom = getValues('from') === airport.code;
                                        return (
                                            <div
                                                key={i + 1}
                                                onClick={() =>
                                                    !isSelectedInFrom && handleSelect('to', airport)
                                                }
                                                className={`px-4 py-3 flex justify-between items-center text-left border-b border-gray-50 last:border-0 ${
                                                    isSelectedInFrom
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                        : 'hover:bg-gray-50 cursor-pointer'
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {airport.city}, {airport.country}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {airport.name}
                                                    </p>
                                                </div>
                                                <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-1 rounded">
                                                    {airport.code}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* Input 3: Date */}
                    <div className="md:col-span-3 border-b md:border-b-0 md:border-r-0 px-4 py-2 relative">
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
                            <FaCalendarAlt className="text-orange-500" />
                            <label className="font-bold uppercase text-xs tracking-wider text-gray-500">
                                Journey Date
                            </label>
                        </div>
                        <input
                            {...register('date')}
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full font-bold text-lg outline-none bg-transparent cursor-pointer text-gray-800"
                        />
                        {errors.date && (
                            <span className="text-[10px] text-red-500 absolute bottom-0 left-4">
                                Required
                            </span>
                        )}
                    </div>

                    {/* Search Button */}
                    <div className="md:col-span-3 flex justify-center md:justify-end">
                        <Button
                            type="submit"
                            className={`w-full h-14 md:w-full text-lg ${button.primary} ${layout.radius.default} transition-all duration-300 hover:shadow-lg active:scale-95`}
                        >
                            <FaSearch className="mr-2" /> Search Flights
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default Hero;
