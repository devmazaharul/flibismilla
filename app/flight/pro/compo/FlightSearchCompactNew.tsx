'use client';

import { useState, useEffect } from 'react';
import OneWayForm from './OneWayForm';
import RoundTripForm from './RoundTripForm';
import MultiCityForm from './MultiCityForm';


interface FlightSearchProps {
    initialValues?: {
        tripType?: 'oneway' | 'round' | 'multi';
        from?: string;
        to?: string;
        date?: string;
        returnDate?: string;
        legs?: any[];
    }
}

const FlightSearchCompactNew = ({ initialValues }: FlightSearchProps) => {
    const [tripType, setTripType] = useState<'oneway' | 'round' | 'multi'>(
        initialValues?.tripType || 'oneway'
    );

    useEffect(() => {
        if (initialValues?.tripType) {
            setTripType(initialValues.tripType);
        }
    }, [initialValues]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            
            {/* === 1. Trip Type Tabs === */}
            <div className="flex justify-center md:justify-start gap-4 mb-6 px-2">
                {[
                    { id: 'oneway', label: 'One Way' },
                    { id: 'round', label: 'Round Trip' },
                    { id: 'multi', label: 'Multi City' }
                ].map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setTripType(type.id as any)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border-2 ${
                            tripType === type.id 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/30' 
                            : 'bg-white text-gray-500 border-transparent hover:bg-gray-100'
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* === 2. Render Active Form with Initial Values === */}
            <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
                {tripType === 'oneway' && <OneWayForm initialValues={initialValues} />}
                {tripType === 'round' && <RoundTripForm initialValues={initialValues} />}
                {tripType === 'multi' && <MultiCityForm initialValues={initialValues} />}
            </div>

        </div>
    );
};

export default FlightSearchCompactNew;