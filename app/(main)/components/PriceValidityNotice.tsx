'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ShieldCheck, Zap, Hourglass } from 'lucide-react';
import { PRICE_VALIDITY_DURATION_MS } from '@/constant/control'; 

interface PriceValidityNoticeProps {
    showTimer?: boolean;
    offerId: string; 
}

export const PriceValidityNotice = ({ 
    showTimer = true,
    offerId 
}: PriceValidityNoticeProps) => {
    
    const [timeLeft, setTimeLeft] = useState<number>(Math.floor(PRICE_VALIDITY_DURATION_MS / 1000));
    const [isExpired, setIsExpired] = useState(false);
    const [targetTime, setTargetTime] = useState<number>(0);

    useEffect(() => {
        const newTarget = Date.now() + PRICE_VALIDITY_DURATION_MS;
        setTargetTime(newTarget);
        setIsExpired(false);
        setTimeLeft(Math.floor(PRICE_VALIDITY_DURATION_MS / 1000));
    }, [offerId]);

    useEffect(() => {
        if (!targetTime) return;

        const updateTimer = () => {
            const now = Date.now();
            const difference = targetTime - now;

            if (difference <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
            } else {
                setTimeLeft(Math.floor(difference / 1000));
            }
        };

        updateTimer();

        const timerInterval = setInterval(updateTimer, 1000);

        return () => clearInterval(timerInterval);
    }, [targetTime]);

    const handleRefresh = () => {
        window.location.reload(); 
    };

    const INITIAL_TIME = Math.floor(PRICE_VALIDITY_DURATION_MS / 1000);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const radius = 18; 
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - ((timeLeft / INITIAL_TIME) * circumference);

    const isDanger = timeLeft < 60; 

    const theme = {
        container: "bg-[#FFFBF0] border-[#FDE68A]", 
        iconBg: "bg-[#FCD34D]", 
        iconColor: "text-amber-900",
        textMain: "text-amber-900",
        textSub: "text-amber-700/60",
        stroke: "stroke-amber-500",
        shadow: "shadow-sm shadow-amber-100"
    };

    if (isDanger) {
        theme.container = "bg-rose-50 border-rose-200 animate-pulse";
        theme.iconBg = "bg-rose-100";
        theme.iconColor = "text-rose-600";
        theme.textMain = "text-rose-900";
        theme.textSub = "text-rose-700/60";
        theme.stroke = "stroke-rose-500";
        theme.shadow = "shadow-md shadow-rose-100";
    }

    return (
        <>
            {showTimer && !isExpired && (
                <div className={`
                    flex items-center justify-between p-3 my-4 pr-5 rounded-full border transition-all duration-500
                    ${theme.container} ${theme.shadow}
                `}>
                    
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.iconBg} ${theme.iconColor} transition-colors shadow-inner`}>
                            {isDanger ? <Zap className="w-5 h-5 fill-current" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textSub}`}>
                                {isDanger ? "Expiring" : "Price Guaranteed"}
                            </span>
                            <div className={`text-sm font-bold leading-none ${theme.textMain}`}>
                                {isDanger ? "Update price now" : "Rates held for session"}
                            </div>
                        </div>
                    </div>

                    <div className="relative w-11 h-11 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r={radius} fill="none" className="stroke-black/5" strokeWidth="3" />
                            <circle 
                                cx="22" cy="22" r={radius} fill="none" 
                                className={`${theme.stroke} transition-all duration-1000 ease-linear`} 
                                strokeWidth="3" 
                                strokeDasharray={circumference}
                                strokeDashoffset={progressOffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums ${theme.textMain}`}>
                            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                        </div>
                    </div>
                </div>
            )}

            {isExpired && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-700"></div>

                    <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/50 ring-1 ring-slate-200/50">
                        <div className="rounded-[2.3rem] p-8 text-center bg-gradient-to-b from-white to-slate-50">
                            
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full border border-amber-200 animate-[ping_2s_linear_infinite]"></div>
                                <Hourglass className="w-9 h-9 text-amber-500 relative z-10" />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Time Expired</h2>
                            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                                Airline inventory moves fast. We've paused your session to check for the latest seat availability.
                            </p>

                            <button
                                onClick={handleRefresh}
                                className="group w-full py-4 bg-rose-500 cursor-pointer hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                                <span>Check Latest Fares</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};