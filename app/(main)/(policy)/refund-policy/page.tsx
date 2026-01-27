import { Banknote, Clock, AlertTriangle, HelpCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Refund Policy | Flybismillah Travels & Tour",
  description: "USA compliant refund and cancellation policies.",
};

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 md:px-8">
      
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Refund & Cancellation Policy</h1>
        <p className="text-slate-500 text-lg">
          At <strong>Flybismillah Travels & Tour</strong>, we operate under US consumer protection laws to ensure a transparent refund process for our travelers.
        </p>
      </div>

      {/* 🟢 The "First Design" Grid (3 Cards) - Updated with US Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1: 24-Hour Rule */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">24-Hour Risk-Free</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
                As per US DOT regulations, you can cancel any booking within 24 hours of purchase for a full refund, provided the flight is at least 7 days away.
            </p>
        </div>

        {/* Card 2: Processing Time */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <Clock className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Processing Time</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
                Refunds typically appear on your US bank statement within 1-2 billing cycles (approx. 7-14 business days) after airline approval.
            </p>
        </div>

        {/* Card 3: Penalties */}
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-amber-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Airline Penalties</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
                After the 24-hour window, standard airline penalties ($100-$300+) apply. Basic Economy fares are usually non-refundable.
            </p>
        </div>
      </div>

      {/* Detailed Policy Content */}
      <div className="space-y-8 text-slate-700 leading-relaxed border-t border-slate-200 pt-10">
        
        <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Cancellation Process</h3>
            <p>
                To initiate a cancellation, you must submit a request via our support portal or email us at <span className="font-semibold">support@flybismillah.com</span>. For flights departing from the US, we recommend cancelling at least <strong>24 hours before departure</strong> to avoid "No-Show" penalties.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Refund Calculation (USD)</h3>
            <p>
                Your refund amount is calculated based on the fare rules of the specific airline.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl mt-3 font-mono text-sm border border-slate-200">
                Refund = Total Paid (USD) - (Airline Penalty + Flybismillah Service Fee $30)
            </div>
            <p className="text-sm text-slate-500 mt-2 italic">
                *Service fees charged by Flybismillah at the time of booking are non-refundable.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Non-Refundable Tickets</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Promotional or "Saver" fares are generally non-refundable.</li>
                <li>If a passenger is a "No-Show" at the airport.</li>
                <li>Visa denials do not guarantee a full refund (subject to airline waivers).</li>
            </ul>
        </section>

        <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Involuntary Cancellations</h3>
            <p>
                If an airline cancels a flight or significantly changes the schedule (e.g., a delay of 4+ hours for international flights), you are entitled to a full refund under US laws, regardless of the ticket type.
            </p>
        </section>

      </div>

      {/* Contact CTA (Dark Style from First Design) */}
      <div className="mt-12 bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
            <h4 className="text-xl font-bold mb-1">Need to request a refund?</h4>
            <p className="text-slate-400 text-sm">Our US support team is available Mon-Fri, 9 AM - 6 PM EST.</p>
        </div>
        <a href="mailto:support@flybismillah.com" className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Contact Support
        </a>
      </div>

    </div>
  );
}