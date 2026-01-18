'use client';

import { useState, useEffect, useMemo } from 'react';
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
    FaMoneyBillWave
} from 'react-icons/fa';
import { TICKET_PRICE_COMMISION } from '@/constant/flight';
import FlightSearchCompactNew from './compo/FlightSearchCompactNew'; 
import FlightCard from './compo/FlightCard'; 

// --- Helpers ---
const getDurationInMinutes = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    return hours * 60 + minutes;
};

// --- Skeleton Loader ---
const FlightSkeleton = () => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 w-full space-y-4">
                <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="w-full md:w-32 h-10 bg-gray-200 rounded-lg"></div>
        </div>
    </div>
);

const FlightSearchPage = () => {
    const { layout } = appTheme;
    const searchParams = useSearchParams();

    const initialFormValues = useMemo(() => {
        const type = (searchParams.get('type') || 'oneway') as 'oneway' | 'multi' | 'round';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';
        const date = searchParams.get('date') || '';
        const returnDate = searchParams.get('return') || '';
        const legsParam = searchParams.get('legs');

        let legs = undefined;
        
        // Multi-city legs parsing safely
        if (type === 'multi' && legsParam) {
            try {
                legs = JSON.parse(legsParam);
            } catch (e) {
                console.error("Failed to parse legs param:", e);
            }
        }

        return {
            tripType: type,
            from,
            to,
            date,
            returnDate,
            legs
        };
    }, [searchParams]);

    // Check if user is actually searching
    const isSearching = (initialFormValues.from && initialFormValues.to) || (initialFormValues.tripType === 'multi' && initialFormValues.legs);

    // --- States ---
    const [isLoading, setIsLoading] = useState(true);
    const [flights, setFlights] = useState<any[]>([]);
    const [dictionaries, setDictionaries] = useState<any>(null);
    const [error, setError] = useState('');
    
    // --- UI States ---
    const [showFilters, setShowFilters] = useState(false);
    
    // --- Filter States ---
    const [priceRange, setPriceRange] = useState(5000);
    const [sortBy, setSortBy] = useState('cheapest'); 
    const [selectedStops, setSelectedStops] = useState<number[]>([]);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

    // --- 1. Fetch Data ---
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

                        if (TICKET_PRICE_COMMISION.type === 'percentage') { //add with percentage 
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
                } else {
                    setError('No flights found for this route.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to fetch flight data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlights();
    }, [searchParams, isSearching]);

    // --- 2. Dynamic Airlines ---
    const availableAirlines = useMemo(() => {
        const carriers = new Set<string>();
        flights.forEach((f) => {
            const code = f.itineraries[0].segments[0].carrierCode;
            carriers.add(code);
        });
        return Array.from(carriers);
    }, [flights]);

    // --- 3. Filter Logic ---
    const processedFlights = useMemo(() => {
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

    // --- Handlers ---
    const toggleStop = (val: number) => {
        setSelectedStops(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };
    const toggleAirline = (val: string) => {
        setSelectedAirlines(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };
    const resetFilters = () => {
        setPriceRange(5000);
        setSelectedStops([]);
        setSelectedAirlines([]);
        setSortBy('cheapest');
    };

    // ============================================
    // 🟢 VIEW 1: LANDING PAGE (NO SEARCH PARAMS)
    // ============================================
    if (!isSearching) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1556388158-158ea5ccacbd?q=80&w=870&auto=format&fit=crop" 
                        alt="Travel Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
                            Explore the <span className="text-rose-500">World</span>
                        </h1>
                        <p className="text-gray-200 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md">
                            Find the best flight deals for your next adventure.
                        </p>
                    </div>
                    
                    <div className="bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/20">
                        {/* 🟢 Passing Initial Values */}
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
            
            {/* Sticky Header with Form Auto-filled */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200  top-0 z-40 transition-all duration-300">
                <div className={`${layout.container} py-4`}>
                    {/* 🟢 Passing Initial Values */}
                    <FlightSearchCompactNew initialValues={initialFormValues} />
                </div>
            </div>

            <div className={`${layout.container} mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8`}>
                
                {/* Filters Sidebar */}
                <aside className={`fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent lg:z-auto lg:col-span-3 transition-opacity duration-300 ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'}`}>
                    <div 
                        className={`bg-white h-full lg:h-fit lg:rounded-3xl border-r lg:border border-gray-200 p-6 w-80 lg:w-full ml-auto lg:ml-0 overflow-y-auto lg:sticky lg:top-28 transition-transform duration-300 ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6 lg:mb-4">
                            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                <FaFilter className="text-rose-600" /> Filters
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 bg-gray-100 rounded-full text-gray-500"><FaTimes /></button>
                        </div>

                        <div className="mb-6 flex justify-end">
                            <button onClick={resetFilters} className="text-xs font-bold text-rose-600 hover:text-rose-700 underline">Reset All</button>
                        </div>

                        {/* Stops */}
                        <div className="mb-8">
                            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2"><FaPlane className="text-rose-500" /> Stops</label>
                            <div className="flex flex-wrap gap-2">
                                {[{ l: 'Direct', v: 0 }, { l: '1 Stop', v: 1 }, { l: '2+ Stops', v: 2 }].map((stop) => (
                                    <button
                                        key={stop.v}
                                        onClick={() => toggleStop(stop.v)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedStops.includes(stop.v) ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 hover:border-rose-300'}`}
                                    >
                                        {stop.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <label className="text-sm font-bold text-gray-700 mb-4 block flex justify-between">
                                <span className="flex items-center gap-2"><FaMoneyBillWave className="text-rose-500"/> Max Price</span>
                                <span className="text-rose-600">${priceRange}</span>
                            </label>
                            <input type="range" min="100" max="10000" step="50" value={priceRange} onChange={(e) => setPriceRange(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                        </div>

                        {/* Airlines */}
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

                {/* Results */}
                <div className="lg:col-span-9">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{isLoading ? 'Searching Flights...' : `Found ${processedFlights.length} Flights`}</h2>
                            <p className="text-sm text-gray-500">Prices include all taxes and fees.</p>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button onClick={() => setShowFilters(true)} className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold shadow-sm"><FaSlidersH /> Filter</button>
                            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
                                <button onClick={() => setSortBy('cheapest')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'cheapest' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Cheapest</button>
                                <button onClick={() => setSortBy('fastest')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'fastest' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Fastest</button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {isLoading && <><FlightSkeleton /><FlightSkeleton /><FlightSkeleton /></>}
                        {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center"><p className="text-red-600 font-bold mb-2">Oops! Something went wrong.</p><p className="text-sm text-red-500">{error}</p></div>}
                        {!isLoading && !error && processedFlights.length === 0 && (
                            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><FaPlane className="text-gray-300 text-2xl" /></div>
                                <h3 className="text-lg font-bold text-gray-900">No flights found</h3>
                                <Button onClick={resetFilters} variant="outline" className="mt-4">Clear All Filters</Button>
                            </div>
                        )}
                        {!isLoading && processedFlights.map((flight) => (
                            <FlightCard key={flight.id} flight={flight} dictionaries={dictionaries} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FlightSearchPage;