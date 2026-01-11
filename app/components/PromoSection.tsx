'use client';

import Image from 'next/image';
import Link from 'next/link';
import { promoBanners } from '@/constant/others';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaWhatsapp, FaArrowRight, FaCopy } from 'react-icons/fa'; // FaClock সরানো হয়েছে
import { toast } from 'sonner';

const PromoSection = () => {
    const { layout, typography } = appTheme;

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Coupon ${code} copied!`);
    };

    return (
        <section className="py-20 bg-gray-50 relative overflow-hidden">
            
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-10 right-10 w-64 h-64 bg-rose-200 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-200 rounded-full blur-[100px] opacity-20"></div>
            </div>

            <div className={`${layout.container} relative`}>
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="text-rose-600 font-bold tracking-[0.2em] uppercase text-xs mb-3 block animate-pulse">
                        Don't Miss Out
                    </span>
                    <h2 className={`${typography.h2} text-gray-900 mb-4`}>
                        Exclusive Travel Deals
                    </h2>
                    <div className="h-1 w-20 bg-rose-600 mx-auto rounded-full"></div>
                </div>

                {/* Banners Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {promoBanners.map((promo) => (
                        <div key={promo.id} className="group relative h-[450px] w-full rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50">
                            
                            {/* Background Image */}
                            <Image
                                src={promo.image}
                                alt={promo.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            
                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                            {/* Top Left Badge (Subtitle) */}
                            <div className="absolute top-6 left-6 flex gap-3">
                                <span className={`bg-gradient-to-r ${promo.color} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg`}>
                                    {promo.subTitle}
                                </span>
                            </div>
                            
                            {/* 🟢 Removed Expiry Date Badge from Top Right */}

                            {/* Bottom Content (Glassmorphism) */}
                            <div className="absolute bottom-0 left-0 w-full p-8 transition-all duration-500 transform translate-y-12 group-hover:translate-y-0">
                                
                                {/* Text Content */}
                                <div className="mb-6 relative z-10">
                                    <h3 className="text-3xl font-extrabold text-white mb-2 leading-tight">
                                        {promo.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm md:text-base line-clamp-2 group-hover:line-clamp-none transition-all">
                                        {promo.description}
                                    </p>
                                </div>

                                {/* Action Buttons Area */}
                                <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                    
                                   
                                    

                                    {/* Buttons Row */}
                                    <div className="flex gap-3 mt-1">
                                        <Link href={promo.link} className="flex-1">
                                            <Button className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl border-none">
                                                View Details <FaArrowRight className="ml-2" />
                                            </Button>
                                        </Link>
                                        
                                        <a href="https://wa.me/12139858499" target="_blank" rel="noreferrer" className="flex-1">
                                            <Button className="w-full h-12 bg-[#25D366] hover:bg-[#20b85c] text-white font-bold rounded-xl border-none">
                                                <FaWhatsapp className="mr-2 text-xl" /> WhatsApp
                                            </Button>
                                        </a>
                                    </div>
                                </div>

                                {/* Hover Hint Arrow */}
                                <div className="absolute bottom-12 right-8 text-white/50 animate-bounce group-hover:hidden">
                                    <FaArrowRight className="-rotate-90 text-2xl" />
                                </div>

                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </section>
    );
};

export default PromoSection;