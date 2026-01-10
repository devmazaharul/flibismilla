export const websiteDetails = {
    name: 'Fly Bismillah',
    url: 'https://www.flybismillah.com',
    description:
        'Fly Bismillah - Your Trusted Travel Partner for Hajj, Umrah, Flights, Hotels, and Tours.',
    address: 'Los Angeles,California 90057',
    phone: '+1-213-985-8499',
    email: 'Murad.usa09@gmail.com',
    whatappsLink: 'https://api.whatsapp.com/send/?phone=12139858499',
};
// ==================== 1. Header & Navigation ====================
export const headerData = {
    contact: {
        email: 'Murad.usa09@gmail.com',
        phones: ['+1 213-985-8499', '+1 213-296-8786', '+1 213-792-0038'],
    },
    socialLinks: [
        {
            icon: 'whatsapp',
            href: 'https://api.whatsapp.com/send/?phone=12139858499&text=Hello%2C+Welcome+to+Bismillah+Travel+%26+Tours.%0D%0AWe%27re+excited+to+help+you+plan+your+next+trip&type=phone_number&app_absent=0',
        },
        { icon: 'facebook', href: 'https://www.facebook.com/FlyBismillah' },
        { icon: 'youtube', href: 'https://www.youtube.com/@FlyBismillah' },
        { icon: 'twitter', href: 'https://x.com/FlyBismillah' },
        { icon: 'instagram', href: 'https://www.instagram.com/flybismillah' },
        { icon: 'pinterest', href: 'https://www.pinterest.com/FlyBismillah/' },
    ],
    navLinks: [
        { label: 'HOME', href: '/', hasDropdown: false, subMenu: null },
        {
            label: 'FLIGHT',
            href: '/flight',
            hasDropdown: true,
            subMenu: [
                { label: 'Domestic Flight Booking', href: '/flight/domestic' },
                { label: 'International Flight Booking', href: '/flight/international' },
            ],
        },
        { label: 'HOTEL', href: '/hotel', hasDropdown: false, subMenu: null },
        {
            label: 'HAJJ',
            href: '/hajj',
            hasDropdown: true,
            subMenu: [
                { label: 'Economy Hajj Package', href: '/hajj/economy' },
                { label: 'Premium Hajj Package', href: '/hajj/premium' },
            ],
        },
        {
            label: 'UMRAH',
            href: '/umrah',
            hasDropdown: true,
            subMenu: [
                { label: 'Family Umrah Package', href: '/umrah/family' },
                { label: 'Group Umrah Package', href: '/umrah/group' },
            ],
        },
        { label: 'ABOUT', href: '/about', hasDropdown: false },
        { label: 'CONTACT', href: '/contact', hasDropdown: false, subMenu: null },
    ],
};

// ==================== 2. Hero Section ====================
export const heroData = {
    subtitle: 'Natural Beauty',
    title: 'Your Best Travel Partner',
    searchTabs: [
        { id: 1, label: 'Destinations', placeholder: 'Where are you going?', icon: 'map-pin' },
        { id: 2, label: 'Activity', placeholder: 'All Activity', icon: 'hiking' },
        { id: 3, label: 'Dates', placeholder: 'DD-MM-YYYY', icon: 'calendar' },
        { id: 4, label: 'Guests', placeholder: '2 Persons', icon: 'user' },
    ],
};

// ==================== 4. Popular Destinations ====================
// constant/data.ts

