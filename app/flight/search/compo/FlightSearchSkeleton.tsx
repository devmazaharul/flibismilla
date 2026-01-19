'use client';

import { useEffect, useState } from 'react';
import { FaPlane } from 'react-icons/fa';


export 
const FlightSearchSkleton = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                const diff = Math.random() * 10;
                const newProgress = Math.min(oldProgress + diff, 99); 
                return Math.floor(newProgress);
            });
        }, 200); 

        return () => {
            clearInterval(timer);
        };
    }, []);

    const getLoadingText = () => {
        if (progress < 30) return "Connecting to server...";
        if (progress < 60) return "Scanning 400+ airlines...";
        if (progress < 90) return "Comparing best prices...";
        return "Finalizing your results...";
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl p-9 ">
                
                {/* ✈️ Progress Plane Icon (Moving) */}
                <div 
                    className="absolute top-6 transition-all duration-300 ease-out z-20"
                    style={{ left: `calc(${progress}% - 24px)` }} 
                >
                    <div className="relative">
                         {/* Jet Stream Trail */}
                        <div className="absolute top-1/2 right-4 w-12 h-1 bg-gradient-to-l from-rose-500/0 to-rose-500 rounded-full blur-[1px] opacity-60"></div>
                        <FaPlane className="text-3xl text-rose-600 transform rotate-12 drop-shadow-lg" />
                        
                        {/* Percentage Tooltip above Plane */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                            {progress}%
                        </div>
                    </div>
                </div>

                {/* 📊 The Progress Bar Track */}
                <div className="w-full h-3 bg-gray-200 rounded-full mt-4 overflow-hidden relative">
                    {/* Filling Animation */}
                    <div 
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                        style={{ width: `${progress}%` }}
                    >
                         {/* Shine Effect on Bar */}
                        <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>

                {/* 📝 Dynamic Status Text */}
                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-sm font-bold text-gray-800 animate-pulse">
                            {getLoadingText()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Please keep this window open</p>
                    </div>
                    <div className="text-right">
                         <span className="text-3xl font-black text-rose-600/20">{progress}%</span>
                    </div>
                </div>

            </div>
            
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};