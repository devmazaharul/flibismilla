import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: {
        template: '%s | Best Flight Booking Agency',
        default: 'Book Cheap Flights & Air Tickets | Best Deals',
    },
    description:
        'Find and book the cheapest flights to any destination. Compare airline ticket prices, check flight schedules, and get the best travel deals instantly.',
    keywords: [
        'flight booking',
        'cheap air tickets',
        'airways',
        'dhaka to dubai flights',
        'travel agency',
        'flight schedule',
        'air ticket price',
    ],
    authors: [{ name: 'Bismillash Travels & Tours' }],
    creator: 'Bismillash Travels & Tours',
    publisher: 'Bismillash Travels & Tours',

    openGraph: {
        title: 'Book Cheap Flights & Air Tickets',
        description:
            'Compare airlines and save money on your next trip. Hassle-free booking with instant confirmation.',
        url: 'https://flybismillah.com/flight',
        siteName: 'Your Company Name',
        images: [
            {
                url: '/icon.png',
                width: 1200,
                height: 630,
                alt: 'Flight Booking Banner',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },

    // 🟢 Twitter Card
    twitter: {
        card: 'summary_large_image',
        title: 'Best Flight Deals & Offers',
        description: 'Get the best rates on international and domestic flights.',
        images: ['/icon.png'],
    },

    robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
        },
    },
};

export default function FlightLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'TravelAgency',
                        name: 'Your Company Name',
                        url: 'https://flybismillah.com',
                        description: 'Best agency for booking cheap flights and holiday packages.',
                        image: 'https://flybismillah.com/logo.jpg',
                        priceRange: '$$',
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: 'Warren, Michigan 48091',
                            addressLocality: 'USA',
                            addressCountry: 'US',
                        },
                    }),
                }}
            />

            <main className="flex-grow">{children}</main>
        </div>
    );
}
