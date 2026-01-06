"use client";
import { useState } from "react";
import Link from "next/link";

import { appTheme } from "@/constant/theme/global";
import { Button } from "@/components/ui/button";
import { FaPlus, FaMinus, FaQuestionCircle, FaHeadset } from "react-icons/fa";
import { faqData } from "@/constant/policy";

const FaqPage = () => {
  const { colors, layout, typography, button } = appTheme;
  
  // State to track which accordion is open
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default 1st one open

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="bg-gray-50 min-h-screen py-16">
      
      {/* ================= Header Section ================= */}
      <div className={`${layout.container} text-center mb-16 max-w-3xl mx-auto`}>
        <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-4 animate-bounce">
            <FaQuestionCircle className="text-2xl text-rose-600" />
        </div>
        <h1 className={`${typography.h2} ${colors.text.heading} mb-4`}>
          {faqData.header.title}
        </h1>
        <p className={`${colors.text.body} text-lg`}>
          {faqData.header.subtitle}
        </p>
      </div>

      {/* ================= FAQ Accordion Grid ================= */}
      <div className={`${layout.container} max-w-4xl mx-auto`}>
        <div className="space-y-4">
          {faqData.items.map((item, index) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                openIndex === index 
                ? "border-rose-200 shadow-2xl shadow-gray-100 border border-gray-200/70;" 
                : " hover:border-rose-100  shadow-2xl shadow-gray-100 border border-gray-200/70"
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className={`text-lg font-bold transition-colors ${
                  openIndex === index ? "text-rose-600" : "text-gray-800"
                }`}>
                  {item.question}
                </span>
                <span className={`ml-4 flex-shrink-0 p-2 rounded-full cursor-pointer transition-colors ${
                    openIndex === index ? "bg-rose-100 text-rose-600" : "bg-gray-50 text-gray-700"
                }`}>
                  {openIndex === index ? <FaMinus className="text-sm" /> : <FaPlus className="text-sm" />}
                </span>
              </button>

              {/* Answer Content (Collapsible) */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-6 pt-0 border-t border-gray-50">
                  <p className="text-gray-600 leading-relaxed mt-4">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Bottom CTA Section ================= */}
      <div className={`${layout.container} max-w-4xl mx-auto mt-20`}>
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaHeadset className="text-3xl text-rose-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              {faqData.cta.title}
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              {faqData.cta.text}
            </p>

            <Link href={faqData.cta.link}>
              <Button className={`${button.primary} bg-white text-gray-900 hover:bg-gray-100 border-none px-8 py-6 text-lg shadow-xl shadow-rose-900/20`}>
                {faqData.cta.btnText}
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
};

export default FaqPage;