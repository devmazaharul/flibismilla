
import { ShieldCheck, Lock, Phone, CreditCard } from 'lucide-react'; 
import "@/app/(main)/globals.css" 
import { websiteDetails } from '@/constant/data';
import type { Metadata } from 'next';

// 🟢 LIGHTWEIGHT SEO CONFIGURATION
export const metadata: Metadata = {
  title: `Secure Checkout - ${websiteDetails.name}`,
  description: "Complete your flight booking securely. Your payment information is encrypted and protected.",
  robots: {
    index: false, // ⚠️ Checkout page should NOT be indexed
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-100 selection:text-rose-600">
        
        {/* 🟢 Modern Sticky Header with Glassmorphism */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl transition-all">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
            
            {/* Left: Logo & Context */}
            <div className="flex items-center gap-4">

               <div className="relative">
                  <img src="/logo.jpg" alt="Logo" className="h-9 w-auto object-contain" />
               </div>
               
               {/* Divider & Badge */}
               <div className="hidden md:flex items-center gap-3 border-l border-slate-300 pl-4">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                    Secure Checkout
                  </span>
               </div>
            </div>

            {/* Right: Trust & Support */}
            <div className="flex items-center gap-6">
              
              {/* Help Info (Trust Signal) */}
              <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Need Help?</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{websiteDetails.phone}</span>
                  </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                 <ShieldCheck className="w-4 h-4 text-green-600" />
                 <span className="text-xs font-bold text-green-700 hidden sm:block">
                    SSL ENCRYPTED
                 </span>
                 <Lock className="w-3.5 h-3.5 text-green-600/60" />
              </div>
            </div>
          </div>
        </nav>

        {/* 🟢 Main Content */}
        <main className="max-w-7xl mx-auto py-10 px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          
          {/* Timer Notice Wrapper */}
         

          {children}
        </main>

        {/* 🟢 Enhanced Trust Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
              
              {/* Payment Icons */}
              <div className="flex justify-center items-center gap-4 mb-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                  <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-slate-50">
                      <CreditCard className="w-4 h-4" /> <span className="text-xs font-bold">Visa</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-slate-50">
                      <CreditCard className="w-4 h-4" /> <span className="text-xs font-bold">Mastercard</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-slate-50">
                      <CreditCard className="w-4 h-4" /> <span className="text-xs font-bold">Amex</span>
                  </div>
              </div>

              {/* Links */}
              <div className="flex justify-center gap-6 mb-6 text-xs text-slate-500 font-medium">
                  <a href="/terms-conditions" className="hover:text-rose-600 hover:underline">Terms & Conditions</a>
                  <a href="/privacy-policy" className="hover:text-rose-600 hover:underline">Privacy Policy</a>
                  <a href="/refund-policy" className="hover:text-rose-600 hover:underline">Refund Policy</a>
              </div>

              <p className="text-slate-400 text-[11px]">
                  © 2026 {websiteDetails.name}. All transactions are secure and encrypted.
              </p>
          </div>
        </footer>

      </body>
    </html>
  );
}