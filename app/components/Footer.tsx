'use client';
import Link from 'next/link';
import Image from 'next/image';
import { footerData, headerData } from '@/constant/data'; // headerData থেকে সোশ্যাল লিংক নিচ্ছি

import {
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
} from 'react-icons/fa';
import { appTheme } from '@/constant/theme/global';

const Footer = () => {
    const { colors, layout } = appTheme;

    // আইকন হেল্পার ফাংশন
    const getIcon = (iconName: string) => {
        // এখানে থিমের প্রাইমারি কালার (rose-600) ব্যবহার করছি
        const iconClass = 'text-rose-600 mt-1 shrink-0';
        switch (iconName) {
            case 'map':
                return <FaMapMarkerAlt className={iconClass} />;
            case 'phone':
                return <FaPhoneAlt className={iconClass} />;
            case 'email':
                return <FaEnvelope className={iconClass} />;
            // Social Icons
            case 'facebook':
                return <FaFacebookF />;
            case 'twitter':
                return <FaTwitter />;
            case 'instagram':
                return <FaInstagram />;
            default:
                return <FaLinkedinIn />;
        }
    };

    return (
        <footer className={`${colors.topBar.bg} ${colors.text.light} pt-16 md:pt-20`}>
            {/* ================= Top Section (4 Columns) ================= */}
            <div
                className={`${layout.container} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16`}
            >
                {/* Column 1: About & Logo */}
                {/* Logo */}
                <div>
                    <Link href="/" className="group flex items-center gap-2">
                        <div className="bg-gray-700 text-white p-2.5 rounded-xl shadow-lg group-hover:bg-gray-700 transition-colors duration-300">
                            <span className="text-2xl">✈️</span>
                        </div>
                        <div>
                            <h1
                                className={`text-xl font-extrabold text-gray-200 leading-none tracking-tight`}
                            >
                                Bismillah
                            </h1>
                            <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
                                Travels & Tours
                            </span>
                        </div>
                    </Link>

                    <p className={`${colors.text.muted} leading-relaxed pr-4 py-4`}>
                        {footerData.about.text}
                    </p>
                </div>

                {/* Column 2: Contact Us */}
                <div>
                    <h3 className="text-lg font-bold mb-6 tracking-wider">
                        {footerData.contact.title}
                    </h3>
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
                    <h3 className="text-lg font-bold mb-6 tracking-wider">
                        {footerData.support.title}
                    </h3>
                    <ul className="space-y-3">
                        {footerData.support.links.map((link, idx) => (
                            <li key={idx}>
                                <Link
                                    href={link.href}
                                    className={`${colors.text.muted} hover:text-rose-500 transition-colors duration-200 flex items-center gap-2`}
                                >
                                    <span className="text-xs text-rose-600">›</span> {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-6 tracking-wider">
                        {footerData.getApp.title}
                    </h3>
                    <p className={`${colors.text.muted} mb-6`}>{footerData.getApp.text}</p>

                    <div className="w-30 h-30  flex items-center justify-center text-gray-500 text-sm">
                        <Image
                            src={
                                'https://flybismillah.com/wp-content/uploads/2024/12/New-Project.webp'
                            }
                            width={600}
                            height={600}
                            alt="app image"
                            className="w-full h-full bg-cover"
                        />
                    </div>
                </div>
            </div>

            {/* ================= Bottom Bar (Copyright & Social) ================= */}
            <div className="border-t border-gray-800 bg-gray-950/50 py-6">
                <div
                    className={`${layout.container} flex flex-col md:flex-row justify-between items-center gap-4`}
                >
                    {/* Left Side: Copyright & Links */}
                    <div
                        className={`text-sm ${colors.text.muted} flex flex-col md:flex-row items-center gap-2 md:gap-6`}
                    >
                        <p>© {new Date().getFullYear()} {footerData.bottomBar.copyright}</p>
                    </div>
                    <p className='text-xs text-gray-400'> 
                        Developed by{' '}
                        <Link
                            className="text-blue-500"
                            target="_blank"
                            href="https://mazaharul.site"
                        >
                            Maza IT.
                        </Link>{' '}
                    </p>
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
