'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plane, AlertCircle, Check, Filter, X, SlidersHorizontal } from 'lucide-react';

import { FlightResultCard } from './utils/FlightResultCard';

import FlightSearchForm from './utils/FlightSearchForm';
import { FlightSearchSkleton } from './utils/FlightSearchSkeleton';

// --- Interfaces ---
interface FlightOffer {
    id: string;
    token: string;
    carrier: { name: string; logo: string | null; code: string };
    itinerary: any[];
    price: { currency: string; basePrice: number; markup: number; finalPrice: number };
    conditions: { refundable: boolean; changeable: boolean; baggage: string };
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

    // Sort & Filter States
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'best'>('best');
    const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [maxPriceLimit, setMaxPriceLimit] = useState(10000);

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

                const maxPrice = Math.max(...data.data.map((f: any) => f.price.finalPrice));
                setMaxPriceLimit(maxPrice);
                setPriceRange([0, maxPrice]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFlights();
    }, [searchParams]);

    // 🟢 Filter & Sort Logic
    const filteredResults = useMemo(() => {
        let res = [...rawResults];

        // Filter by Price
        res = res.filter((f) => f.price.finalPrice <= priceRange[1]);

        // Filter by Airlines
        if (selectedAirlines.length > 0)
            res = res.filter((f) => selectedAirlines.includes(f.carrier.name));

        // Sorting
        if (sortBy === 'price') res.sort((a, b) => a.price.finalPrice - b.price.finalPrice);
        else if (sortBy === 'duration')
            res.sort((a, b) =>
                a.itinerary[0].totalDuration.localeCompare(b.itinerary[0].totalDuration),
            );

        return res;
    }, [rawResults, priceRange, selectedAirlines, sortBy]);

    // 🟢 Airline Counts Logic
    const airlineCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        rawResults.forEach((f) => {
            const name = f.carrier.name;
            counts[name] = (counts[name] || 0) + 1;
        });
        return counts;
    }, [rawResults]);

    const uniqueAirlines = useMemo(() => Object.keys(airlineCounts), [airlineCounts]);

    const toggleAirline = (airline: string) => {
        setSelectedAirlines((prev) =>
            prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline],
        );
    };

    // 🟢 Custom Slider Styling Logic
    const sliderPercentage = maxPriceLimit > 0 ? (priceRange[1] / maxPriceLimit) * 100 : 0;

    const FilterContent = () => (
        <>
            {/* Price Filter */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Max Price
                    </label>
                    <span className="text-sm font-bold text-slate-700">
                        {priceRange[1].toLocaleString()} USD
                    </span>
                </div>

                <input
                    type="range"
                    min={0}
                    max={maxPriceLimit}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="range-slider "
                    style={{
                        background: `linear-gradient(to right, #e11d48 ${sliderPercentage}%, #e2e8f0 ${sliderPercentage}%)`,
                    }}
                />
            </div>

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
        </>
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

            {/* Hero */}
            <div className="bg-slate-900 pb-32 pt-10 px-4 relative">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                        Find Your Flight
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base">
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
                            <div className="hidden lg:block lg:col-span-1 bg-white rounded-[1.5rem] p-6 shadow-2xl shadow-gray-100 border border-gray-200/80 sticky top-4">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
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
                                                    <span>
                                                        {parseInt(searchParams.get('adt') || '1')}{' '}
                                                        Adult,
                                                    </span>
                                                    {parseInt(searchParams.get('chd') || '0') >
                                                        0 && (
                                                        <span>
                                                            {searchParams.get('chd')} Child,
                                                        </span>
                                                    )}
                                                    {parseInt(searchParams.get('inf') || '0') >
                                                        0 && (
                                                        <span>
                                                            {searchParams.get('inf')} Infant
                                                        </span>
                                                    )}
                                                    <span className="text-slate-300">•</span>
                                                    <span>Including taxes</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setShowMobileFilter(true)}
                                                    className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                                                >
                                                    <SlidersHorizontal className="w-5 h-5" />
                                                </button>
                                                <div className="bg-slate-100 p-1.5 rounded-xl flex items-center">
                                                    {[
                                                        { id: 'best', label: 'Best' },
                                                        { id: 'price', label: 'Cheapest' },
                                                        { id: 'duration', label: 'Fastest' },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setSortBy(opt.id as any)}
                                                            className={`px-4 md:px-6 py-2 cursor-pointer rounded-lg text-sm font-bold transition-all duration-200 ${sortBy === opt.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
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
