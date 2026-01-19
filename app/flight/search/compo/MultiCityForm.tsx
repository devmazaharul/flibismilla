'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput';
import TravelerInput from './TravelerInput';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MULTI_TRIP_MAX_FLIGHT } from '@/constant/flight';

// Schema Definition
const multiCitySchema = z.object({
    legs: z.array(
        z.object({
            from: z.string().min(3, "Required"),
            to: z.string().min(3, "Required"),
            date: z.string().min(1, "Date required").refine((val) => {
                const selected = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selected >= today;
            }, { message: "Past date!" })
        })
    ).min(2, "Min 2 flights"),
    adults: z.string(),
    children: z.string(),
    infants: z.string(),
    travelClass: z.string()
});

type MultiCityInputs = z.infer<typeof multiCitySchema>;

const MultiCityForm = ({ initialValues }: { initialValues?: any }) => {
    const router = useRouter();
    const todayStr = new Date().toISOString().split('T')[0];

    const { 
        control, 
        handleSubmit, 
        watch, 
        setValue,
        register,
        formState: { errors } 
    } = useForm<MultiCityInputs>({
        resolver: zodResolver(multiCitySchema),
        defaultValues: {
            legs: initialValues?.legs || [
                { from: '', to: '', date: todayStr },
                { from: '', to: '', date: todayStr }
            ],
            adults: initialValues?.adults || '1',
            children: initialValues?.children || '0',
            infants: initialValues?.infants || '0',
            travelClass: initialValues?.travelClass || 'ECONOMY'
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "legs" });
    const legs = watch('legs');

    const onSubmit = (data: MultiCityInputs) => {
        const legsParam = JSON.stringify(data.legs);
        const queryParams = new URLSearchParams({
            type: 'multi',
            legs: legsParam,
            adults: data.adults,
            children: data.children,
            infants: data.infants,
            travelClass: data.travelClass
        }).toString();

        router.push(`/flight/search?${queryParams}`);
    };

    const handleAppend = () => {
        if (fields.length < MULTI_TRIP_MAX_FLIGHT) {
            append({ from: '', to: '', date: todayStr });
        } else {
            toast.error("Maximum 5 flights allowed!");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {fields.map((field, index) => (
                <div 
                    key={field.id} 
                    className="flex flex-col lg:flex-row gap-3 items-start bg-gray-50/50 p-3 rounded-2xl border border-gray-100 relative"
                    // 🟢 FIX: Row Z-Index (Higher rows stay on top of lower rows for dropdowns)
                    style={{ zIndex: 50 - index }}
                >
                    <div className="bg-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 min-w-[80px] text-center mt-4 lg:mt-5">
                        Flight {index + 1}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        
                        {/* 1. Origin Input (Highest Z inside row) */}
                        <div className="w-full relative z-30">
                            <Controller
                                name={`legs.${index}.from`}
                                control={control}
                                render={({ field }) => (
                                    <AirportInput 
                                        label="Origin" icon="depart" placeholder="From"
                                        value={field.value} onChange={field.onChange}
                                        error={errors.legs?.[index]?.from?.message}
                                    />
                                )}
                            />
                        </div>
                        
                        {/* 2. Destination Input (Middle Z inside row) */}
                        <div className="w-full relative z-20">
                            <Controller
                                name={`legs.${index}.to`}
                                control={control}
                                render={({ field }) => (
                                    <AirportInput 
                                        label="Dest" icon="arrive" placeholder="To"
                                        value={field.value} onChange={field.onChange}
                                        error={errors.legs?.[index]?.to?.message}
                                        excludeCode={legs?.[index]?.from}
                                    />
                                )}
                            />
                        </div>
                        
                        {/* 3. Date Input (Lowest Z inside row) - 🟢 FIXED STYLES */}
                        <div className="relative w-full z-10 bg-white rounded-2xl border border-transparent hover:border-rose-200 transition-all focus-within:ring-2 focus-within:ring-rose-500/20">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none z-10">
                                <FaCalendarAlt />
                            </div>
                            
                            {/* Floating Label */}
                            <span className="absolute left-12 top-3 text-[10px] text-rose-500 font-bold uppercase tracking-wider pointer-events-none z-10">
                                Date
                            </span>

                            <Controller
                                name={`legs.${index}.date`}
                                control={control}
                                render={({ field }) => (
                                    <input 
                                        {...field} 
                                        type="date" 
                                        min={todayStr} 
                                        className={`w-full h-16 pl-12 pr-4 pt-6 pb-2 bg-transparent rounded-2xl font-bold text-gray-800 outline-none cursor-pointer appearance-none block min-w-0 ${errors.legs?.[index]?.date ? 'border-red-500' : ''}`}
                                        style={{ fontSize: '16px' }} // iOS Zoom Fix
                                    />
                                )}
                            />
                            
                            {errors.legs?.[index]?.date && (
                                <span className="text-red-500 text-[10px] font-bold absolute bottom-1 left-12">
                                    {errors.legs[index]?.date?.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Delete Button */}
                    {fields.length > 2 && (
                        <button type="button" onClick={() => remove(index)} className="p-4 mt-1 text-red-500 hover:bg-red-100 rounded-xl transition-colors self-start lg:self-center">
                            <FaTrash />
                        </button>
                    )}
                </div>
            ))}

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-4 pt-4 border-t border-gray-100 relative z-0">
                <Button type="button" variant="outline" onClick={handleAppend} disabled={fields.length >= 5} className="h-14 border-dashed border-gray-300 text-gray-600 hover:text-rose-600">
                    <FaPlus className="mr-2" /> Add Flight
                </Button>
                
                {/* Traveler Input with High Z-Index */}
                <div className="w-full md:w-72 relative z-50">
                    <TravelerInput register={register} setValue={setValue} watch={watch} />
                </div>

                <Button type="submit" className="h-14 px-10 rounded-xl bg-rose-700 hover:bg-rose-800 font-bold text-lg shadow-xl ">
                    <FaSearch className="mr-2" /> Search
                </Button>
            </div>
        </form>
    );
};

export default MultiCityForm;