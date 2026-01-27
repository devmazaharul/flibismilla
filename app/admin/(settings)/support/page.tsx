'use client';

import { useState } from 'react';
import axios from 'axios';
import { 
  Mail, Send, Phone, MapPin, 
  HelpCircle, MessageSquare, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight
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
} from "@/components/ui/accordion";
import { websiteDetails } from '@/constant/data';

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('/api/dashboard/support/send-email', formData);
      if (data.success) {
        toast.success("Email sent successfully!");
        setFormData({ to: '', subject: '', message: '' }); // Reset form
      }
    } catch (error) {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
            <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-sm text-gray-500">Contact us or send emails to your customers.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Email Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">Compose Email</h2>
                        <p className="text-xs text-gray-500">Send a direct message to users or support.</p>
                    </div>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSendEmail} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">Recipient Email</Label>
                                <Input 
                                    placeholder="client@example.com" 
                                    type="email"
                                    required
                                    className="rounded-lg h-11 focus:ring-1 focus:ring-blue-500"
                                    value={formData.to}
                                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">Subject Line</Label>
                                <Input 
                                    placeholder="Regarding project update..." 
                                    required
                                    className="rounded-lg h-11 focus:ring-1 focus:ring-blue-500"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700">Message Body</Label>
                            <Textarea 
                                placeholder="Type your message here..." 
                                required
                                className="min-h-[200px] rounded-lg p-4 resize-none focus:ring-1 focus:ring-blue-500"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="h-11 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-lg shadow-gray-200 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2"/>}
                                Send Email
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
          </div>

          {/* Right Column: Contact Info & FAQ */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h3 className="font-semibold text-lg mb-1">Need Urgent Help?</h3>
                <p className="text-gray-400 text-xs mb-6">Our support team is available 24/7.</p>
                
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
                        <Phone className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-xs text-gray-400">Call Us</p>
                            <p className="font-medium text-sm">{websiteDetails.whatsappNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-xs text-gray-400">Location</p>
                            <p className="font-medium text-sm">{websiteDetails.address}</p>
                        </div>
                    </div>
                   
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Common Questions</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline py-3">
                            How to reset admin password?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                            Go to Team Settings, click on the three dots beside the user, and select "Reset Password".
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-b-0">
                        <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline py-3">
                            Can I undo a user deletion?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                            No, once a user is deleted, the action is permanent and cannot be recovered.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-b-0">
                        <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:no-underline py-3">
                            Email limits per day?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-gray-500 leading-relaxed">
                            Currently, you can send up to 500 emails per day through this dashboard.
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