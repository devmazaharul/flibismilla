'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput';
import { roundTripSchema } from '@/validation/zod';



const RoundTripForm = ({initialValues}:{initialValues:any}) => {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

   const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(roundTripSchema),
        defaultValues: { 
            from: initialValues?.from || '', 
            to: initialValues?.to || '', 
            date: initialValues?.date || today, 
            returnDate: initialValues?.returnDate || '' // 🟢 Auto-fill return date
        }
    });

    const onSubmit = (data: any) => {
        router.push(`/flight/pro?type=round&from=${data.from}&to=${data.to}&date=${data.date}&return=${data.returnDate}`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-4 items-start w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:flex-1">
                <AirportInput 
                    label="Origin" icon="depart" placeholder="From"
                    value={watch('from')} onChange={(v) => setValue('from', v)}
                    error={errors.from?.message as string}
                />
                <AirportInput 
                    label="Dest" icon="arrive" placeholder="To"
                    value={watch('to')} onChange={(v) => setValue('to', v)}
                    error={errors.to?.message as string}
                    excludeCode={watch('from')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-1/3">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"><FaCalendarAlt /></div>
                    <input type="date" min={today} {...register('date')} className="w-full h-16 pl-12 pr-4 bg-gray-50 rounded-2xl border border-transparent font-bold text-gray-800 outline-none" />
                    {errors.date && <span className="text-red-500 text-xs font-bold ml-2">{errors.date.message as string}</span>}
                </div>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none"><FaCalendarAlt /></div>
                    <input type="date" min={watch('date') || today} {...register('returnDate')} className="w-full h-16 pl-12 pr-4 bg-gray-50 rounded-2xl border border-transparent font-bold text-gray-800 outline-none" />
                    {errors.returnDate && <span className="text-red-500 text-xs font-bold ml-2">{errors.returnDate.message as string}</span>}
                </div>
            </div>

            <Button type="submit" className="w-full lg:w-auto h-16 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-lg shadow-xl shadow-rose-500/20">
                <FaSearch className="mr-2" /> Search
            </Button>
        </form>
    );
};
export default RoundTripForm;