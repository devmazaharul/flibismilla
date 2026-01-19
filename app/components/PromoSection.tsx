'use client';

import Image from 'next/image';
import Link from 'next/link';

import { appTheme } from '@/constant/theme/global';
import { FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { promoBanners } from '@/constant/others';
import { websiteDetails } from '@/constant/data';

const PromoSection = () => {
    const { layout,button } = appTheme;

    return (
        <section className="py-20 bg-gray-50">
            <div className={layout.container}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <span className="text-rose-600 font-bold tracking-widest uppercase text-xs bg-rose-100 px-3 py-1 rounded-full">
                            Limited Time Offers
                        </span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mt-4 leading-tight">
                            Unbeatable <span className="text-rose-600">Travel Deals</span>
                        </h2>
                    </div>

                    <div>
                        <div className="mt-12 text-center">
                   <Link href={"/offers"}>
                        <Button className={`${button.primary}  shadow-none hover:shadow-none `}>
                            View All Offers
                        </Button>
                    </Link>
                </div>

                       
                    </div>
                </div>

                {/* Modern Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
                    {promoBanners.slice(0,5).map((banner) => (
                        <div 
                            key={banner.id} 
                            className={`relative group rounded-[2rem] overflow-hidden shadow-xl cursor-pointer ${
                                banner.isLarge ? 'md:col-span-2' : 'md:col-span-1'
                            }`}
                        >
                            {/* 1. Background Image with Zoom Effect */}
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                            />
                            
                            {/* 2. Gradient Overlay (Always visible for text readability) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                            {/* 3. Content at Bottom */}
                            <div className="absolute bottom-0 left-0 w-full p-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className={`font-bold text-white mb-2 leading-tight ${banner.isLarge ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                                    {banner.title}
                                </h3>
                                <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    {banner.description}
                                </p>
                                
                                {/* WhatsApp Button (Slide Up Effect) */}
                                <div className="overflow-hidden h-0 group-hover:h-auto transition-all duration-500">
                                    <Link 
                                        href={`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(banner.whatsappMessage)}`}
                                        target="_blank"
                                    >
                                        <Button className="bg-green-500 hover:bg-green-600 text-white font-bold w-full md:w-auto h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/30 animate-pulse-slow">
                                            <FaWhatsapp className="text-xl" />
                                            Book via WhatsApp
                                            <FaArrowRight className="text-xs ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* 4. Top Right Tag */}
                            <div className="absolute top-6 right-6 ">
                                <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {banner.isLarge ? 'Best Seller' : 'Hot Deal'}
                                </span>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default PromoSection;