'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput';

// Validation
const schema = z.object({
    from: z.string().min(3, "Required"),
    to: z.string().min(3, "Required"),
    date: z.string().min(1, "Required")
});

const OneWayForm = ({initialValues}:{initialValues:any}) => {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];
const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { 
            from: initialValues?.from || '', 
            to: initialValues?.to || '',    
            date: initialValues?.date || today 
        }
    });

    const onSubmit = (data: any) => {
        router.push(`/flight/pro?type=oneway&from=${data.from}&to=${data.to}&date=${data.date}`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-4 items-start w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <div className="w-full lg:w-1/4 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none"><FaCalendarAlt /></div>
                <input 
                    type="date" min={today} {...register('date')}
                    className="w-full h-16 pl-12 pr-4 bg-gray-50 rounded-2xl border border-transparent hover:border-rose-200 focus:bg-white focus:border-rose-500 font-bold text-gray-800 outline-none transition-all"
                />
            </div>

            <Button type="submit" className="w-full lg:w-auto h-16 px-10 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-lg shadow-xl shadow-rose-500/20">
                <FaSearch className="mr-2" /> Search
            </Button>
        </form>
    );
};
export default OneWayForm;