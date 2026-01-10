'use client';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { destinations, packages } from '@/constant/data'; 
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import { 
    FaMapMarkerAlt, 
    FaStar, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaLanguage, 
    FaCamera,
    FaArrowRight,
    FaArrowLeft
} from 'react-icons/fa';
import PackageCard from '@/app/components/PackageCard';

const DestinationDetails = () => {
    const {  layout } = appTheme;
    const params = useParams();

    // 1. Find Destination Data
    const dest = destinations.find((d) => d.slug === params?.slug);

    if (!dest) return notFound();

    // 2. Find Related Packages (Smart Filter)
    const relatedPackages = packages.filter(pkg => 
        pkg.location.toLowerCase().includes(dest.country.toLowerCase()) || 
        pkg.location.toLowerCase().includes(dest.name.split(',')[0].toLowerCase())
    );

    return (
        <main className="bg-white min-h-screen pb-20">
            
            {/* ================= 1. Hero Section ================= */}
            <div className="relative h-[50vh] min-h-[400px] w-full">
                <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Back Button */}
                <div className="absolute top-6 left-4 md:left-10 z-20">
                    <Link href="/" className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-rose-600 transition">
                        <FaArrowLeft /> Back to Home
                    </Link>
                </div>

                {/* Hero Content */}
                <div className={`${layout.container} absolute bottom-10 left-0 right-0 text-white`}>
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-2">
                             <FaMapMarkerAlt className="text-rose-400" />
                             <span className="uppercase tracking-widest text-sm font-bold">{dest.country}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{dest.name}</h1>
                        <div className="flex items-center gap-2">
                             <FaStar className="text-yellow-400" />
                             <span className="font-bold">{dest.rating}</span>
                             <span className="text-gray-300">({dest.reviews} Reviews)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= 2. Main Content Grid ================= */}
            <div className={`${layout.container} mt-12`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Info (66%) */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* About */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {dest.name.split(',')[0]}</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {dest.description}
                            </p>
                        </div>

                        {/* Top Attractions Grid */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Top Attractions</h3>
                            <div className="flex flex-wrap gap-3">
                                {dest.attractions.map((attr, idx) => (
                                    <span key={idx} className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-default">
                                        📍 {attr}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Photo Gallery */}
                        <div>
                             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FaCamera className="text-rose-600"/> Photo Gallery
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-60">
                                {dest.gallery.map((img, idx) => (
                                    <div key={idx} className={`relative rounded-xl overflow-hidden group h-full ${idx === 0 ? 'sm:col-span-2' : 'sm:col-span-1'}`}>
                                        <Image src={img} alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                             </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Quick Facts Sidebar (33%) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-8">
                            
                            {/* Facts Card */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">Quick Facts</h3>
                                
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                            <FaCalendarAlt />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Best Time to Visit</p>
                                            <p className="font-bold text-gray-800">{dest.bestTime}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                            <FaMoneyBillWave />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Currency</p>
                                            <p className="font-bold text-gray-800">{dest.currency}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                            <FaLanguage />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Language</p>
                                            <p className="font-bold text-gray-800">{dest.language}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Card */}
                            <div className="bg-rose-600 text-white p-8 rounded-3xl text-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Plan your trip to {dest.name.split(',')[0]}!</h3>
                                    <p className="text-rose-100 mb-6 text-sm">We have exclusive packages with flights and hotels included.</p>
                                    <Link href="/contact">
                                        <Button className="bg-white text-rose-600 hover:bg-gray-100 font-bold w-full h-12">
                                            Get Custom Quote
                                        </Button>
                                    </Link>
                                </div>
                                {/* Decor Circle */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                                <div className="absolute top-10 -left-10 w-20 h-20 bg-white/10 rounded-full"></div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* ================= 3. Related Packages Section ================= */}
            {relatedPackages.length > 0 && (
                <div className="bg-gray-50 py-16 mt-16 border-t border-gray-200">
                    <div className={layout.container}>
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Available Packages</h2>
                                <p className="text-gray-500">Handpicked tours for {dest.name}</p>
                            </div>
                            <Link href="/packages">
                                <Button variant="link" className="text-rose-600 font-bold">
                                    View All <FaArrowRight className="ml-2"/>
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedPackages.slice(0, 3).map((pkg) => (
                                <PackageCard key={pkg.id} data={pkg} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
};

export default DestinationDetails;