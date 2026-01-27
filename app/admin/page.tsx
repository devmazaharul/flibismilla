'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    ArrowUpRight, 
    ArrowDownRight, 
    DollarSign, 
    Users, 
    CreditCard, 
    Activity, 
    RefreshCw,
    Download,
    Calendar,
    Search,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button'; // shadcn button (optional) or standard HTML button
import { Skeleton } from '@/components/ui/skeleton'; // shadcn skeleton or custom

// --- UTILS ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0 
    }).format(amount);
};

// --- COMPONENTS ---

export default function VercelDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 1. API Call Function
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            // আপনার তৈরি করা Aggregated API কল
            const res = await axios.get('/api/dashboard/data');
            
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            console.error(err);
            setError('Connection error with server');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manual Refresh Handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    if (loading) return <DashboardSkeleton />;
    if (error) return <ErrorState message={error} retry={fetchData} />;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Overview</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Dashboard &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleRefresh}
                            className={`p-2 bg-white border cursor-pointer border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors shadow-2xl shadow-gray-100">
                            <Download size={16} /> Export Report
                        </button>
                    </div>
                </div>

                {/* --- KPI GRID (Vercel Style: Clean Borders) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                        title="Total Revenue" 
                        value={formatCurrency(data?.kpi?.totalRevenue || 0)}
                        subValue={`+${formatCurrency(data?.kpi?.potentialRevenue || 0)} pending`}
                        icon={<DollarSign className="w-4 h-4 text-gray-500" />}
                        trend="+12.5%"
                        trendUp={true}
                    />
                    <KPICard 
                        title="Net Profit (Est.)" 
                        value={formatCurrency(data?.kpi?.netProfit || 0)}
                        subValue="15% Margin applied"
                        icon={<CreditCard className="w-4 h-4 text-gray-500" />}
                        trend="+8.2%"
                        trendUp={true}
                    />
                    <KPICard 
                        title="Active Bookings" 
                        value={data?.kpi?.totalBookings || 0}
                        subValue={`${data?.kpi?.pendingBookings} awaiting approval`}
                        icon={<Users className="w-4 h-4 text-gray-500" />}
                        trend="+24.0%"
                        trendUp={true}
                    />
                    <KPICard 
                        title="Total Bookings" 
                        value="8,42" // This can be dynamic if you have analytics
                        subValue="Last 30 days"
                        icon={<Activity className="w-4 h-4 text-gray-500" />}
                        trend="-2.1%"
                        trendUp={false}
                    />
                </div>

                {/* --- CHARTS SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-medium text-gray-900">Revenue Growth</h3>
                            <select className="text-sm border-none bg-gray-50 rounded px-2 py-1 text-gray-600 focus:ring-0 cursor-pointer">
                                <option>Last 6 Months</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.charts?.revenueTrend || []}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#6B7280', fontSize: 12}} 
                                        dy={10} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#6B7280', fontSize: 12}} 
                                        tickFormatter={(value) => `$${value/1000}k`} 
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#000" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorValue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-[0px_2px_4px_rgba(0,0,0,0.02)]">
                        <h3 className="font-medium text-gray-900 mb-6">Sales by Category</h3>
                        <div className="h-[200px] w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.charts?.categoryDistribution || []} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={60}
                                        tick={{fontSize: 12, fill: '#374151', fontWeight: 500}}
                                    />
                                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                        {data?.charts?.categoryDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#000'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Legend */}
                        <div className="space-y-3">
                            {data?.charts?.categoryDistribution.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                                        <span className="text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{item.value} Sales</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RECENT BOOKINGS TABLE (Minimalist) --- */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-[0px_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-gray-900">Recent Transactions</h3>
                            <p className="text-sm text-gray-500 mt-1">Latest booking requests from customers.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-black focus:ring-1 focus:ring-black w-full sm:w-64 transition-all"
                                />
                            </div>
                            <button className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
                                <Filter className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.recentBookings?.map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{booking.customerName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{booking.date}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {booking.packageTitle}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatCurrency(booking.price)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.recentBookings || data.recentBookings.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">
                                            No recent bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
                        <button className="text-sm font-medium text-gray-600 hover:text-black transition-colors flex items-center justify-center gap-1 mx-auto">
                            View all transactions <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const KPICard = ({ title, value, subValue, icon, trend, trendUp }: any) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-[0px_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 transition-colors group">
        <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            {icon}
        </div>
        <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-semibold text-gray-900">{value}</h2>
        </div>
        <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">{subValue}</p>
            <span className={`text-xs font-medium flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                {trend}
            </span>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    // Vercel style badges: small dot + text
    const normalized = status.toLowerCase();
    let colorClass = "bg-gray-100 text-gray-600";
    let dotClass = "bg-gray-400";

    if (normalized === 'confirmed') {
        colorClass = "bg-white border border-gray-200 text-gray-700";
        dotClass = "bg-emerald-500";
    } else if (normalized === 'pending') {
        colorClass = "bg-white border border-gray-200 text-gray-700";
        dotClass = "bg-amber-500";
    } else if (normalized === 'cancelled') {
        colorClass = "bg-white border border-gray-200 text-gray-700";
        dotClass = "bg-rose-500";
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            {status}
        </span>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black text-white text-xs p-2 rounded shadow-xl">
                <p className="font-semibold mb-1">{label}</p>
                <p>{`${payload[0].name === 'value' ? 'Revenue' : payload[0].name} : ${
                    payload[0].name === 'value' || payload[0].name === 'Revenue' 
                    ? formatCurrency(payload[0].value) 
                    : payload[0].value
                }`}</p>
            </div>
        );
    }
    return null;
};

// Vercel-like Skeleton
const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg border border-gray-300"></div>)}
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 h-80 bg-gray-200 rounded-lg border border-gray-300"></div>
                <div className="h-80 bg-gray-200 rounded-lg border border-gray-300"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg border border-gray-300"></div>
        </div>
    </div>
);

const ErrorState = ({ message, retry }: any) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl shadow-gray-100 border border-gray-200 max-w-md w-full">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button 
                onClick={retry}
                className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
            >
                Try Again
            </button>
        </div>
    </div>
);