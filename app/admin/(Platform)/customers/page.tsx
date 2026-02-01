'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  User, 
  Filter, 
  Download, 
  Loader2, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  MapPin,
  RefreshCcw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// প্যাসেঞ্জার টাইপ ডেফিনিশন
interface Passenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  type: string;
  gender: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  email: string;
  phone: string;
  lastBookingRef: string;
  lastTravelDate: string;
}

export default function PassengerDatabase() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, adult, child
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);

  // 🟢 1. Data Fetching
  const fetchPassengers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/passengers');
      if (res.data.success) {
        setPassengers(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch passengers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  // 🟢 2. Filtering Logic
  const filteredPassengers = passengers.filter(p => {
    const matchesSearch = 
      p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || p.type === filterType;

    return matchesSearch && matchesType;
  });

  // 🟢 3. Export to CSV Function
  const handleExport = () => {
    const headers = ["First Name,Last Name,Type,Passport,Email,Phone,Last Travel"];
    const rows = filteredPassengers.map(p => 
      `${p.firstName},${p.lastName},${p.type},${p.passportNumber},${p.email},${p.phone},${format(new Date(p.lastTravelDate), 'yyyy-MM-dd')}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mazafly_passengers.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Passenger Database</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all customer details from bookings.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPassengers} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, passport, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
           <div className="relative min-w-[140px]">
             <Filter className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-rose-500"
             >
               <option value="all">All Types</option>
               <option value="adult">Adults</option>
               <option value="child">Children</option>
               <option value="infant">Infants</option>
             </select>
           </div>
        </div>
      </div>

      {/* 🟢 DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-rose-500" />
            <span className="text-sm font-medium">Loading passengers...</span>
          </div>
        ) : filteredPassengers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-slate-600">No passengers found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & ID</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Passport Info</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Activity</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${passenger.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                          {passenger.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{passenger.title}. {passenger.firstName} {passenger.lastName}</p>
                          <p className="text-xs text-slate-400">ID: {passenger.id.substring(0,6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        passenger.type === 'adult' ? 'bg-slate-100 text-slate-600' : 
                        passenger.type === 'child' ? 'bg-amber-50 text-amber-600' : 
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {passenger.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {passenger.passportNumber !== 'N/A' ? (
                        <div>
                           <p className="text-sm font-mono font-bold text-slate-700">{passenger.passportNumber}</p>
                           <p className="text-[10px] text-slate-400 flex items-center gap-1">
                             <MapPin className="w-3 h-3" /> {passenger.passportCountry}
                           </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Passport</span>
                      )}
                    </td>
                    <td className="p-4">
                       <div className="space-y-1">
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                             <Mail className="w-3 h-3 text-slate-400" /> {passenger.email.length > 15 ? passenger.email.substring(0,15)+'...' : passenger.email}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                             <Phone className="w-3 h-3 text-slate-400" /> {passenger.phone}
                          </p>
                       </div>
                    </td>
                    <td className="p-4">
                        <div>
                           <p className="text-xs font-bold text-slate-700">{format(parseISO(passenger.lastTravelDate), 'dd MMM yyyy')}</p>
                           <p className="text-[10px] text-slate-400">Ref: {passenger.lastBookingRef}</p>
                        </div>
                    </td>
                    <td className="p-4 text-right">
                       <button 
                         onClick={() => setSelectedPassenger(passenger)}
                         className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                       >
                          <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🟢 PASSENGER DETAILS MODAL */}
      {selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                 <h2 className="text-lg font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-rose-400" /> Passenger Details
                 </h2>
                 <button onClick={() => setSelectedPassenger(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <span className="text-2xl leading-none">&times;</span>
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Basic Info */}
                 <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${selectedPassenger.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                       {selectedPassenger.firstName[0]}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">{selectedPassenger.title}. {selectedPassenger.firstName} {selectedPassenger.lastName}</h3>
                       <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600 uppercase">{selectedPassenger.type}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600 uppercase">{selectedPassenger.gender}</span>
                       </div>
                    </div>
                 </div>

                 {/* Passport Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Passport Number</p>
                       <p className="text-sm font-mono font-bold text-slate-800">{selectedPassenger.passportNumber}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Issuing Country</p>
                       <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-rose-500" /> {selectedPassenger.passportCountry}
                       </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Date of Birth</p>
                       <p className="text-sm font-bold text-slate-800">{format(parseISO(selectedPassenger.dob), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Passport Expiry</p>
                       <p className="text-sm font-bold text-slate-800">{selectedPassenger.passportExpiry}</p>
                    </div>
                 </div>

                 {/* Contact Info */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Mail className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Email Address</p>
                          <p className="text-sm font-bold text-slate-800">{selectedPassenger.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Phone className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Phone Number</p>
                          <p className="text-sm font-bold text-slate-800">{selectedPassenger.phone}</p>
                       </div>
                    </div>
                 </div>

                 <button onClick={() => setSelectedPassenger(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                    Close Details
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}