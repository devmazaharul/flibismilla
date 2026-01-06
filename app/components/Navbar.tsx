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
    FaLinkedinIn,
    FaChevronRight,
} from 'react-icons/fa';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { IoMdArrowDropdown } from 'react-icons/io';

const Navbar = () => {
    const { colors, layout, button } = appTheme;

    const getIcon = (iconName: string) => {
        switch (iconName) {
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
                className={`sticky top-0 z-50 w-full ${colors.navbar.bg} ${colors.navbar.border} shadow-2xl shadow-gray-100 border-b border-b-gray-200/60 transition-all`}
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

                    {/* Desktop Menu */}
                    <ul className="hidden lg:flex items-center gap-8 text-sm font-bold">
                        {headerData.navLinks.map((link, idx) => {
                            return (
                                <li key={idx} className="relative group h-20 flex items-center">
                                    <Link
                                        href={link.href}
                                        className={`${colors.navbar.text} hover:text-rose-600 transition-colors flex items-center gap-1 uppercase tracking-wide`}
                                    >
                                        {link.label}
                                        {/* Dropdown Icon Logic */}
                                        {link.subMenu && (
                                            <IoMdArrowDropdown className="text-xl transition-transform group-hover:rotate-180 duration-300" />
                                        )}
                                    </Link>

                                    {/* Dropdown Menu */}
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

                        {/* Mobile Menu Trigger */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-300 text-gray-900 hover:bg-gray-100"
                                    >
                                        <FaBars className="text-lg" />
                                    </Button>
                                </SheetTrigger>

                                <SheetContent
                                    side="right"
                                    className="bg-white w-[85vw] sm:w-[380px] p-0 overflow-y-auto"
                                >
                                    <SheetHeader className="p-6 border-b bg-gray-50">
                                        <SheetTitle className="text-left flex items-center gap-2">
                                            <span className="text-2xl">✈️</span>
                                            <span className="font-bold text-gray-900">Menu</span>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="flex flex-col p-6">
                                        {headerData.navLinks.map((link, idx) => (
                                            <MobileMenuItem
                                                key={idx}
                                                link={link}
                                                subMenu={link.subMenu}
                                            />
                                        ))}

                                        <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-gray-100">
                                            <Button
                                                variant="secondary"
                                                className="w-full justify-center text-gray-700 border-gray-100 h-12"
                                            >
                                                Log In
                                            </Button>
                                            <Button className={`w-full ${button.primary} h-12`}>
                                                Create Account
                                            </Button>
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

const MobileMenuItem = ({ link, subMenu }: { link: any; subMenu: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-50 last:border-0">
            <div
                className="flex items-center justify-between py-4 cursor-pointer group"
                onClick={() => subMenu && setIsOpen(!isOpen)}
            >
                <Link
                    href={link.href}
                    className="text-lg font-bold text-gray-700 group-hover:text-rose-600 transition-colors uppercase"
                    onClick={(e) => subMenu && e.preventDefault()}
                >
                    {link.label}
                </Link>

                {subMenu && (
                    <FaChevronRight
                        className={`text-gray-400 text-sm transition-transform duration-300 ${
                            isOpen ? 'rotate-90 text-rose-600' : ''
                        }`}
                    />
                )}
            </div>

            {/* Mobile Submenu Expansion */}
            {subMenu && (
                <div
                    className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-60 opacity-100 mb-4' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="flex flex-col gap-2 pl-4 border-l-2 border-rose-100 ml-1">
                        {subMenu.map((sub: any, idx: number) => (
                            <Link
                                key={idx}
                                href={sub.href}
                                className="text-gray-500 font-medium hover:text-rose-600 py-2 block text-sm"
                            >
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
