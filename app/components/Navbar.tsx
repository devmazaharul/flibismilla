'use client';
import Link from 'next/link';
import { headerData } from '@/constant/data';

import {
    FaPhoneAlt,
    FaEnvelope,
    FaBars,
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
} from 'react-icons/fa';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { appTheme } from '@/constant/theme/global';

const Navbar = () => {
    const { colors, layout, button } = appTheme;

    // সোশ্যাল আইকন ম্যাপ করার জন্য হেল্পার (ডাটা ফাইল থেকে স্ট্রিং আসলে সেটা আইকনে কনভার্ট করবে)
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
            {/* ================= 1. Top Bar (Dark) ================= */}
            <div
                className={`${colors.topBar.bg} ${colors.topBar.text} text-xs py-2.5 hidden md:block border-b border-gray-800`}
            >
                <div className={`${layout.container} flex justify-between items-center`}>
                    {/* Left Side: Contact */}
                    <div className="flex gap-6 font-medium">
                        <a
                            href={`mailto:${headerData.contact.email}`}
                            className="flex items-center gap-2 hover:text-white/80 transition"
                        >
                            <FaEnvelope className="text-gray-400" /> {headerData.contact.email}
                        </a>
                        <a
                            href={`tel:${headerData.contact.phones[0]}`}
                            className="flex items-center gap-2 hover:text-white/80 transition"
                        >
                            {headerData.contact.phones.map((item,i)=>(
                              <div key={i} className='flex items-center gap-1'>
                               <FaPhoneAlt  className="text-gray-400" />  {item}
                              </div>
                              
                            ))}
                        </a>
                    </div>

                    {/* Right Side: Social Icons (Explicitly Visible) */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 hidden lg:inline-block">Follow Us:</span>
                        <div className="flex gap-3">
                            {headerData.socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-white transition-all duration-300 ${colors.topBar.iconHover}`}
                                >
                                    {getIcon(social.icon)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Main Navigation (Sticky) ================= */}
            <nav
                className={`sticky top-0 z-50 w-full ${colors.navbar.bg} border-b ${colors.navbar.border} shadow-sm transition-all`}
            >
                <div className={`${layout.container} h-20 flex justify-between items-center`}>
                    {/* Logo Section */}
                    <Link href="/" className="group flex items-center gap-2">
                        <div className="bg-gray-900 text-white p-2 rounded-lg group-hover:bg-rose-600 transition-colors">
                            <span className="text-2xl">✈️</span>
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold ${colors.navbar.text} leading-none`}>
                                Bismillah
                            </h1>
                            <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">
                                Travels & Tours
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu Links */}
                    <ul className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                        {headerData.navLinks.map((link, idx) => (
                            <li key={idx}>
                                <Link
                                    href={link.href}
                                    className={`${colors.navbar.text} hover:text-rose-600 transition-colors relative py-2 group`}
                                >
                                    {link.label}
                                    {/* Hover Underline Effect */}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-rose-600 transition-all group-hover:w-full"></span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* Desktop Buttons */}
                        <div className="hidden lg:flex items-center gap-3">
                            <Button variant="ghost" className={button.ghost}>
                                Log In
                            </Button>
                            <Button className={button.primary}>Sign Up</Button>
                        </div>

                        {/* Mobile Menu Toggle (Hamburger) */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    {/* বাটনটি এখন কালো রঙের হবে যাতে সাদা ব্যাকগ্রাউন্ডে দেখা যায় */}
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
                                    className="bg-white w-[85vw] sm:w-[380px] p-6"
                                >
                                    <SheetHeader className="border-b pb-4 mb-4">
                                        <SheetTitle className="text-left flex items-center gap-2">
                                            <span className="text-2xl">✈️</span>
                                            <span className="font-bold text-gray-900">Menu</span>
                                        </SheetTitle>
                                    </SheetHeader>

                                    {/* Mobile Links */}
                                    <div className="flex flex-col gap-2">
                                        {headerData.navLinks.map((link, idx) => (
                                            <Link
                                                key={idx}
                                                href={link.href}
                                                className="text-lg font-medium text-gray-600 py-3 border-b border-gray-50 hover:text-rose-600 hover:pl-2 transition-all"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Mobile Buttons */}
                                    <div className="mt-8 flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-gray-700 border-gray-300"
                                        >
                                            Log In
                                        </Button>
                                        <Button className={`w-full ${button.primary}`}>
                                            Create Account
                                        </Button>
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

export default Navbar;
