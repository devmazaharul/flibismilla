import { websiteDetails } from "@/constant/data";
import { Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Flybismillah Travels & Tour",
  description: "How we collect, use, and protect your personal data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 md:px-8">
      
      {/* Simple Header */}
      <div className="mb-10 border-b border-slate-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <Lock className="w-8 h-8 text-rose-600" />
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-sm">Effective Date: January 24, 2026</p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-slate-700 leading-relaxed">
        
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
          <p>
            At <strong>Flybismillah Travels & Tour</strong>, we collect information necessary to process your travel bookings. This includes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
             <li><strong>Personal Identification:</strong> Full Name, Date of Birth, Gender (Required by TSA).</li>
             <li><strong>Travel Documents:</strong> Passport Number, Expiry Date, and Issuing Country.</li>
             <li><strong>Contact Details:</strong> Email Address and Phone Number.</li>
             <li><strong>Payment Information:</strong> Credit/Debit card details (Processed securely via PCI-DSS compliant gateways).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
          <p>
            We use your data strictly for the purpose of fulfilling your travel arrangements. This includes:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
             <li>Booking flights and issuing e-tickets.</li>
             <li>Submitting required passenger data to the <strong>US Transportation Security Administration (TSA)</strong> for Secure Flight vetting.</li>
             <li>Sending you booking confirmations, updates, and invoices.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Sharing (Third Parties)</h2>
          <p>
            We do not sell your personal data. However, we must share your information with:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
             <li><strong>Airlines & GDS:</strong> To confirm your seat and generate your ticket.</li>
             <li><strong>Government Authorities:</strong> Customs and Border Protection (CBP) as required by US law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data Security</h2>
          <p>
            We implement industry-standard security measures, including <strong>SSL Encryption</strong>, to protect your personal and financial information during transmission and storage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13 without parental consent, in compliance with the <strong>Children's Online Privacy Protection Act (COPPA)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Your Rights</h2>
          <p>
            You have the right to request access to the personal information we hold about you or request its deletion (subject to legal record-keeping requirements). To exercise these rights, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact our Data Protection Officer at:
            <br />
            <strong>Email:</strong> {websiteDetails.email}
          </p>
        </section>

      </div>
    </div>
  );
}