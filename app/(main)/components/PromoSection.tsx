'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import { FaWhatsapp, FaArrowRight, FaExclamationTriangle, FaFire, FaSadTear } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { websiteDetails } from '@/constant/data';

// Interface for API Data
interface OfferType {
    _id: string; 
    title: string;
    description: string;
    image: string;
    whatsappMessage?: string;
    isLarge?: boolean;
}

const PromoSection = () => {
    const { layout, button } = appTheme;

    // State Management
    const [offers, setOffers] = useState<OfferType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Offers
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/api/public/offers');
                const data = response.data.data || response.data || [];
                // Taking first 5 offers for the promo grid
                setOffers(data.slice(0, 5));
            } catch (err: any) {
                console.error("Error fetching offers:", err);
                setError("Failed to load special offers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOffers();
    }, []);

    return (
        <section className="py-24 bg-[#F8F9FB]">
            <div className={layout.container}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full mb-4">
                            <FaFire className="text-rose-500 animate-pulse" />
                            <span className="text-rose-600 font-bold tracking-widest uppercase text-xs">
                                Limited Time Offers
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                            Unbeatable <span className="text-rose-600">Travel Deals</span>
                        </h2>
                        <p className="text-gray-500 mt-4 text-lg">
                            Grab these exclusive packages before they expire. Best price guaranteed.
                        </p>
                    </div>

                    <div className="mb-2">
                        <Link href={"/offers"}>
                            <Button className={`${button.primary} shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 transition-all duration-300 cursor-pointer h-12 px-8 rounded-xl`}>
                                View All Offers
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content Area */}
                
                {/* 1. Loading Skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[420px]">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i} 
                                className={`relative rounded-[2.5rem] overflow-hidden bg-gray-200 animate-pulse border border-white shadow-sm ${
                                    i === 1 ? 'md:col-span-2' : 'md:col-span-1'
                                }`} 
                            >
                                <div className="absolute bottom-8 left-8 right-8 space-y-3">
                                    <div className="h-8 bg-gray-300 rounded-lg w-3/4"></div>
                                    <div className="h-4 bg-gray-300 rounded-lg w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Error State */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-red-100 shadow-xl text-center">
                        <div className="bg-red-50 p-4 rounded-full mb-4">
                            <FaExclamationTriangle className="text-4xl text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Oops!</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-300">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* 3. Success Grid */}
                {!isLoading && !error && offers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[420px]">
                        {offers.map((banner, index) => {
                            // Logic: First item is large by default for better layout
                            const isLarge = banner.isLarge ;

                            return (
                                <div 
                                    key={banner._id || index} 
                                    className={`relative group rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-100 cursor-pointer bg-gray-900 border-4 border-white ${
                                        isLarge ? 'md:col-span-2' : 'md:col-span-1'
                                    }`}
                                >
                                    {/* Background Image */}
                                    <Image
                                        src={banner.image}
                                        alt={banner.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110"
                                    />
                                    
                                    {/* Gradient Overlay */}
                                    <div className={`absolute inset-0 transition-opacity duration-500 ${
                                        isLarge 
                                            ? 'bg-gradient-to-r from-black/80 via-black/30 to-transparent' 
                                            : 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
                                    }`} />

                                    {/* Content Container */}
                                    <div className={`absolute bottom-0 left-0 w-full p-10 z-20 flex flex-col justify-end h-full ${
                                        isLarge ? 'md:w-2/3 items-start text-left' : 'items-start text-left'
                                    }`}>
                                        
                                        {/* Title */}
                                        <h3 className={`font-black text-white mb-3 leading-tight drop-shadow-md transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75 ${
                                            isLarge ? 'text-4xl md:text-5xl' : 'text-3xl'
                                        }`}>
                                            {banner.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-400 text-sm  line-clamp-2 font-medium  transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 mb-8">
                                            {banner.description}
                                        </p>
                                        
                                        {/* WhatsApp Button (Animated) */}
                                        <div className="transform  transition-all duration-500 delay-150 w-full md:w-auto">
                                            <Link 
                                                href={`https://wa.me/${websiteDetails.whatsappNumber || websiteDetails.phone}?text=${encodeURIComponent(`Hi, I'm interested in the offer: ${banner.title}`)}`}
                                                target="_blank"
                                            >
                                                <Button className="bg-white cursor-pointer hover:bg-gray-100 text-gray-900 font-bold w-full md:w-auto h-12 rounded-xl flex items-center justify-center gap-3 shadow-lg">
                                                    <FaWhatsapp className="text-green-600 text-xl" />
                                                    <span>Book via WhatsApp</span>
                                                    <FaArrowRight className="text-xs ml-1 opacity-60" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Top Right Tag */}
                                    <div className="absolute top-6 right-6 z-30">
                                        <span className={`backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${
                                            isLarge ? 'bg-rose-600/90' : 'bg-black/30'
                                        }`}>
                                            {isLarge ? '★ Best Seller' : 'Hot Deal'}
                                        </span>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && offers.length === 0 && (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-gray-300 shadow-sm max-w-lg mx-auto">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-gray-300">
                           <FaSadTear />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Offers Found</h3>
                        <p className="text-gray-500">Check back later for new deals!</p>
                    </div>
                )}

            </div>
        </section>
    );
};

export default PromoSection;