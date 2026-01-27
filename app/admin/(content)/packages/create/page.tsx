'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Save, Image as ImageIcon, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import Updated Schema
import { PackageFormValues, packageSchema } from '../../validation/package';
import { PACKAGE_LIMITS } from '@/app/admin/helper/constant';

export default function CreatePackagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false); // To track broken images

  // 1. Form Setup
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: "",
      price: 0,
      category: "",
      location: "Makkah & Madinah",
      imageUrl: "",
      description: "",
      included: [{ value: "Round Trip Airfare" }, { value: "Hajj Visa & Insurance" }],
    },
    mode: "onChange",
  } as any);

  const { fields, append, remove } = useFieldArray({
    name: "included",
    control: form.control,
  });

  // Watch values for counters/previews
  const watchedTitle = form.watch("title");
  const watchedDesc = form.watch("description");
  const watchedImage = form.watch("imageUrl");

  const onSubmit = async (data: PackageFormValues) => {
    setIsSubmitting(true);
    try {
      const apiPayload = {
        ...data,
        included: data.included.map(item => item.value), 
      };

      const response = await fetch('/api/dashboard/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          form.setError("title", { message: "This title is already taken" });
          toast.error("Duplicate Title");
        } else {
          toast.error(result.error || "Failed to create package");
        }
        return;
      }

      toast.success("Package Published!", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />
      });
      router.push('/admin/packages'); 
      router.refresh();

    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern Card Style
  const cardStyle = "shadow-xl shadow-slate-100 border border-slate-200 bg-white rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50";

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Package</h1>
          <p className="text-slate-500 mt-1">Design a new travel experience for your customers.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* LEFT COLUMN: Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Basic Information */}
              <Card className={cardStyle}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-slate-900 rounded-full"></div>
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
                          <Input className="h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-slate-900/10" placeholder="e.g. Premium Umrah Package 2025" {...field} />
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
                                    placeholder="0.00" 
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
                            <Input className="h-11 bg-slate-50 border-slate-200 focus:bg-white" placeholder="e.g. Makkah, Madinah & Jeddah" {...field} />
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
                            placeholder="Detailed itinerary, hotel details, and schedule..." 
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

                  {fields.length < PACKAGE_LIMITS.INCLUDED_ITEMS.MAX_COUNT? (
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-6 border-dashed cursor-pointer border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full"
                        onClick={() => append({ value: "" })}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Service
                    </Button>
                  ) : (
                    <p className="text-center text-sm text-amber-600 mt-4 font-medium bg-amber-50 p-2 rounded-lg">
                        Maximum limit of 15 items reached.
                    </p>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Image Upload with Better Preview */}
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
                                    setImageError(false); // Reset error on change
                                }}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Robust Image Preview Logic */}
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
                        {/* Overlay Gradient for professionalism */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Cover Preview</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-400 p-4 text-center">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <ImageIcon className={`w-6 h-6 ${imageError ? 'text-rose-400' : 'text-slate-300'}`} />
                        </div>
                        <div className="space-y-1">
                            <p className={`text-sm font-medium ${imageError ? 'text-rose-500' : 'text-slate-500'}`}>
                                {imageError ? "Invalid Image URL" : "No image provided"}
                            </p>
                            <p className="text-xs text-slate-400">
                                {imageError ? "Please check the link" : "Enter a URL to preview"}
                            </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Floating Action Buttons */}
              <div className="sticky top-6 pt-2 space-y-3">
                 <Button 
                    type="submit" 
                    className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 h-12 text-base shadow-xl shadow-slate-200 hover:shadow-slate-300 transition-all duration-300" 
                    disabled={isSubmitting}
                 >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Publish Package
                        </>
                    )}
                 </Button>
                 
                 <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full cursor-pointer border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" 
                    onClick={() => router.back()}
                 >
                    Discard
                 </Button>
              </div>

            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}