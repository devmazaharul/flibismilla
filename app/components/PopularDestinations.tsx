"use client";
import Image from "next/image";
import { destinationsData } from "@/constant/data";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { appTheme } from "@/constant/theme/global";

const PopularDestinations = () => {
  const {  layout, typography } = appTheme;

  return (
    <section className={`bg-gray-900 ${layout.sectionPadding} relative overflow-hidden`}>
      
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
        </svg>
      </div>

      <div className={`${layout.container} relative z-10`}>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className={`${typography.h2} text-white mb-2`}>
              Popular Destinations
            </h2>
            <p className="text-gray-400 text-lg">
              Bring the distance closer through us.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              size="icon" 
              className="rounded-full bg-gray-800 text-white hover:bg-rose-600 border border-gray-700 hover:border-rose-600 transition-all duration-300"
            >
              <FaChevronLeft />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full bg-gray-800 text-white hover:bg-rose-600 border border-gray-700 hover:border-rose-600 transition-all duration-300"
            >
              <FaChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinationsData.map((item) => (
            <div 
              key={item.id} 
              className={`group bg-white ${layout.radius.card} overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer`}
            >
              <div className="relative h-80 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                
                <div className="absolute bottom-0 left-0 w-full p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="h-0.5 w-8 bg-rose-600 rounded-full transition-all duration-300 group-hover:w-12"></span>
                    <p className="text-sm text-gray-300 font-medium">
                      {item.reviews} Reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;