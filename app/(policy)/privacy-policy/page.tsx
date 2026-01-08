"use client";
import { websiteDetails } from "@/constant/data";
import { privacyContent } from "@/constant/policy";
import { appTheme } from "@/constant/theme/global";

import { FaShieldAlt, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

const PrivacyPolicy = () => {
  const { colors, layout, typography } = appTheme;

  return (
    <main className="bg-gray-50 min-h-screen py-16">
      
      {/* ================= Header ================= */}
      <div className={`${layout.container} max-w-4xl mx-auto mb-10 text-center`}>
        <div className="inline-flex items-center justify-center p-4 bg-rose-100/30 rounded-full mb-4">
            <FaShieldAlt className="text-3xl text-rose-600" />
        </div>
        <h1 className={`${typography.h2} text-gray-900 mb-4`}>Privacy Policy</h1>
        <p className={`${colors.text.body} text-lg leading-relaxed`}>
          {privacyContent.intro}
        </p>
        <p className="text-sm text-gray-400 mt-2">Last Updated: January 06, 2026</p>
      </div>

      {/* ================= Content Area ================= */}
      <div className={`${layout.container} max-w-4xl mx-auto`}>
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/60 space-y-10">
          
          {/* Dynamic Sections Loop */}
          {privacyContent.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-rose-600 pl-4">
                {section.title}
              </h2>
              
              {/* Paragraph Content */}
              {section.content && (
                <p className="text-gray-600 leading-relaxed mb-4">
                  {section.content}
                </p>
              )}

              {/* Bullet Points (If any) */}
              {section.items && (
                <ul className="space-y-3 mt-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-600 leading-relaxed">
                      <span className="w-2 h-2 bg-rose-400 rounded-full mt-2.5 shrink-0"></span>
                      {/* বোল্ড টেক্সট রেন্ডার করার জন্য লজিক */}
                      <span dangerouslySetInnerHTML={{ 
                        __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') 
                      }} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* ================= Contact Section (Using Footer Data) ================= */}
          <section className=" p-8 rounded-2xl border border-gray-200/70 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions or concerns about our Privacy Policy or how we handle your personal information, please contact us at:
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <FaMapMarkerAlt className="text-rose-600 text-xl" />
                 <span className="text-gray-700 font-medium">
                    {/* এখানে ফুটার ডাটা থেকে এড্রেস নেওয়া হচ্ছে */}
                    {websiteDetails.address}
                 </span>
              </div>

              <div className="flex items-center gap-3">
                 <FaPhoneAlt className="text-rose-600 text-xl" />
                 <a href={`tel:${websiteDetails.phone}`} className="text-gray-700 font-medium hover:text-rose-600 transition">
                    {websiteDetails.phone}
                 </a>
              </div>

              <div className="flex items-center gap-3">
                 <FaEnvelope className="text-rose-600 text-xl" />
                 <a href={`mailto:${websiteDetails.email}`} className="text-gray-700 font-medium hover:text-rose-600 transition">
                    {websiteDetails.email}
                 </a>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="text-center pt-6 border-t border-gray-100">
             <p className="text-sm text-gray-500 italic">
                {privacyContent.footerNote}
             </p>
          </div>

        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;