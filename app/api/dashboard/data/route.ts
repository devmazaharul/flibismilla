export const dynamic = "force-dynamic"; // always dynamic in production to avoid caching

import { NextResponse } from "next/server";
import dbConnect from "@/connection/db";
import Booking from "@/models/Booking.model";
import Destination from "@/models/Destination.model";
import Offer from "@/models/Offer.model";
import Package from "@/models/Package.model";

export async function GET() {
  try {
    await dbConnect();

    // 1. Fetch all required data in parallel (performance-optimized)
    const [allBookings, allPackages, totalDestinations, totalOffers] =
      await Promise.all([
        // Only select the fields we actually need
        Booking.find({})
          .select(
            "pricing status createdAt contact flightDetails pnr bookingReference"
          )
          .sort({ createdAt: -1 })
          .lean(),

        // Package categories for the category distribution chart
        Package.find({}).select("category").lean(),

        Destination.countDocuments(),
        Offer.countDocuments(),
      ]);

    // ================= AGGREGATION & BUSINESS LOGIC =================

    const statsCount = {
      total: allBookings.length,
      pending: 0, // Held + Processing
      confirmed: 0, // Issued
      cancelled: 0, // Cancelled + Failed + Expired
    };

    let totalRevenue = 0; // Confirmed (issued) bookings only
    let totalProfit = 0; // Markup sum
    let potentialRevenue = 0; // Pending / held bookings

    // Track a "base" currency from bookings (assumes most bookings use same currency)
    let detectedCurrency: string | null = null;

    // --- Revenue Trend: last 6 calendar months ---
    const last6Months = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString("default", { month: "short" });
      last6Months.set(monthName, 0);
    }

    // --- Booking Loop: compute all stats ---
    allBookings.forEach((booking: any) => {
      const amount = Number(booking.pricing?.total_amount) || 0;
      const markup = Number(booking.pricing?.markup) || 0;
      const status = booking.status
        ? String(booking.status).toLowerCase()
        : "processing";

      const currency = booking.pricing?.currency as string | undefined;
      if (!detectedCurrency && currency) {
        detectedCurrency = currency;
      }

      const createdAt = booking.createdAt
        ? new Date(booking.createdAt)
        : new Date();
      const bookingMonth = createdAt.toLocaleString("default", {
        month: "short",
      });

      if (status === "issued") {
        // Confirmed sale
        statsCount.confirmed += 1;
        totalRevenue += amount;
        totalProfit += markup;

        // Revenue trend chart (issued bookings only)
        if (last6Months.has(bookingMonth)) {
          last6Months.set(
            bookingMonth,
            (last6Months.get(bookingMonth) || 0) + amount
          );
        }
      } else if (["cancelled", "failed", "expired"].includes(status)) {
        // Lost sale
        statsCount.cancelled += 1;
      } else {
        // Pending / opportunity
        statsCount.pending += 1;
        potentialRevenue += amount;
      }
    });

    // Use detected currency if any booking has it; otherwise default
    const baseCurrency = detectedCurrency || "USD";

    // Revenue Chart Formatting
    const revenueChartData = Array.from(
      last6Months,
      ([name, value]) => ({ name, value })
    );

    // --- Category Distribution Chart (Package inventory + flights) ---
    const categoryStats = {
      hajj: 0,
      umrah: 0,
      holiday: 0,
      tour: 0,
      others: 0,
    };

    allPackages.forEach((pkg: any) => {
      const cat = pkg.category ? String(pkg.category).toLowerCase() : "others";
      if (cat === "hajj") categoryStats.hajj++;
      else if (cat === "umrah") categoryStats.umrah++;
      else if (cat === "holiday") categoryStats.holiday++;
      else if (cat === "tour" || cat === "islamic tour") categoryStats.tour++;
      else categoryStats.others++;
    });

    const categoryChartData = [
      { name: "Hajj", value: categoryStats.hajj, color: "#10B981" }, // Green
      { name: "Umrah", value: categoryStats.umrah, color: "#F59E0B" }, // Amber
      { name: "Holiday", value: categoryStats.holiday, color: "#EC4899" }, // Pink
      { name: "Tour", value: categoryStats.tour, color: "#6366F1" }, // Indigo
      {
        name: "Flight (Sold)",
        value: statsCount.confirmed,
        color: "#3B82F6",
      }, // Blue (comparison)
    ].filter((item) => item.value > 0); // Do not show zero-value segments

    // --- Recent Bookings (Top 8) ---
    const recentBookings = allBookings.slice(0, 8).map((b: any) => ({
      id: b._id,
      customerName: b.contact?.email || "Guest",
      customerPhone: b.contact?.phone || "N/A",
      packageTitle: b.flightDetails?.route
        ? `${b.flightDetails.route} (${b.flightDetails.airline})`
        : "Flight Booking",
      price: Number(b.pricing?.total_amount) || 0,
      currency: b.pricing?.currency || baseCurrency, // <<< expose booking currency here
      status: b.status,
      pnr: b.pnr || b.bookingReference,
      date: new Date(b.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    // ================= FINAL RESPONSE =================

    return NextResponse.json(
      {
        success: true,
        data: {
          // 1. KPI cards data
          kpi: {
            totalRevenue,
            netProfit: totalProfit,
            potentialRevenue,
            totalBookings: statsCount.total,
            pendingBookings: statsCount.pending,
            confirmedBookings: statsCount.confirmed,
            cancelledBookings: statsCount.cancelled,
            activePackages: allPackages.length,
            activeDestinations: totalDestinations,
            activeOffers: totalOffers,
            currency: baseCurrency, // <<< main currency for dashboard numbers
          },

          // 2. Charts data
          charts: {
            revenueTrend: revenueChartData,
            categoryDistribution: categoryChartData,
          },

          // 3. Recent bookings table
          recentBookings,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}