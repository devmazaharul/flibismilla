'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Plus, Search, MoreHorizontal, Eye, 
  Pencil, Trash2, Power, MapPin, X, Loader2, AlertTriangle, 
  Globe, Calendar, DollarSign, Tag, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface Destination {
  _id: string;
  name: string;
  country: string;
  slug: string;
  image: string;
  rating: number;
  reviews: number;
  isActive: boolean;
  currency: string;
  bestTime: string;
  description?: string;
  attractions?: string[];
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for Modals & Menus
  const [viewData, setViewData] = useState<Destination | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null); 
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); 
  
  // Click Outside to close menu logic
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 1. Fetch Data (API Call) ---
  const fetchDestinations = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/destinations');
      if (data.success) {
        setDestinations(data.data);
      }
    } catch (error) {
      toast.error("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  // --- 2. Action Handlers ---

  // Toggle Status API
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await axios.patch(`/api/dashboard/destinations/${id}`, {
        isActive: !currentStatus
      });
      if (data.success) {
        toast.success(currentStatus ? "Destination Hidden" : "Destination Published");
        fetchDestinations(); // Refresh Data
        setOpenMenuId(null);
      }
    } catch (error: any) {
    toast.error(error?.response?.data?.message || "Status update failed");
    }
  };

  // Delete API
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/dashboard/destinations/${deleteId}`);
      setDestinations(prev => prev.filter(item => item._id !== deleteId));
      toast.success("Destination deleted successfully");
      setDeleteId(null);
      setOpenMenuId(null);
    } catch (error: any) {
       toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  // --- 3. Filter Logic ---
  const filteredDestinations = destinations.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Styles
  const cardClass = "bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 overflow-hidden";
  const btnClass = "w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-2 cursor-pointer";

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 font-sans text-gray-900" onClick={() => setOpenMenuId(null)}>
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" onClick={(e) => e.stopPropagation()}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your travel locations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search destinations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 rounded-xl border border-gray-200/70 bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition shadow-2xl shadow-gray-100 text-sm"
            />
          </div>

          <Link href="/admin/destinations/create">
            <button className="flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition shadow-lg shadow-gray-200 cursor-pointer">
              <Plus size={16} />
              Add Destination
            </button>
          </Link>
        </div>
      </div>

      {/* --- Table --- */}
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDestinations.length > 0 ? (
                  filteredDestinations.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition">
                      
                      {/* Name & Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                            <span className="text-xs text-gray-400">ID: {item._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {item.country}</div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="text-yellow-500 mr-1">★</span> {item.rating} <span className="text-xs text-gray-400 font-normal">({item.reviews})</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${item.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {item.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === item._id ? null : item._id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === item._id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-8 top-12 z-50 w-48 bg-white rounded-xl shadow-2xl shadow-gray-200 border border-gray-200/70 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                          >
                            <button onClick={() => { setViewData(item); setOpenMenuId(null); }} className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-blue-600`}>
                              <Eye size={16} /> View Details
                            </button>

                            <Link href={`/admin/destinations/edit?id=${item._id}`} onClick={() => setOpenMenuId(null)}>
                              <div className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900`}>
                                <Pencil size={16} /> Edit Data
                              </div>
                            </Link>

                            <button onClick={() => handleToggleStatus(item._id, item.isActive)} className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-orange-600`}>
                              <Power size={16} /> {item.isActive ? 'Unpublish' : 'Publish'}
                            </button>

                            <div className="h-px bg-gray-100 my-1"></div>

                            <button onClick={() => { setDeleteId(item._id); setOpenMenuId(null); }} className={`${btnClass} text-red-500 hover:bg-red-50`}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                         <Globe size={32} className="opacity-20" />
                         <p className="text-sm">No destinations found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Delete Confirmation Modal --- */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-6 scale-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Destination?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Are you sure you want to delete this? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => setDeleteId(null)}
                className="py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition shadow-lg shadow-red-100 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FIXED View Modal --- */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden scale-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* 1. Header with Image & Cross Button */}
            <div className="relative h-56 w-full flex-shrink-0">
              <img src={viewData.image} alt={viewData.name} className="w-full h-full object-cover" />
              
              {/* Close Button (Top Right) */}
              <button 
                onClick={() => setViewData(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition cursor-pointer shadow-sm z-10"
              >
                <X size={18} />
              </button>

              {/* Title Overlay (Bottom) */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-sm border ${viewData.isActive ? 'bg-green-500/20 text-green-100 border-green-500/30' : 'bg-white/20 text-white border-white/10'}`}>
                      {viewData.isActive ? 'Active' : 'Hidden'}
                    </span>
                 </div>
                 <h2 className="text-xl font-bold text-white leading-tight">{viewData.name}</h2>
                 <div className="flex items-center gap-2 text-gray-300 text-xs mt-1">
                    <MapPin size={12} /> {viewData.country}
                 </div>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div className="p-6 overflow-y-auto">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                       <DollarSign size={12}/> Currency
                    </div>
                    <p className="text-sm font-bold text-gray-900">{viewData.currency}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                       <Calendar size={12}/> Best Time
                    </div>
                    <p className="text-sm font-bold text-gray-900">{viewData.bestTime}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Tag size={14} className="text-gray-400"/> About Destination
                 </h3>
                 <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewData.description || "No description provided for this destination."}
                 </p>
              </div>

              {/* Attractions */}
              <div>
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-gray-400"/> Key Attractions
                 </h3>
                 <div className="grid grid-cols-1 gap-2">
                    {viewData.attractions && viewData.attractions.length > 0 ? (
                       viewData.attractions.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                             <span className="text-sm text-gray-700 font-medium">{item}</span>
                          </div>
                       ))
                    ) : (
                       <p className="text-sm text-gray-400 italic">No attractions listed.</p>
                    )}
                 </div>
              </div>

            </div>

            {/* 3. Footer (Edit Button) */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-shrink-0">
               <Link href={`/admin/destinations/edit?id=${viewData._id}`} className="w-full">
                  <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition cursor-pointer shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit Destination
                  </button>
               </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}