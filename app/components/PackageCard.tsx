import { Button } from '@/components/ui/button';
import { PackageType } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import Image from 'next/image';

interface PackageCardProps {
    data: PackageType;
}

const PackageCard = ({ data }: PackageCardProps) => {
    const { button } = appTheme;

    return (
        <div className="group hover:scale-101 bg-white rounded-2xl overflow-hidden border border-gray-200/70 shadow-2xl shadow-gray-100 hover:shadow-xl transition duration-300">
            {/* Image Container */}
            <div className="relative h-60 w-full bg-gray-200 overflow-hidden">
                {/* Placeholder for Image - Replace src with actual image path */}

                <Image alt="am" className='h-full w-full bg-contain' src={data.image} height={700} width={700} />

                {/* Wishlist Button */}

                {/* Badge */}
                <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                    {data.category}
                </span>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 title={data.title} className="text-lg font-bold text-gray-800 leading-snug mb-3 line-clamp-2 h-14">
                    {data.title}
                </h3>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                        <span className="text-xs text-gray-500 block">Starting from</span>
                        <span className="text-xl font-bold text-gray-900">{data.price}</span>
                    </div>

                    <Button  variant={'default'}>
                        Explore
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PackageCard;
