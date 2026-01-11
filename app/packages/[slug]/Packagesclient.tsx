'use client';

import { useState, useMemo, useEffect } from 'react'; 
import Image from 'next/image';
import { packages } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { FaSearch, FaFilter, FaSadTear } from 'react-icons/fa';

import { useSearchParams, useRouter } from 'next/navigation'; 
import PackageCard from '@/app/components/PackageCard';

// API call simulation (Static Data)
const categories = packages.reduce((acc, pkg) => {
  if (!acc.includes(pkg.category)) {
    acc.push(pkg.category);
  }
  return acc;
}, ['All'] as string[]).slice(0, 10);

const Packagesclient = () => {
  const { layout, typography, button } = appTheme;
  const params = useSearchParams();
  const router = useRouter();


  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const type = params.get("type");
    if (type) {
      setActiveCategory(type.toLowerCase());
    } else {
      setActiveCategory("all");
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


  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchCategory = activeCategory === "all" || pkg.category.toLowerCase() === activeCategory;
      
      const matchSearch = 
        pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pkg.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const displayCategory = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      
      {/* ================= 1. Hero / Header Section ================= */}
      <div className="relative bg-gray-900 h-[40vh] min-h-[300px] flex flex-col items-center justify-center text-center px-4">
        {/* Background Image */}
        <Image
          src="/asset/others/aboutbg.webp"
          alt="Packages Hero"
          fill
          className="object-cover opacity-40"
          priority
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-3xl w-full space-y-6">
          <h1 className={`${typography.h1} text-white`}>
            Explore Our Packages
          </h1>
          <p className="text-gray-200 text-lg">
            Find the perfect spiritual journey or holiday getaway tailored just for you.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full shadow-xl flex items-center max-w-lg mx-auto">
             <div className="pl-4 text-gray-400">
                <FaSearch />
             </div>
             <input 
               type="text" 
               placeholder="Search by destination or package name..." 
               className="flex-1 px-4 py-3 outline-none text-gray-700 font-medium bg-transparent"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Button className={`${button.primary} rounded-full px-6 h-12`}>
                Search
             </Button>
          </div>
        </div>
      </div>

      {/* ================= 2. Filter Tabs ================= */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200/70 shadow-2xl shadow-gray-100">
        <div className={layout.container}>
           <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
              <span className="text-sm font-bold text-gray-400 mr-2 flex items-center gap-1">
                 <FaFilter /> Filter:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                    activeCategory === cat.toLowerCase()
                      ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200"
                      : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* ================= 3. Packages Grid ================= */}
      <div className={`${layout.container} mt-10`}>
        
        {/* Result Count */}
        <div className="mb-6 flex justify-between items-end">
           <h2 className="text-2xl font-bold text-gray-900">
              {activeCategory === "all" ? "All Packages" : `${displayCategory} Packages`}
           </h2>
           <p className="text-gray-500 font-medium">
              Showing {filteredPackages.length} results
           </p>
        </div>

        {/* Content */}
        {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} data={pkg} />
              ))}
            </div>
        ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-4xl text-gray-400">
                  <FaSadTear />
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-2">No Packages Found</h3>
               <p className="text-gray-500 mb-6">
                 We couldn't find any packages matching "{searchQuery}" in {displayCategory}.
               </p>
               <Button 
                 onClick={() => {
                     setSearchQuery(""); 
                     handleCategoryChange("All");
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