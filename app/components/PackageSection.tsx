'use client';
import { packages } from '@/constant/data';
import PackageCard from './PackageCard';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PackageSection = () => {
    const { layout, typography, button } = appTheme;

    return (
        <section className="py-20 bg-gray-50">
            <div className={layout.container}>
                
                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className={`${typography.subtitle} mb-2 block`}>Destinations</span>
                    <h2 className={`${typography.h2} text-gray-900 mb-4`}>
                        Our Popular Packages
                    </h2>
                    <p className="text-gray-500">
                        Explore our top-rated Hajj, Umrah, and Holiday packages designed for your comfort and spiritual journey.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.slice(0, 6).map((pkg) => (
                        <PackageCard key={pkg.id} data={pkg} />
                    ))}
                </div>

                 <div className="mt-12 text-center">
                    <Link href="/packages">
                        <Button className={`${button.primary}  shadow-none hover:shadow-none `}>
                            View All Packages
                        </Button>
                    </Link>
                </div>

             

            </div>
        </section>
    );
};

export default PackageSection;