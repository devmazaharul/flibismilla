import { packagesData } from '@/constant/data';
import React from 'react';
import PackageCard from './PackageCard';
import { Button } from '@/components/ui/button';
import { appTheme } from '@/constant/theme/global';
import Link from 'next/link';

export default function Packages() {
    const { colors, layout, typography, button } = appTheme;
    return (
        <section className={`${layout.sectionPadding} ${colors.background.main}`}>
            <div className={layout.container}>
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className={`${typography.h2} ${colors.text.heading} mb-4`}>
                        Popular Travel Packages
                    </h2>
                    <p className={`${colors.text.body} max-w-2xl mx-auto`}>
                        Explore our top-rated Hajj and Umrah packages tailored for your spiritual
                        journey.
                    </p>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {packagesData.map((pkg) => (
                      <Link key={pkg.id} href={`packages/${pkg.title.trim().split(" ").join("-")}`}>
                        <PackageCard  data={pkg} />
                      </Link>
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-12 text-center">
                    <Button className={`${button.secondary} px-8 h-12 rounded-full`}>
                        View All Packages
                    </Button>
                </div>
            </div>
        </section>
    );
}
