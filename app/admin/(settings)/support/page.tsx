'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Mail,
  Send,
  Phone,
  MapPin,
  HelpCircle,
  Loader2,
  Sparkles,
  Shield,
  MessageSquare,
  AtSign,
  FileText,
  AlignLeft,
  CheckCircle2,
  Zap,
  Headphones,
  ArrowUpRight,
  Info,
  CreditCard,
  Ticket,
  Plane,
  PhoneCall,
  AlertCircle,
  Clock,
  Receipt,
  UserCheck,
  RefreshCcw,
  Ban,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { websiteDetails } from '@/constant/data';

// ─── Template Data ───
const EMAIL_TEMPLATES = [
  {
    title: 'Booking Confirmed',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    subject: 'Your Booking is Confirmed ✅',
    body: `Dear Valued Customer,

We are pleased to inform you that your booking has been confirmed successfully.

Booking Details:
- Booking Reference: [REF_NUMBER]
- Date: [DATE]
- Status: Confirmed

Please keep this email for your records. If you have any questions, feel free to reach out.

Thank you for choosing our service.

Best regards,
Support Team`,
  },
  {
    title: 'Ticket Issued',
    icon: Ticket,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    subject: 'Your E-Ticket Has Been Issued 🎫',
    body: `Dear Customer,

Great news! Your e-ticket has been issued successfully.

Ticket Details:
- Ticket Number: [TICKET_NUMBER]
- PNR: [PNR_CODE]
- Passenger Name: [PASSENGER_NAME]
- Route: [ORIGIN] → [DESTINATION]
- Travel Date: [DATE]

Please download your ticket from the attachment or your account dashboard.

Important: Please arrive at the airport at least 3 hours before departure for international flights.

Best regards,
Support Team`,
  },
  {
    title: 'Payment Received',
    icon: CreditCard,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    subject: 'Payment Received Successfully 💳',
    body: `Dear Customer,

We have successfully received your payment. Here are the details:

Payment Details:
- Amount: [AMOUNT]
- Transaction ID: [TXN_ID]
- Payment Method: [METHOD]
- Date: [DATE]

Your booking is now being processed. You will receive a confirmation shortly.

Thank you for your payment.

Best regards,
Finance Team`,
  },
  {
    title: 'Payment Reminder',
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    subject: 'Payment Reminder - Action Required ⚠️',
    body: `Dear Customer,

This is a friendly reminder that your payment is still pending.

Booking Details:
- Booking Reference: [REF_NUMBER]
- Amount Due: [AMOUNT]
- Due Date: [DATE]

Please complete the payment at your earliest convenience to avoid cancellation.

If you have already made the payment, please disregard this message.

Best regards,
Support Team`,
  },
  {
    title: 'Flight Information',
    icon: Plane,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    subject: 'Your Flight Information & Details ✈️',
    body: `Dear Customer,

Here are your flight details:

Flight Information:
- Flight: [AIRLINE] [FLIGHT_NUMBER]
- Route: [ORIGIN] → [DESTINATION]
- Departure: [DATE] at [TIME]
- Arrival: [ARRIVAL_TIME]
- Terminal: [TERMINAL]
- Seat: [SEAT_NUMBER]
- Baggage: [BAGGAGE_INFO]

Important Reminders:
✅ Carry a valid photo ID / Passport
✅ Check-in opens 24 hours before departure
✅ Arrive at least 3 hours early for international flights

Have a safe journey!

Best regards,
Support Team`,
  },
  {
    title: 'Reach Out / Follow-up',
    icon: PhoneCall,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    subject: 'Following Up on Your Recent Inquiry 📞',
    body: `Dear Customer,

Thank you for reaching out to us. We wanted to follow up on your recent inquiry.

We value your time and want to ensure all your questions are answered. Please let us know if you need any further assistance.

You can reach us via:
📞 Phone: [PHONE_NUMBER]
📧 Email: [EMAIL]
💬 WhatsApp: [WHATSAPP]

Our team is available 24/7 to help you.

Best regards,
Support Team`,
  },
  {
    title: 'Refund Processed',
    icon: RefreshCcw,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-100',
    subject: 'Your Refund Has Been Processed 💰',
    body: `Dear Customer,

We are writing to confirm that your refund has been processed successfully.

Refund Details:
- Refund Amount: [AMOUNT]
- Original Booking: [REF_NUMBER]
- Refund Method: [METHOD]
- Expected Credit: 5-10 business days

Please note that the refund may take up to 10 business days to reflect in your account depending on your bank.

If you don't see the refund after 10 business days, please contact us.

Best regards,
Finance Team`,
  },
  {
    title: 'Booking Cancelled',
    icon: Ban,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    subject: 'Booking Cancellation Confirmation ❌',
    body: `Dear Customer,

As per your request, your booking has been cancelled.

Cancellation Details:
- Booking Reference: [REF_NUMBER]
- Cancellation Date: [DATE]
- Refund Status: [REFUND_STATUS]

If a refund is applicable, it will be processed within 5-10 business days.

If this cancellation was made in error, please contact us immediately.

Best regards,
Support Team`,
  },
  {
    title: 'Invoice / Receipt',
    icon: Receipt,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    subject: 'Your Invoice / Payment Receipt 🧾',
    body: `Dear Customer,

Please find your invoice details below:

Invoice Details:
- Invoice Number: [INVOICE_NUMBER]
- Amount: [AMOUNT]
- Date: [DATE]
- Service: [SERVICE_DESCRIPTION]
- Payment Status: Paid ✅

For your records, a PDF copy is attached to this email.

Thank you for your business.

Best regards,
Finance Team`,
  },
  {
    title: 'Welcome / Onboarding',
    icon: UserCheck,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    subject: 'Welcome Aboard! 🎉',
    body: `Dear [CUSTOMER_NAME],

Welcome! We're thrilled to have you with us.

Your account has been created successfully. Here's how to get started:

1️⃣ Log in to your dashboard
2️⃣ Complete your profile
3️⃣ Explore our services

If you need any help, our support team is just a message away.

We look forward to serving you!

Warm regards,
The Team`,
  },
  {
    title: 'Feedback Request',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
    subject: 'We Value Your Feedback ⭐',
    body: `Dear Customer,

We hope you had a great experience with our service. Your feedback means a lot to us!

Could you spare a moment to share your thoughts?

⭐ How was your overall experience?
⭐ Was our team helpful?
⭐ Any suggestions for improvement?

Simply reply to this email with your feedback, or click the link below:
[FEEDBACK_LINK]

Thank you for helping us improve!

Best regards,
Customer Experience Team`,
  },
  {
    title: 'Schedule Change',
    icon: Clock,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    subject: 'Important: Flight Schedule Change ⏰',
    body: `Dear Customer,

We regret to inform you that there has been a schedule change for your upcoming flight.

Updated Details:
- Flight: [AIRLINE] [FLIGHT_NUMBER]
- Original Departure: [OLD_TIME]
- New Departure: [NEW_TIME]
- Route: [ORIGIN] → [DESTINATION]

Please review the updated schedule. If this doesn't work for you, please contact us for alternatives.

We apologize for any inconvenience.

Best regards,
Support Team`,
  },
];

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        '/api/dashboard/support',
        formData
      );
      if (data.success) {
        toast.success('Email sent successfully!');
        setFormData({ to: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      message: template.body,
    }));
    toast.success(`"${template.title}" template applied`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gray-900 blur-lg opacity-10" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-900 shadow-lg shadow-gray-900/10">
                <Headphones className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Dashboard
                </p>
                <span className="text-gray-200">/</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">
                  Support
                </p>
              </div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Help & Support Center
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* ═══ LEFT: EMAIL FORM ═══ */}
          <div className="xl:col-span-8 space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-100/40">
              <div className="h-[3px] w-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-md shadow-gray-900/10">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">
                      Compose Email
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      Send direct email to customers
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-extrabold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 uppercase tracking-[0.15em]">
                  <Shield className="w-3 h-3 text-gray-400" />
                  Encrypted
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <form onSubmit={handleSendEmail} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        <AtSign className="w-3 h-3" />
                        Recipient Email
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-gray-900 transition-colors duration-300" />
                        <Input
                          placeholder="client@example.com"
                          type="email"
                          required
                          className="
                            h-12 pl-11 rounded-xl
                            border-2 border-gray-100 bg-gray-50/50
                            text-sm font-medium
                            placeholder:text-gray-300
                            hover:border-gray-200
                            focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:bg-white
                            transition-all duration-300
                          "
                          value={formData.to}
                          onChange={(e) =>
                            setFormData({ ...formData, to: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        <FileText className="w-3 h-3" />
                        Subject Line
                      </Label>
                      <div className="relative group">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-gray-900 transition-colors duration-300" />
                        <Input
                          placeholder="Regarding your booking..."
                          required
                          className="
                            h-12 pl-11 rounded-xl
                            border-2 border-gray-100 bg-gray-50/50
                            text-sm font-medium
                            placeholder:text-gray-300
                            hover:border-gray-200
                            focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:bg-white
                            transition-all duration-300
                          "
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                      <AlignLeft className="w-3 h-3" />
                      Message Body
                    </Label>
                    <Textarea
                      placeholder="Write your message here..."
                      required
                      className="
                        min-h-[260px] resize-none rounded-xl
                        border-2 border-gray-100 bg-gray-50/50
                        p-4 text-sm font-medium leading-relaxed
                        placeholder:text-gray-300
                        hover:border-gray-200
                        focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:bg-white
                        transition-all duration-300
                      "
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Info className="w-3 h-3" />
                        Sent from your configured support address
                      </p>
                      {formData.message.length > 0 && (
                        <span className="text-[10px] font-mono text-gray-400">
                          {formData.message.length} chars
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
                      <span>All emails are logged</span>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="
                        h-12 cursor-pointer
                        flex items-center gap-2.5
                        rounded-xl px-8
                        bg-gray-900 hover:bg-gray-800
                        text-sm font-bold text-white
                        shadow-lg shadow-gray-900/10
                        transition-all duration-300
                        active:scale-[0.97]
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send Email</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* ═══ QUICK TEMPLATES ═══ */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-gray-100 shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gray-100 rounded-xl">
                    <Zap className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                      Quick Templates
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Click any template to auto-fill the email form
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {EMAIL_TEMPLATES.length} templates
                </span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {EMAIL_TEMPLATES.map((template, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="
                        group flex items-start gap-3
                        p-3.5 rounded-xl
                        bg-white border border-gray-100
                        hover:border-gray-300 hover:shadow-md hover:shadow-gray-100/50
                        transition-all duration-300 cursor-pointer
                        text-left active:scale-[0.98]
                      "
                    >
                      <div
                        className={`
                          w-9 h-9 rounded-xl ${template.bg} ${template.border}
                          border flex items-center justify-center
                          shrink-0 mt-0.5
                          group-hover:scale-110 transition-transform duration-300
                        `}
                      >
                        <template.icon
                          className={`w-4 h-4 ${template.color}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 group-hover:text-gray-900 truncate transition-colors">
                          {template.title}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-relaxed">
                          {template.subject.replace(/[✅🎫💳⚠️✈️📞💰❌🧾🎉⭐⏰]/g, '').trim()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="xl:col-span-4 space-y-5">
            {/* ═══ CONTACT CARD ═══ */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-900">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-gray-700/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gray-700/20 rounded-full blur-2xl" />
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:20px_20px]" />

              <div className="relative p-6 z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.06]">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      Need urgent help?
                    </h3>
                    <p className="text-[11px] text-white/40 font-medium">
                      24/7 support available
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <a
                    href={`tel:${websiteDetails.whatsappNumber}`}
                    className="
                      flex items-center gap-3.5
                      rounded-xl bg-white/[0.04] border border-white/[0.06]
                      px-4 py-3.5
                      hover:bg-white/[0.07]
                      transition-all duration-300 group
                    "
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/25">
                        Call / WhatsApp
                      </p>
                      <p className="text-sm font-bold text-white/80 truncate">
                        {websiteDetails.whatsappNumber}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                  </a>

                  <a
                    href={`mailto:${websiteDetails.email || 'support@example.com'}`}
                    className="
                      flex items-center gap-3.5
                      rounded-xl bg-white/[0.04] border border-white/[0.06]
                      px-4 py-3.5
                      hover:bg-white/[0.07]
                      transition-all duration-300 group
                    "
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/25">
                        Email Support
                      </p>
                      <p className="text-sm font-bold text-white/80 truncate">
                        {websiteDetails.email || 'support@example.com'}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                  </a>

                  <div className="
                    flex items-start gap-3.5
                    rounded-xl bg-white/[0.04] border border-white/[0.06]
                    px-4 py-3.5
                  ">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/25">
                        Office
                      </p>
                      <p className="text-sm font-bold text-white/80 leading-relaxed">
                        {websiteDetails.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

    
            {/* ═══ TIP ═══ */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xl shadow-gray-100 shrink-0">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 mb-1">
                    Admin Tip
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Replace placeholders like{' '}
                    <code className="text-[10px] bg-gray-200 px-1 py-0.5 rounded font-mono text-gray-700">
                      [REF_NUMBER]
                    </code>{' '}
                    with actual booking data before sending.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}