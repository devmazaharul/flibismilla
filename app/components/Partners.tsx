"use client";
import Image from "next/image";
import { partnersData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";


const Partners = () => {
  const { colors, layout, typography } = appTheme;

  return (
    <section className={`bg-white ${layout.sectionPadding} border-t border-gray-100`}>
      <div className={layout.container}>
        
        <div className="text-center mb-12">
          <span className={`${typography.subtitle} block mb-2`}>
            Our Best
          </span>
          <h2 className={`${typography.h2} ${colors.text.heading} mb-6`}>
            Partners
          </h2>
          <p className={`${colors.text.body} max-w-2xl mx-auto`}>
            We collaborate with trusted airlines, hotels, and travel service providers to deliver exceptional experiences.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 lg:gap-20 opacity-80">
          {partnersData.map((partner) => (
            <div 
              key={partner.id} 
              className="relative w-28 h-16 md:w-36 md:h-20   transition-all duration-500 cursor-pointer hover:scale-110"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Partners;