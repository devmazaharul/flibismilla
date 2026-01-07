'use client';
import Link from 'next/link';
import { useState } from 'react';
import { headerData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';

import {
    FaPhoneAlt,
    FaEnvelope,
    FaBars,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaChevronRight,
    FaHome,
    FaPlaneDeparture,
    FaHotel,
    FaKaaba,
    FaInfoCircle,
    FaHeadset,
    FaYoutube,
    FaPinterest,
    FaWhatsapp,
} from 'react-icons/fa';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { IoMdArrowDropdown } from 'react-icons/io';
import { usePathname } from 'next/navigation';

const Navbar = () => {
    const pathName = usePathname();
    const { colors, layout, button } = appTheme;

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'whatsapp':
                return <FaWhatsapp />;
            case 'facebook':
                return <FaFacebookF />;
            case 'twitter':
                return <FaTwitter />;
            case 'instagram':
                return <FaInstagram />;
            case 'youtube':
                return <FaYoutube />;
            default:
                return <FaPinterest />;
        }
    };

    return (
        <header className="w-full relative z-50">
            {/* ... Top Bar & Desktop Nav Code (Same as before) ... */}

            {/* ================= 1. Top Bar ================= */}
            <div
                className={`${colors.topBar.bg} ${colors.topBar.text} text-xs py-2.5 hidden md:block border-b border-gray-800`}
            >
                <div className={`${layout.container} flex justify-between items-center`}>
                    {/* Left: Contact */}
                    <div className="flex gap-6 font-medium">
                        <a
                            href={`mailto:${headerData.contact.email}`}
                            className="flex items-center gap-2 hover:text-rose-400 transition"
                        >
                            <FaEnvelope className="text-gray-400" /> {headerData.contact.email}
                        </a>
                        <div className="flex gap-4">
                            {headerData.contact.phones.map((item, i) => (
                                <a
                                    key={i}
                                    href={`tel:${item}`}
                                    className="flex items-center gap-1 hover:text-rose-400 transition"
                                >
                                    <FaPhoneAlt className="text-gray-400" /> {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Right: Socials */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 hidden lg:inline-block">Follow Us:</span>
                        <div className="flex gap-3">
                            {headerData.socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-white transition-all duration-300 hover:bg-rose-600 hover:-translate-y-0.5`}
                                >
                                    {getIcon(social.icon)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Main Navigation ================= */}
            <nav
                className={`sticky top-0 z-50 w-full ${colors.navbar.bg} border-b ${colors.navbar.border} shadow-2xl shadow-gray-100 border border-gray-200/50 transition-all`}
            >
                <div className={`${layout.container} h-20 flex justify-between items-center`}>
                    {/* Logo */}
                    <Link href="/" className="group flex items-center gap-2">
                        <div className="bg-gray-900 text-white p-2.5 rounded-xl shadow-lg group-hover:bg-gray-700 transition-colors duration-300">
                            <span className="text-2xl">✈️</span>
                        </div>
                        <div>
                            <h1
                                className={`text-xl font-extrabold ${colors.navbar.text} leading-none tracking-tight`}
                            >
                                Bismillah
                            </h1>
                            <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">
                                Travels & Tours
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu (Hidden on Mobile) */}
                    <ul className="hidden lg:flex items-center gap-8 text-sm font-bold">
                        {headerData.navLinks.map((link, idx) => (
                            <li key={idx} className="relative group h-20 flex items-center">
                                <Link
                                    href={link.href}
                                    className={`${colors.navbar.text}   
                                     ${
                                         link.href === '/'
                                             ? pathName === '/'
                                                 ? 'text-rose-400'
                                                 : ''
                                             : pathName.startsWith(link.href)
                                             ? 'text-rose-400'
                                             : ''
                                     }
hover:text-rose-600 transition-colors flex items-center gap-1 uppercase tracking-wide`}
                                >
                                    {link.label}
                                    {link.subMenu && (
                                        <IoMdArrowDropdown className="text-xl transition-transform group-hover:rotate-180 duration-300" />
                                    )}
                                </Link>

                                {link.subMenu && (
                                    <div className="absolute top-[80%] left-0 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-full transition-all duration-300 ease-in-out">
                                        <ul className="bg-white shadow-xl rounded-b-xl border-t-4 border-rose-600 py-2 overflow-hidden">
                                            {link.subMenu.map((sub, sIdx) => (
                                                <li key={sIdx}>
                                                    <Link
                                                        href={sub.href}
                                                        className="block px-6 py-3 text-gray-600 hover:text-rose-600 hover:bg-gray-50 transition-colors font-medium border-b border-gray-100 last:border-0"
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-3">
                            <Button variant="ghost" className={`${button.ghost} font-bold`}>
                                <Link href={'/login'}>Log In</Link>
                            </Button>
                            <Button className={`${button.primary} px-6`}>
                                <Link href={'/signup'}>Sign Up</Link>
                            </Button>
                        </div>

                        {/* ================= UPDATED MOBILE MENU ================= */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-200/70 shadow-2xl shadow-gray-100 text-gray-900 hover:bg-gray-50 h-10 w-10 rounded-xl"
                                    >
                                        <FaBars className="text-lg" />
                                    </Button>
                                </SheetTrigger>

                                <SheetContent
                                    side="right"
                                    className="bg-white w-[85vw] sm:w-[380px] p-0 flex flex-col h-full"
                                >
                                    {/* 1. Header with Branding */}
                                    <SheetHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                                        <SheetTitle className="text-left flex items-center gap-3">
                                            <div className="bg-gray-800 text-white p-2 rounded-lg shadow-gray-200 shadow-md">
                                                <span className="text-xl">✈️</span>
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-gray-900 text-lg leading-none">
                                                    Bismillah Travels
                                                </h2>
                                                <p className="text-xs text-gray-500 font-medium mt-1">
                                                    Explore the world with us
                                                </p>
                                            </div>
                                        </SheetTitle>
                                    </SheetHeader>

                                    {/* 2. Scrollable Menu Items */}
                                    <div className="flex-1 overflow-y-auto py-6 px-6">
                                        <div className="flex flex-col gap-1">
                                            {headerData.navLinks.map((link, idx) => (
                                                <MobileMenuItem
                                                    key={idx}
                                                    link={link}
                                                    subMenu={link.subMenu}
                                                />
                                            ))}
                                        </div>

                                        <br />
                                        {/* Auth Buttons */}
                                        <div className="flex flex-col gap-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-center shadow-2xl shadow-gray-100 border text-gray-700 border-gray-200/70 h-12 font-bold hover:bg-gray-50 hover:text-rose-600"
                                            >
                                                <Link href={'/login'}>Log In</Link>
                                            </Button>
                                            <Button
                                                className={`w-full ${button.primary} h-12 font-bold shadow-lg shadow-rose-500/20`}
                                            >
                                                <Link href={'/signup'}> Create Account</Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 3. Footer with Contact & Socials */}
                                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                                        <div className="flex flex-col gap-4">
                                            {/* Quick Contact */}
                                            <div className="space-y-2 text-sm text-gray-600 font-medium">
                                                <a
                                                    href={`tel:${headerData.contact.phones[0]}`}
                                                    className="flex items-center gap-3 hover:text-rose-600 transition"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-rose-500">
                                                        <FaPhoneAlt size={12} />
                                                    </div>
                                                    {headerData.contact.phones[0]}
                                                </a>
                                                <a
                                                    href={`mailto:${headerData.contact.email}`}
                                                    className="flex items-center gap-3 hover:text-rose-600 transition"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-rose-500">
                                                        <FaEnvelope size={12} />
                                                    </div>
                                                    {headerData.contact.email}
                                                </a>
                                            </div>

                                            {/* Social Icons */}
                                            <div className="flex gap-3 mt-2">
                                                {headerData.socialLinks.map((social, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={social.href}
                                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200/70 text-gray-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-2xl shadow-gray-100 "
                                                    >
                                                        <span className="text-xs">
                                                            {getIcon(social.icon)}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

// ================= Helper Component for Mobile Accordion =================
const MobileMenuItem = ({ link, subMenu }: { link: any; subMenu: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getLinkIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('home')) return <FaHome />;
        if (l.includes('flight')) return <FaPlaneDeparture />;
        if (l.includes('hotel')) return <FaHotel />;
        if (l.includes('hajj') || l.includes('umrah')) return <FaKaaba />;
        if (l.includes('about')) return <FaInfoCircle />;
        if (l.includes('contact')) return <FaHeadset />;
        return <IoMdArrowDropdown className="rotate-[-90deg]" />;
    };

    return (
        <div className="border-b border-gray-50 last:border-0">
            <div
                className={`flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isOpen ? 'bg-rose-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => subMenu && setIsOpen(!isOpen)}
            >
                <Link
                    href={link.href}
                    className="flex items-center gap-3 flex-1"
                    onClick={(e) => subMenu && e.preventDefault()}
                >
                    {/* Icon Box */}
                    <span
                        className={`text-lg w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isOpen ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        {getLinkIcon(link.label)}
                    </span>
                    <span
                        className={`text-base font-bold uppercase tracking-wide ${
                            isOpen ? 'text-rose-700' : 'text-gray-700'
                        }`}
                    >
                        {link.label}
                    </span>
                </Link>

                {subMenu && (
                    <FaChevronRight
                        className={`text-gray-400 text-xs transition-transform duration-300 ${
                            isOpen ? 'rotate-90 text-rose-600' : ''
                        }`}
                    />
                )}
            </div>

            {/* Mobile Submenu Expansion */}
            {subMenu && (
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-60 opacity-100 mb-2 mt-1' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="flex flex-col gap-1 pl-12 pr-2">
                        {subMenu.map((sub: any, idx: number) => (
                            <Link
                                key={idx}
                                href={sub.href}
                                className="text-gray-500 font-medium hover:text-rose-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                {sub.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
