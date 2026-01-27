'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // Added useEffect
import { headerData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation'; // Added useRouter

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

// New Icons for Auth
import { Loader2, LogOut, User, LayoutDashboard } from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { IoMdArrowDropdown } from 'react-icons/io';

const Navbar = () => {
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter(); // For redirecting after logout
    const { colors, layout } = appTheme;

    // 🟢 AUTH STATE MANAGEMENT
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check session on mount
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                setUser(data.user);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/access');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // Active Link Logic
    const isActive = (href: string) => {
        if (href === '/') return pathName === '/';
        if (href.includes('?')) {
            const [basePath, queryString] = href.split('?');
            const linkParams = new URLSearchParams(queryString);
            const currentParams = new URLSearchParams(searchParams?.toString() || '');
            if (pathName !== basePath) return false;
            for (const [key, value] of Array.from(linkParams.entries())) {
                if (currentParams.get(key) !== value) return false;
            }
            return true;
        }
        return pathName === href || (pathName.startsWith(href) && href !== '/');
    };

    // Social Icons Helper
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'whatsapp': return <FaWhatsapp />;
            case 'facebook': return <FaFacebookF />;
            case 'twitter': return <FaTwitter />;
            case 'instagram': return <FaInstagram />;
            case 'youtube': return <FaYoutube />;
            default: return <FaPinterest />;
        }
    };

    return (
        <header className="w-full relative bg-white">
            
            {/* ================= 1. Top Bar (Desktop Only) ================= */}
            <div className={`${colors.topBar.bg} ${colors.topBar.text} text-[10px] sm:text-xs py-2 hidden md:block border-b border-white/10`}>
                <div className={`${layout.container} flex justify-between items-center`}>
                    {/* Contact Info */}
                    <div className="flex gap-4 lg:gap-6 font-medium">
                        <a href={`mailto:${headerData.contact.email}`} className="flex items-center gap-2 hover:text-rose-400 transition">
                            <FaEnvelope className="text-gray-400" /> {headerData.contact.email}
                        </a>
                        {headerData.contact.phones.map((item, i) => (
                            <a key={i} href={`tel:${item}`} className="flex items-center gap-1 hover:text-rose-400 transition">
                                <FaPhoneAlt className="text-gray-400" /> {item}
                            </a>
                        ))}
                    </div>
                    {/* Social Icons */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 hidden lg:inline-block">Follow Us:</span>
                        <div className="flex gap-3">
                            {headerData.socialLinks.map((social, idx) => (
                                <a key={idx} href={social.href} target="_blank" className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-rose-600 hover:-translate-y-0.5">
                                    {getIcon(social.icon)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Main Navigation ================= */}
            <nav className="w-full bg-white border-b border-gray-100 py-2 md:py-0">
                <div className={`${layout.container} flex justify-between items-center h-14 md:h-20 lg:h-22`}>
                    
                    {/* Logo */}
                    <Link href="/" className="relative flex items-center h-10 w-32 md:h-12 md:w-44 lg:h-14 lg:w-52 overflow-hidden">
                        <Image 
                            src={'/logo.jpg'} 
                            alt="logo" 
                            fill 
                            className="object-contain object-left" 
                            priority 
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] xl:text-sm font-bold h-full">
                        {headerData.navLinks.map((link, idx) => {
                            const active = isActive(link.href);
                            return (
                                <li key={idx} className="relative group h-full flex items-center">
                                    <Link
                                        href={link.href}
                                        className={`${active ? 'text-rose-600' : 'text-gray-700'} hover:text-rose-600 transition-colors flex items-center gap-1 uppercase tracking-wide`}
                                    >
                                        {link.label}
                                        {link.subMenu && <IoMdArrowDropdown className="text-xl transition-transform group-hover:rotate-180 duration-300" />}
                                    </Link>                                 
                                    {/* Desktop Dropdown */}
                                    {link.subMenu && (
                                        <div className="absolute top-[90%] left-0 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:top-full transition-all duration-300 ease-in-out pt-2 z-50">
                                            <ul className="bg-white shadow-2xl rounded-b-xl border-t-4 border-rose-600 py-2">
                                                {link.subMenu.map((sub, sIdx) => (
                                                    <li key={sIdx}>
                                                        <Link
                                                            href={sub.href}
                                                            className={`block px-6 py-3 transition-colors font-medium border-b border-gray-50 last:border-0 ${isActive(sub.href) ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:text-rose-600 hover:bg-gray-50'}`}
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
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden sm:flex items-center gap-2 md:gap-3">
                            
                            {/* 🟢 CONDITIONAL AUTH BUTTONS (Desktop) */}
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            ) : user ? (
                                <div className="flex items-center gap-3">
                                    <Link href="/admin">
                                        <Button variant="ghost" className="font-bold cursor-pointer text-gray-700 hover:text-rose-600 hover:bg-rose-50 gap-2">
                                            <User className="w-4 h-4" />
                                            <span className="max-w-[100px] truncate">{user.name}</span>
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleLogout}
                                        className="h-9 w-9 p-0 rounded-full cursor-pointer border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="link" asChild className="font-bold text-gray-700 hover:text-rose-600 hidden md:inline-flex">
                                    <Link href={'/access'}>Log In</Link>
                                </Button>
                            )}

                        </div>

                        {/* Mobile Toggle Button */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-200 hover:bg-gray-50">
                                        <FaBars className="text-lg text-gray-700" />
                                    </Button>
                                </SheetTrigger>
                                
                                <SheetContent side="right" className="bg-white w-[85vw] sm:w-[380px] p-0 flex flex-col h-full border-l-0 z-[110]">
                                    <SheetHeader className="p-5 border-b border-gray-50 bg-white sticky top-0 z-10">
                                        <SheetTitle className="text-left">
                                            <div className="relative h-10 w-32 overflow-hidden">
                                                <Image 
                                                    src={'/logo.jpg'} 
                                                    alt="logo" 
                                                    fill 
                                                    className="object-contain object-left" 
                                                />
                                            </div>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                                        <div className="space-y-1">
                                            {headerData.navLinks.map((link, idx) => (
                                                <MobileMenuItem key={idx} link={link} subMenu={link.subMenu} isActiveFunc={isActive} />
                                            ))}
                                        </div>
                                        
                                        <div className="mt-8 space-y-3 px-2">
                                            {/* 🟢 CONDITIONAL AUTH BUTTONS (Mobile) */}
                                            {loading ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                </div>
                                            ) : user ? (
                                                <>
                                                    <div className="p-4 bg-gray-50 rounded-xl mb-4 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 font-medium uppercase">Logged in as</p>
                                                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                                        </div>
                                                    </div>

                                                    <Button asChild className="w-full bg-slate-900 hover:bg-black h-12 font-bold">
                                                        <Link href={'/admin/dashboard'} className="flex items-center gap-2">
                                                            <LayoutDashboard className="w-4 h-4" />
                                                            Go to Dashboard
                                                        </Link>
                                                    </Button>

                                                    <Button 
                                                        onClick={handleLogout}
                                                        variant="outline" 
                                                        className="w-full h-12 font-bold text-rose-600 border-rose-100 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Log Out
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="outline" asChild className="w-full h-12 font-bold text-gray-700 border-gray-200">
                                                        <Link href={'/access'}>Log In</Link>
                                                    </Button>
                                                    <Button asChild className="w-full bg-rose-600 hover:bg-rose-700 h-12 font-bold shadow-lg shadow-rose-500/20">
                                                        <Link href={'/signup'}>Create Account</Link>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                                        <div className="space-y-3">
                                            <a href={`tel:${headerData.contact.phones[0]}`} className="flex items-center gap-3 text-gray-700 font-semibold group">
                                                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                    <FaPhoneAlt size={14} />
                                                </div>
                                                <span className="text-sm">{headerData.contact.phones[0]}</span>
                                            </a>
                                            <a href={`mailto:${headerData.contact.email}`} className="flex items-center gap-3 text-gray-700 font-semibold group">
                                                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                    <FaEnvelope size={14} />
                                                </div>
                                                <span className="text-sm truncate">{headerData.contact.email}</span>
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

// ================= Mobile Helper Component (Unchanged) =================

const MobileMenuItem = ({ link, subMenu, isActiveFunc }: any) => {
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
        return <FaChevronRight className="text-[10px]" />;
    };

    return (
        <div className="w-full">
            <div className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 ${isOpen || active ? 'bg-rose-50/50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${active || isOpen ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white border border-gray-100 text-gray-400'}`}>
                        {getLinkIcon(link.label)}
                    </div>
                    <Link 
                        href={link.href} 
                        className={`text-[15px] font-bold tracking-wide flex-1 ${active || isOpen ? 'text-gray-900' : 'text-gray-600'}`}
                        onClick={(e) => { if(subMenu) { e.preventDefault(); setIsOpen(!isOpen); } }}
                    >
                        {link.label}
                    </Link>
                </div>
                {subMenu && (
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                        <IoMdArrowDropdown className={`text-2xl text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-600' : ''}`} />
                    </button>
                )}
            </div>

            {subMenu && (
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-11 flex flex-col gap-1 border-l-2 border-rose-100">
                        {subMenu.map((sub: any, idx: number) => (
                            <Link
                                key={idx}
                                href={sub.href}
                                className={`block py-2.5 px-4 text-[14px] font-medium transition-colors ${isActiveFunc(sub.href) ? 'text-rose-600 font-bold' : 'text-gray-500 hover:text-rose-600'}`}
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