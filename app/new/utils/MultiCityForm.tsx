'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, Plane, Plus, Trash2, AlertCircle } from 'lucide-react';
import PassengerSelector from './PassengerSelector'; 
import { z } from 'zod';
import { AirportInput } from './AirportInput';

// Schema Definition
const flightLegSchema = z.object({
    origin: z.string().min(1, "Origin is required"),
    destination: z.string().min(1, "Destination is required"),
    date: z.string().min(1, "Date is required"),
}).refine((data) => data.origin !== data.destination, {
    message: "Same airport",
    path: ["destination"],
});

const multiCitySchema = z.object({
    flights: z.array(flightLegSchema).min(2, "At least 2 flights required"),
    passengers: z.object({
        adults: z.number().min(1),
        children: z.number(),
        infants: z.number()
    }),
    cabinClass: z.string()
});

interface FlightLeg {
    origin: string;
    destination: string;
    date: string;
}

export default function MultiCityForm({ onSearch }: { onSearch: (params: URLSearchParams) => void }) {
    const searchParams = useSearchParams();
    const [today, setToday] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const dt = new Date();
        const offset = dt.getTimezoneOffset() * 60000;
        setToday(new Date(dt.getTime() - offset).toISOString().split('T')[0]);
    }, []);

    const [flights, setFlights] = useState<FlightLeg[]>([
        { origin: 'DAC', destination: 'DXB', date: '' },
        { origin: 'DXB', destination: 'LHR', date: '' },
    ]);
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
    const [cabinClass, setCabinClass] = useState('economy');

    // Populate from URL
    useEffect(() => {
        const flightsParam = searchParams.get('flights');
        if (flightsParam) {
            try {
                const parsedFlights = JSON.parse(flightsParam);
                if (Array.isArray(parsedFlights) && parsedFlights.length > 0) {
                    setFlights(parsedFlights);
                }
            } catch (e) { console.error(e); }
        }
    }, [searchParams]);

    const handleFlightChange = (index: number, field: keyof FlightLeg, value: string) => {
        const newFlights = [...flights];
        newFlights[index] = { ...newFlights[index], [field]: value };
        
        if (field === 'destination' && index < flights.length - 1) {
            newFlights[index + 1].origin = value;
        }
        
        setFlights(newFlights);
        
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`flights.${index}.${field}`];
            return newErrors;
        });
    };

    const addFlight = () => {
        if (flights.length < 5) {
            const lastDest = flights[flights.length - 1].destination;
            const lastDate = flights[flights.length - 1].date || today;
            setFlights([...flights, { origin: lastDest, destination: '', date: lastDate }]);
        }
    };

    const removeFlight = (index: number) => {
        if (flights.length > 2) {
            const newFlights = flights.filter((_, i) => i !== index);
            setFlights(newFlights);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = multiCitySchema.safeParse({ flights, passengers, cabinClass });

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach((err) => {
                const path = err.path.join('.'); 
                newErrors[path] = err.message;
            });
            setErrors(newErrors);
            return;
        }

        const params = new URLSearchParams();
        params.set('type', 'multi_city');
        params.set('flights', JSON.stringify(flights));
        params.set('adt', passengers.adults.toString());
        params.set('chd', passengers.children.toString());
        params.set('inf', passengers.infants.toString());
        params.set('class', cabinClass);
        
        if(onSearch) onSearch(params);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 relative z-20 mx-auto">
            <div className="flex flex-col gap-6">
                
                {flights.map((flight, index) => (
                    <div 
                        key={index} 
                        className="flex flex-col xl:flex-row gap-4 items-center animate-in slide-in-from-top-2 p-2 rounded-2xl hover:bg-slate-50/50 transition-colors relative"
                        // 🟢 FIX 1: Dynamic Z-Index ensures top rows float OVER bottom rows
                        style={{ zIndex: 50 - index }} 
                    >
                        
                        {/* Index Badge */}
                        <div className="hidden xl:flex w-8 h-8 shrink-0 bg-slate-900 text-white rounded-full items-center justify-center text-xs font-bold shadow-md">
                            {index + 1}
                        </div>

                        {/* Location Inputs */}
                        <div className="flex flex-col md:flex-row w-full flex-1 items-center gap-3 relative">
                            {/* From Input */}
                            <div className="w-full relative z-30">
                                <AirportInput 
                                    label="From" 
                                    codeValue={flight.origin} 
                                    onSelect={(code: string) => handleFlightChange(index, 'origin', code)} 
                                    placeholder="Origin" 
                                    icon={<MapPin className="w-4 h-4 text-rose-500" />} 
                                    hasError={!!errors[`flights.${index}.origin`]}
                                />
                            </div>
                            
                            {/* To Input */}
                            <div className="w-full relative z-20">
                                <AirportInput 
                                    label="To" 
                                    codeValue={flight.destination} 
                                    onSelect={(code: string) => handleFlightChange(index, 'destination', code)} 
                                    placeholder="Destination" 
                                    icon={<Plane className="w-4 h-4 rotate-90 text-rose-500" />} 
                                    hasError={!!errors[`flights.${index}.destination`]}
                                />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className={`w-full xl:w-[220px] group relative z-10 h-[56px] bg-white border rounded-xl px-4 flex flex-col justify-center transition-all ${errors[`flights.${index}.date`] ? 'border-red-500 ring-1 ring-red-500/20 bg-red-50' : 'border-slate-300 hover:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500'}`}>
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${errors[`flights.${index}.date`] ? 'bg-red-100 text-red-500' : 'group-focus-within:bg-rose-50 group-focus-within:text-rose-600'}`}>
                                <Calendar className="w-4 h-4 text-rose-500" />
                            </div>
                            <div className="ml-10">
                                <label className={`text-[10px] font-bold uppercase tracking-widest block leading-tight ${errors[`flights.${index}.date`] ? 'text-red-400' : 'text-slate-400'}`}>Date</label>
                                <input 
                                    type="date" 
                                    min={index > 0 ? (flights[index - 1].date || today) : today}
                                    value={flight.date} 
                                    onChange={(e) => handleFlightChange(index, 'date', e.target.value)} 
                                    className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-slate-800 uppercase cursor-pointer leading-tight" 
                                />
                            </div>
                        </div>

                        {/* Remove Button */}
                        {index > 1 && (
                            <button type="button" onClick={() => removeFlight(index)} className="w-full xl:w-auto h-[56px] xl:h-14 xl:w-14 rounded-xl text-red-500 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:bg-red-50">
                                <Trash2 className="w-5 h-5 hover:text-red-600" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Controls Row */}
                <div className="flex flex-col md:flex-row gap-4 mt-2 pt-4 border-t border-slate-100 relative z-10">
                    <button type="button" onClick={addFlight} className="w-full md:flex-1 h-[56px] border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold flex items-center cursor-pointer justify-center gap-2 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                        <Plus className="w-4 h-4" /> Add Flight
                    </button>
                    
                    {/* 🟢 FIX 2: Increased Z-Index for Passenger Selector Wrapper */}
                    <div className="w-full md:w-[280px] relative z-50">
                        <div className="h-[56px] hover:border-rose-400 transition-all">
                            <PassengerSelector onChange={(data: any) => { setPassengers(data.passengers); setCabinClass(data.cabinClass); }} />
                        </div>
                    </div>

                    <button type="submit" className="w-full md:flex-1 h-[56px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-rose-200 relative z-10">
                        <Search className="w-5 h-5" /> Search Flights
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {Object.keys(errors).length > 0 && (
                <div className="absolute -bottom-12 left-0 right-0 mx-auto w-fit bg-red-50 border border-red-100 text-red-600 px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2 shadow-lg z-50">
                    <AlertCircle className="w-4 h-4" />
                    Please fix the highlighted errors before searching.
                </div>
            )}
        </form>
    );
}