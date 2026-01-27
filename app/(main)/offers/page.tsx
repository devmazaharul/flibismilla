'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import { FaWhatsapp, FaArrowRight, FaSearch, FaTag, FaSadTear, FaExclamationTriangle, FaFireAlt, FaPlaneDeparture } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { websiteDetails } from '@/constant/data';

// Define Interface
interface OfferType {
    _id: string; 
    title: string;
    description: string;
    image: string;
    whatsappMessage?: string;
    isLarge?: boolean;
}

const OffersPage = () => {
    const { layout, typography } = appTheme;
    
    // State
    const [offers, setOffers] = useState<OfferType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // API Call
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axios.get('/api/public/offers');
                const data = response.data.data || response.data || [];
                setOffers(data);
            } catch (err: any) {
                console.error("Error fetching offers:", err);
                setError("Unable to load latest deals.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOffers();
    }, []);

    // Filter
    const filteredBanners = offers.filter(banner => 
        (banner.title && banner.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (banner.description && banner.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main className="bg-[#F2F4F7] min-h-screen pb-24 font-sans">
            
            {/* ================= 1. Modern Hero Section ================= */}
            <div className="relative h-[45vh] min-h-[400px] w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gray-900">
                {/* Background with Overlay */}
                <Image
                    src="/asset/blog/blog1.webp" 
                    alt="Offers Hero"
                    fill
                    className="object-cover opacity-50 scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#F2F4F7] via-gray-900/40 to-gray-900/80" />

                {/* Hero Content */}
                <div className="relative z-10 w-full max-w-4xl space-y-6 mt-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full text-rose-300 font-bold tracking-wider text-xs uppercase shadow-xl">
                        <FaFireAlt className="animate-pulse" /> Limited Time Deals
                    </div>
                    
                    <h1 className={`${typography.h1} text-white drop-shadow-2xl text-4xl md:text-6xl`}>
                        Curated Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Offers</span>
                    </h1>
                    
                    {/* Floating Search Bar */}
                    <div className="max-w-lg mx-auto w-full relative group">
                        <div className="absolute rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white p-2 rounded-full shadow-2xl flex items-center w-full">
                            <div className="pl-4 text-gray-400 text-lg">
                               <FaSearch />
                            </div>
                            <input 
                               type="text" 
                               placeholder="Find your dream deal (e.g., Dubai, Hajj)..." 
                               className="flex-1 px-4 py-3 outline-none text-gray-800 font-medium bg-transparent placeholder-gray-400 text-sm md:text-base"
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="bg-gray-900 cursor-pointer text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-rose-600 transition-colors">
                                <FaArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Content Section ================= */}
            <div className={`${layout.container} -mt-20 relative z-20`}>
                
                {/* Status Bar */}
                {!isLoading && !error && (
                    <div className="flex justify-between items-center mb-8 px-2">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FaTag className="text-rose-500" />
                         <p className='text-white'>   {searchQuery ? `Results: "${searchQuery}"` : "Trending Offers"}</p>
                        </h2>
                        <span className="bg-white px-4 py-1.5 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-200">
                            {filteredBanners.length} Deals Active
                        </span>
                    </div>
                )}

                {/* Loading Skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i} 
                                className={`relative h-[420px] rounded-[2rem] bg-gray-200 animate-pulse overflow-hidden ${
                                    i === 0 ? 'lg:col-span-2' : ''
                                }`}
                            >
                                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-300 to-transparent"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-red-100 max-w-2xl mx-auto">
                        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaExclamationTriangle className="text-3xl text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Connection Issue</h3>
                        <p className="text-gray-500 mb-8">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-300 cursor-pointer">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Offer Cards Grid */}
                {!isLoading && !error && filteredBanners.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBanners.map((banner, index) => {
                            // First item is Large by default, or if isLarge is true
                            const isLarge = banner.isLarge;

                            return (
                                <div 
                                    key={banner._id || index} 
                                    className={`group relative h-[450px] rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer ${
                                        isLarge ? 'lg:col-span-2' : 'lg:col-span-1'
                                    }`}
                                >
                                    {/* Image */}
                                    <Image
                                        src={banner.image}
                                        alt={banner.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                                    />
                                    
                                    {/* Dark Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                                    {/* Top Badge */}
                                    <div className="absolute top-6 left-6 z-30">
                                        <div className={`backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-lg ${
                                            isLarge ? 'bg-rose-600/90' : 'bg-black/30'
                                        }`}>
                                            {isLarge ? '★ Premium Choice' : 'Hot Deal'}
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-8 z-30">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                            
                                            {/* Title */}
                                            <h3 className={`font-black text-white leading-tight mb-3 drop-shadow-md ${
                                                isLarge ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
                                            }`}>
                                                {banner.title}
                                            </h3>

                                            {/* Description (Visible on large, or hover) */}
                                            <p className={`text-gray-300 font-medium line-clamp-2 mb-6 transition-opacity duration-500 ${
                                                isLarge ? 'text-base md:text-lg opacity-90' : 'text-sm opacity-0 group-hover:opacity-100'
                                            }`}>
                                                {banner.description}
                                            </p>

                                            {/* Action Button */}
                                            <div className="flex items-center gap-4">
                                                <Link 
                                                    href={`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(banner.whatsappMessage || `Hi, I am interested in ${banner.title}`)}`}
                                                    target="_blank"
                                                    className="w-full md:w-auto"
                                                >
                                                    <Button className={`w-full cursor-pointer rounded-xl font-bold h-12  shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
                                                        isLarge 
                                                            ? 'bg-white text-gray-900 hover:bg-gray-100' 
                                                            : 'bg-white text-black hover:bg-gray-500 hover:text-white'
                                                    }`}>
                                                        <FaWhatsapp className="text-xl text-green-500" />
                                                        <span>Book This Offer</span>
                                                        <FaArrowRight className="text-xs opacity-50" />
                                                    </Button>
                                                </Link>
                                                
                                                {/* Extra Info for Large Card */}
                                                {isLarge && (
                                                    <div className="hidden md:flex items-center gap-2 text-white/80 text-sm font-medium backdrop-blur-md bg-white/10 px-4 py-3 rounded-xl border border-white/10">
                                                        <FaPlaneDeparture />
                                                        <span>Flight Included</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredBanners.length === 0 && (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-200/70 shadow-2xl shadow-gray-100 max-w-lg mx-auto mt-10">
                        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-gray-400">
                           <FaSadTear />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Offers Found</h3>
                        <p className="text-gray-500 mb-8">
                            We couldn't find matches for "{searchQuery}". Try a different keyword.
                        </p>
                        <Button 
                            onClick={() => setSearchQuery("")}
                            className="bg-gray-900 text-white rounded-full px-8 h-12 font-bold hover:bg-gray-800"
                        >
                            View All Offers
                        </Button>
                    </div>
                )}

            </div>
        </main>
    );
};

export default OffersPage;