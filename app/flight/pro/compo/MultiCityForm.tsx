'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaCalendarAlt, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import AirportInput from './AirportInput';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { MultiCityInputs, multiCitySchema } from '@/validation/zod';



const MultiCityForm = ({ initialValues }: { initialValues?: any }) => {
    const router = useRouter();
    const todayStr = new Date().toISOString().split('T')[0];

    // 🟢 2. UseForm with Zod Resolver
    const { 
        control, 
        handleSubmit, 
        watch, 
        formState: { errors } 
    } = useForm<MultiCityInputs>({
        resolver: zodResolver(multiCitySchema),
        defaultValues: {
            legs: initialValues?.legs || [
                { from: '', to: '', date: todayStr },
                { from: '', to: '', date: todayStr }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({ 
        control, 
        name: "legs" 
    });

    const legs = watch('legs'); // For Watching values (e.g. excludeCode)

    const onSubmit = (data: MultiCityInputs) => {
        const legsParam = JSON.stringify(data.legs);
        router.push(`/flight/search?type=multi&legs=${legsParam}`);
    };

    const handleAppend = () => {
        if (fields.length < 5) {
            append({ from: '', to: '', date: todayStr });
        } else {
            toast.error("You can add maximum 5 flights only!");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col lg:flex-row gap-3 items-start bg-gray-50/50 p-3 rounded-2xl border border-gray-100 relative">
                    
                    {/* Flight Badge */}
                    <div className="bg-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 min-w-[80px] text-center mt-4 lg:mt-5">
                        Flight {index + 1}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        
                        {/* FROM Input */}
                        <div className="w-full">
                            <Controller
                                name={`legs.${index}.from`}
                                control={control}
                                render={({ field }) => (
                                    <AirportInput 
                                        label="Origin" 
                                        icon="depart" 
                                        placeholder="From"
                                        value={field.value} 
                                        onChange={field.onChange}
                                        error={errors.legs?.[index]?.from?.message}
                                    />
                                )}
                            />
                        </div>

                        {/* TO Input */}
                        <div className="w-full">
                            <Controller
                                name={`legs.${index}.to`}
                                control={control}
                                render={({ field }) => (
                                    <AirportInput 
                                        label="Dest" 
                                        icon="arrive" 
                                        placeholder="To"
                                        value={field.value} 
                                        onChange={field.onChange}
                                        error={errors.legs?.[index]?.to?.message}
                                        excludeCode={legs?.[index]?.from} // Prevent selecting same airport
                                    />
                                )}
                            />
                        </div>

                        {/* DATE Input */}
                        <div className="relative w-full">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-lg pointer-events-none">
                                    <FaCalendarAlt />
                                </div>
                                <Controller
                                    name={`legs.${index}.date`}
                                    control={control}
                                    render={({ field }) => (
                                        <input 
                                            {...field}
                                            type="date" 
                                            min={todayStr} 
                                            className={`w-full h-16 pl-12 pr-4 bg-white rounded-2xl border ${errors.legs?.[index]?.date ? 'border-red-500 bg-red-50' : 'border-transparent'} font-bold text-gray-800 outline-none focus:ring-2 ring-rose-500/20 appearance-none`}
                                        />
                                    )}
                                />
                            </div>
                            {/* Date Error Message */}
                            {errors.legs?.[index]?.date && (
                                <span className="text-xs text-red-500 font-bold ml-2 mt-1 block">
                                    {errors.legs[index]?.date?.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Delete Button */}
                    {fields.length > 2 && (
                        <button 
                            type="button" 
                            onClick={() => remove(index)} 
                            className="p-4 mt-1 text-red-500 hover:bg-red-100 rounded-xl transition-colors self-start lg:self-center"
                        >
                            <FaTrash />
                        </button>
                    )}
                </div>
            ))}

            {/* Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAppend} 
                    disabled={fields.length >= 5}
                    className={`h-14 border-dashed border-gray-300 text-gray-600 hover:text-rose-600 hover:border-rose-300 ${fields.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <FaPlus className="mr-2" /> Add Another Flight
                </Button>
                
                <Button type="submit" className="h-14 px-10 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-lg shadow-xl shadow-rose-500/20">
                    <FaSearch className="mr-2" /> Search Multi-City
                </Button>
            </div>
        </form>
    );
};

export default MultiCityForm;