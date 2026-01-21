'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, Plane, ArrowRightLeft, AlertCircle } from 'lucide-react';
import PassengerSelector from './PassengerSelector';
import { airportSuggestions } from '@/constant/flight';
import { z } from 'zod';
import { AirportInput } from './AirportInput';


const oneWaySchema = z
    .object({
        origin: z.string().min(1, 'Origin is required'),
        destination: z.string().min(1, 'Destination is required'),
        date: z.string().min(1, 'Departure date is required'),
        passengers: z.object({
            adults: z.number().min(1),
            children: z.number(),
            infants: z.number(),
        }),
        cabinClass: z.string(),
    })
    .refine((data) => data.origin !== data.destination, {
        message: 'Origin and Destination cannot be the same',
        path: ['destination'],
    });

export default function OneWayForm({ onSearch }: { onSearch: (params: URLSearchParams) => void }) {
    const searchParams = useSearchParams();
    const [today, setToday] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const dt = new Date();
        const offset = dt.getTimezoneOffset() * 60000;
        setToday(new Date(dt.getTime() - offset).toISOString().split('T')[0]);
    }, []);

    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        date: '',
        passengers: { adults: 1, children: 0, infants: 0 },
        cabinClass: 'economy',
    });

    useEffect(() => {
        const originParam = searchParams.get('origin');
        const destParam = searchParams.get('dest');
        const dateParam = searchParams.get('date');

        if (originParam || destParam || dateParam) {
            setFormData((prev) => ({
                ...prev,
                origin: originParam || 'DAC',
                destination: destParam || 'DXB',
                date: dateParam || '',
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                origin: '',
                destination: '',
                date: prev.date || today,
            }));
        }
    }, [searchParams, today]);

    const handlePaxChange = useCallback((data: any) => {
        setFormData((prev) => ({
            ...prev,
            passengers: data.passengers,
            cabinClass: data.cabinClass,
        }));
    }, []);

    const handleSwap = () => {
        setFormData((prev) => ({ ...prev, origin: prev.destination, destination: prev.origin }));
        setErrors({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = oneWaySchema.safeParse(formData);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error?.issues.forEach((err) => {
                const path = err.path[0] as string;
                newErrors[path] = err.message;
            });
            setErrors(newErrors);
            return;
        }

        const params = new URLSearchParams();
        params.set('type', 'one_way');
        params.set('origin', formData.origin);
        params.set('dest', formData.destination);
        params.set('date', formData.date);
        params.set('adt', formData.passengers.adults.toString());
        params.set('chd', formData.passengers.children.toString());
        params.set('inf', formData.passengers.infants.toString());
        params.set('class', formData.cabinClass);
        if (onSearch) onSearch(params);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full  p-4 rounded-[1.5rem] relative z-20">
            <div className="flex flex-col xl:flex-row gap-3 xl:gap-2 items-center">
                <div className="flex flex-col md:flex-row w-full xl:w-[45%] items-center gap-2 md:gap-0 relative">
                    <div className="w-full relative z-20">
                        <AirportInput
                            label="From"
                            codeValue={formData.origin}
                            onSelect={(code: string) => {
                                setFormData((prev) => ({ ...prev, origin: code }));
                                setErrors((prev) => ({ ...prev, origin: '' })); // Clear error on select
                            }}
                            placeholder="Origin"
                            icon={<MapPin className="w-4 h-4 text-rose-500" />}
                            disabledCodes={[formData.destination]}
                            hasError={!!errors.origin} // Pass error state
                        />
                    </div>

                    <div className="relative z-30 -my-3 md:my-0 md:-mx-3">
                        <button
                            type="button"
                            onClick={handleSwap}
                            className="p-2 cursor-pointer bg-white border border-slate-300 rounded-full text-slate-500 hover:text-rose-600 hover:border-rose-500 transition-all shadow-sm rotate-90 md:rotate-0 hover:rotate-180"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-full relative z-10">
                        <AirportInput
                            label="To"
                            codeValue={formData.destination}
                            onSelect={(code: string) => {
                                setFormData((prev) => ({ ...prev, destination: code }));
                                setErrors((prev) => ({ ...prev, destination: '' }));
                            }}
                            placeholder="Destination"
                            icon={<Plane className="w-4 h-4 rotate-90 text-rose-500" />}
                            disabledCodes={[formData.origin]}
                            hasError={!!errors.destination}
                        />
                    </div>
                </div>

                <div
                    className={`w-full xl:w-[20%] group relative h-[56px] bg-white border rounded-xl px-4 flex flex-col justify-center transition-all ${errors.date ? 'border-red-500 ring-1 ring-red-500/20 bg-red-50' : 'border-slate-300 hover:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500'}`}
                >
                    <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${errors.date ? 'bg-red-100 text-red-500' : ' group-focus-within:bg-rose-50 group-focus-within:text-rose-600'}`}
                    >
                        <Calendar className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="ml-10">
                        <label
                            className={`text-[10px] font-bold uppercase tracking-widest block leading-tight ${errors.date ? 'text-red-400' : 'text-slate-400'}`}
                        >
                            Departure
                        </label>
                        <input
                            type="date"
                            min={today}
                            value={formData.date}
                            onChange={(e) => {
                                setFormData({ ...formData, date: e.target.value });
                                setErrors((prev) => ({ ...prev, date: '' }));
                            }}
                            className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-slate-800 uppercase cursor-pointer leading-tight"
                        />
                    </div>
                </div>

                <div className="w-full xl:w-[20%] relative ">
                    <div className="h-[56px]  hover:border-rose-400 transition-all">
                        <PassengerSelector onChange={handlePaxChange} />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full cursor-pointer xl:w-[15%] h-[56px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-rose-200"
                >
                    <Search className="w-5 h-5" />
                    <span className="">Search</span>
                </button>
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="absolute -bottom-10 left-0 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.origin ||
                        errors.destination ||
                        errors.date ||
                        'Please fill all required fields correctly.'}
                </div>
            )}
        </form>
    );
}
