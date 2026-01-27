import { ScrollText } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | Flybismillah Travels & Tour",
  description: "Terms of service for our USA-based travel agency.",
};

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 md:px-8">
      
      {/* Simple Header */}
      <div className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <ScrollText className="w-8 h-8 text-rose-600" />
          Terms & Conditions
        </h1>
        <p className="text-slate-500 text-sm">Effective Date: January 24, 2026</p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-slate-700 leading-relaxed">
        
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
          <p>
            Welcome to <strong>Flybismillah Travels & Tour</strong>, a travel agency operating under the laws of the United States. By accessing our website and using our booking services, you agree to be bound by these terms and all applicable federal and state laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. TSA Secure Flight Data</h2>
          <p>
            In accordance with the <strong>Transportation Security Administration (TSA)</strong> Secure Flight program, passengers must provide their full legal name, date of birth, and gender exactly as it appears on their government-issued ID or Passport. Failure to provide accurate information may result in denial of transport.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Pricing & Payments (USD)</h2>
          <p>
            All fares are quoted in <strong>US Dollars (USD)</strong>. Prices are dynamic and are not guaranteed until the ticket is issued. If a fare changes during the booking process due to airline updates, we will notify you immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. International Travel & Visas</h2>
          <p>
            It is the sole responsibility of the traveler to ensure they have valid passports (minimum 6 months validity), visas, and health documentation required for entry into the destination country and re-entry into the United States.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Governing Law</h2>
          <p>
            These terms shall be governed by the laws of the <strong>State of Delaware, USA</strong>. Any disputes arising from these terms shall be resolved exclusively in the state or federal courts located within the United States.
          </p>
        </section>

      </div>
    </div>
  );
}