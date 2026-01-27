'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { 
    FaMapMarkerAlt, 
    FaStar, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaLanguage, 
    FaCamera,
    FaArrowLeft,
    FaSuitcaseRolling,
    FaSadTear,
    FaSpinner
} from 'react-icons/fa';
import Image from 'next/image';
import PackageCard from '../../components/PackageCard';

// Define Types
interface DestinationType {
    _id: string;
    name: string;
    country: string;
    rating: number;
    reviews: number;
    bestTime: string;
    currency: string;
    language: string;
    description: string;
    attractions: string[];
    gallery: string[];
}

interface PackageType {
    _id: number;
    slug: string;
    title: string;
    location: string;
    price: string;
    image: string;
    category: string;
    description: string;
    included?: string[];
}

const DestinationDetails = () => {
    const { layout } = appTheme;
    const params = useParams();
    const router = useRouter();
    
    // ID from URL
    const id = typeof params?.slug === 'string' ? params.slug : '';

    // State
    const [dest, setDest] = useState<DestinationType | null>(null);
    const [relatedPackages, setRelatedPackages] = useState<PackageType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                
                // 1. Fetch Destination Details
                const destResponse = await axios.get(`/api/dashboard/destinations/${id}`);
                const destinationData = destResponse.data.data || destResponse.data;
                setDest(destinationData);

                // 2. Fetch All Packages (to filter related ones)
                // Note: In a real app, it's better to have an API like /api/packages?destinationId=XYZ
                const pkgResponse = await axios.get('/api/dashboard/packages');
                const allPackages = pkgResponse.data.data  || [];

                if (destinationData) {
                    const filtered = allPackages.filter((pkg: PackageType) => 
                        (pkg.location && pkg.location.toLowerCase().includes(destinationData.country.toLowerCase())) || 
                        (pkg.location && pkg.location.toLowerCase().includes(destinationData.name.split(',')[0].toLowerCase()))
                    );
                    setRelatedPackages(filtered);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load destination details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);


    const handleClick = () => {
        router.push("/contact");
    };

    // Loading State
    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
            <FaSpinner className="animate-spin text-4xl text-rose-600" />
        </div>
    );

    // Error / Not Found State
    if (!dest && !isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] gap-4">
            <FaSadTear className="text-6xl text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800">Destination Not Found</h2>
            <Button onClick={() => router.push('/destinations')} variant="outline">
                Back to Destinations
            </Button>
        </div>
    );

    if (!dest) return null; // Safety check

    return (
        <main className="bg-[#F8F9FB] min-h-screen pb-20">
            
            {/* ================= 1. Header ================= */}
            <div className="bg-white border-b border-gray-200/60 pt-28 pb-12 shadow-2xl shadow-gray-100">
                <div className={`${layout.container}`}>
                    {/* Breadcrumb & Back */}
                    <div className="mb-8">
                        <Link href="/destinations" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 font-bold text-sm transition-all group">
                            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                            Explore Destinations
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-rose-100 shadow-sm">
                                    {dest.country}
                                </span>
                                <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-100">
                                    <FaStar /> {dest.rating || 'N/A'}
                                    <span className="text-yellow-600/60 font-medium">({dest.reviews || 0} Reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                                Explore <span className="text-rose-600">{dest.name.split(',')[0]}</span>
                            </h1>
                            <div className="flex flex-wrap gap-4 text-gray-500 font-bold text-sm">
                                <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-rose-500" /> {dest.name}</span>
                                <span className="flex items-center gap-2"><FaSuitcaseRolling className="text-blue-500" /> Best Destination</span>
                            </div>
                        </div>

                        {/* Quick Action Card */}
                        <div className="w-full lg:w-72 bg-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-200 animate-in zoom-in-95 duration-500">
                            <p className="text-rose-100 text-xs font-bold uppercase mb-2">Ready to visit?</p>
                            <h3 className="text-lg font-bold mb-4">Plan your perfect trip to {dest.name.split(',')[0]}</h3>
                            <Button onClick={handleClick} className="bg-white text-rose-600 hover:bg-gray-50 font-black w-full h-12 rounded-xl transition-all active:scale-95">
                                Get Custom Quote
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Main Content Grid ================= */}
            <div className={`${layout.container} mt-12`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT COLUMN: Info (8 Columns) */}
                    <div className="lg:col-span-8 space-y-12">
                        
                        {/* Summary Facts */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Best Time', val: dest.bestTime, icon: <FaCalendarAlt />, color: 'blue' },
                                { label: 'Currency', val: dest.currency, icon: <FaMoneyBillWave />, color: 'green' },
                                { label: 'Language', val: dest.language, icon: <FaLanguage />, color: 'orange' }
                            ].map((fact, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xl shadow-gray-100 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-${fact.color}-50 text-${fact.color}-500 flex items-center justify-center text-xl`}>
                                        {fact.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{fact.label}</p>
                                        <p className="font-bold text-gray-800 text-sm">{fact.val || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-200/60 shadow-2xl shadow-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">About the Place</h2>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {dest.description}
                            </p>
                        </div>

                        {/* Top Attractions */}
                        {dest.attractions && dest.attractions.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Popular Attractions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {dest.attractions.map((attr, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200/70 p-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-gray-100 hover:border-rose-500 transition-colors">
                                            <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <span className="font-bold text-gray-700 text-sm">{attr}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Gallery */}
                        {dest.gallery && dest.gallery.length > 0 && (
                            <div>
                                 <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FaCamera className="text-rose-600"/> Sightseeing Gallery
                                 </h3>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {dest.gallery.map((img, idx) => (
                                        <div key={idx} className={`relative rounded-2xl overflow-hidden group aspect-square shadow-md ${idx === 0 ? 'col-span-2 row-span-2 aspect-auto h-[410px]' : ''}`}>
                                            <Image src={img} alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    ))}
                                 </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Featured Packages (4 Columns) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-black text-gray-900">Best Packages</h3>
                                <Link href="/packages" className="text-rose-600 text-xs font-bold hover:underline">View All</Link>
                            </div>

                            {relatedPackages.length > 0 ? (
                                <div className="space-y-6">
                                    {relatedPackages.slice(0, 3).map((pkg) => (
                                        <PackageCard key={pkg._id} data={pkg} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-300 text-center">
                                    <p className="text-gray-400 text-sm font-bold">No packages found for this location.</p>
                                </div>
                            )}

                            {/* Help Desk */}
                            <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] text-center shadow-xl">
                                <h4 className="font-bold mb-2">Need a custom plan?</h4>
                                <p className="text-gray-400 text-xs mb-6">Talk to our experts for a personalized itinerary.</p>
                                <Button onClick={handleClick} className="bg-rose-600 hover:bg-rose-700 text-white w-full rounded-xl font-bold h-12">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    );
};

export default DestinationDetails;