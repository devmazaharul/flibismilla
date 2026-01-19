'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput'; 
import TravelerInput from './TravelerInput'; 
import { roundTripSchema } from '@/validation/zod'; 

const RoundTripForm = ({ initialValues }: { initialValues?: any }) => {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const { 
        register, 
        handleSubmit, 
        setValue, 
        watch, 
        formState: { errors } 
    } = useForm({
        resolver: zodResolver(roundTripSchema),
        defaultValues: { 
            from: initialValues?.from || '', 
            to: initialValues?.to || '', 
            date: initialValues?.date || today, 
            returnDate: initialValues?.returnDate || '',
            adults: initialValues?.adults || '1',
            children: initialValues?.children || '0',
            infants: initialValues?.infants || '0',
            travelClass: initialValues?.travelClass || 'ECONOMY'
        }
    });

    const onSubmit = (data: any) => {
        // 🟢 All params passing to URL
        const queryParams = new URLSearchParams({
            type: 'round',
            from: data.from,
            to: data.to,
            date: data.date,
            return: data.returnDate, // Round trip specific
            adults: data.adults,
            children: data.children,
            infants: data.infants,
            travelClass: data.travelClass
        }).toString();

        router.push(`/flight/search?${queryParams}`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-4 items-start w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* --- 1. Origin & Destination --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:flex-1">
                <div className="w-full">
                    <AirportInput 
                        label="Origin" 
                        icon="depart" 
                        placeholder="From"
                        value={watch('from')} 
                        onChange={(v) => setValue('from', v)}
                        error={errors.from?.message as string}
                    />
                </div>
                <div className="w-full">
                    <AirportInput 
                        label="Dest" 
                        icon="arrive" 
                        placeholder="To"
                        value={watch('to')} 
                        onChange={(v) => setValue('to', v)}
                        error={errors.to?.message as string}
                        excludeCode={watch('from')}
                    />
                </div>
            </div>

            {/* --- 2. Dates & Travelers (3 Columns on Desktop) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-[55%]">
                
                {/* Depart Date */}
                <div className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-lg pointer-events-none">
                        <FaCalendarAlt />
                    </div>
                    <input 
                        type="date" 
                        min={today} 
                        {...register('date')} 
                        className="w-full h-16 pl-12 pr-2 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 font-bold text-gray-800 text-sm outline-none transition-all cursor-pointer" 
                    />
                    {errors.date && (
                        <span className="text-red-500 text-xs font-bold ml-2 mt-1 block">
                            {errors.date.message as string}
                        </span>
                    )}
                </div>

                {/* Return Date */}
                <div className="relative w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none">
                        <FaCalendarAlt />
                    </div>
                    <input 
                        type="date" 
                        min={watch('date') || today} 
                        {...register('returnDate')} 
                        className="w-full h-16 pl-12 pr-2 bg-gray-50 rounded-2xl border border-transparent hover:border-rose-200 focus:ring-2 focus:ring-rose-500/20 font-bold text-gray-800 text-sm outline-none transition-all cursor-pointer" 
                    />
                    {errors.returnDate && (
                        <span className="text-red-500 text-xs font-bold ml-2 mt-1 block">
                            {errors.returnDate.message as string}
                        </span>
                    )}
                </div>

                {/* 🟢 Traveler Input */}
                <div className="w-full">
                    <TravelerInput register={register} setValue={setValue} watch={watch} />
                </div>
            </div>

            {/* --- 3. Search Button --- */}
            <Button 
                type="submit" 
                className="w-full lg:w-auto h-16 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-lg shadow-xl shadow-rose-500/20 whitespace-nowrap active:scale-95 transition-all"
            >
                <FaSearch className="mr-2" /> Search
            </Button>
        </form>
    );
};

export default RoundTripForm;