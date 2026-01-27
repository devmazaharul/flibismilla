'use client';
import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { 
  Save, X, Image as ImageIcon, Megaphone, 
  MessageCircle, ArrowLeft, Loader2, Type 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { offerformSchema, offerFormValues } from '../../validation/offer';
import { generatedSlug } from '../../utils/main';



function EditOfferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { 
    register, handleSubmit, setValue, watch, reset, formState: { errors } 
  } = useForm<offerFormValues>({
    resolver: zodResolver(offerformSchema),
    defaultValues: {
      isLarge: false,
      isActive: true,
      whatsappMessage: ""
    }
  });

  const titleValue = watch('title');
  const imageValue = watch('image');
  const isLarge = watch('isLarge');
  const isActive = watch('isActive');

  // --- 1. Fetch Existing Data ---
  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) return;
      try {
        const response = await axios.get(`/api/dashboard/offers/${offerId}`);
        if (response.data.success) {
          reset(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to load offer details");
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [offerId, reset]);

  // --- 2. Auto Slug ---
  useEffect(() => {
    if (titleValue) {
      const slug =generatedSlug(titleValue);
      setValue('slug', slug);
    }
  }, [titleValue, setValue]);

  // --- 3. Update Handler ---
  const onSubmit = async (data: offerFormValues) => {
    if (!offerId) return;
    setSaving(true);
    try {
      const response = await axios.put(`/api/dashboard/offers/${offerId}`, data);
      if (response.data.success) {
        toast.success("Offer Updated Successfully!");
        router.push('/admin/offers'); 
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Update failed";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const cardClass = "bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 overflow-hidden";
  const labelClass = "text-sm font-medium text-gray-700 flex gap-1";
  const requiredStar = <span className="text-red-500">*</span>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!offerId) return <div className="p-10 text-center text-red-500">Invalid Offer ID</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans text-gray-900">
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()} 
                className="h-10 w-10 p-0 rounded-xl border-gray-200/70 shadow-2xl shadow-gray-100 cursor-pointer"
             >
                <ArrowLeft size={20} className="text-gray-600" />
             </Button>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Offer</h1>
               <p className="text-sm text-gray-500 mt-1">Update campaign details for {titleValue}</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              className="px-6 border-gray-200/70 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={saving}
              className="px-8 bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className={cardClass}>
              <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Megaphone size={16}/></div>
                <h3 className="font-semibold text-gray-900">Offer Details</h3>
              </div>
              <div className="p-8 space-y-6">
                
                <input type="hidden" {...register('slug')} />

                <div className="space-y-2">
                  <label className={labelClass}><Type size={14} className="text-gray-400"/> Offer Title {requiredStar}</label>
                  <input 
                    {...register('title')}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none"
                  />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Description {requiredStar}</label>
                  <textarea 
                    {...register('description')}
                    rows={4}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none resize-none"
                  />
                  {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}><MessageCircle size={14} className="text-gray-400"/> WhatsApp Message {requiredStar}</label>
                  <input 
                    {...register('whatsappMessage')}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none"
                  />
                  {errors.whatsappMessage && <p className="text-red-500 text-xs">{errors.whatsappMessage.message}</p>}
                </div>

              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className={cardClass}>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex gap-1">Display Settings</h3>
                
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition group">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-gray-900">Active Status</span>
                     <span className="text-xs text-gray-500">{isActive ? 'Visible to users' : 'Hidden from site'}</span>
                   </div>
                   <input type="checkbox" {...register('isActive')} className="w-5 h-5 accent-gray-900 cursor-pointer" />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition group">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-gray-900">Highlight Offer</span>
                     <span className="text-xs text-gray-500">Display as large banner</span>
                   </div>
                   <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" {...register('isLarge')} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-gray-900 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                   </div>
                </label>

              </div>
            </div>

            <div className={cardClass}>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex gap-1">Offer Image {requiredStar}</h3>
                
                {imageValue ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={imageValue} alt="Cover" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setValue('image', '')}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                    {isLarge && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold">Large Layout</div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <ImageIcon size={24} className="mb-2 opacity-50"/>
                    <span className="text-xs">No image provided</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">IMAGE URL</label>
                  <input 
                    {...register('image')}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 transition outline-none"
                  />
                  {errors.image && <p className="text-red-500 text-xs">{errors.image.message}</p>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditOfferPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>}>
      <EditOfferFormContent />
    </Suspense>
  );
}