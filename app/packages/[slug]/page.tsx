'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { packages, websiteDetails } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    FaMapMarkerAlt,
    FaArrowLeft,
    FaShareAlt,
    FaStar,
    FaCheckCircle,
    FaRegClock,
    FaUserFriends,
    FaPassport,
    FaWhatsapp,
    FaPlane,
    FaHotel,
    FaTimes,
    FaCalendarAlt,
    FaUser,
    FaEnvelope,
    FaPhone,
} from 'react-icons/fa';

const PackageDetails = () => {
    const { layout, button } = appTheme;
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        travelDate: '',
        returnDate: '',
        adults: 1,
        children: 0,
        message: ''
    });

    const slug = typeof params?.slug === 'string' ? params.slug : '';
    const pkg = packages.find((p) => p.slug === slug);

    useEffect(() => {
        if (params?.slug) {
            setIsLoading(false);
        }
    }, [params]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'adults') {
            const val = parseInt(value);
            if (val > 10) {
                toast.error("Maximum 10 adults allowed");
                finalValue = '10';
            } else if (val < 1) {
                finalValue = '1';
            }
        }

        if (name === 'children') {
            const val = parseInt(value);
            if (val > 8) {
                toast.error("Maximum 8 children allowed");
                finalValue = '8';
            } else if (val < 0) {
                finalValue = '0';
            }
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

  // 🟢 Updated handleSubmit to call API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const bookingPayload = {
            packageTitle: pkg?.title,
            packagePrice: pkg?.price,
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            travelDate: formData.travelDate,
            returnDate: formData.returnDate,
            guests: {
                adults: formData.adults,
                children: formData.children
            },
            notes: formData.message,
        };

        try {
            // 🟢 Call the API Route
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingPayload),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Booking Request Sent Successfully! ✅");
                setIsModalOpen(false);
                // Reset form (Optional)
                setFormData({
                    name: '', email: '', phone: '', travelDate: '', returnDate: '',
                    adults: 1, children: 0, message: ''
                });
            } else {
                toast.error("Failed to send request. Try again.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    if (!isLoading && !pkg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Package Not Found 😕</h2>
                <Button onClick={() => router.push('/packages')} className={button.primary}>
                    Browse All Packages
                </Button>
            </div>
        );
    }

    if (isLoading)
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <main className="bg-white min-h-screen pb-20 relative">
            
            {/* ================= 1. Top Navigation ================= */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
                <div className={`${layout.container} py-4 flex justify-between items-center`}>
                    <Link
                        href="/packages"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 font-bold transition-colors"
                    >
                        <FaArrowLeft /> <span className="hidden sm:inline">Back to Packages</span>
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-full transition"
                        >
                            <FaShareAlt /> Share
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= 2. 🟢 NEW Hero Section (Cinematic Banner Style) ================= */}
            <div className={`${layout.container} mt-6`}>
                <div className="relative w-full h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl group">
                    {/* Image */}
                    <Image
                        src={pkg?.image || ''}
                        alt={pkg?.title || 'Package Image'}
                        fill
                        quality={100} // High Quality
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        priority
                    />
                    
                    {/* Gradient Overlay (Makes text readable & Image look clear) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {/* Content Over Image */}
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
                        <div className="flex flex-wrap items-center gap-3 mb-3 animate-in slide-in-from-bottom-4 duration-700">
                            <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                {pkg?.category}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <FaStar className="text-yellow-400 text-sm" /> 4.9 (120 Reviews)
                            </div>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 leading-tight drop-shadow-xl animate-in slide-in-from-bottom-4 duration-700 delay-100">
                            {pkg?.title}
                        </h1>
                        
                        <div className="flex items-center gap-2 text-gray-200 font-medium text-lg animate-in slide-in-from-bottom-4 duration-700 delay-200">
                            <FaMapMarkerAlt className="text-rose-500" />
                            <span>{pkg?.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 3. Content Grid ================= */}
            <div className={`${layout.container} mt-10`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Highlights */}
                        <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 text-xl">
                                    <FaRegClock />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Duration</p>
                                    <p className="font-bold text-gray-800 text-sm">Flexible Days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 text-xl">
                                    <FaUserFriends />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Group Size</p>
                                    <p className="font-bold text-gray-800 text-sm">Unlimited</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 text-xl">
                                    <FaPassport />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Visa</p>
                                    <p className="font-bold text-gray-800 text-sm">Included</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">About this package</h3>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {pkg?.description}
                            </p>
                            <div className="flex gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 border border-gray-100">
                                    <FaPlane className="text-rose-500" /> Flights
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 border border-gray-100">
                                    <FaHotel className="text-rose-500" /> Hotels
                                </div>
                            </div>
                        </div>

                        {/* Included */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-200/70 shadow-2xl shadow-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">What's included</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pkg?.included?.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0 text-lg shadow-sm rounded-full" />
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </div>
                                ))}
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0 text-lg shadow-sm rounded-full" />
                                    <span className="text-gray-700 font-medium">24/7 Expert Support</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white p-6 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/70">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">Starting from</p>
                                    <h2 className="text-4xl font-extrabold text-rose-600">{pkg?.price}</h2>
                                </div>
                                <span className="text-gray-400 font-medium mb-1">/ person</span>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Destination</span>
                                    <span className="font-bold text-gray-800 text-right">{pkg?.location}</span>
                                </div>
                                <div className="w-full h-[1px] bg-gray-200"></div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Category</span>
                                    <span className="font-bold text-gray-800">{pkg?.category}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className={`w-full h-14 text-lg font-bold ${button.primary} shadow-xl shadow-rose-500/20 active:scale-95 transition-all`}
                                >
                                    Request Booking
                                </Button>

                                <a
                                    href={`${websiteDetails.whatappsLink}&text=Hello,%20I%20am%20interested%20in%20the%20${encodeURIComponent(pkg?.title || '')}%20package.`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full shadow-2xl shadow-gray-100 h-14 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 font-bold active:scale-95 transition-all"
                                    >
                                        <FaWhatsapp className="mr-2 text-xl" /> Chat on WhatsApp
                                    </Button>
                                </a>
                            </div>

                            <p className="text-xs text-center text-gray-400 mt-4 px-4">
                                You won't be charged yet. We will contact you to confirm dates.
                            </p>
                        </div>

                        <div className="mt-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-200/70 text-center shadow-2xl shadow-gray-100">
                            <h4 className="font-bold text-gray-900 mb-1">Need Help?</h4>
                            <p className="text-xs text-gray-500 mb-3">Call our travel experts 24/7</p>
                            <a
                                href={`tel:${websiteDetails.phone}`}
                                className="text-rose-600 font-bold text-lg hover:underline flex items-center justify-center gap-2"
                            >
                                {websiteDetails.phone}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 4. Booking Popup Modal ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900">Book Your Trip</h3>
                                <p className="text-xs text-gray-500">{pkg?.title}</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            
                            <div className="grid grid-cols-1 gap-4">
                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                        <FaUser className="text-rose-500" /> Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all"
                                    />
                                </div>

                                {/* Phone & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            <FaPhone className="text-rose-500" /> Phone Number
                                        </label>
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="012XXX..."
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            <FaEnvelope className="text-rose-500" /> Email
                                        </label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="you@example.com"
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            <FaCalendarAlt className="text-rose-500" /> Travel Date
                                        </label>
                                        <input 
                                            type="date" 
                                            name="travelDate"
                                            required
                                            value={formData.travelDate}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                            <FaCalendarAlt className="text-gray-400" /> Return Date <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            name="returnDate"
                                            value={formData.returnDate}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all text-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* 🟢 Guests (With Limits) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Adults (Max 10)</label>
                                        <input 
                                            type="number" 
                                            name="adults"
                                            min="1"
                                            max="10"
                                            value={formData.adults}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 outline-none text-sm font-bold text-center"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Children (Max 8)</label>
                                        <input 
                                            type="number" 
                                            name="children"
                                            min="0"
                                            max="8"
                                            value={formData.children}
                                            onChange={handleInputChange}
                                            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 outline-none text-sm font-bold text-center"
                                        />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Additional Message</label>
                                    <textarea 
                                        name="message"
                                        rows={3}
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Any specific requirements?"
                                        className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm font-medium transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`w-full h-14 text-lg font-bold ${button.primary} shadow-lg shadow-rose-500/20 active:scale-95 transition-all mt-2`}
                            >
                                {isSubmitting ? 'Sending Request...' : 'Confirm Booking Request'}
                            </Button>
                            
                            <p className="text-[10px] text-center text-gray-400">
                                By clicking Confirm, you agree to share your contact details with us.
                            </p>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
};

export default PackageDetails;