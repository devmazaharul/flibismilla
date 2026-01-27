'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Save, Image as ImageIcon, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageFormValues, packageSchema } from '../../validation/package';
import { PACKAGE_LIMITS } from '@/app/admin/helper/constant';
import axios from 'axios';

// Main Component wrapped in Suspense (Required for useSearchParams)
export default function EditPackagePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EditForm />
    </Suspense>
  );
}

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id'); 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 1. Form Setup
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      title: "",
      price: 0,
      category: "",
      location: "",
      imageUrl: "",
      description: "",
      included: [{ value: "" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    name: "included",
    control: form.control,
  });

  // 2. Fetch Existing Data
  useEffect(() => {
    if (!packageId) {
      toast.error("Invalid Package ID");
      router.push('/admin/packages');
      return;
    }

    async function fetchPackageData() {
      try { 
        const data =await axios.get(`/api/dashboard/packages/${packageId}`);

        if (data.status === 200 && data.data) {
          const pkg = data.data.data;
          
          // Transform Data: DB Array ["A", "B"] -> Form Array [{value: "A"}, {value: "B"}]
          const formattedIncluded = pkg.included && pkg.included.length > 0 
            ? pkg.included.map((item: string) => ({ value: item }))
            : [{ value: "" }];

          // Reset form with fetched data
          form.reset({
            title: pkg.title,
            price: pkg.price,
            category: pkg.category,
            location: pkg.location,
            imageUrl: pkg.image, 
            description: pkg.description,
            included: formattedIncluded,
          });
        } else {
          toast.error("Package not found");
          router.push('/admin/packages');
        }
      } catch (error) {
        toast.error("Error loading package details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPackageData();
  }, [packageId, form, router]);

  // Watchers for Real-time Preview
  const watchedTitle = form.watch("title");
  const watchedDesc = form.watch("description");
  const watchedImage = form.watch("imageUrl");

  // 3. Submit Handler (UPDATE)
  const onSubmit = async (data: PackageFormValues) => {
    if (!packageId) return;
    setIsSubmitting(true);
    
    try {
      // Prepare Payload
      const apiPayload = {
        ...data,
        included: data.included, // Backend Zod Schema handles the transform
      };

      const response = await fetch(`/api/dashboard/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          form.setError("title", { message: "This title is already taken" });
          toast.error("Duplicate Title");
        } else {
          toast.error(result.message || "Update failed");
        }
        return;
      }

      toast.success("Package Updated Successfully!", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />
      });
      router.push('/admin/packages'); 
      router.refresh();

    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern Card Style
  const cardStyle = "shadow-xl shadow-slate-100 border border-slate-200 bg-white rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50";

  if (isLoading) return <LoadingSkeleton />;

    if (!packageId) {
    return <div className="p-10 text-center">Invalid ID provided.</div>;
  }
  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pt-8">
       <Button variant="outline" size="icon" className="h-8 w-10 rounded-lg bg-white shadow-2xl shadow-gray-100 border-slate-200 hover:bg-slate-50" asChild>
          <Link href="/admin/packages">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Package</h1>
          <p className="text-slate-500 mt-1">Update details for <span className="font-semibold text-slate-900">{watchedTitle || "..."}</span></p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* LEFT COLUMN: Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Basic Information */}
              <Card className={cardStyle}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-amber-500 rounded-full"></div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Package Details</CardTitle>
                        <CardDescription>Core information and pricing.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                            <FormLabel className="text-slate-700 font-semibold">Package Title</FormLabel>
                            <span className={`text-xs ${watchedTitle?.length > 100 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                {watchedTitle?.length || 0}/100
                            </span>
                        </div>
                        <FormControl>
                          <Input className="h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-slate-900/10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Price ($)</FormLabel>
                          <FormControl>
                            <div className="relative group">
                                <span className="absolute left-3 top-3 text-slate-400 font-bold group-focus-within:text-slate-900">$</span>
                                <Input 
                                    type="number" 
                                    className="pl-7 h-11 bg-slate-50 border-slate-200 focus:bg-white" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)} 
                                />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Location</FormLabel>
                          <FormControl>
                            <Input className="h-11 bg-slate-50 border-slate-200 focus:bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                            <FormLabel className="text-slate-700 font-semibold">Description</FormLabel>
                            <span className={`text-xs ${watchedDesc?.length > 3000 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                {watchedDesc?.length || 0}/3000
                            </span>
                        </div>
                        <FormControl>
                          <Textarea 
                            className="min-h-[250px] font-sans text-sm bg-slate-50 border-slate-200 focus:bg-white leading-relaxed resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="flex gap-2 items-center text-xs text-slate-500">
                          <AlertCircle className="w-3 h-3" /> Supports Markdown formatting.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. Included Services */}
              <Card className={cardStyle}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                  <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Included Services</CardTitle>
                      <CardDescription>Features included in this package.</CardDescription>
                  </div>
                  <Badge variant={fields.length >= 15 ? "destructive" : "secondary"}>
                    {fields.length} / 15 Items
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center group relative">
                        <FormField
                          control={form.control}
                          name={`included.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1 space-y-0">
                              <FormControl>
                                <div className="relative">
                                    <div className="absolute left-3 top-2.5 h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <Input className="pl-10 h-10 bg-white border-slate-200 focus:border-slate-400" placeholder="Service name" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {fields.length < PACKAGE_LIMITS.INCLUDED_ITEMS.MAX_COUNT && (
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-6 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full"
                        onClick={() => append({ value: "" })}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Service
                    </Button>
                  )}
                  
                  {form.formState.errors.included && (
                    <p className="text-sm text-rose-500 mt-2 font-medium text-center">
                      {form.formState.errors.included.message || "Please add at least one item"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Settings */}
            <div className="space-y-8">
              
              {/* Category */}
              <Card className={cardStyle}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800">Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                   <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectGroup>
                                <SelectLabel>Pilgrimage</SelectLabel>
                                <SelectItem value="Hajj">Hajj Package</SelectItem>
                                <SelectItem value="Umrah">Umrah Package</SelectItem>
                                <SelectItem value="Islamic Tour">Islamic Tour</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Travel</SelectLabel>
                                <SelectItem value="Holiday">Holiday / Vacation</SelectItem>
                                <SelectItem value="Tour">Tour Package</SelectItem>
                                <SelectItem value="Travels">Travels</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Services</SelectLabel>
                                <SelectItem value="Airlines">Airlines / Ticket</SelectItem>
                                <SelectItem value="Hotel">Hotel Booking</SelectItem>
                                <SelectItem value="Visa">Visa Service</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Other</SelectLabel>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card className={cardStyle}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-bold text-slate-800">Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Cover Image URL</FormLabel>
                        <FormControl>
                           <Input 
                                className="bg-slate-50 border-slate-200" 
                                placeholder="https://example.com/image.jpg" 
                                {...field} 
                                onChange={(e) => {
                                    field.onChange(e);
                                    setImageError(false);
                                }}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Image Preview */}
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group">
                    {watchedImage && !imageError ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={watchedImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          onError={() => setImageError(true)}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-400 p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-xs">No Preview</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="sticky top-6 pt-2 space-y-3">
                 <Button 
                    type="submit" 
                    className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 h-12 text-base shadow-xl shadow-slate-200" 
                    disabled={isSubmitting}
                 >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Update Package
                        </>
                    )}
                 </Button>
                 
                 <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-slate-200 hover:bg-rose-50 hover:text-rose-600" 
                    onClick={() => router.back()}
                 >
                    Discard Changes
                 </Button>
              </div>

            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

function LoadingSkeleton() {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
            <div className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-[150px] w-full rounded-xl" />
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}