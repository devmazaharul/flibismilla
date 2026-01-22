'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plane, AlertCircle, Check, Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import FlightSearchForm from './utils/FlightSearchForm';
import { FlightSearchSkleton } from './utils/FlightSearchSkeleton';
import { FlightResultCard } from './utils/FlightResultCard';

// --- Interfaces ---
interface FlightOffer {
    id: string;
    token: string;
    carrier: { name: string; logo: string | null; code: string };
    itinerary: any[]; 
    price: { currency: string; basePrice: number; markup: number; finalPrice: number };
    conditions: { refundable: boolean; changeable: boolean; baggage: string };
    baggage: string;
    cabinClass: string;
}

// --- MAIN PAGE LOGIC ---
function SearchPageContent() {
    const searchParams = useSearchParams();
    const resultsRef = useRef<HTMLDivElement>(null);

    // States
    const [loading, setLoading] = useState(false);
    const [rawResults, setRawResults] = useState<FlightOffer[]>([]);
    const [error, setError] = useState('');
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Sort State
    const [sortBy, setSortBy] = useState<'best' | 'price_asc' | 'price_desc' | 'duration'>('best');
    
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [selectedStops, setSelectedStops] = useState<string[]>([]);

    useEffect(() => {
        const fetchFlights = async () => {
            const type = searchParams.get('type');
            if (!type) return;

            setError('');
            if (rawResults.length === 0) setLoading(true);
            else {
                setLoading(true);
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }

            try {
                let payload: any = {
                    type,
                    passengers: {
                        adults: parseInt(searchParams.get('adt') || '1'),
                        children: parseInt(searchParams.get('chd') || '0'),
                        infants: parseInt(searchParams.get('inf') || '0'),
                    },
                    cabinClass: searchParams.get('class') || 'economy',
                };

                if (type === 'multi_city') {
                    const legsJson = searchParams.get('flights');
                    if (legsJson) payload.flights = JSON.parse(legsJson);
                } else {
                    payload.origin = searchParams.get('origin');
                    payload.destination = searchParams.get('dest');
                    payload.departureDate = searchParams.get('date');
                    if (type === 'round_trip') payload.returnDate = searchParams.get('ret');
                }

                const res = await fetch('/api/new', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (!data.success) throw new Error(data.error || 'No flights found');
                setRawResults(data.data);
                console.log(data.data)
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFlights();
    }, [searchParams]);

    // Filter & Sort Logic
    const filteredResults = useMemo(() => {
        let res = [...rawResults];

        // 1. Filter by Stops 
        if (selectedStops.length > 0) {
            res = res.filter((f) => {
                const stops = f.itinerary[0].stops; 
                if (selectedStops.includes('direct') && stops === 0) return true;
                if (selectedStops.includes('1_stop') && stops === 1) return true;
                if (selectedStops.includes('2_stop') && stops === 2) return true;
                if (selectedStops.includes('2plus_stop') && stops > 2) return true;
                return false;
            });
        }

        // 2. Filter by Airlines
        if (selectedAirlines.length > 0)
            res = res.filter((f) => selectedAirlines.includes(f.carrier.name));

        // 3. Sorting Logic
        if (sortBy === 'price_asc') {
            res.sort((a, b) => a.price.finalPrice - b.price.finalPrice);
        } else if (sortBy === 'price_desc') {
            res.sort((a, b) => b.price.finalPrice - a.price.finalPrice);
        } else if (sortBy === 'duration') {
            res.sort((a, b) => a.itinerary[0].totalDuration.localeCompare(b.itinerary[0].totalDuration));
        }

        return res;
    }, [rawResults, selectedAirlines, selectedStops, sortBy]);

    // Counts Logic
    const { airlineCounts, stopCounts } = useMemo(() => {
        const aCounts: Record<string, number> = {};
        const sCounts: Record<string, number> = { direct: 0, '1_stop': 0, '2_stop': 0, '2plus_stop': 0 };

        rawResults.forEach((f) => {
            const name = f.carrier.name;
            aCounts[name] = (aCounts[name] || 0) + 1;

            const stops = f.itinerary[0].stops;
            if (stops === 0) sCounts['direct']++;
            else if (stops === 1) sCounts['1_stop']++;
            else if (stops === 2) sCounts['2_stop']++;
            else sCounts['2plus_stop']++;
        });
        return { airlineCounts: aCounts, stopCounts: sCounts };
    }, [rawResults]);

    const uniqueAirlines = useMemo(() => Object.keys(airlineCounts), [airlineCounts]);

    // Toggle Handlers
    const toggleAirline = (airline: string) => {
        setSelectedAirlines((prev) =>
            prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline],
        );
    };

    const toggleStop = (stopType: string) => {
        setSelectedStops((prev) =>
            prev.includes(stopType) ? prev.filter((s) => s !== stopType) : [...prev, stopType],
        );
    };

    // Filter Content Component
    const FilterContent = () => (
        <div className="space-y-8">
            
            {/* Stops Filter (Side by Side) */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                    Stops
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: 'direct', label: 'Direct' },
                        { id: '1_stop', label: '1 Stop' },
                        { id: '2_stop', label: '2 Stops' },
                        { id: '2plus_stop', label: '2+ Stops' },
                    ].map((stop) => (
                        <label
                            key={stop.id}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center relative
                                ${selectedStops.includes(stop.id) 
                                    ? 'border-rose-600 bg-rose-50 text-rose-700' 
                                    : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            <span className="text-sm font-bold">{stop.label}</span>
                            <span className="text-[10px] font-medium opacity-60 mt-1">
                                {stopCounts[stop.id as keyof typeof stopCounts]} flights
                            </span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={selectedStops.includes(stop.id)}
                                onChange={() => toggleStop(stop.id)}
                            />
                            {selectedStops.includes(stop.id) && (
                                <div className="absolute top-1 right-1">
                                    <Check className="w-3 h-3 text-rose-600" />
                                </div>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Airlines Filter */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                    Airlines
                </label>
                <div className="space-y-3">
                    {uniqueAirlines.map((airline) => (
                        <label
                            key={airline}
                            className="flex items-center justify-between cursor-pointer group hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedAirlines.includes(airline) ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}
                                >
                                    {selectedAirlines.includes(airline) && (
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    )}
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedAirlines.includes(airline)}
                                        onChange={() => toggleAirline(airline)}
                                    />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                    {airline}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                                {airlineCounts[airline]}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowMobileFilter(false)}
                    ></div>
                    <div className="bg-white rounded-t-3xl p-6 w-full max-h-[85vh] overflow-y-auto relative z-10 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Filter className="w-5 h-5" /> Filter Flights
                            </h3>
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <FilterContent />
                        <div className="mt-8 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-300"
                            >
                                Apply Filters ({filteredResults.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟢 Hero Section with Image & Overlay */}
            <div className="relative pb-32 pt-10 px-4">
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                        src="/e0b.jpg" 
                        alt="Flight Background" 
                        className="w-full h-full object-cover"
                    />
                    {/* Dark Overlay (Opacity Control) */}
                    <div className="absolute inset-0 bg-slate-900/80"></div>
                </div>

                {/* Content Layer */}
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                        Find Your Flight
                    </h1>
                    <p className="text-slate-300 text-sm md:text-base">
                        Compare prices from hundreds of airlines.
                    </p>
                </div>
            </div>

            {/* Forms Component */}
            <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-20 mb-12">
                <FlightSearchForm />
            </div>

            <div ref={resultsRef} className="scroll-mt-24"></div>

            <div className="max-w-7xl mx-auto px-4">
                {error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] border border-red-100 flex flex-col items-center justify-center gap-3 mt-8">
                        <AlertCircle className="w-8 h-8" />{' '}
                        <span className="font-semibold">{error}</span>
                    </div>
                ) : (
                    (loading || rawResults.length > 0 || searchParams.get('type')) && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                            
                            {/* Desktop Sidebar Filters */}
                            <div className="hidden lg:block lg:col-span-1 bg-white rounded-[1.5rem] p-6 shadow-2xl shadow-gray-100 border border-gray-200/80 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                                    <Filter className="w-5 h-5 text-rose-600" />
                                    <h3 className="font-black text-slate-800 text-lg">Filters</h3>
                                </div>
                                <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                                    <FilterContent />
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="col-span-1 lg:col-span-3">
                                {loading ? (
                                    <div className="animate-in fade-in duration-300">
                                        <FlightSearchSkleton />
                                    </div>
                                ) : rawResults.length > 0 ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Header Section */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-bold text-slate-900">
                                                        Found {filteredResults.length} Flights
                                                    </h2>
                                                    <span className="px-2.5 py-1 rounded bg-gray-700 text-gray-100 text-[10px] font-bold uppercase tracking-wider">
                                                        {searchParams.get('class') || 'Economy'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                                                    <span>{parseInt(searchParams.get('adt') || '1')} Adult,</span>
                                                    {parseInt(searchParams.get('chd') || '0') > 0 && <span>{searchParams.get('chd')} Child,</span>}
                                                    {parseInt(searchParams.get('inf') || '0') > 0 && <span>{searchParams.get('inf')} Infant</span>}
                                                    <span className="text-slate-300">•</span>
                                                    <span>Including taxes</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                                <button
                                                    onClick={() => setShowMobileFilter(true)}
                                                    className="lg:hidden p-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                                >
                                                    <SlidersHorizontal className="w-5 h-5" />
                                                </button>
                                                
                                                {/* Dropdown Sorting */}
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value as any)}
                                                        className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-2xl shadow-gray-100 cursor-pointer hover:border-slate-300 transition-all min-w-[180px]"
                                                    >
                                                        <option value="best">Best Match</option>
                                                        <option value="price_asc">Cheapest (Low to High)</option>
                                                        <option value="price_desc">Price (High to Low)</option>
                                                        <option value="duration">Fastest</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Result Cards */}
                                        <div className="space-y-5">
                                            {filteredResults.map((f) => (
                                                <FlightResultCard key={f.id} flight={f} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-32 opacity-50">
                                        <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-2xl font-black text-slate-800">
                                            No flights found
                                        </h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default function FlightSearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}