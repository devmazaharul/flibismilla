"use client";
import Link from "next/link";
import Image from "next/image";
import { footerData, headerData } from "@/constant/data"; // headerData থেকে সোশ্যাল লিংক নিচ্ছি

import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { appTheme } from "@/constant/theme/global";

const Footer = () => {
  const { colors, layout } = appTheme;

  // আইকন হেল্পার ফাংশন
  const getIcon = (iconName: string) => {
    // এখানে থিমের প্রাইমারি কালার (rose-600) ব্যবহার করছি
    const iconClass = "text-rose-600 mt-1 shrink-0"; 
    switch (iconName) {
      case "map": return <FaMapMarkerAlt className={iconClass} />;
      case "phone": return <FaPhoneAlt className={iconClass} />;
      case "email": return <FaEnvelope className={iconClass} />;
      // Social Icons
      case "facebook": return <FaFacebookF />;
      case "twitter": return <FaTwitter />;
      case "instagram": return <FaInstagram />;
      default: return <FaLinkedinIn />;
    }
  };

  return (
    // আমরা ডার্ক থিমের ব্যাকগ্রাউন্ড ব্যবহার করছি (topBar.bg = bg-gray-950)
    <footer className={`${colors.topBar.bg} ${colors.text.light} pt-16 md:pt-20`}>
      
      {/* ================= Top Section (4 Columns) ================= */}
      <div className={`${layout.container} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16`}>
        
        {/* Column 1: About & Logo */}
        <div className="space-y-6">
          <Link href="/" className="block">
             {/* লোগো না থাকলে টেক্সট দেখাবে, থাকলে ইমেজ */}
             <div className="flex items-center gap-2">
                <span className="text-3xl">✈️</span>
                <h2 className="text-2xl font-bold">Fly Bismillah</h2>
             </div>
            {/* আসল লোগো ব্যবহারের উদাহরণ:
            <Image src={footerData.about.logo} alt="Fly Bismillah Logo" width={150} height={50} className="brightness-0 invert" /> 
            */}
          </Link>
          <p className={`${colors.text.muted} leading-relaxed pr-4`}>
            {footerData.about.text}
          </p>
        </div>

        {/* Column 2: Contact Us */}
        <div>
          <h3 className="text-lg font-bold mb-6 tracking-wider">{footerData.contact.title}</h3>
          <ul className="space-y-4">
            {footerData.contact.info.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {getIcon(item.icon)}
                <span className={colors.text.muted}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support Links */}
        <div>
          <h3 className="text-lg font-bold mb-6 tracking-wider">{footerData.support.title}</h3>
          <ul className="space-y-3">
            {footerData.support.links.map((link, idx) => (
              <li key={idx}>
                <Link 
                  href={link.href} 
                  className={`${colors.text.muted} hover:text-rose-500 transition-colors duration-200 flex items-center gap-2`}
                >
                  {/* ছোট্ট অ্যারো আইকন */}
                  <span className="text-xs text-rose-600">›</span> {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Get the App */}
        <div>
           <h3 className="text-lg font-bold mb-6 tracking-wider">{footerData.getApp.title}</h3>
           <p className={`${colors.text.muted} mb-6`}>{footerData.getApp.text}</p>
           
           {/* App Download Image Placeholder (Replace with actual image) */}
           <div className="w-30 h-30  flex items-center justify-center text-gray-500 text-sm">
            <Image src={"https://flybismillah.com/wp-content/uploads/2024/12/New-Project.webp"} width={600} height={600} alt="app image" className="w-full h-full bg-cover"/> 
            
           </div>
        </div>
      </div>

      {/* ================= Bottom Bar (Copyright & Social) ================= */}
      <div className="border-t border-gray-800 bg-gray-950/50 py-6">
        <div className={`${layout.container} flex flex-col md:flex-row justify-between items-center gap-4`}>
          
          {/* Left Side: Copyright & Links */}
          <div className={`text-sm ${colors.text.muted} flex flex-col md:flex-row items-center gap-2 md:gap-6`}>
            <p>{footerData.bottomBar.copyright}</p>
            <div className="flex gap-4">
                {footerData.bottomBar.links.map((link, idx) => (
                    <Link key={idx} href={link.href} className="hover:text-white transition">
                        {link.label}
                    </Link>
                ))}
            </div>
          </div>

          {/* Right Side: Social Icons (Reusing headerData) */}
          <div className="flex gap-3">
            {headerData.socialLinks.map((social, idx) => (
              <a 
                key={idx} 
                href={social.href} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-rose-600 hover:text-white transition-all duration-300"
              >
                {getIcon(social.icon)}
              </a>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;