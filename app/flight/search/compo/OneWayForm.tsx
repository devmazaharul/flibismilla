'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput'; 
import TravelerInput from './TravelerInput'; 
import { searchSchema } from '@/validation/zod'; 

const OneWayForm = ({ initialValues }: { initialValues?: any }) => {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const { 
        register, 
        handleSubmit, 
        setValue, 
        watch, 
        formState: { errors } 
    } = useForm({
        resolver: zodResolver(searchSchema),
        defaultValues: { 
            from: initialValues?.from || '', 
            to: initialValues?.to || '', 
            date: initialValues?.date || today,
            adults: initialValues?.adults || '1',
            children: initialValues?.children || '0',
            infants: initialValues?.infants || '0',
            travelClass: initialValues?.travelClass || 'ECONOMY'
        }
    });

    const onSubmit = (data: any) => {
        const queryParams = new URLSearchParams({
            type: 'oneway',
            from: data.from,
            to: data.to,
            date: data.date,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:flex-1 relative z-30">
                <div className="w-full relative z-20">
                    <AirportInput 
                        label="Origin" 
                        icon="depart" 
                        placeholder="From"
                        value={watch('from')} 
                        onChange={(v) => setValue('from', v)}
                        error={errors.from?.message as string}
                    />
                </div>
                <div className="w-full relative z-10">
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

            {/* --- 2. Date & Travelers --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto relative z-20">
                
                {/* 🟢 Date Input Box Fixed */}
                <div className="relative w-full bg-gray-50 rounded-2xl border border-transparent hover:border-rose-200 transition-all focus-within:ring-2 focus-within:ring-rose-500/20">
                    
                    {/* Icon */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none z-10">
                        <FaCalendarAlt />
                    </div>

                    {/* Floating Label */}
                    <span className="absolute left-12 top-3 text-[10px] text-rose-500 font-bold uppercase tracking-wider pointer-events-none z-10">
                        Departure Date
                    </span>

                    {/* Input Field */}
                    <input 
                        type="date" 
                        min={today} 
                        {...register('date')} 
                        className="w-full h-16 pl-12 pr-4 pt-6 pb-2 bg-transparent rounded-2xl font-bold text-gray-800 outline-none cursor-pointer appearance-none block min-w-0"
                        style={{
                            fontSize: '16px', // iOS Zoom Fix
                        }}
                    />

                    {/* Error Message */}
                    {errors.date && (
                        <span className="text-red-500 text-[10px] font-bold absolute bottom-1 left-12">
                            {errors.date.message as string}
                        </span>
                    )}
                </div>

                {/* Traveler Input */}
                <div className="w-full relative z-30">
                    <TravelerInput register={register} setValue={setValue} watch={watch} />
                </div>
            </div>

            {/* --- 3. Search Button --- */}
            <div className="relative z-10 w-full lg:w-auto">
                <Button 
                    type="submit" 
                    className="w-full h-16 px-10 rounded-2xl bg-rose-700 hover:bg-rose-800 font-bold text-lg shadow-xl  whitespace-nowrap active:scale-95 transition-all"
                >
                    <FaSearch className="mr-2" /> Search
                </Button>
            </div>
        </form>
    );
};

export default OneWayForm;