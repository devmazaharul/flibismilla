'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Repeat } from 'lucide-react';
import { FaLayerGroup } from 'react-icons/fa';

// Forms Imports
import OneWayForm from '../utils/OneWayForm';
import RoundTripForm from '../utils/RoundTripForm';
import MultiCityForm from '../utils/MultiCityForm';


export default function FlightSearchForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'one_way' | 'round_trip' | 'multi_city'>('round_trip');

    // Sync Tab from URL
    useEffect(() => {
        const type = searchParams.get('type') as any;
        if (type) setActiveTab(type);
    }, [searchParams]);

    const tabs = [
        { id: 'one_way', icon: Plane, label: 'One Way' },
        { id: 'round_trip', icon: Repeat, label: 'Round Trip' },
        { id: 'multi_city', icon: FaLayerGroup, label: 'Multi City' },
    ];

    // Handle Search Action
    const handleSearchPush = (params: URLSearchParams) => {
        router.push(`/new?${params.toString()}`, { scroll: false });
    };

    return (
      
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/20 border border-slate-100 relative z-20">

            {/* 🟢 Navigation Tabs */}
            <div className="bg-slate-50/80 p-2 border-b border-slate-100 rounded-t-3xl"> 
                <div className="w-fit mx-auto bg-white/50 p-1.5 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
                    <div className="grid grid-cols-3 gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    relative flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wide transition-all duration-300 ease-out
                                    ${activeTab === tab.id 
                                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 transform scale-[1.02]' 
                                        : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-md hover:shadow-slate-100'
                                    }
                                `}
                            >
                                <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                                <span className="truncate">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🟢 Form Content Area */}
            <div className="p-4 md:p-6 lg:p-8 bg-white rounded-b-3xl min-h-[150px]">
                <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                    {activeTab === 'one_way' && (
                        <div className="transition-opacity duration-300 relative z-30">
                            <OneWayForm onSearch={handleSearchPush} />
                        </div>
                    )}
                    
                    {activeTab === 'round_trip' && (
                        <div className="transition-opacity duration-300 relative z-30">
                            <RoundTripForm onSearch={handleSearchPush} />
                        </div>
                    )}
                    
                    {activeTab === 'multi_city' && (
                        <div className="transition-opacity duration-300 relative z-30">
                            <MultiCityForm onSearch={handleSearchPush} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}