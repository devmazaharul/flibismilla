"use client";
import Image from "next/image";
import { testimonialsData } from "@/constant/data";

import { FaStar, FaQuoteRight } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const Testimonials = () => {
  const { colors, layout, typography } = appTheme;

  // স্টার রেন্ডার করার ফাংশন
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={index < rating ? "text-yellow-400" : "text-gray-300"}
      />
    ));
  };

  return (
    <section className={`bg-gray-50 ${layout.sectionPadding}`}>
      <div className={layout.container}>
        
        {/* ================= Header ================= */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className={`${typography.subtitle} block mb-3`}>
            Testimonials
          </span>
          <h2 className={`${typography.h2} ${colors.text.heading} mb-4`}>
            What Our <span className="text-rose-600">Happy Clients</span> Say
          </h2>
          <p className={colors.text.body}>
            We take pride in serving our guests with the utmost care. Here are some words from our satisfied travelers.
          </p>
        </div>

        {/* ================= Reviews Grid ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((item) => (
            <div 
              key={item.id} 
              className={`group bg-white p-8 ${layout.radius.card} shadow-2xl shadow-gray-100 hover:translate-1.5 transition-all duration-300 border border-gray-200/80 relative overflow-hidden`}
            >
              {/* Decorative Quote Icon (Watermark effect) */}
              <FaQuoteRight className="absolute top-6 right-6 text-6xl text-rose-50 opacity-10 group-hover:opacity-20 transition-opacity" />

              {/* Review Text */}
              <div className="relative z-10">
                <div className="flex gap-1 mb-6 text-sm">
                  {renderStars(item.rating)}
                </div>
                
                <p className={`${colors.text.body} mb-8 italic leading-relaxed`}>
                  "{item.review}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-rose-100">
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-none mb-1">
                      {item.name}
                    </h4>
                    <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                      {item.role}
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

export default Testimonials;