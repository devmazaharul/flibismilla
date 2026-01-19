'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react'; // 🟢 useRef added
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
    FaPlane,
    FaFilter,
    FaTimes,
    FaCheck,
    FaSlidersH,
    FaMoneyBillWave,
} from 'react-icons/fa';
import { TICKET_PRICE_COMMISION } from '@/constant/flight';
import FlightSearchCompactNew from './compo/FlightSearchCompactNew';
import FlightCard from './compo/FlightCard';
import { FlightSearchSkleton } from './compo/FlightSearchSkeleton';

const getDurationInMinutes = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    return hours * 60 + minutes;
};

const FlightCardSkeleton = () => (
    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-lg shadow-gray-100 animate-pulse mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1 w-full space-y-4">
                <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
            <div className="w-full md:w-32 h-12 bg-gray-200 rounded-xl"></div>
        </div>
    </div>
);

// ==========================================
// 🟢 3. Main Search Content Component
// ==========================================
const SearchContent = () => {
    const { layout } = appTheme;
    const searchParams = useSearchParams();
    
    // 🟢 1. Create a Ref for the results section
    const resultsRef = useRef<HTMLDivElement>(null);

    const initialFormValues = useMemo(() => {
        const type = (searchParams.get('type') || 'oneway') as 'oneway' | 'multi' | 'round';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';
        const date = searchParams.get('date') || '';
        const returnDate = searchParams.get('return') || '';
        
        const adults = searchParams.get('adults') || '1';
        const children = searchParams.get('children') || '0';
        const infants = searchParams.get('infants') || '0';
        const travelClass = searchParams.get('travelClass') || 'ECONOMY';

        const legsParam = searchParams.get('legs');
        let legs = undefined;
        
        if (type === 'multi' && legsParam) {
            try {
                legs = JSON.parse(legsParam);
            } catch (e) {
                console.error(e);
            }
        }

        return {
            tripType: type,
            from, to, date, returnDate, legs,
            adults, children, infants, travelClass
        };
    }, [searchParams]);

    const isSearching = (initialFormValues.from && initialFormValues.to) || (initialFormValues.tripType === 'multi' && initialFormValues.legs);

    const [isLoading, setIsLoading] = useState(false);
    const [flights, setFlights] = useState<any[]>([]);
    const [dictionaries, setDictionaries] = useState<any>(null);
    const [error, setError] = useState('');
    
    const [showFilters, setShowFilters] = useState(false);
    
    const [priceRange, setPriceRange] = useState(10000); 
    const [sortBy, setSortBy] = useState('cheapest'); 
    const [selectedStops, setSelectedStops] = useState<number[]>([]);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

    // 🟢 2. Auto Scroll Effect
    useEffect(() => {
        // যদি লোডিং শেষ হয় এবং রেজাল্ট থাকে (অথবা এরর থাকে)
        if (!isLoading && isSearching && (flights.length > 0 || error)) {
            // মোবাইল ডিভাইসে একটু স্মুথলি স্ক্রল হবে
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100); // 100ms delay to ensure DOM is ready
        }
    }, [isLoading, flights.length, error, isSearching]);

    useEffect(() => {
        if (!isSearching) return;

        const fetchFlights = async () => {
            setIsLoading(true);
            setError('');
            setFlights([]);

            try {
                const queryString = searchParams.toString();
                const res = await axios.get(`/api/pro?${queryString}`); 

                if (res.data.success) {
                    const processedFlights = res.data.data.map((flight: any) => {
                        const basePrice = parseFloat(flight.price.total);
                        let finalPrice = basePrice;

                        if (TICKET_PRICE_COMMISION.type === 'percentage') { 
                            finalPrice = basePrice * (1 + TICKET_PRICE_COMMISION.amount / 100);
                        } else {
                            finalPrice = basePrice + TICKET_PRICE_COMMISION.amount;
                        }

                        return {
                            ...flight,
                            price: { ...flight.price, total: finalPrice.toFixed(2) }
                        };
                    });

                    setFlights(processedFlights);
                    setDictionaries(res.data.dictionaries);
                    
                    if (processedFlights.length > 0) {
                        const maxPrice = Math.max(...processedFlights.map((f: any) => parseFloat(f.price.total)));
                        setPriceRange(Math.ceil(maxPrice + 100)); 
                    }
                } else {
                    setError('No flights found. Try changing dates or airports.');
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch flight data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlights();
    }, [searchParams, isSearching]);

    const availableAirlines = useMemo(() => {
        const carriers = new Set<string>();
        flights.forEach((f) => {
            const code = f.itineraries[0].segments[0].carrierCode;
            carriers.add(code);
        });
        return Array.from(carriers);
    }, [flights]);

    const filteredFlights = useMemo(() => {
        let result = [...flights];

        result = result.filter((f) => parseFloat(f.price.total) <= priceRange);

        if (selectedStops.length > 0) {
            result = result.filter((f) => {
                const stops = f.itineraries[0].segments.length - 1;
                if (selectedStops.includes(2) && stops >= 2) return true;
                return selectedStops.includes(stops);
            });
        }

        if (selectedAirlines.length > 0) {
            result = result.filter((f) => {
                const carrier = f.itineraries[0].segments[0].carrierCode;
                return selectedAirlines.includes(carrier);
            });
        }

        result.sort((a, b) => {
            if (sortBy === 'cheapest') {
                return parseFloat(a.price.total) - parseFloat(b.price.total);
            } else if (sortBy === 'fastest') {
                return getDurationInMinutes(a.itineraries[0].duration) - getDurationInMinutes(b.itineraries[0].duration);
            }
            return 0;
        });

        return result;
    }, [flights, priceRange, sortBy, selectedStops, selectedAirlines]);

    const toggleStop = (val: number) => {
        setSelectedStops(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };
    const toggleAirline = (val: string) => {
        setSelectedAirlines(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };
    const resetFilters = () => {
        if(flights.length > 0) {
             const maxPrice = Math.max(...flights.map((f: any) => parseFloat(f.price.total)));
             setPriceRange(Math.ceil(maxPrice));
        }
        setSelectedStops([]);
        setSelectedAirlines([]);
        setSortBy('cheapest');
    };

    // ============================================
    // 🟢 VIEW 1: LANDING PAGE
    // ============================================
    if (!isSearching) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                        src="/asset/others/flimg.avif" 
                        alt="Travel Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative z-50 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 mt-20">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
                            Start Your <span className="text-rose-500">Journey</span>
                        </h1>
                        <p className="text-gray-200 text-lg font-medium drop-shadow-md">
                            Best flights. Best prices. Endless destinations.
                        </p>
                    </div>
                    
                    <div className="bg-white/95 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] shadow-2xl border border-white/20 relative z-50">
                        <FlightSearchCompactNew initialValues={initialFormValues} />
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // 🟢 VIEW 2: SEARCH RESULTS PAGE
    // ============================================
    return (
        <main className="min-h-screen bg-gray-50/50 pb-24">
            
            <div className="relative z-40 bg-gray-900 pb-6 pt-20 lg:pt-24 rounded-b-[2rem] shadow-xl overflow-visible transition-all duration-500">
                 <div className="absolute inset-0 opacity-40 overflow-hidden rounded-b-[2rem]">
                    <img src="/asset/others/flimg.avif" className="w-full h-full object-cover" alt="header" />
                 </div>
                 <div className={`${layout.container} relative`}>
                    <div className="bg-white rounded-2xl shadow-xl p-2 md:p-4 relative">
                        <FlightSearchCompactNew initialValues={initialFormValues} />
                    </div>
                 </div>
            </div>

            <div className={`${layout.container} mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-50`}>
                
                {/* Filters Sidebar */}
                <aside className={`fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent lg:z-auto lg:col-span-3 transition-opacity duration-300 ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'}`}>
                    <div 
                        className={`bg-white h-full lg:h-fit lg:rounded-3xl lg:border border-gray-200 p-6 w-80 lg:w-full ml-auto lg:ml-0 overflow-y-auto lg:sticky lg:top-28 transition-transform duration-300 shadow-xl lg:shadow-none ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                <FaFilter className="text-rose-600" /> Filters
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 bg-gray-100 rounded-full text-gray-500"><FaTimes /></button>
                        </div>

                        <div className="mb-6 flex justify-end">
                            <button onClick={resetFilters} className="text-xs font-bold text-rose-600 hover:text-rose-700 underline">Reset All</button>
                        </div>

                        {/* Filter Sections */}
                        <div className="mb-8 border-b border-gray-100 pb-8">
                            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                                <FaPlane className="text-rose-500" /> Stops
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[{ l: 'Direct', v: 0 }, { l: '1 Stop', v: 1 }, { l: '2+ Stops', v: 2 }].map((stop) => (
                                    <button
                                        key={stop.v}
                                        onClick={() => toggleStop(stop.v)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedStops.includes(stop.v) ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300'}`}
                                    >
                                        {stop.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 border-b border-gray-100 pb-8">
                            <label className="text-sm font-bold text-gray-700 mb-4 block flex justify-between">
                                <span className="flex items-center gap-2"><FaMoneyBillWave className="text-rose-500"/> Price Limit</span>
                                <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">${priceRange}</span>
                            </label>
                            <input type="range" min="100" max="10000" step="50" value={priceRange} onChange={(e) => setPriceRange(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Airlines</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {availableAirlines.length > 0 ? availableAirlines.map((code) => {
                                    const name = dictionaries?.carriers?.[code] || code;
                                    return (
                                        <label key={code} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedAirlines.includes(code) ? 'bg-rose-600 border-rose-600' : 'border-gray-300 bg-white group-hover:border-rose-400'}`}>
                                                {selectedAirlines.includes(code) && <FaCheck className="text-white text-[10px]" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={selectedAirlines.includes(code)} onChange={() => toggleAirline(code)} />
                                            <span className="text-sm text-gray-600 font-medium truncate flex-1">{name}</span>
                                        </label>
                                    );
                                }) : <p className="text-xs text-gray-400 italic">No airlines available.</p>}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Results Section */}
                <div className="lg:col-span-9">
                    
                    {/* Header / Loader */}
                    {/* 🟢 3. Attach the Ref to this container to scroll here */}
                    <div 
                        ref={resultsRef} 
                        className="scroll-mt-28 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-2xl shadow-gray-100 border border-gray-100 min-h-[90px]"
                    >
                        <div className="w-full sm:w-auto flex-1">
                            {isLoading ? (
                                <FlightSearchSkleton />
                            ) : (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {`Found ${filteredFlights.length} Flights`}
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase">{initialFormValues.travelClass.replace(/_/g, ' ')}</span>
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {initialFormValues.adults} Adult, {initialFormValues.children} Child, {initialFormValues.infants} Infant • Including taxes
                                    </p>
                                </>
                            )}
                        </div>
                        
                        {/* Sort & Mobile Filter Buttons */}
                        <div className="flex gap-3 w-full sm:w-auto self-start sm:self-center">
                            <button onClick={() => setShowFilters(true)} className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold"><FaSlidersH /> Filter</button>
                            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                                <button onClick={() => setSortBy('cheapest')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'cheapest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Cheapest</button>
                                <button onClick={() => setSortBy('fastest')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'fastest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Fastest</button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {isLoading && Array.from({ length: 3 }).map((_, i) => <FlightCardSkeleton key={i} />)}
                        
                        {!isLoading && error && (
                            <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center animate-in fade-in">
                                <p className="text-red-600 font-bold mb-2 text-lg">Oops! No flights found.</p>
                                <p className="text-sm text-red-500">{error}</p>
                                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 bg-white border-red-200 text-red-600 hover:bg-red-50">Try Again</Button>
                            </div>
                        )}

                        {!isLoading && !error && filteredFlights.length === 0 && (
                            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><FaPlane className="text-gray-300 text-2xl" /></div>
                                <h3 className="text-lg font-bold text-gray-900">No flights match your filters</h3>
                                <p className="text-gray-400 text-sm mt-1 mb-4">Try adjusting your stops or price limit.</p>
                                <Button onClick={resetFilters} className="bg-rose-600 text-white hover:bg-rose-700">Clear All Filters</Button>
                            </div>
                        )}

                        {!isLoading && filteredFlights.map((flight) => (
                            <FlightCard key={flight.id} flight={flight} dictionaries={dictionaries} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

// ==========================================
// 🟢 4. Page Wrapper
// ==========================================
const FlightSearchPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <SearchContent />
        </Suspense>
    );
};

export default FlightSearchPage;