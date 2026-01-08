import type { Metadata } from "next";
import { Poppins, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

// 1. Primary Font (Body & Headings)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins", // CSS variable for Tailwind
  display: "swap",
});

// 2. Accent Font (Cursive/Script style for Taglines)
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

// 3. SEO Metadata Configuration
export const metadata: Metadata = {
  title: {
    default: "Bismillah Travels & Tours | Hajj, Umrah & Holiday Packages",
    template: "%s | Bismillah Travels & Tours",
  },
icons: {
    icon: "/icon.png",
    apple: "/icon.png", 
  },
  description: "Your best travel partner for Hajj, Umrah, and holiday packages. We provide flight booking, hotel reservation, and visa processing services in Bangladesh and USA.",
  keywords: ["Travel Agency", "Hajj Package 2026", "Umrah Visa", "Flight Booking", "Bismillah Travels", "Tour Operator"],
  authors: [{ name: "Mazaharul Islam" }],
  openGraph: {
    title: "Bismillah Travels & Tours - Your Best Travel Partner",
    description: "Book affordable Hajj, Umrah, and Tour packages with world-class service.",
    url: "https://flybismillah.com/",
    siteName: "Bismillah Travels",
    images: [
      {
        url: "https://flybismillah.com/wp-content/uploads/2024/12/6-600x426.webp", 
        width: 1200,
        height: 630,
        alt: "Bismillah Travels & Tours Homepage",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bismillah Travels & Tours",
    description: "Best deals on Hajj, Umrah and International Flights.",
    images: ["https://flybismillah.com/wp-content/uploads/2024/12/6-600x426.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${poppins.variable} ${greatVibes.variable} font-sans antialiased bg-gray-50 text-gray-800`}
      >
        <Navbar />
        {children}

          <Toaster
                    position="top-center"
                    closeButton
                    expand={false}
                    duration={3000}
                    visibleToasts={5}
                    toastOptions={{
                        style: {
                            maxWidth: '25rem',
                            width: 'auto',
                        },
                    }}
                />
                  <Footer />
      </body>
    </html>
  );
}