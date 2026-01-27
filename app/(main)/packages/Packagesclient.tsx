'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios'; // Import Axios
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaSearch, FaFilter, FaSadTear, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';
import PackageCard from '../components/PackageCard';

// Define the Interface for your Package Data
// Adjust the fields based on what your API actually returns
interface PackageType {
    _id: string; 
    title: string;
    category: string;
    location: string;
    price: number;
    image: string;
    // ... add other specific fields needed for PackageCard
}

const Packagesclient = () => {
    const { layout, typography, button } = appTheme;
    const params = useSearchParams();
    const router = useRouter();

    // 1. State Management
    const [packagesData, setPackagesData] = useState<PackageType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 2. Fetch Data using Axios
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Axios Call
               const response = await axios.get('/api/public/packages');
                if (response.status !== 200) {
                    throw new Error('Network response was not ok');
                }
    
                
                const data = response.data.data || []
                setPackagesData(data);
            } catch (err) {
              setError((err instanceof Error ? err.message : 'An unexpected error occurred'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchPackages();
    }, []);

    // 3. Dynamic Category Calculation (Moved inside useMemo dependent on fetched data)
    const categories = useMemo(() => {
        if (!packagesData.length) return ['All'];

        return packagesData
            .reduce(
                (acc, pkg) => {
                    if (pkg.category && !acc.includes(pkg.category)) {
                        acc.push(pkg.category);
                    }
                    return acc;
                },
                ['All'] as string[],
            )
            .slice(0, 10);
    }, [packagesData]);

    // 4. URL Param Sync
    useEffect(() => {
        const type = params.get('type');
        if (type) {
            setActiveCategory(type.toLowerCase());
        } else {
            setActiveCategory('all');
        }
    }, [params]);

    const handleCategoryChange = (cat: string) => {
        const lowerCat = cat.toLowerCase();
        setActiveCategory(lowerCat);

        if (lowerCat === 'all') {
            router.push('/packages');
        } else {
            router.push(`/packages?type=${lowerCat}`);
        }
    };

    // 5. Filtering Logic
    const filteredPackages = useMemo(() => {
        return packagesData.filter((pkg) => {
            const matchCategory =
                activeCategory === 'all' || 
                (pkg.category && pkg.category.toLowerCase() === activeCategory);

            const matchSearch =
                (pkg.title && pkg.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (pkg.location && pkg.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (pkg.category && pkg.category.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchCategory && matchSearch;
        });
    }, [activeCategory, searchQuery, packagesData]);

    const displayCategory = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

    const heroImageUrl =
        params.get('type') === 'hajj'
            ? '/asset/others/hajj_umrah.avif'
            : params.get('type') === 'umrah'
              ? '/asset/others/hajj_umrah.avif'
              : '/asset/others/ottour.avif';

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            {/* ================= 1. Hero / Header Section ================= */}
            <div className="relative bg-gray-900 h-[40vh] min-h-[300px] flex flex-col items-center justify-center text-center px-4">
                <Image
                    src={heroImageUrl}
                    alt="Packages Hero"
                    fill
                    className="object-cover opacity-40"
                    priority
                />

                <div className="relative z-10 max-w-3xl w-full space-y-6">
                    <h1 className={`${typography.h1} text-white`}>Explore Our Packages</h1>
                    <p className="text-gray-200 text-sm md:text-lg">
                        Find the perfect spiritual journey or holiday getaway tailored just for you.
                    </p>

                    <div className="bg-white p-1.5 md:p-2 rounded-full shadow-xl flex items-center w-full max-w-lg mx-auto transition-all">
                        <div className="pl-3 md:pl-4 text-gray-400 shrink-0">
                            <FaSearch className="text-sm md:text-base" />
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Search by destination..."
                            className="flex-1 w-full min-w-0 px-2 md:px-4 py-2 md:py-3 outline-none text-gray-700 font-medium bg-transparent text-sm md:text-base placeholder:text-xs md:placeholder:text-base truncate"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        
                        <Button className={`${button.primary} cursor-pointer rounded-full px-4 md:px-6 h-10 md:h-12 text-sm md:text-base shrink-0`}>
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* ================= 2. Filter Tabs ================= */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200/70 shadow-2xl shadow-gray-100">
                <div className={layout.container}>
                    <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
                        <span className="text-sm font-bold text-gray-400 mr-2 flex items-center gap-1 shrink-0">
                            <FaFilter /> Filter:
                        </span>
                        
                        {isLoading ? (
                            // Skeleton loader for categories
                            [1,2,3,4].map(i => <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"></div>)
                        ) : (
                            categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                                        activeCategory === cat.toLowerCase()
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ================= 3. Packages Grid / Loading / Error ================= */}
            <div className={`${layout.container} mt-10`}>
                
                {/* Header Count */}
                <div className="mb-6 flex justify-between items-end">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {activeCategory === 'all' ? 'All Packages' : `${displayCategory} Packages`}
                    </h2>
                    {!isLoading && !error && (
                        <p className="text-gray-500 font-medium text-sm md:text-base">
                            Showing {filteredPackages.length} results
                        </p>
                    )}
                </div>

                {/* State Handling: Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <FaSpinner className="animate-spin text-4xl text-rose-600 mb-4" />
                        <p className="text-gray-500 font-medium">Loading packages...</p>
                    </div>
                )}

                {/* State Handling: Error */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[300px] text-center">
                        <FaExclamationTriangle className="text-4xl text-yellow-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Something went wrong</h3>
                        <p className="text-gray-500 mt-2">{error}</p>
                    </div>
                )}

                {/* State Handling: Success Data */}
                {!isLoading && !error && filteredPackages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPackages.map((pkg) => (
                            // @ts-ignore - Ensure PackageCard handles the prop types correctly
                            <PackageCard key={pkg._id} data={pkg} />
                        ))}
                    </div>
                )}

                {/* State Handling: No Results */}
                {!isLoading && !error && filteredPackages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-4xl text-gray-400">
                            <FaSadTear />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Packages Found</h3>
                        <p className="text-gray-500 mb-6">
                            We couldn't find any packages matching "{searchQuery}" in{' '}
                            {displayCategory}.
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                handleCategoryChange('All');
                            }}
                            variant="outline"
                            className="border-gray-300"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Packagesclient;