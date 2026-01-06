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
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { SearchInputs, searchSchema } from '@/validation/zod';
import { useRouter } from 'next/navigation';

const Hero = () => {
    const { colors, layout, typography, button } = appTheme;
    const [isSwapping, setIsSwapping] = useState(false);
    const router = useRouter();
    // 2. Form Setup with Zod Resolver
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<SearchInputs>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            from: '',
            to: '',
            date: new Date().toISOString().split('T')[0], // Default to today
        },
    });

    // 3. Swap Functionality
    const handleSwap = () => {
        setIsSwapping(true);
        const currentFrom = getValues('from');
        const currentTo = getValues('to');

        setValue('from', currentTo);
        setValue('to', currentFrom);

        setTimeout(() => setIsSwapping(false), 300); // Animation reset
    };

    // 4. Submit Handler
    const onSubmit: SubmitHandler<SearchInputs> = (data) => {
        router.push(`/flights/search?from=${data.from}&to=${data.to}&date=${data.date}`);
    };

    return (
        <section className="relative w-full min-h-[85vh] flex items-center justify-center">
            {/* ================= Background Image & Overlay ================= */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://flybismillah.com/wp-content/uploads/2024/12/slider-2-2.webp"
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
                    Explore the world with our exclusive Hajj, Umrah, and Holiday packages designed
                    for your comfort.
                </p>

                {/* ================= Search Box (Floating Form) ================= */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className={`bg-white w-full  max-w-6xl ${layout.radius.card} shadow-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative mb-10 md:mb-5`}
                >
                    {/* Input 1: From Location */}
                    <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2 relative group">
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
                            <FaPlaneDeparture className="text-blue-500" />
                            <label className="font-bold uppercase text-xs tracking-wider text-gray-500">
                                From
                            </label>
                        </div>
                        <input
                            {...register('from')}
                            type="text"
                            placeholder="Dhaka (DAC)"
                            maxLength={3}
                            className={`w-full uppercase outline-none font-medium placeholder-gray-300 bg-transparent transition-colors ${
                                errors.from ? 'text-red-500' : 'text-gray-800'
                            }`}
                        />
                        {/* Animated Underline for Error */}
                        <div
                            className={`absolute bottom-0 left-4 right-4 h-[2px] transition-all duration-300 ${
                                errors.from ? 'bg-red-500' : 'bg-transparent'
                            }`}
                        />
                        {errors.to && (
                            <span className="text-[10px] text-red-500 absolute -bottom-3 left-4">
                                {errors.to.message}
                            </span>
                        )}
                    </div>

                    {/* Swap Button (Hidden on Mobile, Visible on Desktop) */}
                    <div className="hidden md:flex absolute left-[25%] top-1/2 -translate-y-1/2 z-10 justify-center">
                        <button
                            type="button"
                            onClick={handleSwap}
                            className={`bg-white border border-gray-200 rounded-full p-2 text-gray-500 hover:text-rose-600 hover:shadow-md transition-all duration-300 ${
                                isSwapping ? 'rotate-180' : ''
                            }`}
                            title="Swap Locations"
                        >
                            <FaExchangeAlt size={12} />
                        </button>
                    </div>

                    {/* Input 2: To Location */}
                    <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2 relative md:pl-8">
                        <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
                            <FaPlaneArrival className="text-green-500" />
                            <label className="font-bold uppercase text-xs tracking-wider text-gray-500">
                                To
                            </label>
                        </div>
                        <input
                            {...register('to')}
                            type="text"
                            placeholder="Jeddah (JED)"
                            maxLength={3}
                            className={`w-full uppercase outline-none font-medium placeholder-gray-300 bg-transparent transition-colors ${
                                errors.to ? 'text-red-500' : 'text-gray-800'
                            }`}
                        />
                        <div
                            className={`absolute bottom-0 left-4 right-4 h-[2px] transition-all duration-300 ${
                                errors.to ? 'bg-red-500' : 'bg-transparent'
                            }`}
                        />
                        {errors.to && (
                            <span className="text-[10px] text-red-500 absolute -bottom-3 left-8">
                                {errors.to.message}
                            </span>
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
                            min={new Date().toISOString().split('T')[0]} // HTML level protection
                            className={`w-full uppercase outline-none font-medium placeholder-gray-300 bg-transparent  cursor-pointer ${
                                errors.date ? 'text-red-500' : 'text-gray-800'
                            }`}
                        />
                        <div
                            className={`absolute bottom-0 left-4 right-4 h-[2px] transition-all duration-300 ${
                                errors.date ? 'bg-red-500' : 'bg-transparent'
                            }`}
                        />
                        {errors.date && (
                            <span className="text-[10px] text-red-500 absolute -bottom-3 left-4">
                                {errors.date.message}
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
