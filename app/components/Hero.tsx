"use client";
import Image from "next/image";

import { heroData } from "@/constant/data";
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUser } from "react-icons/fa";
import { Button } from "@/components/ui/button"; // Shadcn Button
import { appTheme } from "@/constant/theme/global";

const Hero = () => {
  // থিম অবজেক্ট থেকে স্টাইলগুলো বের করে নিলাম যাতে কোড ক্লিন দেখায়
  const { colors, layout, typography, button } = appTheme;

  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center">
      
      {/* ================= Background Image & Overlay ================= */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://flybismillah.com/wp-content/uploads/2024/12/slider-2-2.webp" 
          alt="Travel Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay for better text visibility */}
        <div className={`absolute inset-0 ${colors.background.overlay}`} />
      </div>

      {/* ================= Main Content ================= */}
      <div className={`relative z-10 w-full ${layout.container} flex flex-col items-center text-center mt-10`}>
        
        {/* Subtitle (Cursive Font) */}
        <span className={`${typography.subtitle} text-white mb-2 animate-fade-in-up`}>
          {heroData.subtitle}
        </span>

        {/* Main Title */}
        <h1 className={`${typography.h1} text-white max-w-4xl mb-6 drop-shadow-md`}>
          Your Best <span className="text-gray-200">Travel Partner</span>
        </h1>

        <p className="text-gray-200 text-lg mb-10 max-w-2xl mx-auto">
          Explore the world with our exclusive Hajj, Umrah, and Holiday packages designed for your comfort.
        </p>

        {/* ================= Search Box (Floating Card) ================= */}
        <div className={`bg-white w-full max-w-5xl ${layout.radius.card} shadow-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center`}>
          
          {/* Input 1: Destination */}
          <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2">
            <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
              <FaMapMarkerAlt />
              <label className="font-bold uppercase text-xs tracking-wider text-gray-500">Destination</label>
            </div>
            <input 
              type="text" 
              placeholder="Where are you going?" 
              className="w-full outline-none text-gray-800 font-medium placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Input 2: Dates */}
          <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-2">
             <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
              <FaCalendarAlt />
              <label className="font-bold uppercase text-xs tracking-wider text-gray-500">Date</label>
            </div>
            <input 
              type="text" 
              placeholder="DD-MM-YYYY" 
              className="w-full outline-none text-gray-800 font-medium placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Input 3: Guests */}
          <div className="md:col-span-3 px-4 py-2">
             <div className="flex items-center gap-2 mb-1 text-gray-400 text-sm">
              <FaUser />
              <label className="font-bold uppercase text-xs tracking-wider text-gray-500">Guests</label>
            </div>
            <input 
              type="text" 
              placeholder="2 Persons" 
              className="w-full outline-none text-gray-800 font-medium placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Search Button (Gray Theme) */}
          <div className="md:col-span-3 flex justify-center md:justify-end">
            <Button className={`w-full h-14 md:w-full text-lg ${button.primary} ${layout.radius.default}`}>
              <FaSearch className="mr-2" /> Search
            </Button>
          </div>

        </div>

      </div>

  

    </section>
  );
};

export default Hero;