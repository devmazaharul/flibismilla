'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';

interface DestinationProps {
    data: {
        id: number;
        slug: string;
        name: string;
        country: string;
        image: string;
        rating?: number;
        reviews?: number;
        bestTime?: string;
    };
}

const DestinationCard = ({ data }: DestinationProps) => {
    return (
        <Link href={`/destinations/${data.slug}`} className="group block h-full">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl shadow-gray-100 hover:shadow-xl transition-all duration-300 border border-gray-200/70 bg-white flex flex-col">
                
                {/* Image Section */}
                <div className="relative h-64 w-full overflow-hidden">
                    <Image
                        src={data.image}
                        alt={data.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    {/* Country Badge */}
                    <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <FaMapMarkerAlt /> {data.country}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1 relative">
                    {/* Floating Rating Badge */}
                    <div className="absolute -top-5 right-5 bg-white shadow-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold border border-gray-100">
                        <FaStar className="text-yellow-400" />
                        <span>{data.rating || 4.8}</span>
                        <span className="text-gray-400 font-normal">({data.reviews || 50})</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">
                        {data.name}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                       Explore the beauty of {data.name}. Best time to visit is during {data.bestTime || 'the season'}.
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            View Guide
                        </span>
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                            <FaArrowRight className="text-sm -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default DestinationCard;