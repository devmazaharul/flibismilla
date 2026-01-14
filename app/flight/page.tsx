'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';
import {
    FaPlane,
    FaPlaneDeparture,
    FaPlaneArrival,
    FaClock,
    FaSuitcaseRolling,
    FaFilter,
    FaSearch,
    FaTimes,
    FaChevronDown,
    FaChevronUp,
} from 'react-icons/fa';
import FlightSearchCompact from './compo/FlightsearchCard';
import { formatDuration, formatTime, getAirlineLogo } from '@/validation/response';
import { airportDatabase } from '@/constant/flight';
import { websiteDetails } from '@/constant/data';

//  Helper to get Airport Details safely
const getAirportDetails = (code: string) => {
    return airportDatabase[code] || { city: code, airport: `${code} Intl Airport` };
};

// Helper to convert Duration (PT2H30M) to Minutes for Sorting
const getDurationInMinutes = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    return hours * 60 + minutes;
};

const FlightSearchPage = () => {
    const { layout } = appTheme;
    const searchParams = useSearchParams();

    const fromParam = searchParams.get('from') || '';
    const toParam = searchParams.get('to') || '';
    const dateParam = searchParams.get('date') || '';

    // States
    const [isLoading, setIsLoading] = useState(false);
    const [flights, setFlights] = useState<any[]>([]);
    const [dictionaries, setDictionaries] = useState<any>(null);
    const [error, setError] = useState('');

    // Filters State
    const [priceRange, setPriceRange] = useState(5000);
    const [sortBy, setSortBy] = useState('cheapest');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStops, setSelectedStops] = useState<number[]>([]);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

    // Fetch Data
    useEffect(() => {
        const fetchFlights = async () => {
            if (!fromParam || !toParam || !dateParam) return;

            setIsLoading(true);
            setError('');
            setFlights([]);
            try {
                const res = await axios.get(
                    `/api/search?origin=${fromParam}&dest=${toParam}&date=${dateParam}`,
                );
                if (res.data.success) {
                    setFlights(res.data.data);
                    setDictionaries(res.data.dictionaries);
                } else {
                    setError(res.data.error || 'No flights found.');
                }
            } catch (err: any) {
                setError('Failed to fetch flights. Please check connection.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlights();
    }, [fromParam, toParam, dateParam]);

    // Available Airlines Logic
    const availableAirlines = useMemo(() => {
        const carriers = new Set<string>();
        flights.forEach((f) => {
            const code = f.itineraries[0].segments[0].carrierCode;
            carriers.add(code);
        });
        return Array.from(carriers);
    }, [flights]);

    //  Filter & Sort Logic
    const processedFlights = useMemo(() => {
        let result = [...flights];

        // 1. Price Filter
        result = result.filter((f) => parseFloat(f.price.total) <= priceRange);

        // 2. Stops Filter
        if (selectedStops.length > 0) {
            result = result.filter((f) => {
                const stops = f.itineraries[0].segments.length - 1;
                if (selectedStops.includes(2) && stops >= 2) return true;
                return selectedStops.includes(stops);
            });
        }

        // 3. Airline Filter
        if (selectedAirlines.length > 0) {
            result = result.filter((f) => {
                const carrier = f.itineraries[0].segments[0].carrierCode;
                return selectedAirlines.includes(carrier);
            });
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (sortBy === 'cheapest') {
                return parseFloat(a.price.total) - parseFloat(b.price.total);
            } else if (sortBy === 'fastest') {
                return (
                    getDurationInMinutes(a.itineraries[0].duration) -
                    getDurationInMinutes(b.itineraries[0].duration)
                );
            }
            return 0;
        });

        return result;
    }, [flights, priceRange, sortBy, selectedStops, selectedAirlines]);

    // Handlers
    const toggleStop = (val: number) =>
        setSelectedStops((prev) =>
            prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
        );
    const toggleAirline = (val: string) =>
        setSelectedAirlines((prev) =>
            prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
        );
    const resetFilters = () => {
        setPriceRange(5000);
        setSelectedStops([]);
        setSelectedAirlines([]);
        setSortBy('cheapest');
    };

    //handle click

    if (!fromParam || !toParam || !dateParam) {
        return (
            <div className="min-h-screen  flex items-center justify-center p-4">
                <div className="w-full max-w-6xl bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 text-center">
                    {/* === 1. Title & Description === */}
                    <div className="text-center mb-8 px-4">
                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                            Find Your <span className="text-rose-600">Perfect Flight</span>
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base font-medium max-w-2xl mx-auto">
                            Compare prices from hundreds of airlines and book the cheapest tickets
                            to your dream destination.
                        </p>
                    </div>
                    <FlightSearchCompact />
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Header */}
            <div className=" border-b border-gray-200/80 bg-gray-800  top-0 z-30 shadow-2xl shadow-gray-100 ">
                <div className={`${layout.container} py-4`}>
                    <FlightSearchCompact
                        initialValues={{ from: fromParam, to: toParam, date: dateParam }}
                    />
                </div>
            </div>

            <div className={`${layout.container} mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8`}>
                {/* Sidebar Filters */}
                <div
                    className={`fixed inset-0 z-50 bg-white lg:static lg:bg-transparent lg:z-auto lg:block p-6 lg:p-0 overflow-y-auto transition-transform duration-300 ${
                        showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    <div className="bg-white p-6 rounded-2xl border border-gray-200/70 shadow-2xl shadow-gray-100 h-fit sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FaFilter className="text-rose-600" /> Filters
                            </h3>
                            <button
                                onClick={resetFilters}
                                className="text-xs text-rose-600 font-bold hover:underline"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="lg:hidden text-gray-500"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Price Filter */}
                        <div className="mb-8 border-b border-gray-100 pb-6">
                            <label className="text-sm font-bold text-gray-700 mb-4 block">
                                Max Price: <span className="text-rose-600">${priceRange}</span>
                            </label>
                            <input
                                type="range"
                                min="300"
                                max="5000"
                                step="50"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                            />
                        </div>

                        {/* Stops Filter */}
                        <div className="mb-8 border-b border-gray-100 pb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">
                                Stops
                            </label>
                            <div className="space-y-3">
                                {[
                                    { l: 'Direct', v: 0 },
                                    { l: '1 Stop', v: 1 },
                                    { l: '2+ Stops', v: 2 },
                                ].map((stop) => (
                                    <label
                                        key={stop.v}
                                        className="flex items-center gap-3 cursor-pointer group"
                                    >
                                        <div
                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                selectedStops.includes(stop.v)
                                                    ? 'bg-rose-600 border-rose-600'
                                                    : 'border-gray-300 group-hover:border-rose-400'
                                            }`}
                                        >
                                            {selectedStops.includes(stop.v) && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            onChange={() => toggleStop(stop.v)}
                                            checked={selectedStops.includes(stop.v)}
                                        />
                                        <span className="text-sm text-gray-600 font-medium">
                                            {stop.l}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Airlines Filter */}
                        <div className="mb-8 border-b border-gray-100 pb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">
                                Airlines
                            </label>
                            {availableAirlines.length > 0 ? (
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                    {availableAirlines.map((code) => {
                                        const name = dictionaries?.carriers?.[code] || code;
                                        return (
                                            <label
                                                key={code}
                                                className="flex items-center gap-3 cursor-pointer group"
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                        selectedAirlines.includes(code)
                                                            ? 'bg-rose-600 border-rose-600'
                                                            : 'border-gray-300 group-hover:border-rose-400'
                                                    }`}
                                                >
                                                    {selectedAirlines.includes(code) && (
                                                        <span className="text-white text-xs">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    onChange={() => toggleAirline(code)}
                                                    checked={selectedAirlines.includes(code)}
                                                />
                                                <span
                                                    className="text-sm text-gray-600 font-medium truncate"
                                                    title={name}
                                                >
                                                    {name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">No airlines available</p>
                            )}
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block">
                                Sort By
                            </label>
                            <div className="space-y-2">
                                <label
                                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                                        sortBy === 'cheapest'
                                            ? 'bg-rose-50 border-rose-200'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="sort"
                                        checked={sortBy === 'cheapest'}
                                        onChange={() => setSortBy('cheapest')}
                                        className="accent-rose-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Cheapest First
                                    </span>
                                </label>
                                <label
                                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                                        sortBy === 'fastest'
                                            ? 'bg-rose-50 border-rose-200'
                                            : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="sort"
                                        checked={sortBy === 'fastest'}
                                        onChange={() => setSortBy('fastest')}
                                        className="accent-rose-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Fastest First
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-500 font-medium">
                            Found{' '}
                            <span className="text-gray-900 font-bold">
                                {processedFlights.length}
                            </span>{' '}
                            flights
                        </p>
                        <button
                            onClick={() => setShowFilters(true)}
                            className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold shadow-sm"
                        >
                            <FaFilter /> Filter
                        </button>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <FaPlane className="text-5xl text-rose-500 animate-pulse" />
                            <p className="text-gray-600 font-medium animate-pulse">
                                Searching best deals...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {!isLoading &&
                            processedFlights.map((flight: any) => (
                                <FlightCard
                                    key={flight.id}
                                    flight={flight}
                                    dictionaries={dictionaries}
                                />
                            ))}
                    </div>

                    {!isLoading && processedFlights.length === 0 && !error && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <FaSearch className="text-gray-300 text-3xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No flights found</h3>
                            <p className="text-gray-500 mt-2">
                                Adjust your filters to see more results.
                            </p>
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="mt-4 border-gray-300"
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

// ================= Updated Flight Card =================
const FlightCard = ({ flight, dictionaries }: { flight: any; dictionaries: any }) => {
    const [showDetails, setShowDetails] = useState(false);

    const itinerary = flight.itineraries[0];
    const segments = itinerary.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    const airlineCode = firstSegment.carrierCode;
    const airlineName = dictionaries?.carriers?.[airlineCode] || airlineCode;
    const duration = formatDuration(itinerary.duration);
    const stops = segments.length - 1;
    const price = flight.price.total;
    const currency = flight.price.currency;

    //  Using Helper safely
    const originDetails = getAirportDetails(firstSegment.departure.iataCode);
    const destDetails = getAirportDetails(lastSegment.arrival.iataCode);

    function handleClick() {
        const message = ` *Flight Booking Request*
        
*Airline:* ${airlineName} (${airlineCode})
*Flight Number:* ${airlineCode}-${firstSegment.number}

 *Route*
From: ${firstSegment.departure.iataCode} (${originDetails.city})
To: ${lastSegment.arrival.iataCode} (${destDetails.city})

 *Schedule*
Departure: ${formatTime(firstSegment.departure.at)}
Arrival: ${formatTime(lastSegment.arrival.at)}
Duration: ${duration}

 *Price:* *${currency} ${price}*

Please provide me with further booking details.
Thank you!`;

        const whatsappURL = `https://wa.me/${
            websiteDetails.whatsappNumber
        }?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-200/70 shadow-2xl shadow-gray-100  transition-all duration-300 overflow-hidden group">
            {/* Main Info */}
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    {/* Airline */}
                    <div className="flex items-center gap-4 min-w-[180px]">
                        <div className="w-14 h-14 relative bg-gray-50 rounded-xl p-2 border border-gray-200/50 shadow-2xl shadow-gray-100 ">
                            <img
                                src={getAirlineLogo(airlineCode)}
                                alt={airlineCode}
                                className="w-full h-full object-contain mix-blend-multiply"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/fallback-plane.png';
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                                {airlineName}
                            </h3>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                {airlineCode}-{firstSegment.number}
                            </span>
                        </div>
                    </div>

                    {/* Flight Path */}
                    <div className="flex-1 flex items-center justify-between gap-4 px-2 md:px-8">
                        {/* Origin */}
                        <div className="text-center min-w-[100px]">
                            <p className="text-xl font-bold text-gray-900">
                                {formatTime(firstSegment.departure.at)}
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                {firstSegment.departure.iataCode}
                            </p>
                            <div className="flex flex-col items-center">
                                <small className="text-xs text-gray-700">
                                    {originDetails.city}
                                </small>
                            </div>
                        </div>

                        {/* Graphic */}
                        <div className="flex-1 flex flex-col items-center px-4">
                            <p className="text-xs text-gray-400 font-medium mb-2">{duration}</p>
                            <div className="w-full flex items-center gap-1 relative">
                                <div className="h-[2px] bg-gray-200 flex-1 rounded-full"></div>
                                <FaPlane className="text-rose-500 text-lg transform rotate-90 bg-white p-1 rounded-full border border-gray-100" />
                                <div className="h-[2px] bg-gray-200 flex-1 rounded-full"></div>
                            </div>
                            <p
                                className={`text-xs mt-2 font-bold px-3 py-1 rounded-full border ${
                                    stops === 0
                                        ? 'bg-green-50 text-green-600 border-green-100'
                                        : 'bg-orange-50 text-orange-600 border-orange-100'
                                }`}
                            >
                                {stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}
                            </p>
                        </div>

                        {/* Destination */}
                        <div className="text-center min-w-[100px]">
                            <p className="text-xl font-bold text-gray-900">
                                {formatTime(lastSegment.arrival.at)}
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                {lastSegment.arrival.iataCode}
                            </p>
                            <div className="flex flex-col items-center">
                                <small className="text-xs  text-gray-700">{destDetails.city}</small>
                            </div>
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end min-w-[140px] border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                        <div className="text-left md:text-right">
                            <p className="text-3xl font-extrabold text-gray-700">
                                {currency} {price}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">Total Price</p>
                        </div>
                        <Button
                            onClick={handleClick}
                            className="bg-red-600 hover:bg-rose-700 text-white w-32 md:w-full mt-2 transition-colors shadow-lg shadow-rose-500/10"
                        >
                            Select
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <div
                onClick={() => setShowDetails(!showDetails)}
                className="bg-gray-50/80 hover:bg-rose-50/50 px-6 py-3 flex justify-center items-center border-t border-gray-100 cursor-pointer transition-colors"
            >
                <span className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wider group-hover:text-rose-600">
                    {showDetails ? 'Hide Itinerary' : 'View Flight Details'}{' '}
                    {showDetails ? <FaChevronUp /> : <FaChevronDown />}
                </span>
            </div>

            {/* Expanded Details */}
            {showDetails && (
                <div className="bg-white border-t border-gray-100 p-6 md:p-8 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FaClock className="text-rose-500" /> Flight Itinerary
                    </h4>
                    <div className="relative pl-4 space-y-0">
                        <div className="absolute left-[27px] top-3 bottom-6 w-[2px] bg-gray-200"></div>
                        {segments.map((seg: any, idx: number) => {
                            let layoverTime = '';
                            if (idx < segments.length - 1) {
                                const arrival = new Date(seg.arrival.at).getTime();
                                const nextDep = new Date(segments[idx + 1].departure.at).getTime();
                                const diff = nextDep - arrival;
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                layoverTime = `${hours}h ${mins}m`;
                            }

                            const segOrigin = getAirportDetails(seg.departure.iataCode);
                            const segDest = getAirportDetails(seg.arrival.iataCode);

                            return (
                                <div key={idx} className="relative pb-8 last:pb-0">
                                    <div className="flex gap-6">
                                        <div className="relative z-10 w-6 h-6 bg-white border-2 border-rose-500 rounded-full flex items-center justify-center shrink-0 mt-1">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-lg font-bold text-gray-800">
                                                    {seg.departure.iataCode}
                                                </span>
                                                <FaPlane className="text-gray-300 text-xs" />
                                                <span className="text-lg font-bold text-gray-800">
                                                    {seg.arrival.iataCode}
                                                </span>
                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-2 border border-blue-100 font-bold">
                                                    {seg.carrierCode} {seg.number}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Depart
                                                    </p>
                                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                                        <FaPlaneDeparture />{' '}
                                                        {formatTime(seg.departure.at)}
                                                    </p>
                                                    <p className="text-xs mt-1 text-gray-500">
                                                        {new Date(seg.departure.at).toDateString()}
                                                    </p>
                                                    <p className="text-xs mt-1 text-rose-600 font-bold">
                                                        {segOrigin.airport}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Arrive
                                                    </p>
                                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                                        <FaPlaneArrival />{' '}
                                                        {formatTime(seg.arrival.at)}
                                                    </p>
                                                    <p className="text-xs mt-1 text-gray-500">
                                                        {new Date(seg.arrival.at).toDateString()}
                                                    </p>
                                                    <p className="text-xs mt-1 text-rose-600 font-bold">
                                                        {segDest.airport}
                                                    </p>
                                                </div>
                                                <div className="sm:col-span-2 border-t border-gray-200 pt-2 mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <FaClock /> Duration:{' '}
                                                    {formatDuration(seg.duration)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {layoverTime && (
                                        <div className="ml-12 mt-4 mb-4">
                                            <div className="bg-orange-50 border border-orange-100 text-orange-700 px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2">
                                                <FaSuitcaseRolling /> Layover in {segDest.city} (
                                                {seg.arrival.iataCode}): {layoverTime}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightSearchPage;
