'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import { FaWhatsapp, FaArrowRight, FaSearch, FaTag } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { promoBanners } from '@/constant/others';

const OffersPage = () => {
    const { layout, typography } = appTheme;
    const [searchQuery, setSearchQuery] = useState("");
    const whatsappNumber = "12139858499"; 

    // Filter Logic
    const filteredBanners = promoBanners.filter(banner => 
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            
            {/* ================= 1. Hero / Header ================= */}
            <div className="relative bg-gray-900 h-[35vh] min-h-[300px] flex flex-col items-center justify-center text-center px-4">
                <Image
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000"
                    alt="Offers Hero"
                    fill
                    className="object-cover opacity-30"
                    priority
                />
                <div className="relative z-10 max-w-2xl w-full space-y-6">
                    <span className="text-rose-400 font-bold tracking-widest uppercase">
                        Exclusive Deals
                    </span>
                    <h1 className={`${typography.h1} text-white`}>
                        All Flight Offers
                    </h1>
                    
                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-full shadow-2xl flex items-center w-full">
                        <div className="pl-4 text-gray-400">
                           <FaSearch />
                        </div>
                        <input 
                           type="text" 
                           placeholder="Search destination (e.g. Florida, Rome)..." 
                           className="flex-1 px-4 py-3 outline-none text-gray-700 font-medium bg-transparent"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ================= 2. Banners Grid ================= */}
            <div className={`${layout.container} mt-12`}>
                
                <div className="flex items-center gap-2 mb-8">
                    <FaTag className="text-rose-600" />
                    <h2 className="text-xl font-bold text-gray-800">
                        {searchQuery ? `Results for "${searchQuery}"` : "Latest Deals"}
                    </h2>
                    <span className="ml-auto text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200">
                        {filteredBanners.length} Offers Available
                    </span>
                </div>

                {filteredBanners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
                        {filteredBanners.map((banner) => (
                            <div 
                                key={banner.id} 
                                className={`relative group rounded-[2rem] overflow-hidden shadow-xl cursor-pointer bg-gray-200 ${
                                    banner.isLarge ? 'md:col-span-2' : 'md:col-span-1'
                                }`}
                            >
                                {/* Background Image */}
                                <Image
                                    src={banner.image}
                                    alt={banner.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                                />
                                
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 w-full p-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className={`font-bold text-white mb-2 leading-tight ${banner.isLarge ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                                        {banner.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        {banner.description}
                                    </p>
                                    
                                    {/* WhatsApp Button */}
                                    <div className="overflow-hidden h-0 group-hover:h-auto transition-all duration-500">
                                        <Link 
                                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(banner.whatsappMessage)}`}
                                            target="_blank"
                                        >
                                            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold w-full md:w-auto h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/30">
                                                <FaWhatsapp className="text-xl" />
                                                Check Price
                                                <FaArrowRight className="text-xs ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Tag */}
                                <div className="absolute top-6 right-6 z-20">
                                    <span className={`backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        banner.isLarge ? 'bg-rose-600/80' : 'bg-white/20'
                                    }`}>
                                        {banner.isLarge ? 'Best Seller' : 'Promo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-bold text-gray-400">No offers found matching "{searchQuery}"</h3>
                        <Button 
                            variant="link" 
                            onClick={() => setSearchQuery("")}
                            className="text-rose-600 mt-2"
                        >
                            View all offers
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
};

export default OffersPage;