export const destinations = [
    {
        id: 1,
        slug: 'male-maldives',
        name: 'Malé, Maldives',
        country: 'Maldives',
        reviews: 156,
        rating: 4.8,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Male-maldives.webp',
        description: 'Discover the sunny side of life. Malé is the densely populated capital of the Maldives, known for its colorful buildings and mosques. Beyond the capital, the Maldives offers overwater villas, crystal clear turquoise waters, and vibrant coral reefs perfect for diving and snorkeling.',
        bestTime: 'November to April',
        currency: 'Maldivian Rufiyaa (MVR)',
        language: 'Dhivehi',
        attractions: ['Grand Friday Mosque', 'Artificial Beach', 'Fish Market', 'National Museum', 'Banana Reef'],
        gallery: [
            'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1000',
            'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=1000',
            'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?q=80&w=1000'
        ]
    },
    {
        id: 2,
        slug: 'dubai-uae',
        name: 'Dubai, UAE',
        country: 'United Arab Emirates',
        reviews: 340,
        rating: 4.9,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/The-Dubai-Fountain.webp',
        description: 'Dubai is a city of skyscrapers, ports, and beaches, where big business takes place alongside sun-seeking tourism. Experience the top of the world at Burj Khalifa, shop at the world\'s largest mall, or take a safari into the golden desert dunes.',
        bestTime: 'November to March',
        currency: 'Dirham (AED)',
        language: 'Arabic',
        attractions: ['Burj Khalifa', 'The Dubai Mall', 'Palm Jumeirah', 'Dubai Creek', 'Desert Safari'],
        gallery: [
            'https://images.unsplash.com/photo-1523816026461-73ad84069f3d?q=80&w=1000',
            'https://images.unsplash.com/photo-1518684079-3c830dcef6c0?q=80&w=1000',
            'https://images.unsplash.com/photo-1546412414-e1885259563a?q=80&w=1000'
        ]
    },
    {
        id: 3,
        slug: 'istanbul-turkey',
        name: 'Istanbul, Turkey',
        country: 'Turkey',
        reviews: 210,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?q=80&w=1000',
        description: 'Istanbul is a major city in Turkey that straddles Europe and Asia across the Bosphorus Strait. Its Old City reflects cultural influences of the many empires that once ruled here.',
        bestTime: 'April to May & Sept to Nov',
        currency: 'Turkish Lira (TRY)',
        language: 'Turkish',
        attractions: ['Hagia Sophia', 'Blue Mosque', 'Topkapi Palace', 'Grand Bazaar', 'Bosphorus Cruise'],
        gallery: [
            'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a6b?q=80&w=1000',
            'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1000',
            'https://images.unsplash.com/photo-1622546758362-3652d87e078a?q=80&w=1000'
        ]
    },
];

// ==================== 5. About Us Section ====================

export const aboutData = {
    subtitle: 'Take a Tour',
    title: 'We Are Dedicated to Make Your Hajj & Umrah Journey Spiritual',
    description:
        'At Bismillah Travel and Tour, we are passionate about making your travel dreams come true. Based in the USA & BD, we specialize in providing a wide range of travel services, including flight bookings, hotel reservations, Umrah and Hajj packages.',
    features: [
        'Best Airline Service Provider',
        'VIP/Non VIP Ticket Holder',
        'Worldwide Hotel Reservation',
        '24/7 Customer Support',
    ],
    stats: {
        years: '20+',
        label: 'Years of Experience',
    },
};

// constant/data.ts

export const aboutPageData = {
    hero: {
        title: 'About Us',
        subtitle: 'Your trusted partner for Hajj, Umrah, and Worldwide Travel.',
        bgImage:
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop',
    },
    intro: {
        title: 'Welcome to our agency',
        heading: 'We make your travel dreams come true',
        description1:
            'At Bismillah Travel and Tour, we are passionate about making your travel dreams come true. Based in the USA, we specialize in providing a wide range of travel services, including flight bookings, hotel reservations, Umrah and Hajj packages, and personalized tours.',
        description2:
            'We understand that every traveler has unique needs. That’s why we offer tailored packages designed to suit your preferences and budget. Our team is committed to providing expert advice and exceptional service.',
        highlightBadge: '1M+ Travelers Monthly',
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1000&auto=format&fit=crop',
    },
    missionVision: [
        {
            title: 'Our Mission',
            text: 'To provide seamless and memorable travel experiences. We focus on offering personalized services for flights, hotels, and pilgrimage packages, ensuring each journey is smooth and enjoyable.',
            icon: 'mission',
        },
        {
            title: 'Our Vision',
            text: 'To be the leading travel agency in the USA, known for exceptional service, customer satisfaction, and offering accessible, customized travel solutions for both leisure and spiritual journeys.',
            icon: 'vision',
        },
    ],
    steps: {
        title: '3 Steps for the Perfect Trip',
        subtitle: 'Find Travel Perfection',
        desc: 'We have simplified the travel booking process for you.',
        items: [
            {
                id: 1,
                title: 'Tell us what you want to do',
                desc: "Share your travel goals, whether it's a pilgrimage or a vacation.",
            },
            {
                id: 2,
                title: 'Share your travel preference',
                desc: 'Let us know your budget, dates, and preferred accommodation style.',
            },
            {
                id: 3,
                title: 'We’ll give you recommendations',
                desc: 'Get a customized itinerary and package designed just for you.',
            },
        ],
    },
    stats: [
        { value: '28k', label: 'Total Users' },
        { value: '13k', label: 'Total Tours' },
        { value: '68k', label: 'Social Likes' },
        { value: '10k', label: '5 Star Ratings' },
    ],
    skills: [
        { label: 'Countryside Tours', percentage: 78 },
        { label: 'Vineyard & Nature', percentage: 92 },
        { label: 'Wine & Food Tasting', percentage: 62 },
    ],
};
// ==================== 6. Stats Section ====================

