'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Plus, Search, MoreHorizontal, Eye, 
  Pencil, Trash2, Power, X, Loader2, AlertTriangle, 
  Megaphone, MessageCircle, Type, Image as ImageIcon, Check, Star 
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface Offer {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  whatsappMessage: string;
  isLarge: boolean;
  isActive: boolean;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for Modals & Menus
  const [viewData, setViewData] = useState<Offer | null>(null);
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

  // --- 1. Fetch Data ---
  const fetchOffers = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/offers');
      if (data.success) {
        setOffers(data.data);
      }
    } catch (error) {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // --- 2. Action Handlers ---

  // Toggle Active Status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await axios.patch(`/api/dashboard/offers/${id}`, {
        isActive: !currentStatus
      });
      if (data.success) {
        toast.success(currentStatus ? "Offer Hidden" : "Offer Published");
        fetchOffers(); 
        setOpenMenuId(null);
      }
    } catch (error:any) {
     toast.error(error?.response?.data?.message || "Status update failed");
    }
  };


  const handleToggleHighlight = async (offer: Offer) => {
    try {
      const { data } = await axios.put(`/api/dashboard/offers/${offer._id}`, {
        ...offer, // Send all data back
        isLarge: !offer.isLarge // Toggle isLarge
      });
      if (data.success) {
        toast.success(offer.isLarge ? "Highlight Removed" : "Offer Highlighted");
        fetchOffers();
        setOpenMenuId(null);
      }
    } catch (error:any) {
      toast.error(error?.response?.data?.message || "Highlight update failed");
    }
  };

  // Delete Offer
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/dashboard/offers/${deleteId}`);
      setOffers(prev => prev.filter(item => item._id !== deleteId));
      toast.success("Offer deleted successfully");
      setDeleteId(null);
      setOpenMenuId(null);
    } catch (error:any) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  // --- 3. Filter Logic ---
  const filteredOffers = offers.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Styles
  const cardClass = "bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 overflow-hidden";
  const btnClass = "w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-2 cursor-pointer";

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 font-sans text-gray-900" onClick={() => setOpenMenuId(null)}>
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" onClick={(e) => e.stopPropagation()}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional offers</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search offers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 rounded-xl border border-gray-200/70 bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition shadow-2xl shadow-gray-100 text-sm"
            />
          </div>

          <Link href="/admin/offers/create">
            <button className="flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition shadow-lg shadow-gray-200 cursor-pointer">
              <Plus size={16} />
              Add Offer
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
                  <th className="px-6 py-4">Offer</th>
                  <th className="px-6 py-4">Highlight</th>
                  <th className="px-6 py-4">WhatsApp Link</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition">
                      
                      {/* Title & Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                            <span className="text-xs text-gray-400">ID: {item._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Highlight (isLarge) */}
                      <td className="px-6 py-4">
                        {item.isLarge ? (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200">
                              <Megaphone size={10} /> Featured
                           </span>
                        ) : (
                           <span className="text-xs text-gray-400 font-medium">Standard</span>
                        )}
                      </td>

                      {/* WhatsApp Message Preview */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 max-w-[200px] truncate" title={item.whatsappMessage}>
                           <MessageCircle size={14} className="text-green-500 shrink-0"/> 
                           {item.whatsappMessage}
                        </div>
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

                            <Link href={`/admin/offers/edit?id=${item._id}`} onClick={() => setOpenMenuId(null)}>
                              <div className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900`}>
                                <Pencil size={16} /> Edit Data
                              </div>
                            </Link>

                            <button onClick={() => handleToggleHighlight(item)} className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-purple-600`}>
                              <Star size={16} /> {item.isLarge ? 'Remove Highlight' : 'Highlight Offer'}
                            </button>

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
                         <Megaphone size={32} className="opacity-20" />
                         <p className="text-sm">No offers found.</p>
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
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Offer?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Are you sure you want to delete this offer? This action cannot be undone.
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

      {/* --- View Modal --- */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden scale-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header Image */}
            <div className="relative h-56 w-full flex-shrink-0">
              <img src={viewData.image} alt={viewData.title} className="w-full h-full object-cover" />
              
              <button 
                onClick={() => setViewData(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition cursor-pointer shadow-sm z-10"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-sm border ${viewData.isActive ? 'bg-green-500/20 text-green-100 border-green-500/30' : 'bg-white/20 text-white border-white/10'}`}>
                      {viewData.isActive ? 'Active' : 'Hidden'}
                    </span>
                    {viewData.isLarge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-sm border bg-purple-500/20 text-purple-100 border-purple-500/30">
                        Featured
                      </span>
                    )}
                 </div>
                 <h2 className="text-xl font-bold text-white leading-tight">{viewData.title}</h2>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto">
              
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                     <MessageCircle size={14}/> WhatsApp Auto-Reply
                  </div>
                  <p className="text-sm font-medium text-gray-800 italic">"{viewData.whatsappMessage}"</p>
              </div>

              <div>
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Type size={14} className="text-gray-400"/> Description
                 </h3>
                 <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewData.description}
                 </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-shrink-0">
               <Link href={`/admin/offers/edit?id=${viewData._id}`} className="w-full">
                  <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition cursor-pointer shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit Offer
                  </button>
               </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}