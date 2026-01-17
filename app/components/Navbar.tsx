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
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const Navbar = () => {
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const { colors, layout, button } = appTheme;

    const isActive = (href: string) => {
        // 1. Root Home Check
        if (href === '/') return pathName === '/';

        // 2. Handle Query Params (e.g., /packages?type=umrah)
        if (href.includes('?')) {
            const [basePath, queryString] = href.split('?');
            const linkParams = new URLSearchParams(queryString);
            const currentParams = new URLSearchParams(searchParams?.toString() || '');

            // Path must match
            if (pathName !== basePath) return false;

            // All params in the link must match current URL params
            for (const [key, value] of Array.from(linkParams.entries())) {
                if (currentParams.get(key) !== value) return false;
            }
            return true;
        }

        // 3. Standard Path Check (e.g., /about, /contact)
        // Ensure accurate sub-path matching
        return pathName === href || (pathName.startsWith(href) && href !== '/');
    };

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
                className={`sticky top-0 z-50 w-full ${colors.navbar.bg} border-none ${colors.navbar.border}  border border-gray-200/50 transition-all`}
            >
                <div className={`${layout.container} h-20 flex justify-between items-center`}>
                    {/* Logo */}
                    <Link href="/" className="group flex items-center gap-2">
                        <Image height={200} width={200} alt="logo" src={'/logo1.jpeg'} />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="hidden lg:flex items-center gap-8 text-sm font-bold">
                        {headerData.navLinks.map((link, idx) => {
                            const active = isActive(link.href);

                            return (
                                <li key={idx} className="relative group h-20 flex items-center">
                                    <Link
                                        href={link.href}
                                        className={`${colors.navbar.text} 
                                        ${active ? `${appTheme.colors.brand.accent}` : ''}
                                        transition-colors flex items-center gap-1 ${
                                            appTheme.colors.navbar.hoverText
                                        } uppercase tracking-wide`}
                                    >
                                        {link.label}
                                        {link.subMenu && (
                                            <IoMdArrowDropdown className="text-xl transition-transform group-hover:rotate-180 duration-300" />
                                        )}
                                    </Link>                                
                                    {link.subMenu && (
                                        <div className="absolute top-[80%] left-0 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-full transition-all duration-300 ease-in-out">
                                            <ul className="bg-white shadow-xl rounded-b-xl border-t-4 border-rose-600 py-2 overflow-hidden">
                                                {link.subMenu.map((sub, sIdx) => {
                                                    const subActive = isActive(sub.href);
                                                    return (
                                                        <li key={sIdx}>
                                                            <Link
                                                                href={sub.href}
                                                                className={`block px-6 py-3 transition-colors font-medium border-b border-gray-100 last:border-0
                                                                ${
                                                                    subActive
                                                                        ? 'text-rose-600 bg-rose-50'
                                                                        : 'text-gray-600 hover:text-rose-600 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {sub.label}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
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

                        {/* Mobile Menu */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shadow-2xl shadow-gray-100 text-gray-900 hover:bg-gray-50 h-10 w-10 rounded-xl"
                                    >
                                        <FaBars className="text-lg" />
                                    </Button>
                                </SheetTrigger>

                                <SheetContent
                                    side="right"
                                    className="bg-white w-[85vw] sm:w-[380px] p-0 flex flex-col h-full"
                                >
                                    <SheetHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                                        <SheetTitle className="text-left flex items-center gap-3">
                                            <Image
                                                height={200}
                                                width={200}
                                                alt="logo"
                                                src={'/logo1.jpeg'}
                                            />
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="flex-1 overflow-y-auto py-6 px-6">
                                        <div className="flex flex-col gap-1">
                                            {headerData.navLinks.map((link, idx) => (
                                                <MobileMenuItem
                                                    key={idx}
                                                    link={link}
                                                    subMenu={link.subMenu}
                                                    isActiveFunc={isActive} // Pass function down
                                                />
                                            ))}
                                        </div>
                                        <br />
                                        {/* Auth Buttons Mobile */}
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

                                    {/* Mobile Footer */}
                                    <div className="p-6 bg-gray-50 border-t border-gray-100">
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

const MobileMenuItem = ({
    link,
    subMenu,
    isActiveFunc,
}: {
    link: any;
    subMenu: any;
    isActiveFunc: (href: string) => boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const active = isActiveFunc(link.href);

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
                            active || isOpen
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        {getLinkIcon(link.label)}
                    </span>
                    <span
                        className={`text-base font-bold uppercase tracking-wide ${
                            active || isOpen ? 'text-rose-700' : 'text-gray-700'
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
                        {subMenu.map((sub: any, idx: number) => {
                            const subActive = isActiveFunc(sub.href);
                            return (
                                <Link
                                    key={idx}
                                    href={sub.href}
                                    className={`font-medium px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2
                                    ${
                                        subActive
                                            ? 'text-rose-600 bg-rose-50'
                                            : 'text-gray-500 hover:text-rose-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            subActive ? 'bg-rose-600' : 'bg-gray-300'
                                        }`}
                                    ></span>
                                    {sub.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
