// app/api/dashboard/stats/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import Destination from '@/models/Destination.model';
import Offer from '@/models/Offer.model';
import Package from '@/models/Package.model';
import { isAdmin } from '@/app/api/lib/auth';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Server-safe month names.
 * Avoids toLocaleString() which is locale-dependent
 * and produces inconsistent results across Node environments.
 */
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getMonthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()];
}

/**
 * Generate last N month keys for revenue trend chart.
 * Returns array of { key: "Mar", year: 2025 } objects
 * to handle year boundaries correctly.
 */
function getLast6Months(): { key: string; year: number }[] {
  const months: { key: string; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      key: getMonthName(d),
      year: d.getFullYear(),
    });
  }
  return months;
}

// ================================================================
// RATE LIMITER
// ================================================================

const rateLimitMap = new Map<
  string,
  { count: number; startTime: number }
>();

function isRateLimited(ip: string): boolean {
  const windowMs = 60 * 1000;
  const maxRequests = 30; // Dashboard refreshes frequently
  const now = Date.now();
  const data = rateLimitMap.get(ip) || {
    count: 0,
    startTime: now,
  };

  if (now - data.startTime > windowMs) {
    data.count = 1;
    data.startTime = now;
  } else {
    data.count++;
  }

  rateLimitMap.set(ip, data);
  return data.count > maxRequests;
}

// ================================================================
// GET /api/dashboard/stats
//
// Admin-only. Returns aggregated dashboard data:
// - KPI metrics (revenue, profit, booking counts)
// - Revenue trend chart (last 6 months)
// - Category distribution chart
// - Recent bookings table
//
// IMPORTANT: Only counts isLiveMode=true bookings for
// financial metrics. Test bookings are excluded from
// revenue, profit, and booking status counts.
// ================================================================

