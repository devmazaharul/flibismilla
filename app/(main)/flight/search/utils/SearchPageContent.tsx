'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plane,
  AlertCircle,
  Check,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import FlightSearchForm from './FlightSearchForm';
import { FlightSearchSkleton } from './FlightSearchSkeleton';
import { PriceValidityNotice } from '@/app/(main)/components/PriceValidityNotice';
import { FlightResultCard } from './FlightResultCard';

// --- Interfaces ---
interface FlightOffer {
  id: string;
  token: string;
  carrier: { name: string; logo: string | null; code: string };
  itinerary: any[];
  price: {
    currency: string;
    basePrice: number;
    markup: number;
    finalPrice: number;
  };
  conditions: { refundable: boolean; changeable: boolean; penalty?: string };
  baggage: string;
  cabinClass: string;
  expires_at?: string;
}

// ----------------------------------------------------------------------
// Airline Price Grid (Carousel)
// ----------------------------------------------------------------------
const AirlinePriceGrid = ({
  offers,
  selectedAirlines,
  onToggle,
}: {
  offers: FlightOffer[];
  selectedAirlines: string[];
  onToggle: (name: string) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const airlineStats = useMemo(() => {
    const stats: Record<
      string,
      { name: string; logo: string | null; minPrice: number; currency: string }
    > = {};

    offers.forEach((offer) => {
      const name = offer.carrier.name || 'Unknown Airline';
      const price = offer.price.finalPrice;
      const currency = offer.price.currency;
      const logo = offer.carrier.logo;

      if (!stats[name] || price < stats[name].minPrice) {
        stats[name] = { name, logo, minPrice: price, currency };
      }
    });

    return Object.values(stats).sort((a, b) => a.minPrice - b.minPrice);
  }, [offers]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { current } = scrollRef;
    const scrollAmount = 220;

    current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (airlineStats.length === 0) return null;

  return (
    <div className="w-full mb-8 relative">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full  text-rose-600 shadow-sm border border-rose-100">
            <BadgePercent className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Compare Airlines
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 shadow-md shadow-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 shadow-md shadow-gray-100 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="
          flex gap-3 overflow-x-auto pb-4
          snap-x scroll-smooth
          cursor-grab active:cursor-grabbing
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        "
      >
        {airlineStats.map((airline) => {
          const isSelected = selectedAirlines.includes(airline.name);
          return (
            <button
              key={airline.name}
              onClick={() => onToggle(airline.name)}
              className={`
                flex flex-col items-center justify-center
                min-w-[150px]
                px-4 py-3.5
                rounded-2xl
                border
                snap-start
                relative overflow-hidden
                transition-all duration-300
                cursor-pointer
                ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]'
                    : 'bg-white border-slate-200/70 text-slate-600 hover:border-rose-200/80 hover:shadow-[0_14px_40px_rgba(148,27,66,0.18)]'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-emerald-200 animate-pulse" />
              )}

              <div className="h-11 w-11 mb-3 flex items-center justify-center bg-white rounded-full p-1.5 overflow-hidden shadow-sm border border-slate-100">
                {airline.logo ? (
                  <img
                    src={airline.logo}
                    alt={airline.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Plane className="w-5 h-5 text-slate-300" />
                )}
              </div>

              <span
                className={`
                  text-[10px] font-bold uppercase
                  tracking-tight truncate w-full text-center mb-1.5
                  ${isSelected ? 'text-slate-300' : 'text-slate-500'}
                `}
              >
                {airline.name}
              </span>

              <div className="flex flex-col items-center">
                <span
                  className={`
                    text-[9px] font-semibold pb-0.5 uppercase
                    ${isSelected ? 'text-slate-400' : 'text-emerald-600'}
                  `}
                >
                  Starting from
                </span>
                <span
                  className={`
                    text-base font-black
                    ${isSelected ? 'text-white' : 'text-slate-900'}
                  `}
                >
                  {airline.currency} {airline.minPrice.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN PAGE CONTENT
// ----------------------------------------------------------------------
function SearchPageContent() {
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<FlightOffer[]>([]);
  const [error, setError] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [sortBy, setSortBy] = useState<'best' | 'price_asc' | 'price_desc' | 'duration'>(
    'best',
  );
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);

useEffect(() => {
  const type = searchParams.get('type');
  const trigger = searchParams.get('trigger'); // নতুন flag

  // 🔒 শুধু তখনই fetch করব, যখন user Search button চাপছে (trigger=1)
  if (!type || trigger !== '1') {
    return;
  }

  const fetchFlights = async () => {
    setError('');

    // আগের loading logic 그대로 রাখতে পারো:
    if (rawResults.length === 0) {
      setLoading(true);
    } else {
      setLoading(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
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

      const res = await fetch('/api/duffel/search', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await res.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch flight data.');
      }

      setRawResults(responseData.data || []);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  fetchFlights();
}, [searchParams]);

  // FILTER & SORT
  const filteredResults = useMemo(() => {
    let res = [...rawResults];

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

    if (selectedAirlines.length > 0) {
      res = res.filter((f) => selectedAirlines.includes(f.carrier.name));
    }

    if (sortBy === 'price_asc') {
      res.sort((a, b) => a.price.finalPrice - b.price.finalPrice);
    } else if (sortBy === 'price_desc') {
      res.sort((a, b) => b.price.finalPrice - a.price.finalPrice);
    } else if (sortBy === 'duration') {
      res.sort((a, b) =>
        a.itinerary[0].totalDuration.localeCompare(b.itinerary[0].totalDuration),
      );
    }

    return res;
  }, [rawResults, selectedAirlines, selectedStops, sortBy]);

  // COUNTS
  const { airlineCounts, stopCounts } = useMemo(() => {
    const aCounts: Record<string, number> = {};
    const sCounts: Record<string, number> = {
      direct: 0,
      '1_stop': 0,
      '2_stop': 0,
      '2plus_stop': 0,
    };

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

  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline],
    );
  };

  const toggleStop = (stopType: string) => {
    setSelectedStops((prev) =>
      prev.includes(stopType)
        ? prev.filter((s) => s !== stopType)
        : [...prev, stopType],
    );
  };

  // Filter UI
  const FilterContent = () => (
    <div className="space-y-8">
      {/* Stops */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3 block">
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
              className={`
                flex flex-col items-center justify-center
                p-3 rounded-xl border-2
                cursor-pointer
                transition-all duration-200
                text-center relative
                ${
                  selectedStops.includes(stop.id)
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-[0_8px_24px_rgba(248,113,113,0.35)]'
                    : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                }
              `}
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

      {/* Airlines */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3 block">
          Airlines
        </label>
        <div className="space-y-2.5">
          {uniqueAirlines.map((airline) => (
            <label
              key={airline}
              className="
                flex items-center justify-between cursor-pointer
                group hover:bg-slate-50
                px-2 py-1.5 rounded-lg
                transition-colors
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-5 h-5 rounded-md border flex items-center justify-center
                    transition-all
                    ${
                      selectedAirlines.includes(airline)
                        ? 'bg-rose-600 border-rose-600 shadow-sm shadow-rose-300/70'
                        : 'border-slate-300 bg-white'
                    }
                  `}
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
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {airlineCounts[airline]}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100
        font-sans text-slate-900 pb-20
      "
    >
      {/* Mobile Filter Modal */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilter(false)}
          />
          <div
            className="
              bg-white
              rounded-t-3xl
              p-6
              w-full
              max-h-[85vh]
              overflow-y-auto
              relative z-10
              animate-in slide-in-from-bottom-10 duration-300
              shadow-[0_-18px_50px_rgba(15,23,42,0.35)]
            "
          >
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Filter className="w-5 h-5 text-rose-600" /> Filter Flights
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
                className="
                  w-full py-4
                  bg-slate-900
                  text-white font-bold
                  rounded-xl
                  shadow-lg shadow-slate-400/50
                "
              >
                Apply Filters ({filteredResults.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pb-32 pt-10 px-4">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/e0b.jpg"
            alt="Flight Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/75 to-slate-900/80" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/25 blur-3xl opacity-60" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-slate-100 font-medium mb-4 backdrop-blur">
            <Plane className="w-3.5 h-3.5" />
            Live fares from global airlines
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
            Find Your Next Flight
          </h1>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mx-auto">
            Search, compare and book flights from hundreds of airlines in one
            place.
          </p>
        </div>
      </div>

      {/* Search Form */}
<div className="max-w-6xl   mx-auto px-4 -mt-24 relative z-20 mb-12  rounded-3xl">
  <div className=" rounded-3xl shadow-2xl shadow-gray-100 border border-white/20 bg-white/95 backdrop-blur-xl">
    <FlightSearchForm />
  </div>
</div>

      <div ref={resultsRef} className="scroll-mt-24" />

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4">
        {error ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] border border-red-100 flex flex-col items-center justify-center gap-3 mt-8 shadow-[0_16px_60px_rgba(220,38,38,0.18)]">
            <AlertCircle className="w-8 h-8" />
            <span className="font-semibold">{error}</span>
          </div>
        ) : (
          (loading || rawResults.length > 0 || searchParams.get('type')) && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Sidebar Filters */}
              <div
                className="
                  hidden lg:block lg:col-span-1
                  rounded-[1.75rem]
                  p-6
                  bg-gradient-to-br from-white via-white to-slate-50
                  shadow-[0_20px_60px_rgba(15,23,42,0.12)]
                  border border-slate-100
                  sticky top-4
                  max-h-[calc(100vh-2rem)]
                  overflow-y-auto
                  custom-scrollbar
                "
              >
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                    <Filter className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-800 text-lg">Filters</h3>
                </div>
                <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                  <FilterContent />
                </div>
              </div>

              {/* Main Content */}
              <div className="col-span-1 lg:col-span-3">
                {loading ? (
                  <div className="animate-in fade-in duration-300">
                    <FlightSearchSkleton />
                  </div>
                ) : rawResults.length > 0 ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PriceValidityNotice offerId="" showTimer={false} />

                    <AirlinePriceGrid
                      offers={rawResults}
                      selectedAirlines={selectedAirlines}
                      onToggle={toggleAirline}
                    />

                    {/* Stats & Sorting */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-2xl font-bold text-slate-900">
                            Found {filteredResults.length} flights
                          </h2>
                          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-50 text-[10px] font-bold uppercase tracking-[0.18em]">
                            {searchParams.get('class') || 'Economy'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {parseInt(searchParams.get('adt') || '1')} Adult
                          </span>
                          {parseInt(searchParams.get('chd') || '0') > 0 && (
                            <span>{searchParams.get('chd')} Child</span>
                          )}
                          {parseInt(searchParams.get('inf') || '0') > 0 && (
                            <span>{searchParams.get('inf')} Infant</span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span>Prices include all taxes & fees</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <button
                          onClick={() => setShowMobileFilter(true)}
                          className="
                            lg:hidden
                            p-3 bg-white border border-slate-200
                            rounded-xl text-slate-700
                            hover:bg-slate-50
                            transition-colors shadow-sm
                          "
                        >
                          <SlidersHorizontal className="w-5 h-5" />
                        </button>

                        <div className="relative">
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          </div>
                          <select
                            value={sortBy}
                            onChange={(e) =>
                              setSortBy(e.target.value as any)
                            }
                            className="
                              appearance-none
                              bg-white
                              border border-slate-200
                              text-slate-700
                              py-3 pl-4 pr-10
                              rounded-xl text-sm font-bold
                              focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                              shadow-[0_12px_40px_rgba(15,23,42,0.08)]
                              cursor-pointer hover:border-slate-300
                              transition-all min-w-[190px]
                            "
                          >
                            <option value="best">Best match</option>
                            <option value="price_asc">Cheapest (low to high)</option>
                            <option value="price_desc">Price (high to low)</option>
                            <option value="duration">Fastest</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-5">
                      {filteredResults.map((f) => (
                        <FlightResultCard key={f.id} flight={f} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-32 opacity-60">
                    <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-slate-800">
                      No flights found
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Try adjusting your dates or filters.
                    </p>
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}