'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { 
   X, Image as ImageIcon, MapPin, Globe, Star, 
  Calendar, DollarSign, Languages, ArrowLeft, Layers, Loader2, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils'; 
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DestinationformSchema, DestinationFormValues } from '../../validation/destination'; // Ensure path is correct
import { generatedSlug } from '../../utils/main'; // Ensure path is correct


export default function CreateDestinationForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Local State for Inputs
  const [attractions, setAttractions] = useState<string[]>([]);
  const [attractionInput, setAttractionInput] = useState('');
  
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryInput, setGalleryInput] = useState('');

  const { 
    register, handleSubmit, setValue, watch, formState: { errors } 
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(DestinationformSchema),
    defaultValues: {
      rating: 5.0, // Default Value
      reviews: 0,  // Default Value
      isActive: true,
      attractions: [],
      gallery: []
    }
  });

  const nameValue = watch('name');
  const imageValue = watch('image');
  const isActive = watch('isActive');

  // 1. Auto Slug Generator
  useEffect(() => {
    if (nameValue) {
      const slug = generatedSlug(nameValue);
      setValue('slug', slug);
    }
  }, [nameValue, setValue]);

  // 2. Attraction Handler
  const addAttraction = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && attractionInput.trim()) {
      e.preventDefault();
      if (!attractions.includes(attractionInput)) {
        const newTags = [...attractions, attractionInput];
        setAttractions(newTags);
        setValue('attractions', newTags);
        setAttractionInput('');
      }
    }
  };

  const removeAttraction = (tag: string) => {
    const newTags = attractions.filter(t => t !== tag);
    setAttractions(newTags);
    setValue('attractions', newTags);
  };

  // 3. Gallery Handler
  const addGalleryImage = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault(); 
    if (galleryInput.trim()) {
      const newImages = [...galleryImages, galleryInput];
      setGalleryImages(newImages);
      setValue('gallery', newImages);
      setGalleryInput('');
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    setValue('gallery', newImages);
  };

  // --- Submit Handler ---
  const onSubmit = async (data: DestinationFormValues) => {
    setLoading(true);
    try {
      // ✅ No need to hardcode rating/reviews anymore, they come from the form
      const response = await axios.post('/api/dashboard/destinations', data);

      if (response.data.success) {
        toast.success("Destination created successfully!");
        router.push('/admin/destinations');
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reusable Styles
  const cardClass = "bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/80 overflow-hidden";
  const labelClass = "text-sm font-medium text-gray-700 flex gap-1";
  const requiredStar = <span className="text-red-500">*</span>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans text-gray-900">
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <Button variant={"outline"} type="button" className='cursor-pointer shadow-2xl shadow-gray-100 border border-gray-100' onClick={() => router.back()}>
                <ArrowLeft size={20} />
             </Button>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Destination</h1>
               <p className="text-sm text-gray-500 mt-1">Create a new travel location for your agency.</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              className="px-6 cursor-pointer py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200/80 rounded-xl hover:bg-gray-100 transition shadow-2xl shadow-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition shadow-lg shadow-gray-200 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Create Destination"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. General Info */}
            <div className={cardClass}>
              <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Globe size={16}/></div>
                <h3 className="font-semibold text-gray-900">Core Details</h3>
              </div>
              <div className="p-8 space-y-6">
                
                <input type="hidden" {...register('slug')} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Destination Name {requiredStar}</label>
                    <input 
                      {...register('name')}
                      placeholder="e.g. Kyoto"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Country {requiredStar}</label>
                    <input 
                      {...register('country')}
                      placeholder="e.g. Japan"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none"
                    />
                    {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Description {requiredStar}</label>
                  <textarea 
                    {...register('description')}
                    rows={5}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition outline-none resize-none"
                    placeholder="Tell your customers why they should visit here..."
                  />
                  {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            {/* 2. Attractions */}
            <div className={cardClass}>
               <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md"><MapPin size={16}/></div>
                <h3 className="font-semibold text-gray-900">Attractions</h3>
              </div>
              <div className="p-8">
                <div className="flex gap-3 mb-4">
                  <input 
                    value={attractionInput}
                    onChange={(e) => setAttractionInput(e.target.value)}
                    onKeyDown={addAttraction}
                    placeholder="Add an attraction (Press Enter)"
                    className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition outline-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {attractions.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                      {tag}
                      <button type="button" onClick={() => removeAttraction(tag)} className="hover:text-purple-900 cursor-pointer">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {attractions.length === 0 && <span className="text-gray-400 text-sm italic py-2">No attractions added yet.</span>}
                </div>
              </div>
            </div>

            {/* 3. Image Gallery */}
            <div className={cardClass}>
               <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="p-1.5 bg-pink-50 text-pink-600 rounded-md"><Layers size={16}/></div>
                <h3 className="font-semibold text-gray-900">Photo Gallery</h3>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex gap-2">
                  <input 
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-pink-500 transition outline-none text-sm"
                  />
                  <Button 
                    type="button"
                    onClick={addGalleryImage}
                    className="bg-gray-900 cursor-pointer"
                  >
                    Add
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {galleryImages.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {galleryImages.length === 0 && (
                    <div className="col-span-4 py-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                      Add photos to create a gallery
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-6">
            
            {/* Publish Card */}
            <div className={cardClass}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900">Status</span>
                  <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200")}>
                    {isActive ? "ACTIVE" : "DRAFT"}
                  </div>
                </div>
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition">
                   <span className="text-sm text-gray-600">Publish to website</span>
                   <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-gray-900 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                   </div>
                </label>
              </div>
            </div>

             {/* 🔥 NEW: Rating & Review Card */}
             <div className={cardClass}>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex gap-1">Social Proof</h3>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex gap-1">RATING</label>
                      <div className="relative">
                        <Star size={14} className="absolute left-3 top-3 text-yellow-500 fill-yellow-500"/>
                        <input 
                           type="number"
                           step="0.1"
                           min="0"
                           max="5"
                           {...register('rating', { valueAsNumber: true })} 
                           className="w-full h-10 pl-9 pr-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition" 
                        />
                      </div>
                      {errors.rating && <p className="text-red-500 text-xs">{errors.rating.message}</p>}
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 flex gap-1">REVIEWS</label>
                      <div className="relative">
                        <MessageCircle size={14} className="absolute left-3 top-3 text-gray-400"/>
                        <input 
                           type="number"
                           min="0"
                           {...register('reviews',{ valueAsNumber: true })} 
                           className="w-full h-10 pl-9 pr-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition" 
                        />
                      </div>
                      {errors.reviews && <p className="text-red-500 text-xs">{errors.reviews.message}</p>}
                   </div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className={cardClass}>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex gap-1">Cover Image {requiredStar}</h3>
                
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
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <ImageIcon size={24} className="mb-2 opacity-50"/>
                    <span className="text-xs">No cover image</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500">IMAGE URL</label>
                  <input 
                    {...register('image')}
                    placeholder="https://"
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-gray-900 transition outline-none"
                  />
                  {errors.image && <p className="text-red-500 text-xs">{errors.image.message}</p>}
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className={cardClass}>
              <div className="p-6 space-y-5">
                <h3 className="font-semibold text-gray-900 text-sm">Trip Details</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 flex gap-1">BEST TIME {requiredStar}</label>
                    <div className="relative">
                       <Calendar size={14} className="absolute left-3 top-3 text-gray-400"/>
                       <input {...register('bestTime')} className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition" placeholder="e.g. Winter" />
                    </div>
                    {errors.bestTime && <p className="text-red-500 text-xs">{errors.bestTime.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-500 flex gap-1">CURRENCY {requiredStar}</label>
                         <div className="relative">
                           <DollarSign size={14} className="absolute left-3 top-3 text-gray-400"/>
                           <input {...register('currency')} className="w-full h-10 pl-8 pr-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition" placeholder="USD" />
                         </div>
                         {errors.currency && <p className="text-red-500 text-xs">{errors.currency.message}</p>}
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-500 flex gap-1">LANGUAGE {requiredStar}</label>
                         <div className="relative">
                           <Languages size={14} className="absolute left-3 top-3 text-gray-400"/>
                           <input {...register('language')} className="w-full h-10 pl-8 pr-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 outline-none transition" placeholder="EN" />
                         </div>
                         {errors.language && <p className="text-red-500 text-xs">{errors.language.message}</p>}
                      </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}