export async function GET(req: Request) {
  // ── Auth Check ──
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  // ── Rate Limit ──
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown-ip';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Too many requests',
      },
      { status: 429 },
    );
  }

  try {
    await dbConnect();

    // ══════════════════════════════════════════════
    // PARALLEL DATA FETCH
    //
    // Fetch all required data concurrently.
    // Bookings: select only needed fields for
    // performance (no passenger/payment data needed).
    // ══════════════════════════════════════════════

    const [
      allBookings,
      allPackages,
      totalDestinations,
      totalOffers,
    ] = await Promise.all([
      Booking.find({})
        .select(
          'pricing status createdAt contact flightDetails pnr bookingReference isLiveMode',
        )
        .sort({ createdAt: -1 })
        .lean(),

      Package.find({}).select('category').lean(),

      Destination.countDocuments(),

      Offer.countDocuments(),
    ]);

    // ══════════════════════════════════════════════
    // AGGREGATION & BUSINESS LOGIC
    // ══════════════════════════════════════════════

    const statsCount = {
      total: 0, // Only live bookings
      pending: 0, // held + processing
      confirmed: 0, // issued
      cancelled: 0, // cancelled + failed + expired
    };

    // Test booking counter (for admin awareness)
    let testBookingCount = 0;

    let totalRevenue = 0; // Sum of issued booking amounts
    let totalProfit = 0; // Sum of markup from issued bookings
    let potentialRevenue = 0; // Sum of pending/held booking amounts

    // Currency tracking — find most common currency
    const currencyCount = new Map<string, number>();

    // Revenue trend: last 6 calendar months
    const last6Months = getLast6Months();
    const revenueByMonth = new Map<string, number>();
    last6Months.forEach((m) => revenueByMonth.set(m.key, 0));

    // Year boundaries for month matching
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // ── Main Booking Loop ──
    allBookings.forEach((booking: any) => {
      const isLive = booking.isLiveMode === true;

      // Count test bookings separately
      if (!isLive) {
        testBookingCount++;
        return; // Skip test bookings from financial calculations
      }

      const amount =
        Number(booking.pricing?.total_amount) || 0;
      const markup =
        Number(booking.pricing?.markup) || 0;
      const status = booking.status
        ? String(booking.status).toLowerCase()
        : 'processing';
      const currency = booking.pricing?.currency as
        | string
        | undefined;

      // Track currency frequency
      if (currency) {
        currencyCount.set(
          currency,
          (currencyCount.get(currency) || 0) + 1,
        );
      }

      const createdAt = booking.createdAt
        ? new Date(booking.createdAt)
        : new Date();

      // Increment total live bookings
      statsCount.total++;

      if (status === 'issued') {
        // ── Confirmed Sale ──
        statsCount.confirmed++;
        totalRevenue += amount;
        totalProfit += markup;

        // Revenue trend (issued bookings within last 6 months)
        if (createdAt >= sixMonthsAgo) {
          const monthKey = getMonthName(createdAt);
          if (revenueByMonth.has(monthKey)) {
            revenueByMonth.set(
              monthKey,
              (revenueByMonth.get(monthKey) || 0) +
                amount,
            );
          }
        }
      } else if (
        ['cancelled', 'failed', 'expired'].includes(
          status,
        )
      ) {
        // ── Lost Sale ──
        statsCount.cancelled++;
      } else {
        // ── Pending Opportunity (held, processing) ──
        statsCount.pending++;
        potentialRevenue += amount;
      }
    });

    // ── Determine Primary Currency ──
    // Use most frequently occurring currency across live bookings
    let baseCurrency = 'USD';
    let maxCurrencyCount = 0;
    currencyCount.forEach((count, currency) => {
      if (count > maxCurrencyCount) {
        maxCurrencyCount = count;
        baseCurrency = currency;
      }
    });

    // ── Revenue Chart Data ──
    const revenueChartData = last6Months.map((m) => ({
      name: m.key,
      value: Number(
        (revenueByMonth.get(m.key) || 0).toFixed(2),
      ),
    }));

    // ══════════════════════════════════════════════
    // CATEGORY DISTRIBUTION CHART
    // Package inventory + flight bookings sold
    // ══════════════════════════════════════════════

    const categoryStats: Record<string, number> = {
      hajj: 0,
      umrah: 0,
      holiday: 0,
      tour: 0,
      others: 0,
    };

    allPackages.forEach((pkg: any) => {
      const cat = pkg.category
        ? String(pkg.category).toLowerCase()
        : 'others';

      if (cat === 'hajj') categoryStats.hajj++;
      else if (cat === 'umrah') categoryStats.umrah++;
      else if (cat === 'holiday')
        categoryStats.holiday++;
      else if (
        cat === 'tour' ||
        cat === 'islamic tour'
      )
        categoryStats.tour++;
      else categoryStats.others++;
    });

    const categoryChartData = [
      {
        name: 'Hajj',
        value: categoryStats.hajj,
        color: '#10B981',
      },
      {
        name: 'Umrah',
        value: categoryStats.umrah,
        color: '#F59E0B',
      },
      {
        name: 'Holiday',
        value: categoryStats.holiday,
        color: '#EC4899',
      },
      {
        name: 'Tour',
        value: categoryStats.tour,
        color: '#6366F1',
      },
      {
        name: 'Flight (Sold)',
        value: statsCount.confirmed,
        color: '#3B82F6',
      },
    ].filter((item) => item.value > 0);

    // ══════════════════════════════════════════════
    // RECENT BOOKINGS TABLE (Top 8)
    //
    // Shows all bookings (live + test) in recents
    // but marks test bookings for admin visibility.
    // ══════════════════════════════════════════════

    const recentBookings = allBookings
      .slice(0, 8)
      .map((b: any) => ({
        id: b._id,
        customerName:
          b.contact?.email || 'Guest',
        customerPhone:
          b.contact?.phone || 'N/A',
        packageTitle: b.flightDetails?.route
          ? `${b.flightDetails.route} (${b.flightDetails.airline || 'Airline'})`
          : 'Flight Booking',
        price:
          Number(b.pricing?.total_amount) || 0,
        currency:
          b.pricing?.currency || baseCurrency,
        status: b.status,
        pnr: b.pnr || b.bookingReference,
        isLiveMode: b.isLiveMode === true,
        date: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString(
              'en-GB',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              },
            )
          : 'N/A',
      }));

    // ══════════════════════════════════════════════
    // RESPONSE
    // ══════════════════════════════════════════════

    return NextResponse.json(
      {
        success: true,
        data: {
          // KPI Cards
          kpi: {
            totalRevenue: Number(
              totalRevenue.toFixed(2),
            ),
            netProfit: Number(
              totalProfit.toFixed(2),
            ),
            potentialRevenue: Number(
              potentialRevenue.toFixed(2),
            ),
            totalBookings: statsCount.total,
            pendingBookings: statsCount.pending,
            confirmedBookings:
              statsCount.confirmed,
            cancelledBookings:
              statsCount.cancelled,
            testBookings: testBookingCount,
            activePackages: allPackages.length,
            activeDestinations: totalDestinations,
            activeOffers: totalOffers,
            currency: baseCurrency,
          },

          // Charts
          charts: {
            revenueTrend: revenueChartData,
            categoryDistribution:
              categoryChartData,
          },

          // Recent Bookings Table
          recentBookings,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load dashboard data',
        error: error.message,
      },
      { status: 500 },
    );
  }
}