export const statsData = [
    { id: 1, value: '28k', label: 'Total Users', icon: 'users' },
    { id: 2, value: '13k', label: 'Total Tours', icon: 'map' },
    { id: 3, value: '68k', label: 'Social Likes', icon: 'like' },
    { id: 4, value: '10k', label: '5 Star Ratings', icon: 'star' },
];

// ==================== 7. Testimonials ====================

export const testimonialsData = [
    {
        id: 1,
        name: 'Ahmed Karim',
        role: 'Umrah Pilgrim',
        review: 'Alhamdulillah, the service was exceptional. From visa processing to hotel booking near Haram, everything was perfectly managed by Bismillah Travels.',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/men/32.jpg', // Placeholder URL
    },
    {
        id: 2,
        name: 'Fatima Begum',
        role: 'London, UK',
        review: 'I booked a family holiday package to Dubai. The guide was very professional and the hotels were exactly as promised. Highly recommended!',
        rating: 5,
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
        id: 3,
        name: 'Mohammad Riaz',
        role: 'Business Traveler',
        review: 'Great experience with flight booking. I got the best deal on urgent tickets. Their support team is available 24/7 which is very helpful.',
        rating: 4,
        image: 'https://randomuser.me/api/portraits/men/85.jpg',
    },
];

// ==================== 8. Blogs / News ====================

export const blogsData = [
    {
        id: 1,
        title: 'Essential Tips for First-Time Hajj Pilgrims',
        date: '10 Jan, 2026',
        author: 'Admin',
        excerpt:
            'Preparing for Hajj can be overwhelming. Here is a comprehensive guide on what to pack and how to prepare spiritually.',
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Seamless-Flight-768x660.webp', // Replace with local image
    },
    {
        id: 2,
        title: 'Top 5 Hidden Gems to Visit in Turkey',
        date: '05 Jan, 2026',
        author: 'Travel Desk',
        excerpt:
            'Turkey is more than just Istanbul. Discover the beautiful landscapes of Cappadocia and the ancient ruins of Ephesus.',
        image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 3,
        title: 'How to Get the Best Deals on Flights',
        date: '28 Dec, 2025',
        author: 'Support',
        excerpt:
            'Want to save money on your next trip? Learn the secrets of booking cheap flights and the best times to fly.',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop',
    },
];

// ==================== Footer Data ====================
export const footerData = {
    about: {
        logo: '/images/logo-white.png',
        text: 'We are offers reliable travel services, including ticketing, visa processing, and tailored tour packages, ensuring seamless journeys and memorable experiences.',
    },
    contact: {
        title: 'CONTACT US',
        info: [
            { icon: 'map', text: 'Los Angeles,California 90057' },
            { icon: 'phone', text: '+1 213-985-8499' },
            { icon: 'email', text: 'Murad.usa09@gmail.com' },
        ],
    },
    support: {
        title: 'SUPPORT',
        links: [
            { label: 'FAQ', href: '/faq' },
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Contact Us', href: '/contact' },
        ],
    },
    getApp: {
        title: 'GET THE APP',
        text: 'Visit our website for the best experience and exclusive deals.',

        image: '/images/app-download-placeholder.png',
    },
    bottomBar: {
        copyright: 'Bismillah Travels. All rights reserved.',
    },
};

//partners data
export const partnersData = [
    {
        id: 1,
        name: 'MasterCard',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    },
    {
        id: 2,
        name: 'Visa',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    },
    {
        id: 3,
        name: 'Discover',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg',
    },
    {
        id: 4,
        name: 'IATA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/IATA_logo.svg/1200px-IATA_logo.svg.png?20190926085114',
    },
];

