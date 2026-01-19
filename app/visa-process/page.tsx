'use client';

import { useState } from 'react';
import { 
    FaSearch, 
    FaPassport, 
    FaClock, 
    FaCheckCircle, 
    FaPlaneDeparture, 
    FaFileAlt, 
    FaWhatsapp, 
    FaTimes, 
    FaDollarSign // Dollar icon added
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { appTheme } from '@/constant/theme/global';
import { visaPackages, VisaType } from '@/constant/visa'; 
import { websiteDetails } from '@/constant/data';

const VisaPage = () => {
    const { layout } = appTheme;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);

    // Filter Logic
    const filteredVisas = visaPackages.filter(v => 
        v.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // WhatsApp Handler
    const handleApply = (visa: VisaType) => {
        const message = `Hello, I'm interested in *${visa.country} ${visa.visaType}*.\n\n*Price:* $${visa.price}\n*Processing:* ${visa.processingTime}\n\nPlease provide me with more details.`;
        
     
        window.open(`https://wa.me/${websiteDetails.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            
            {/* --- Hero Section --- */}
            <div className="relative bg-gray-900 pt-36 pb-32 rounded-b-[3rem] shadow-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                    <img 
                        src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop" 
                        className="w-full h-full object-cover" 
                        alt="Visa Processing Background" 
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/80 to-gray-900"></div>

                <div className={`${layout.container} relative z-10 text-center`}>
                    <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-4">
                        <span className="text-rose-400 font-bold text-xs tracking-widest uppercase">Global Visa Assistance</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Your Gateway to the <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">World</span>
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
                        Professional visa processing services for business and tourist travel. Fast, reliable, and hassle-free.
                    </p>

                    {/* Search Bar (Centered without currency toggle) */}
                    <div className="max-w-xl mx-auto">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="Search country (e.g. Dubai, Malaysia)" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-16 pl-8 pr-16 rounded-full bg-white/95 backdrop-blur text-gray-900 font-bold outline-none focus:ring-4 ring-rose-500/30 transition-all shadow-xl text-lg"
                            />
                            <div className="absolute right-2 top-2 h-12 w-12 bg-rose-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                                <FaSearch />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Stats Banner --- */}
            <div className={`${layout.container} -mt-12 relative z-20`}>
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-100 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-200/70">
                    {[
                        { icon: <FaPassport />, title: "99% Success", desc: "Proven visa approval record" },
                        { icon: <FaClock />, title: "Fast Processing", desc: "Get your visa on time" },
                        { icon: <FaCheckCircle />, title: "Expert Guide", desc: "Complete documentation support" },
                    ].map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-14 h-14  text-rose-600  flex items-center justify-center text-2xl ">
                                {stat.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">{stat.title}</h4>
                                <p className="text-sm text-gray-500">{stat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Visa Packages Grid --- */}
            <div className={`${layout.container} mt-20`}>
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900">Popular Destinations -(dummy data) Accual data comming soon...</h2>
                   
                        <p className="text-gray-500 mt-2 font-medium">Choose your destination to view requirements & apply</p>
                    </div>
                    <div className="text-sm font-bold text-gray-400 bg-gray-100 px-4 py-2 rounded-lg">
                        Showing {filteredVisas.length} Countries
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredVisas.length > 0 ? filteredVisas.map((visa) => (
                        <div key={visa.id} className="bg-white rounded-[2rem] p-3 border border-gray-200/80 shadow-2xl shadow-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                            
                            {/* Image Wrapper */}
                            <div className="h-56 rounded-[1.5rem] overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                                <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gray-900 shadow-sm">
                                    {visa.visaType}
                                </div>
                                <img 
                                    src={visa.image} 
                                    alt={visa.country} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                                />
                                <div className="absolute bottom-4 left-4 z-20">
                                    <h3 className="text-2xl font-bold text-white drop-shadow-md">{visa.country}</h3>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4 pt-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Processing</p>
                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                            <FaClock className="text-rose-500" /> {visa.processingTime}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Validity</p>
                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                            <FaPlaneDeparture className="text-rose-500" /> {visa.validity}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold">Total Cost</p>
                
                                        <p className="text-2xl font-black text-rose-600 flex items-start">
                                            <span className="text-lg mt-1 mr-0.5">$</span>{visa.price}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            onClick={() => setSelectedVisa(visa)}
                                            size="icon"
                                            className="rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            title="View Requirements"
                                        >
                                            <FaFileAlt />
                                        </Button>
                                        <Button 
                                            onClick={() => handleApply(visa)}
                                            className="rounded-xl bg-gray-900 text-white hover:bg-black px-6 font-bold"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-3xl">
                                <FaSearch />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No Destinations Found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Requirements Modal --- */}
            {selectedVisa && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {selectedVisa.country} 
                                </h2>
                                <p className="text-sm text-gray-500 font-medium">{selectedVisa.visaType} Application</p>
                            </div>
                            <button 
                                onClick={() => setSelectedVisa(null)}
                                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-8 overflow-y-auto">
                            
                            {/* Key Info Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-blue-50/50 p-3 rounded-2xl text-center border border-blue-100">
                                    <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Process</p>
                                    <p className="text-xs font-bold text-gray-800">{selectedVisa.processingTime}</p>
                                </div>
                                <div className="bg-purple-50/50 p-3 rounded-2xl text-center border border-purple-100">
                                    <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">Validity</p>
                                    <p className="text-xs font-bold text-gray-800">{selectedVisa.validity}</p>
                                </div>
                                <div className="bg-orange-50/50 p-3 rounded-2xl text-center border border-orange-100">
                                    <p className="text-[10px] text-orange-600 font-bold uppercase mb-1">Stay</p>
                                    <p className="text-xs font-bold text-gray-800">{selectedVisa.maxStay}</p>
                                </div>
                                <div className="bg-green-50/50 p-3 rounded-2xl text-center border border-green-100">
                                    <p className="text-[10px] text-green-600 font-bold uppercase mb-1">Price</p>
                                    <p className="text-xs font-bold text-gray-800">${selectedVisa.price}</p>
                                </div>
                            </div>

                            {/* Required Documents List */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm"><FaFileAlt /></span>
                                    Required Documents
                                </h3>
                                <ul className="grid grid-cols-1 gap-3">
                                    {selectedVisa.requirements.map((doc, idx) => (
                                        <li key={idx} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-rose-200 transition-colors">
                                            <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-700 leading-tight">{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="text-xs text-gray-500 font-medium">
                                * Requirements may vary based on applicant profile.
                            </div>
                            <Button 
                                onClick={() => handleApply(selectedVisa)}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                            >
                                <FaWhatsapp className="text-xl" /> Apply via WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
};

export default VisaPage;