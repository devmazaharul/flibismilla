'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaSearch, FaGlobeAmericas, FaSadTear, FaExclamationTriangle } from 'react-icons/fa';
import DestinationCard from '../components/DestinationCard';
import Link from 'next/link';

// Define Interface based on your API response
interface DestinationType {
    _id: number;
    slug: string;
    name: string;
    country: string;
    image: string;
    rating?: number;
    reviews?: number;
    bestTime?: string;
    description?: string;
    // Add other fields as needed
}

const DestinationsPage = () => {
    const { layout, typography, button } = appTheme;
    
    // State Management
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Fetch Destinations from API
    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetching from your API endpoint
                  const response = await axios.get('/api/public/destinations');
                // Adjust based on your API response structure (e.g., response.data.destinations or just response.data)
                const data = response.data.data || [];
                
                setDestinations(data);
            } catch (err: any) {
                console.error("Error fetching destinations:", err);
                setError("Failed to load destinations. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDestinations();
    }, []);

    // 2. Filter Logic
    const filteredDestinations = destinations.filter((dest) => 
        (dest.name && dest.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dest.country && dest.country.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            
            {/* ================= 1. Hero Section ================= */}
            <div className="relative h-[40vh] min-h-[350px] flex items-center justify-center bg-gray-900 px-4">
                <Image
                    src="/asset/others/des.jpg"
                    alt="World Map"
                    fill
                    className="object-cover opacity-50"
                    priority
                />
                <div className="relative z-10 text-center max-w-2xl w-full">
                    <span className="text-rose-400 font-bold tracking-widest uppercase mb-2 block">
                        Discover the World
                    </span>
                    <h1 className={`${typography.h1} text-white mb-6`}>
                        Top Destinations
                    </h1>
                    
                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-full shadow-2xl flex items-center w-full max-w-lg mx-auto transform hover:scale-105 transition-transform duration-300">
                        <div className="pl-4 text-gray-400 text-lg">
                           <FaGlobeAmericas />
                        </div>
                        <input 
                           type="text" 
                           placeholder="Where do you want to go?" 
                           className="flex-1 px-4 py-3 outline-none text-gray-700 font-medium bg-transparent placeholder-gray-400"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button className={`${button.primary} cursor-pointer rounded-full w-12 h-12 p-0 flex items-center justify-center`}>
                           <FaSearch />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ================= 2. Destinations Grid ================= */}
            <div className={`${layout.container} mt-16`}>
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Popular Places</h2>
                        {!isLoading && !error && (
                            <p className="text-gray-500 mt-1">
                                {filteredDestinations.length} destinations found
                            </p>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-3xl h-[300px] animate-pulse border border-gray-100 shadow-sm" />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <FaExclamationTriangle className="text-4xl text-yellow-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Something went wrong</h3>
                        <p className="text-gray-500 mt-2">{error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            variant="outline" 
                            className="mt-4 border-gray-300 cursor-pointer"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Success Data State */}
                {!isLoading && !error && filteredDestinations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredDestinations.map((dest) => (
                            // ✅ Passing ID to DestinationCard as requested
                            // Ensure DestinationCard uses `dest._id` for the Link href like: href={`/destinations/${data._id}`}
                            <DestinationCard key={dest._id} data={dest} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredDestinations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl text-gray-300">
                           <FaSadTear />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Destinations Found</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            We couldn't find any places matching "{searchQuery}". Try searching for a country or city name.
                        </p>
                        <Button 
                            onClick={() => setSearchQuery("")}
                            variant="outline"
                            className="border-gray-200 cursor-pointer"
                        >
                            Show All Places
                        </Button>
                    </div>
                )}
            </div>

            {/* ================= 3. Promo Banner ================= */}
            <div className={`${layout.container} mt-20`}>
                <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-3xl p-8 md:p-12 text-center md:text-left relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative z-10 max-w-xl">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Can't find your dream spot?</h3>
                        <p className="text-rose-100">Our travel experts can help you plan a custom tour to any country in the world.</p>
                    </div>
                    <div className="relative z-10">
                        <Link href={`/contact`}>
                        <Button className="bg-white cursor-pointer text-rose-600 hover:bg-gray-100 px-8 h-12 font-bold ">
                            Contact Us Now
                        </Button>
                        </Link>
                    </div>
                    
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
                </div>
            </div>

        </main>
    );
};

export default DestinationsPage;