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
    FaCamera,
} from 'react-icons/fa';

const PackageDetails = () => {
    const {  layout, button } = appTheme;
    const params = useParams(); 
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    const slug = typeof params?.slug === 'string' ? params.slug : '';

    const pkg = packages.find((p) => p.slug === slug);

    useEffect(() => {
        if (params?.slug) {
            setIsLoading(false);
        }
    }, [params]);

    const handleBook = () => {
      //only message whatsapp with package info
      toast.success("please contact via whatsapp to book the package");
    }

    if (!isLoading && !pkg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Package Not Found 😕</h2>
                <p className="text-gray-500">The package you are looking for does not exist.</p>
                <Button onClick={() => router.push('/packages')} className={button.primary}>
                    Browse All Packages
                </Button>
            </div>
        );
    }

  
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    if (isLoading)
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <main className="bg-white min-h-screen pb-20">
            {/* ================= 1. Top Navigation (Sticky) ================= */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
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

            {/* ================= 2. Hero Section ================= */}
            <div className={`${layout.container} mt-6`}>
                {/* Header Info */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {pkg?.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                            <FaStar className="text-yellow-400 text-sm" /> 4.9 (120 Reviews)
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
                        {pkg?.title}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <FaMapMarkerAlt className="text-rose-600" />
                        <span className="underline decoration-dotted">{pkg?.location}</span>
                    </div>
                </div>

                {/* Gallery Grid (Mosaics Style) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[300px] md:h-[450px] rounded-3xl overflow-hidden relative">
                    {/* Main Image */}
                    <div className="md:col-span-4 relative h-full w-full group cursor-pointer">
                        <Image
                            src={pkg?.image || ''}
                            alt={pkg?.title || 'Package Image'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* ================= 3. Content Grid ================= */}
            <div className={`${layout.container} mt-10`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                    {/* LEFT CONTENT (66%) */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Highlights Bar */}
                        <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <FaRegClock />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Duration
                                    </p>
                                    <p className="font-bold text-gray-800">Flexible</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                    <FaUserFriends />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Group Size
                                    </p>
                                    <p className="font-bold text-gray-800">Unlimited</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                    <FaPassport />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Visa
                                    </p>
                                    <p className="font-bold text-gray-800">Included</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                About this package
                            </h3>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {pkg?.description}
                            </p>

                            {/* Feature Icons */}
                            <div className="flex gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 border border-gray-100">
                                    <FaPlane className="text-rose-500" /> Flights
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 border border-gray-100">
                                    <FaHotel className="text-rose-500" /> Hotels
                                </div>
                            </div>
                        </div>

                        {/* What's Included */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-200/70 shadow-2xl shadow-gray-100 ">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                What's included
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pkg?.included?.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0 text-lg shadow-sm rounded-full" />
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </div>
                                ))}
                                {/* Default item */}
                                <div className="flex items-start gap-3">
                                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0 text-lg shadow-sm rounded-full" />
                                    <span className="text-gray-700 font-medium">
                                        24/7 Expert Support
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (33%) - STICKY */}
                    <div className="lg:col-span-1">
                        <div className=" top-24 bg-white p-6 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/70 ">
                            {/* Price Header */}
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <p className="text-gray-500 text-xs font-bold uppercase mb-1">
                                        Starting from
                                    </p>
                                    <h2 className="text-4xl font-extrabold text-rose-600">
                                        {pkg?.price}
                                    </h2>
                                </div>
                                <span className="text-gray-400 font-medium mb-1">/ person</span>
                            </div>

                            {/* Booking Info Box */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Destination</span>
                                    <span className="font-bold text-gray-800 text-right">
                                        {pkg?.location}
                                    </span>
                                </div>
                                <div className="w-full h-[1px] bg-gray-200"></div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Category</span>
                                    <span className="font-bold text-gray-800">{pkg?.category}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Button
                                onClick={handleBook}
                                    className={`w-full h-14 text-lg font-bold ${button.primary} shadow-xl shadow-rose-500/20 active:scale-95 transition-all`}
                                >
                                    Request Booking
                                </Button>

                                <a
                                    href={`${
                                        websiteDetails.whatappsLink
                                    }&text=Hello,%20I%20am%20interested%20in%20the%20${encodeURIComponent(
                                        pkg?.title || '',
                                    )}%20package. ${window.location.href}`}
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

                            {/* Info Text */}
                            <p className="text-xs text-center text-gray-400 mt-4 px-4">
                                You won't be charged yet. We will contact you to confirm dates.
                            </p>
                        </div>

                        {/* Contact Widget */}
                        <div className="mt-6 bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-200/70 text-center shadow-2xl shadow-gray-100 ">
                            <h4 className="font-bold text-gray-900 mb-1">Need Help?</h4>
                            <p className="text-xs text-gray-500 mb-3">
                                Call our travel experts 24/7
                            </p>
                            <a
                                href="tel:+12139858499"
                                className="text-rose-600 font-bold text-lg hover:underline flex items-center justify-center gap-2"
                            >
                                {websiteDetails.phone}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PackageDetails;
