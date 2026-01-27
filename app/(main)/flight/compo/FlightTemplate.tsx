'use client';
import { useState } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaPlane, FaArrowRight, FaFilter, FaLuggageCart } from 'react-icons/fa';
import { flightResultsForAnyType } from '@/constant/flight';
import { toast } from 'sonner';

interface FlightTemplateProps {
    type: 'domestic' | 'international';
    title: string;
    subtitle: string;
    bgImage: string;
}

const FlightTemplate = ({ type, title, subtitle, bgImage }: FlightTemplateProps) => {
    const { layout, button } = appTheme;
    const [sortBy] = useState<'price' | 'duration'>('price');

    // 1. Filter by Type
    const baseFlights = flightResultsForAnyType.filter((f) => f.type === type);

    // 2. Sort Logic
    const sortedFlights = [...baseFlights].sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        // Simple duration sort logic (mock) - in real app convert '1h 30m' to minutes
        return parseInt(a.duration) - parseInt(b.duration);
    });


    function handleClick() {
        //featue upcoming
        toast.error("Feature coming soon!");
   
    }

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            {/* ================= 1. Modern Hero Section ================= */}
            <div className="relative h-[45vh] min-h-[350px] flex items-center justify-center text-center px-4">
                <Image src={bgImage} alt={title} fill className="object-cover" priority />
                {/* Dark Overlay with Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-50" />

                <div className="relative z-10 max-w-4xl space-y-4 animate-fade-in-up">
                    <span className="bg-rose-600/90 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl shadow-gray-100 backdrop-blur-sm border border-rose-500/50">
                        {subtitle}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-xl">
                        {title}
                    </h1>
                    <p className="text-gray-200 text-lg max-w-2xl mx-auto">
                        Find the best deals on {type} flights with Bismillah Travels. Book now and
                        save more.
                    </p>
                </div>
            </div>

            {/* ================= 2. Filter & Sort Bar ================= */}
            <div className={`${layout.container} -mt-8 relative z-20 mb-10`}>
                <div className="bg-white rounded-xl shadow-2xl shadow-gray-100 border border-gray-200/80 p-4 flex flex-col md:flex-row justify-between items-center gap-4 w-fit">
                    <div className="flex items-center gap-2 text-gray-600">
                        <FaFilter className="text-rose-600" />
                        <span className="font-bold">{sortedFlights.length} Flights Found</span>
                    </div>

                
                </div>
            </div>

            {/* ================= 3. Flight Cards List ================= */}
            <div className={`${layout.container} space-y-6`}>
                {sortedFlights.map((flight, idx) => (
                    <div
                        key={flight.id}
                        className="group bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xl shadow-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-rose-100 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Best Value Badge (Logic: First item is best value) */}
                        {idx === 0 && (
                            <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10">
                                BEST VALUE
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                            {/* Airline Info */}
                            <div className="flex items-center gap-4 w-full lg:w-1/4">
                                <div className="w-16 h-16 relative bg-gray-50 rounded-full border border-gray-100 p-2">
                                    <Image
                                        src={flight.logo}
                                        alt={flight.airline}
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{flight.airline}</h3>
                                    <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                                        {flight.flightNumber}
                                    </p>
                                </div>
                            </div>

                            {/* Timeline / Duration */}
                            <div className="flex-1 w-full flex items-center justify-between text-center">
                                {/* Departure */}
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {flight.departureTime}
                                    </p>
                                    <p className="text-sm font-bold text-gray-500">
                                        {flight.fromCode}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{flight.fromCity}</p>
                                </div>

                                {/* Graphic */}
                                <div className="flex-1 px-4 md:px-8 flex flex-col items-center">
                                    <p className="text-xs font-bold text-gray-500 mb-2">
                                        {flight.duration}
                                    </p>
                                    <div className="w-full flex items-center gap-2 relative">
                                        <div className="h-[2px] bg-gray-200 w-full rounded-full"></div>
                                        <FaPlane className="text-rose-500 text-lg absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 transform rotate-90 lg:rotate-0 bg-white p-1 rounded-full border border-gray-200" />
                                    </div>
                                    <p
                                        className={`text-xs font-bold mt-2 ${
                                            flight.stops === 0
                                                ? 'text-green-600'
                                                : 'text-orange-500'
                                        }`}
                                    >
                                        {flight.stopInfo}
                                    </p>
                                </div>

                                {/* Arrival */}
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {flight.arrivalTime}
                                    </p>
                                    <p className="text-sm font-bold text-gray-500">
                                        {flight.toCode}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{flight.toCity}</p>
                                </div>
                            </div>

                            {/* Price & Booking */}
                            <div className="w-full lg:w-auto flex lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-8 gap-1">
                                <div className="text-left lg:text-right">
                                    <p className="text-3xl font-extrabold text-rose-600">
                                        ${flight.price}
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium">per person</p>
                                </div>

                               
                                    <Button onClick={handleClick}
                                        className={`${button.primary} w-full lg:w-40 h-12 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/40 transition-all mt-2`}
                                    >
                                     Book
                                        <FaArrowRight className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
                                    </Button>
                              

                                <div className="hidden lg:flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mt-2">
                                    <FaLuggageCart /> 20KG Baggage
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {sortedFlights.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <FaPlane className="text-gray-300 text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No flights found</h3>
                        <p className="text-gray-500 text-sm">Try changing your search criteria.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default FlightTemplate;