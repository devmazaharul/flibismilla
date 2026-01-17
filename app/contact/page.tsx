'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { contactPageData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';

import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { contactFormSchema, ContactFormValues } from '@/validation/zod';
import { toast } from 'sonner';

const ContactPage = () => {
    const { colors, layout, typography, button } = appTheme;
    const [isSubmitting] = useState(false);

    // React Hook Form Setup
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
    });

    // Form Submit Handler
    const onSubmit = async (data: ContactFormValues) => {
        try {
            const message = `*___ New Form Submission ___*

*Name:* ${data.name}
*Contact:* ${data.phone}
*Email:* ${data.email}

*Subject:* ${data.subject}
*Message:* ${data.message}`;

            const whatsappNumber = '12139858499';
            const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;

            //open whatsapp link
            window.open(whatsappURL, '_blank');
        } catch (error) {
            toast.error('Failed to send message. Please try again later.');
        }
    };

    // Icon Helper
    const getIcon = (icon: string) => {
        const style = 'text-xl text-white';
        switch (icon) {
            case 'map':
                return <FaMapMarkerAlt className={style} />;
            case 'phone':
                return <FaPhoneAlt className={style} />;
            default:
                return <FaEnvelope className={style} />;
        }
    };

    return (
        <main className="bg-gray-50 min-h-screen pt-10 pb-20">
            {/* ================= Header Section ================= */}
            <section className={`${layout.container} text-center mb-16`}>
                <span className={`${typography.subtitle} block mb-3`}>Contact Us</span>
                <h1 className={`${typography.h2} ${colors.text.heading} mb-4`}>
                    {contactPageData.header.title}
                </h1>
                <p className={`${colors.text.body} max-w-2xl mx-auto`}>
                    {contactPageData.header.subtitle}
                </p>
            </section>

            <div className={`${layout.container} grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20`}>
                {/* ================= Left Side: Info Cards ================= */}
                <div className="space-y-8">
                    {/* Locations */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-rose-600 pl-4">
                            Our Locations
                        </h3>
                        {contactPageData.info.locations.map((loc) => (
                            <div
                                key={loc.id}
                                className="flex gap-4 bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 transition-shadow"
                            >
                                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                    {getIcon(loc.icon)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800 mb-1">
                                        {loc.city}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed">{loc.address}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Methods */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-rose-600 pl-4">
                            Contact Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {contactPageData.info.contacts.map((contact) => (
                                <a
                                    key={contact.id}
                                    href={contact.link}
                                    target="_blank"
                                    className="flex flex-col items-center text-center bg-white p-6 rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 hover:border-rose-200 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-12 h-12 bg-gray-900 group-hover:bg-rose-600 rounded-full flex items-center justify-center mb-4 transition-colors duration-300">
                                        {getIcon(contact.icon)}
                                    </div>
                                    <h4 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">
                                        {contact.label}
                                    </h4>
                                    <p className="text-lg font-bold text-gray-900 group-hover:text-rose-600 transition-colors break-all">
                                        {contact.value}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= Right Side: Contact Form ================= */}
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-100 border border-gray-200/70 relative overflow-hidden">
                    {/* Decorative Blob */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0"></div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">
                        Send us a Message
                    </h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                        {/* Name & Phone Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    {...register('name')}
                                    className={`w-full capitalize p-3 rounded-lg border bg-gray-50 focus:bg-white transition-all outline-none ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'}`}
                                    placeholder="John Doe"
                                />
                                {errors.name && (
                                    <span className="text-xs text-red-500">
                                        {errors.name.message}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    {...register('phone')}
                                    className={`w-full p-3 rounded-lg border bg-gray-50 focus:bg-white transition-all outline-none ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'}`}
                                    placeholder="+1 213..."
                                />
                                {errors.phone && (
                                    <span className="text-xs text-red-500">
                                        {errors.phone.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Email Address
                            </label>
                            <input
                                {...register('email')}
                                className={`w-full p-3 rounded-lg border bg-gray-50 focus:bg-white lowercase transition-all outline-none ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'}`}
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <span className="text-xs text-red-500">{errors.email.message}</span>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold  text-gray-700">Subject</label>
                            <input
                                {...register('subject')}
                                className={`w-full p-3 capitalize rounded-lg border bg-gray-50 focus:bg-white transition-all outline-none ${errors.subject ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'}`}
                                placeholder="Package Inquiry"
                            />
                            {errors.subject && (
                                <span className="text-xs text-red-500">
                                    {errors.subject.message}
                                </span>
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Message</label>
                            <textarea
                                {...register('message')}
                                rows={4}
                                className={`w-full p-3 capitalize rounded-lg border bg-gray-50 focus:bg-white transition-all outline-none resize-none ${errors.message ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'}`}
                                placeholder="Tell us about your travel plans..."
                            />
                            {errors.message && (
                                <span className="text-xs text-red-500">
                                    {errors.message.message}
                                </span>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className={`w-full h-12 text-lg ${button.primary}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                'Sending...'
                            ) : (
                                <span className="flex items-center gap-2">
                                    Send Message <FaPaperPlane className="text-sm" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default ContactPage;
