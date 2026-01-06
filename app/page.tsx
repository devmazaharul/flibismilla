import { packagesData } from '@/constant/data';
import { Button } from '@/components/ui/button'; // Shadcn Button
// Components
import Hero from './components/Hero';
import PackageCard from './components/PackageCard';
import { appTheme } from '@/constant/theme/global';
import About from './components/About';
import Testimonials from './components/Testimonial';
import Blog from './components/Blog';
import PopularDestinations from './components/PopularDestinations';
import Partners from './components/Partners';
import Stats from './components/Stats';

export default function Home() {
    const { colors, layout, typography, button } = appTheme;
    return (
        <main className={`min-h-screen font-sans ${colors.background.main}`}>
            {/* 1. Navbar */}

            {/* 2. Hero Section */}
            <Hero />

            {/* 3. Discover Weekly Section */}
            <section className={`${layout.sectionPadding} ${colors.background.main}`}>
                <div className={layout.container}>
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className={`${typography.h2} ${colors.text.heading} mb-4`}>
                            Popular Travel Packages
                        </h2>
                        <p className={`${colors.text.body} max-w-2xl mx-auto`}>
                            Explore our top-rated Hajj and Umrah packages tailored for your
                            spiritual journey.
                        </p>
                    </div>

                    {/* Packages Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {packagesData.map((pkg) => (
                            <PackageCard key={pkg.id} data={pkg} />
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
            <PopularDestinations />
            <About />
            <Stats />
            <Testimonials />
            <Blog />
            <Partners />
        </main>
    );
}
