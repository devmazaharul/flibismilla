"use client";
import Image from "next/image";
import Link from "next/link";
import { aboutPageData } from "@/constant/data";
import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaBullseye, FaEye, FaCheckCircle, FaPhoneAlt, FaMapMarkedAlt } from "react-icons/fa";
import Stats from "../components/Stats";

const page = () => {
  const { colors, layout, typography, button } = appTheme;

  return (
    <main className="bg-white min-h-screen pb-20">
      
      {/* ================= 1. Hero Section ================= */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center bg-gray-900">
        <Image 
          src={aboutPageData.hero.bgImage} 
          alt="About Hero" 
          fill 
          className="object-cover opacity-40"
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className={`${typography.h1} mb-2`}>{aboutPageData.hero.title}</h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
            {aboutPageData.hero.subtitle}
          </p>
        </div>
      </section>

      {/* ================= 2. Intro & Skills (Split Layout) ================= */}
      <section className={`${layout.sectionPadding} ${layout.container}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left: Image & Badge */}
          <div className="relative">
            <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src={aboutPageData.intro.image} 
                alt="Travel Agency Office" 
                fill 
                className="object-cover"
              />
            </div>
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border-l-4 border-rose-600 max-w-[200px] hidden md:block">
              <h4 className="text-4xl font-bold text-rose-600 mb-1">1M+</h4>
              <p className="text-gray-600 font-bold leading-tight">Travel in a Month</p>
            </div>
          </div>

          {/* Right: Content & Progress Bars */}
          <div>
            <span className={`${typography.subtitle} mb-2 block`}>
              {aboutPageData.intro.title}
            </span>
            <h2 className={`${typography.h2} ${colors.text.heading} mb-6`}>
              {aboutPageData.intro.heading}
            </h2>
            <p className={`${colors.text.body} mb-6 text-lg`}>
              {aboutPageData.intro.description1}
            </p>
            
            {/* Mission & Vision Cards Small */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               {aboutPageData.missionVision.map((item, idx) => (
                 <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-rose-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                       {item.icon === 'mission' ? <FaBullseye className="text-rose-600"/> : <FaEye className="text-rose-600"/>}
                       <h4 className="font-bold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{item.text}</p>
                 </div>
               ))}
            </div>

            {/* Progress Bars */}
            <div className="space-y-6">
              {aboutPageData.skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2 font-bold text-gray-700">
                    <span>{skill.label}</span>
                    <span>{skill.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`${appTheme.colors.brand.primary} h-2.5 rounded-full transition-all duration-1000`} 
                      style={{ width: `${skill.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
               <Link href="/contact">
                 <Button className={`${button.primary} px-8 h-12`}>Contact Us Today</Button>
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. Stats Section ================= */}
<Stats/>
      {/* ================= 4. 3 Steps Section ================= */}
      <section className={`${layout.sectionPadding} bg-gray-50`}>
        <div className={layout.container}>
          
          <div className="text-center mb-16 max-w-2xl mx-auto">
             <span className={typography.subtitle}>How It Works</span>
             <h2 className={`${typography.h2} ${colors.text.heading} mb-4`}>
               {aboutPageData.steps.title}
             </h2>
             <p className={colors.text.body}>{aboutPageData.steps.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
             {/* Connector Line (Desktop Only) */}
             <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gray-100 -z-0"></div>

             {aboutPageData.steps.items.map((step, idx) => (
               <div key={idx} className="relative z-10 bg-white p-8 pt-0 text-center rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 hover:-translate-y-2 transition-transform duration-300">
                  {/* Number Circle */}
                  <div className="w-24 h-24 mx-auto bg-white border rounded-full flex items-center justify-center mb-6 -mt-12 shadow-2xl shadow-gray-100 border-gray-200/60">
                     <span className="text-3xl font-extrabold text-rose-600">{step.id}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>

        </div>
      </section>

      {/* ================= 5. Mission & Vision Full Text ================= */}
      <section className={`${layout.sectionPadding} ${layout.container}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-gray-900 text-white p-10 rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                   <div className="w-14 h-14 bg-rose-600 rounded-xl flex items-center justify-center mb-6 text-2xl">
                      <FaBullseye />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                   <p className="text-gray-300 leading-relaxed">
                     {aboutPageData.missionVision[0].text}
                   </p>
                </div>
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
             </div>

             <div className="bg-rose-50 text-gray-900 p-10 rounded-3xl relative overflow-hidden border border-rose-100">
                <div className="relative z-10">
                   <div className="w-14 h-14 bg-white shadow-2xl text-rose-600 rounded-xl flex items-center justify-center mb-6 text-2xl">
                      <FaEye />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                   <p className="text-gray-600 leading-relaxed">
                     {aboutPageData.missionVision[1].text}
                   </p>
                </div>
             </div>
          </div>
      </section>

    </main>
  );
};

export default page;