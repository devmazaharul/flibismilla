'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { FaCheckCircle, FaStar } from 'react-icons/fa';
import FlightSearchForm from '../flight/search/utils/FlightSearchForm';

const sliderImages = [
    '/asset/others/hajj_umrah.avif',
    '/asset/others/utt.avif',
    '/11055f59a68bcbcf257dac2088dfc225.jpg',
    '/asset/others/flimg.avif',
];

const Hero = () => {
    const { layout } = appTheme;
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) =>
                prev === sliderImages.length - 1 ? 0 : prev + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative w-full min-h-[85vh] flex flex-col  pb-16 bg-gray-900">
            {/* ================= Background Slider Layer ================= */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {sliderImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <Image
                            src={img}
                            alt={`Slide ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />
                    </div>
                ))}

                <div className="absolute inset-0 bg-gray-900/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 via-transparent to-gray-900/60" />
            </div>

            {/* ================= Main Content ================= */}
            <div className={`relative z-10 w-full ${layout.container} flex py-8 flex-col items-center`}>
                {/* --- Top Badge --- */}
               

                {/* --- Hero Text (smaller) --- */}
                <div className="text-center max-w-3xl mx-auto space-y-2 mb-4 animate-in fade-in zoom-in-95 duration-700 delay-150">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                        Discover the{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-300 to-rose-400">
                            Unseen World
                        </span>
                    </h1>
                    <p className="text-gray-300 text-xs md:text-base font-medium max-w-xl mx-auto leading-relaxed opacity-90 drop-shadow-md">
                        Book your flights with confidence. Exclusive deals on Hajj, Umrah, and
                        international holidays.
                    </p>
                </div>

                {/* --- Search Form (besh upore) --- */}
                <div className="w-full max-w-6xl relative z-50 animate-in slide-in-from-bottom-8 duration-800 delay-200">
                    {/* Glow behind form */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 rounded-[2rem] blur-xl opacity-30"></div>

                    <div className="relative rounded-[1.8rem] bg-white/95 backdrop-blur-sm shadow-2xl border border-white/80 transform transition-transform hover:-translate-y-1 duration-500 text-left text-gray-900">
                        <div className="p-4 sm:p-6">
                            <FlightSearchForm />
                        </div>
                    </div>
                </div>

                {/* --- Stats / Trust --- */}
                <div className="mt-6 relative z-10 flex flex-wrap justify-center gap-6 md:gap-12 text-gray-400 text-xs font-semibold animate-in fade-in duration-700 delay-400 opacity-85">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden"
                                >
                                    <img
                                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
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

            {/* ================= Slider Navigation Dots ================= */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
                {sliderImages.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300  ${
                            currentSlide === idx
                                ? 'bg-rose-500 scale-125 w-8'
                                : 'bg-white/80 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Hero;