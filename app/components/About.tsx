"use client";
import Image from "next/image";
import { aboutData } from "@/constant/data";

import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const About = () => {
  const { colors, layout, typography, button } = appTheme;

  return (
    <section className={`bg-white ${layout.sectionPadding} overflow-hidden`}>
      <div className={layout.container}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* ================= Left Side: Image Composition ================= */}
          <div className="relative">
            {/* Main Large Image */}
            <div className={`relative h-[400px] md:h-[500px] w-full md:w-[85%] ${layout.radius.card} overflow-hidden shadow-2xl`}>
               {/* Replace src with your actual image path like '/images/about-1.jpg' */}
               <Image 
                 src="https://flybismillah.com/wp-content/uploads/elementor/thumbs/image-2-qxwe5qttaapr8zyw3ahqj068y764nwpws18qcbz57k.webp" 
                 alt="Makkah Clock Tower"
                 fill
                 className="object-cover hover:scale-105 transition-transform duration-700"
               />
            </div>

            {/* Secondary Overlapping Image (Hidden on small mobile) */}
            <div className={`hidden md:block absolute bottom-[-30px] right-0 w-[55%] h-[300px] ${layout.radius.card} overflow-hidden border-8 border-white shadow-xl`}>
              {/* Replace src with '/images/about-2.jpg' */}
              <Image 
                src="https://flybismillah.com/wp-content/uploads/elementor/thumbs/image-1-1-qxwe1dutasuk0mqtrexn4s9gtijqo2j1u3l56mlt6w.webp" 
                alt="Happy Traveler"
                fill
                className="object-cover"
              />
            </div>

            {/* Floating Experience Badge */}
            <div className={`absolute top-10 right-4 md:right-[10%] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-l-4 border-rose-600 animate-pulse`}>
              <h4 className="text-3xl font-bold text-rose-600 mb-0 leading-none">{aboutData.stats.years}</h4>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{aboutData.stats.label}</p>
            </div>
            
            {/* Decorative Dot Pattern (Optional CSS Visual) */}
            <div className="absolute -z-10 top-[-20px] left-[-20px] w-32 h-32 bg-rose-100 rounded-full blur-3xl opacity-50"></div>
          </div>

          {/* ================= Right Side: Content ================= */}
          <div className="flex flex-col justify-center">
            
            {/* Subtitle */}
            <span className={`${typography.subtitle} mb-2 block`}>
              {aboutData.subtitle}
            </span>

            {/* Main Title */}
            <h2 className={`${typography.h2} ${colors.text.heading} mb-6 leading-tight`}>
              We Are <span className="text-rose-600">Dedicated</span> To Make Your Journey Spiritual
            </h2>

            {/* Description */}
            <p className={`${colors.text.body} mb-8 text-lg`}>
              {aboutData.description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {aboutData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <FaCheckCircle className="text-rose-600 text-xl shrink-0" />
                  <span className={`font-medium ${colors.text.heading}`}>{feature}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div>
              <Button className={`${button.primary} px-8 h-12 text-base`}>
                Discover More <FaArrowRight className="ml-2" />
              </Button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;