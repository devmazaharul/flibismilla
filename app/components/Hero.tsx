'use client';

import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import FlightSearchCompactNew from '../flight/search/compo/FlightSearchCompactNew';
import { FaCheckCircle, FaStar } from 'react-icons/fa';

const Hero = () => {
    const { layout } = appTheme;

    return (
        <section className="relative w-full min-h-[85vh] flex flex-col justify-center pt-32 pb-20 bg-gray-900">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                    src="/asset/others/utt.avif"
                    alt="Luxury Travel"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-gray-900/80" />
            </div>

            {/* ================= Main Content ================= */}
            <div className={`relative z-10 w-full ${layout.container} flex flex-col items-center`}>
                
                {/* --- Top Badge --- */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-2xl mb-6 hover:bg-white/20 transition-all cursor-default">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <span className="text-rose-100 text-[10px] font-bold tracking-widest uppercase">
                            #1 Trusted Platform
                        </span>
                    </div>
                </div>

                {/* --- Hero Text --- */}
                <div className="text-center max-w-4xl mx-auto space-y-4 mb-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                        Discover the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-rose-400">
                            Unseen World
                        </span>
                    </h1>
                    <p className="text-gray-300 text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed opacity-90 drop-shadow-md">
                        Book your flights with confidence. Exclusive deals on Hajj, Umrah, and international holidays.
                    </p>
                </div>

                {/* --- Search Form Wrapper --- */}
                <div className="w-full relative z-50  animate-in slide-in-from-bottom-12 duration-1000 delay-300">
                    
            
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 rounded-[2.5rem] blur-xl opacity-30 transition duration-1000"></div>
                    
        
                    <div className="relative transform transition-transform hover:-translate-y-1 duration-500 text-left text-gray-900">
                        <FlightSearchCompactNew />
                    </div>
                </div>

                {/* --- Stats / Trust --- */}
                <div className="mt-10 relative z-10 flex flex-wrap justify-center gap-6 md:gap-12 text-gray-400 text-xs font-semibold animate-in fade-in duration-1000 delay-500 opacity-80">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-white font-bold text-sm">10k+</span>
                            <span className="text-[10px]">Happy Travelers</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-700 hidden md:block"></div>

                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                        <FaCheckCircle className="text-green-500 text-sm" />
                        <span>Best Price Guarantee</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                        <FaStar className="text-yellow-500 text-sm" />
                        <span>4.9/5 Average Rating</span>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;