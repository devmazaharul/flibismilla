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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { websiteDetails } from '@/constant/data';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
              Dashboard · Support
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              Help & Support
            </h1>
            <p className="text-xs text-gray-500">
              Contact customers or reach our internal support team.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Email Form */}
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-100">
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-slate-50/70 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Compose Email
                  </h2>
                  <p className="text-xs text-gray-500">
                    Send a direct email to your customers from the dashboard.
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-5">
                <form onSubmit={handleSendEmail} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">
                        Recipient Email
                      </Label>
                      <Input
                        placeholder="client@example.com"
                        type="email"
                        required
                        className="h-11 rounded-lg border-gray-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        value={formData.to}
                        onChange={(e) =>
                          setFormData({ ...formData, to: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">
                        Subject Line
                      </Label>
                      <Input
                        placeholder="Regarding your booking..."
                        required
                        className="h-11 rounded-lg border-gray-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">
                      Message Body
                    </Label>
                    <Textarea
                      placeholder="Type your message here..."
                      required
                      className="min-h-[220px] resize-none rounded-lg border-gray-200 bg-slate-50 p-4 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                    <p className="text-[11px] text-gray-400">
                      This email will be sent from your configured support
                      address.
                    </p>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-8 text-sm font-medium text-white shadow-2xl shadow-gray-200 transition-all hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>{loading ? 'Sending…' : 'Send Email'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Info & FAQ */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-2xl shadow-slate-900/40">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

              <div className="relative z-10">
                <h3 className="text-lg font-semibold">Need urgent help?</h3>
                <p className="mt-1 text-xs text-slate-300">
                  Our support team is available 24/7 for critical issues.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-3 text-sm text-slate-50 transition hover:bg-white/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Call / WhatsApp
                      </p>
                      <p className="text-sm font-medium">
                        {websiteDetails.whatsappNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-3 text-sm text-slate-50 transition hover:bg-white/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Office
                      </p>
                      <p className="text-sm font-medium">
                        {websiteDetails.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-2xl shadow-gray-100">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Common Questions
                </h3>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
                    How to reset admin password?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                    Go to <strong>Team Settings</strong>, click on the three
                    dots beside the user, and select <strong>“Reset Password”</strong>.
                    A password reset email will be sent automatically.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b-0">
                  <AccordionTrigger className="py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
                    Can I undo a user deletion?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                    No. For security reasons, once a user is deleted, the action
                    is permanent and cannot be recovered. Create a new user
                    instead.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b-0">
                  <AccordionTrigger className="py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline">
                    What are the daily email limits?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                    By default, you can send up to <strong>500 emails per day</strong>{' '}
                    from this dashboard. For higher limits, please contact
                    support to upgrade your plan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}