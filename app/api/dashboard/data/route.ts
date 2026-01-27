export const dynamic = 'force-dynamic'; // প্রোডাকশনে ক্যাশ এড়াতে
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import Destination from '@/models/Destination.model';
import Offer from '@/models/Offer.model';
import Package from '@/models/Package.model';
import { NextResponse } from 'next/server';

export async function GET() {
    try {

        await dbConnect();
        const [allBookings, allPackages, totalDestinations, totalOffers] = await Promise.all([
            Booking.find().select('packagePrice status createdAt customerName packageTitle customerPhone category').sort({ createdAt: -1 }),
            Package.find().select('category price'),
            Destination.countDocuments(),
            Offer.countDocuments()
        ]);

        // ================= BUSINESS LOGIC & CALCULATIONS =================

        const statsCount = {
            total: allBookings.length,
            pending: 0,
            confirmed: 0,
            cancelled: 0
        };

 
        let totalRevenue = 0;
        let potentialRevenue = 0; 


        const last6Months = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            last6Months.set(monthName, 0);
        }

   
        allBookings.forEach((booking) => {
            const price = booking.packagePrice || 0;
            const status = booking.status ? booking.status.toLowerCase() : 'pending';

            // Status Check
            if (status === 'confirmed') {
                statsCount.confirmed += 1;
                totalRevenue += price;

                // Chart Data Fill-up (Confirmed bookings only)
                const month = new Date(booking.createdAt).toLocaleString('default', { month: 'short' });
                if (last6Months.has(month)) {
                    last6Months.set(month, last6Months.get(month) + price);
                }

            } else if (status === 'cancelled') {
                statsCount.cancelled += 1;
            } else {
                // Default to Pending
                statsCount.pending += 1;
                potentialRevenue += price;
            }
        });

        const profitMargin = 0.15; 
        const netProfit = totalRevenue * profitMargin;

        const revenueChartData = Array.from(last6Months, ([name, value]) => ({ name, value }));

   
        const categoryStats = {
            hajj: allPackages.filter((p: any) => p.category?.toLowerCase() === 'hajj').length,
            umrah: allPackages.filter((p: any) => p.category?.toLowerCase() === 'umrah').length,
            holiday: allPackages.filter((p: any) => p.category?.toLowerCase() === 'holiday').length,
            tour: allPackages.filter((p: any) => p.category?.toLowerCase() === 'tour').length,
        };
        

        const categoryChartData = [
            { name: 'Hajj', value: categoryStats.hajj, color: '#E11D48' },
            { name: 'Umrah', value: categoryStats.umrah, color: '#F43F5E' },
            { name: 'Holiday', value: categoryStats.holiday, color: '#FB7185' },
            { name: 'Tour', value: categoryStats.tour, color: '#FB7185' },
        ];

        // ================= FINAL RESPONSE =================

        return NextResponse.json({
            success: true,
            data: {
                // KPI Cards Data
                kpi: {
                    totalRevenue,
                    netProfit,          // Calculated Profit
                    potentialRevenue,   // Opportunity amount
                    totalBookings: statsCount.total,
                    pendingBookings: statsCount.pending,
                    activePackages: allPackages.length,
                    activeDestinations: totalDestinations,
                    activeOffers: totalOffers
                },
                // Charts Data
                charts: {
                    revenueTrend: revenueChartData,
                    categoryDistribution: categoryChartData
                },
                // Recent Table Data (Top 8)
                recentBookings: allBookings.slice(0, 8).map((b: any) => ({
                    id: b._id,
                    customerName: b.customerName,
                    packageTitle: b.packageTitle,
                    price: b.packagePrice,
                    status: b.status || 'Pending', // Fallback status
                    date: new Date(b.createdAt).toLocaleDateString()
                }))
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            message: "Failed to calculate dashboard data",
            error: error.message 
        }, { status: 500 });
    }
}