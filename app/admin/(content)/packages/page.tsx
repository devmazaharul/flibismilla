'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios'; 
import { 
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, 
  MapPin, X, Loader2, AlertTriangle, Power, CheckCircle2, Package
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface PackageType {
  _id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  image: string;
  isFeatured: boolean; 
  description?: string;
  included?: string[];
  slug: string;
}

export default function AllPackagesPage() {
  const router = useRouter();
  
  // Data States
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal & Menu States
  const [viewData, setViewData] = useState<PackageType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Click Outside to close menu
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
  const fetchPackages = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/packages');
      if (data.success) {
        setPackages(data.data);
      }
      console.log(data.data)
    } catch (error) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // --- 2. Action Handlers ---

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await axios.patch(`/api/dashboard/packages/${id}`, { 
        isFeatured: !currentStatus 
      });

      if (data.success || data.ok) { // Adjust based on your API response structure
        toast.success(currentStatus ? "Package Hidden" : "Package Published");
        fetchPackages(); // Refresh UI
        setOpenMenuId(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Status update failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/dashboard/packages/${deleteId}`);
      setPackages(prev => prev.filter(p => p._id !== deleteId));
      toast.success("Package deleted successfully");
      setDeleteId(null);
      setOpenMenuId(null);
    } catch (error: any) {
     
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  // --- 3. Filter Logic ---
  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || pkg.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // --- Styles ---
  const cardClass = "bg-white rounded-2xl shadow-2xl shadow-gray-100 border border-gray-200/70 overflow-hidden";
  const btnClass = "w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-2 cursor-pointer";

  

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 font-sans text-gray-900" onClick={() => setOpenMenuId(null)}>
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" onClick={(e) => e.stopPropagation()}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, track and organize travel inventory</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search packages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 rounded-xl border border-gray-200/70 bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition shadow-2xl shadow-gray-100  text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none cursor-pointer shadow-2xl shadow-gray-100 "
            >
              <option value="All">All Categories</option>
              <option value="Hajj">Hajj</option>
              <option value="Umrah">Umrah</option>
              <option value="Holiday">Holiday</option>
              <option value="Others">Others</option>

            </select>
          </div>

          {/* Create Button */}
          <Link href="/admin/packages/create">
            <button className="flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition shadow-lg shadow-gray-200 cursor-pointer">
              <Plus size={16} />
              Add Package
            </button>
          </Link>
        </div>
      </div>

      {/* --- Table Section --- */}
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
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-gray-50/50 transition">
                      
                      {/* Title & Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                            <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 max-w-[180px]">{pkg.title}</h3>
                            <span className="text-xs text-gray-400">ID: {pkg._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <MapPin size={14} className="text-gray-400" /> {pkg.location}
                         </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {pkg.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 text-sm">
                          ${pkg.price.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${pkg.isFeatured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {pkg.isFeatured ? "Published" : "Hidden"}
                        </span>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === pkg._id ? null : pkg._id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === pkg._id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-8 top-12 z-50 w-48 bg-white rounded-xl shadow-2xl shadow-gray-200 border border-gray-200/70 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                          >
                            <button onClick={() => { setViewData(pkg); setOpenMenuId(null); }} className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-blue-600`}>
                              <Eye size={16} /> View Details
                            </button>

                            <Link href={`/admin/packages/edit?id=${pkg._id}`} onClick={() => setOpenMenuId(null)}>
                              <div className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-gray-900`}>
                                <Pencil size={16} /> Edit Package
                              </div>
                            </Link>

                            <button onClick={() => handleToggleStatus(pkg._id, pkg.isFeatured)} className={`${btnClass} text-gray-600 hover:bg-gray-50 hover:text-orange-600`}>
                              <Power size={16} /> {pkg.isFeatured ? 'Unpublish' : 'Publish'}
                            </button>

                            <div className="h-px bg-gray-100 my-1"></div>

                            <button onClick={() => { setDeleteId(pkg._id); setOpenMenuId(null); }} className={`${btnClass} text-red-500 hover:bg-red-50`}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                         <Package size={32} className="opacity-20" />
                         <p className="text-sm">No packages found.</p>
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
            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Package?</h3>
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

      {/* --- View Modal --- */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden scale-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header Image */}
            <div className="relative h-56 w-full flex-shrink-0">
              <img src={viewData.image} alt={viewData.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setViewData(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-500 transition cursor-pointer shadow-sm"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                 <span className="inline-block px-2 py-1 mb-2 rounded bg-black/50 backdrop-blur-md text-white text-xs font-semibold">
                    {viewData.category}
                 </span>
                 <h2 className="text-2xl font-bold text-white drop-shadow-md">{viewData.title}</h2>
                 <div className="flex items-center gap-2 text-slate-100 text-sm mt-1">
                    <MapPin size={14} /> {viewData.location}
                 </div>
              </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="p-6 overflow-y-auto">
              
              <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Package Price</p>
                    <p className="text-2xl font-bold text-slate-900">${viewData.price.toLocaleString()}</p>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${viewData.isFeatured ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {viewData.isFeatured ? 'Published' : 'Draft Mode'}
                 </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Description</h3>
                 <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {viewData.description || "No description provided."}
                 </p>
              </div>

              {/* Included Items */}
              <div>
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Included Services</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewData.included && viewData.included.length > 0 ? (
                       viewData.included.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <CheckCircle2 size={16} className="text-emerald-500" />
                             <span className="text-sm text-slate-700">{item}</span>
                          </div>
                       ))
                    ) : (
                       <p className="text-sm text-slate-400 italic">No services listed.</p>
                    )}
                 </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
               <Link href={`/admin/packages/edit?id=${viewData._id}`} className="flex-1">
                  <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition cursor-pointer shadow-lg shadow-gray-200">
                    Edit Package
                  </button>
               </Link>
               <button 
                 onClick={() => setViewData(null)} 
                 className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
               >
                 Close
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}