//cotact page data
export const contactPageData = {
    header: {
        title: 'Get In Touch',
        subtitle:
            'Have questions about Hajj, Umrah, or Holiday packages? We are here to help you 24/7.',
    },
    info: {
        locations: [
            {
                id: 1,
                city: 'Los Angeles Office',
                address: 'Los Angeles,California 90057',
                icon: 'map',
            },
            {
                id: 2,
                city: 'Michigan Office',
                address: '24146 Blackmar Ave Warren, Michigan 48091',
                icon: 'map',
            },
        ],
        contacts: [
            {
                id: 'phone',
                label: 'Phone Number',
                value: '+1 213-985-8499',
                link: 'tel:+12139858499',
                icon: 'phone',
            },
            {
                id: 'email',
                label: 'Email Us',
                value: 'Murad.usa09@gmail.com',
                link: 'mailto:Murad.usa09@gmail.com',
                icon: 'email',
            },
        ],
    },
};

// ==================== 9. Packages Data ====================
export interface PackageType {
    id: number;
    title: string;
    price: string;
    image: string;
    category: 'Hajj' | 'Umrah' | 'Tour';
    description: string;
    slug: string;
    location: string;
}
// constant/data.ts

export const packages = [
    // --- HAJJ PACKAGES ---
    {
        id: 1,
        slug: 'economy-hajj-package-2025',
        title: 'Economy Hajj Package 2025 - 14 Days',
        price: '$7,148.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description:
            'An affordable yet comfortable Hajj journey focusing on the spiritual essentials. Includes shifting accommodation near Haram.',
        included: [
            'Round Trip Airfare',
            'Hajj Visa & Insurance',
            '3 Star Hotel (Shifting)',
            'Full Board Meals',
            'Guided Hajj Rituals',
            'Bus Transport',
        ],
    },
    {
        id: 2,
        slug: 'vip-shifting-hajj-package',
        title: 'VIP Shifting Hajj Package - 20 Days',
        price: '$9,500.00',
        image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1000',
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description:
            'Experience Hajj with VIP services. Stay in luxury apartments in Azizia and 5-star hotels facing the Haram during Hajj days.',
        included: [
            'Direct Flights',
            'VIP Hajj Visa',
            '5 Star Hotel',
            'Azizia Apartment',
            'Private AC Bus',
            'Buffet Meals',
            'Ziyarat Tours',
        ],
    },
    {
        id: 3,
        slug: 'non-shifting-hajj-package',
        title: 'Premium Non-Shifting Hajj - 15 Days',
        price: '$11,200.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description:
            'No hassle of changing hotels. Stay in one dedicated 5-star hotel throughout your Hajj journey with closest access to Jamarat.',
        included: [
            'Business Class Flight',
            'Luxury Hotel (Zero Dist)',
            'Private Tent in Mina',
            '24/7 Guide',
            'All Meals',
            'Exclusive Transport',
        ],
    },

    // --- UMRAH PACKAGES ---
    {
        id: 4,
        slug: 'luxury-umrah-package-10-days',
        title: 'Luxury Umrah Package - 10 Days',
        price: '$2,500.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Umrah',
        location: 'Makkah & Madinah',
        description:
            'Perform Umrah with ease and luxury. Our 10-day package offers 5-star hotel stays directly facing the Kaaba.',
        included: [
            'Return Flights',
            'Umrah Visa',
            '5 Star Hotel (Clock Tower)',
            'Breakfast Included',
            'Private Car Transfer',
            'Ziyarat Makkah/Madinah',
        ],
    },
    {
        id: 5,
        slug: 'economy-umrah-group',
        title: 'Economy Group Umrah - 15 Days',
        price: '$1,200.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Umrah',
        location: 'Makkah & Madinah',
        description:
            'Join our guided group for a budget-friendly spiritual journey. Perfect for first-timers needing guidance.',
        included: [
            'Economy Flight',
            'Group Visa',
            '3 Star Hotel (500m)',
            'Bus Transport',
            'Bengali Guide',
            'Weekly Ziyarat',
        ],
    },
    {
        id: 6,
        slug: 'ramadan-umrah-full-month',
        title: 'Full Month Ramadan Umrah',
        price: '$3,800.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Umrah',
        location: 'Makkah & Madinah',
        description:
            'Spend the entire holy month of Ramadan in the holy cities. Experience the spiritual atmosphere of Laylatul Qadr.',
        included: [
            'Return Ticket',
            'Umrah Visa',
            'Standard Hotel',
            'Suhoor & Iftar',
            'Eid Celebration',
            'Transport',
        ],
    },
    {
        id: 7,
        slug: 'short-express-umrah',
        title: 'Express Umrah Package - 7 Days',
        price: '$1,500.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Umrah',
        location: 'Makkah Only',
        description:
            'A quick spiritual recharge. Perfect for busy professionals who want to perform Umrah over a week.',
        included: [
            'Direct Flight',
            'Express Visa',
            '4 Star Hotel',
            'Airport Transfer',
            'Breakfast',
            'Rawdah Slot Booking',
        ],
    },

    // --- ISLAMIC HERITAGE TOURS ---
    {
        id: 8,
        slug: 'alaqsa-jerusalem-tour',
        title: 'Al-Aqsa & Jerusalem Tour - 5 Days',
        price: '$1,800.00',
        image: 'https://images.unsplash.com/photo-1542627088-6603b66e5c54?q=80&w=1000',
        category: 'Heritage',
        location: 'Jerusalem, Palestine',
        description:
            'Visit the first Qibla of Islam. Pray at Masjid Al-Aqsa and visit historical sites of Prophets.',
        included: [
            'Return Flights',
            'Entry Visa',
            'Heritage Hotel',
            'Local Guide',
            'Ziyarat of Prophets',
            'Daily Breakfast',
        ],
    },
    {
        id: 9,
        slug: 'turkey-islamic-history',
        title: 'Turkey Islamic History - 8 Days',
        price: '$1,650.00',
        image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?q=80&w=1000',
        category: 'Heritage',
        location: 'Istanbul & Bursa',
        description:
            'Explore the capital of the Ottoman Empire. Visit Blue Mosque, Hagia Sophia, and Topkapi Palace.',
        included: [
            'Flight Ticket',
            'E-Visa Assistance',
            '4 Star Hotel',
            'Bosphorus Cruise',
            'Museum Tickets',
            'Daily Breakfast',
        ],
    },
    {
        id: 10,
        slug: 'egypt-pyramids-tour',
        title: 'Egypt & Pyramids Tour - 6 Days',
        price: '$1,400.00',
        image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?q=80&w=1000',
        category: 'Heritage',
        location: 'Cairo & Alexandria',
        description:
            'Walk through history. Visit the Pyramids of Giza, Al-Azhar Mosque, and the Nile River.',
        included: [
            'Flight Ticket',
            'Visa Support',
            'Nile Cruise Dinner',
            'Hotel Stay',
            'Pyramid Entry',
            'Transport',
        ],
    },
    {
        id: 11,
        slug: 'uzbekistan-silk-road',
        title: 'Uzbekistan Silk Road - 7 Days',
        price: '$1,550.00',
        image: 'https://images.unsplash.com/photo-1528659556826-6b607062400a?q=80&w=1000',
        category: 'Heritage',
        location: 'Bukhara & Samarkand',
        description:
            'Visit the land of Imam Bukhari. Stunning blue mosques and ancient Islamic architecture.',
        included: [
            'Flight Ticket',
            'Visa Fees',
            'Bullet Train Ticket',
            'Heritage Hotel',
            'Guide',
            'All Transfers',
        ],
    },
    {
        id: 12,
        slug: 'jordan-petra-tour',
        title: 'Jordan & Petra Discovery - 5 Days',
        price: '$1,350.00',
        image: 'https://images.unsplash.com/photo-1575351296813-911e86a51206?q=80&w=1000',
        category: 'Heritage',
        location: 'Amman & Petra',
        description: 'Discover the ancient city of Petra and the site of the Battle of Mutah.',
        included: [
            'Return Flight',
            'Visa On Arrival',
            'Hotel Stay',
            'Petra Entry Ticket',
            'Dead Sea Visit',
            'Transport',
        ],
    },

    // --- INTERNATIONAL HOLIDAYS ---
    {
        id: 13,
        slug: 'dubai-family-fun',
        title: 'Dubai Family Fun - 5 Days',
        price: '$950.00',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea90b7cadc9?q=80&w=1000',
        category: 'Holiday',
        location: 'Dubai, UAE',
        description:
            'Ultimate family vacation. Includes Desert Safari, Burj Khalifa top view, and Dhow Cruise.',
        included: [
            'Flight Ticket',
            'UAE Visa',
            'Citymax Hotel',
            'Desert Safari BBQ',
            'Burj Khalifa Ticket',
            'Airport Transfer',
        ],
    },
    {
        id: 14,
        slug: 'maldives-honeymoon',
        title: 'Maldives Honeymoon Bliss - 4 Days',
        price: '$2,100.00',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1000',
        category: 'Holiday',
        location: 'Male, Maldives',
        description:
            'Romantic getaway in a water villa. Crystal clear waters and white sandy beaches.',
        included: [
            'Return Flights',
            'Visa Free',
            'Water Villa Stay',
            'Speedboat Transfer',
            'All Meals',
            'Candlelight Dinner',
        ],
    },
    {
        id: 15,
        slug: 'malaysia-budget-trip',
        title: 'Malaysia Budget Trip - 5 Days',
        price: '$650.00',
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1000',
        category: 'Holiday',
        location: 'Kuala Lumpur',
        description: 'Explore the Twin Towers, Genting Highlands, and Batu Caves on a budget.',
        included: [
            'Flight Ticket',
            'E-Visa',
            '3 Star Hotel',
            'Cable Car Ticket',
            'City Tour',
            'Breakfast',
        ],
    },
    {
        id: 16,
        slug: 'singapore-city-tour',
        title: 'Singapore City Delight - 4 Days',
        price: '$850.00',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1000',
        category: 'Holiday',
        location: 'Singapore',
        description:
            'Cleanest city in the world. Visit Marina Bay Sands, Sentosa Island, and Universal Studios.',
        included: [
            'Return Flight',
            'Visa Processing',
            'Hotel Boss',
            'Sentosa Pass',
            'Universal Studios',
            'Transfer',
        ],
    },
    {
        id: 17,
        slug: 'thailand-phuket-adventure',
        title: 'Thailand Phuket Adventure - 6 Days',
        price: '$700.00',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1000',
        category: 'Holiday',
        location: 'Bangkok & Phuket',
        description:
            'Island hopping, shopping, and street food. The perfect mix of city and beach life.',
        included: [
            'Flight Ticket',
            'Thai Visa',
            'Beach Resort',
            'Phi Phi Island Tour',
            'Internal Flight',
            'Breakfast',
        ],
    },
    {
        id: 18,
        slug: 'london-paris-combo',
        title: 'London & Paris Combo - 8 Days',
        price: '$2,800.00',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000',
        category: 'Holiday',
        location: 'UK & France',
        description:
            'Visit two iconic European capitals. See the Big Ben and the Eiffel Tower in one trip.',
        included: [
            'Multi-City Flight',
            'Visa Assistance',
            'Central Hotel',
            'Eurostar Train',
            'River Cruise',
            'Breakfast',
        ],
    },
    {
        id: 19,
        slug: 'bali-nature-retreat',
        title: 'Bali Nature Retreat - 6 Days',
        price: '$900.00',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000',
        category: 'Holiday',
        location: 'Bali, Indonesia',
        description: 'Rice terraces, swings, and temples. A peaceful escape into nature.',
        included: [
            'Flight Ticket',
            'Visa Free',
            'Private Pool Villa',
            'Ubud Tour',
            'Nusa Penida Trip',
            'Spa Session',
        ],
    },
    {
        id: 20,
        slug: 'sri-lanka-scenic',
        title: 'Scenic Sri Lanka - 5 Days',
        price: '$550.00',
        image: 'https://images.unsplash.com/photo-1586203002663-71868351b88e?q=80&w=1000',
        category: 'Holiday',
        location: 'Kandy & Ella',
        description: 'Experience the famous train ride, tea gardens, and elephants in Sri Lanka.',
        included: [
            'Return Flight',
            'ETA Visa',
            'Hilltop Hotel',
            'Private Driver',
            'Train Ticket',
            'Breakfast',
        ],
    },
];
