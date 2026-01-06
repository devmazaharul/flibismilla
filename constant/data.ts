export const websiteDetails = {
    name: 'Fly Bismillah',
    url: 'https://www.flybismillah.com',
    description:
        'Fly Bismillah - Your Trusted Travel Partner for Hajj, Umrah, Flights, Hotels, and Tours.',
        address:"24146 blackmar Ave Warren, Michigan 48091",
        phone:"+1-213-985-8499",
        email:"Murad.usa09@gmail.com"
};
// ==================== 1. Header & Navigation ====================
export const headerData = {
    contact: {
        email: 'Murad.usa09@gmail.com',
        phones: ['+1 213-985-8499', '+1 213-296-8786', '+1 213-792-0038'],
    },
    socialLinks: [
        { icon: 'facebook', href: 'https://www.facebook.com/FlyBismillah' },
        { icon: 'youtube', href: 'https://www.youtube.com/@FlyBismillah' },
        { icon: 'twitter', href: 'https://x.com/FlyBismillah' },
        { icon: 'instagram', href: 'https://www.instagram.com/flybismillah' },
        { icon: 'pinterest', href: 'https://www.pinterest.com/FlyBismillah/' },
    ],
    navLinks: [
        { label: 'HOME', href: '/', hasDropdown: false,subMenu:null },
        { label: 'FLIGHT', href: '/flight', hasDropdown: false,subMenu:null },
        { label: 'HOTEL', href: '/hotel', hasDropdown: false ,subMenu:null},
        {
            label: 'UMRAH',
            href: '/umrah',
            hasDropdown: true,
            subMenu: [
                { label: 'Economy Hajj Package', href: '/hajj/economy' },
                { label: 'Premium Hajj Package', href: '/hajj/premium' },
            ],
        },
        {
            label: 'HAJJ',
            href: '/hajj',
            hasDropdown: true,
            subMenu: [
                { label: 'Family Umrah Package', href: '/umrah/family' },
                { label: 'Group Umrah Package', href: '/umrah/group' },
            ],
        },
        { label: 'ABOUT', href: '/about', hasDropdown: false },
        { label: 'CONTACT', href: '/contact',hasDropdown:false,subMenu:null },
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

// ==================== 3. Packages (Discover Weekly) ====================
export interface PackageType {
    id: number;
    title: string;
    price: string;
    image: string; 
    category: 'Hajj' | 'Umrah' | 'Tour';
}

export const packagesDataRaw: PackageType[] = [
    {
        id: 1,
        title: 'Bismillah Tours Economy Hajj Package 1E 2025: 13 Nights Package',
        price: '$7,148.00',
        image: '/images/packages/hajj1.jpg',
        category: 'Hajj',
    },
    {
        id: 2,
        title: 'Bismillah Tours Economy Hajj Package 1D 2025: 13 Nights Package',
        price: '$8,448.00',
        image: '/images/packages/hajj2.jpg',
        category: 'Hajj',
    },
    {
        id: 3,
        title: 'Bismillah Tours Deluxe Hajj Package 1C 2025: (No Azizia)-13 Nights Package',
        price: '$9,448.00',
        image: '/images/packages/hajj3.jpg',
        category: 'Hajj',
    },
    {
        id: 4,
        title: 'Bismillah Tours Super Deluxe Hajj Package 1B 2025: (No Azizia)-13 Nights Package',
        price: '$12,198.00',
        image: '/images/packages/hajj4.jpg',
        category: 'Hajj',
    },
    {
        id: 5,
        title: 'Bismillah Tours Executive Hajj Package 1A 2025: (No Azizia)-13 Nights Package',
        price: '$12,948.00',
        image: '/images/packages/hajj5.jpg',
        category: 'Hajj',
    },
    {
        id: 6,
        title: 'Package 1C 2023-24:(15th Apr/31st Dec) & (01st Jan/11th Mar)-10 Nights Package',
        price: '$2,048.00',
        image: '/images/packages/umrah1.jpg',
        category: 'Umrah',
    },
    {
        id: 7,
        title: 'Package 1B 2023-24:(15th Apr/31st Dec) & (01st Jan/11th Mar)-07 Nights Package',
        price: '$1,648.00',
        image: '/images/packages/umrah2.jpg',
        category: 'Umrah',
    },
    {
        id: 8,
        title: 'Package 1A 2023-24:(15th Apr/31st Dec) & (01st Jan/11th Mar)-05 Nights Package',
        price: '$1,348.00',
        image: '/images/packages/umrah3.jpg',
        category: 'Umrah',
    },
];

export const packagesData = packagesDataRaw.map((item) => {
    return {
        ...item,
        image: 'https://flybismillah.com/wp-content/uploads/2024/12/3-600x426.webp',
    };
});

// ==================== 4. Popular Destinations ====================
export const destinationsData = [
    {
        id: 1,
        name: 'Malé, Maldives',
        reviews: 0,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Male-maldives.webp',
    },
    {
        id: 2,
        name: 'Dubai Fountain',
        reviews: 0,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Sagarmatha-National-Park-Nepal.webp',
    },
    {
        id: 3,
        name: 'Senso-Ji Temple, Tokyo',
        reviews: 0,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/The-Dubai-Fountain.webp',
    },
    {
        id: 4,
        name: 'Burj Al Arab, Dubai',
        reviews: 0,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Great-Wall-of-China.webp',
    },
    {
        id: 5,
        name: 'Burj Al Arab, Dubai',
        reviews: 0,
        image: 'https://flybismillah.com/wp-content/uploads/2022/07/Great-Wall-of-China.webp',
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
            { icon: 'map', text: '24146 blackmar Ave Warren, Michigan 48091' },
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
    title: "Get In Touch",
    subtitle: "Have questions about Hajj, Umrah, or Holiday packages? We are here to help you 24/7.",
  },
  info: {
    locations: [
      {
        id: 1,
        city: "Los Angeles Office",
        address: "1053 S New Hampshire Ave # 506 Los Angeles, CA 90006",
        icon: "map"
      },
      {
        id: 2,
        city: "Michigan Office",
        address: "24146 Blackmar Ave Warren, Michigan 48091",
        icon: "map"
      }
    ],
    contacts: [
      {
        id: "phone",
        label: "Phone Number",
        value: "+1 213-985-8499",
        link: "tel:+12139858499",
        icon: "phone"
      },
      {
        id: "email",
        label: "Email Us",
        value: "Murad.usa09@gmail.com",
        link: "mailto:Murad.usa09@gmail.com",
        icon: "email"
      }
    ]
  }
};

//account
export const authData = {
  login: {
    title: "Welcome Back",
    subtitle: "Please enter your details to sign in.",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop", // Travel Image
    btnText: "Sign In",
    footerText: "Don't have an account?",
    footerLinkText: "Create free account",
    footerLink: "/signup"
  },
  register: {
    title: "Create Account",
    subtitle: "Start your spiritual journey with us today.",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop", // Travel Image
    btnText: "Create Account",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerLink: "/login"
  }
};