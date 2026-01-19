'use client';
import { useState } from 'react';
import OneWayForm from './OneWayForm';
import RoundTripForm from './RoundTripForm';
import MultiCityForm from './MultiCityForm';
import { FaPlane, FaExchangeAlt, FaLayerGroup } from 'react-icons/fa';

const FlightSearchCompactNew = ({ initialValues }: { initialValues?: any }) => {
    // Determine active tab
    const getInitialTab = () => {
        if (initialValues?.tripType === 'multi') return 'multi';
        if (initialValues?.tripType === 'round') return 'round';
        return 'oneway';
    };

    const [activeTab, setActiveTab] = useState<'oneway' | 'round' | 'multi'>(getInitialTab());

    const tabs = [
        { id: 'oneway', label: 'One Way', icon: <FaPlane className="rotate-45" /> },
        { id: 'round', label: 'Round Trip', icon: <FaExchangeAlt /> },
        { id: 'multi', label: 'Multi City', icon: <FaLayerGroup /> },
    ];

    return (

        <div className="w-full relative z-50"> 
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100/80 backdrop-blur-md p-1.5 rounded-2xl inline-flex gap-2 border border-gray-200/50 shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-white text-rose-600 shadow-md scale-105'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            <span className="text-xs">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Container */}

            <div className="relative z-40">
                {activeTab === 'oneway' && <OneWayForm initialValues={initialValues} />}
                {activeTab === 'round' && <RoundTripForm initialValues={initialValues} />}
                {activeTab === 'multi' && <MultiCityForm initialValues={initialValues} />}
            </div>
        </div>
    );
};

export default FlightSearchCompactNew;