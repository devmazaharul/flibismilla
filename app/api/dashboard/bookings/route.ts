// app/api/admin/booking/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import { hasPermission } from '../../lib/auth';
import Booking from '@/models/Booking.model';
import { decrypt } from '../../duffel/booking/utils';
import { syncSingleBooking } from '../../duffel/booking/route';

// ================================================================
// ADMIN RATE LIMITER (Separate from customer booking limiter)
//
// Why separate?
//  • The booking API limiter (10/min) is designed for end-user
//    booking creation. Admin panel makes frequent GET requests
//    (pagination, refresh, search, etc.)
//  • Sharing the same bucket means: admin browsing bookings
//    could inadvertently rate-limit a customer trying to book.
//  • Admin routes are already behind auth — rate limiting here
//    is DoS protection, not abuse prevention.
//
// Limits: 60 requests/min (generous for admin panel usage)
// ================================================================

interface AdminRateLimitEntry {
    timestamps: number[];
}

const adminRateLimitMap = new Map<string, AdminRateLimitEntry>();

const ADMIN_RATE_CONFIG = {
    windowMs: 60 * 1000,       // 1 minute
    maxPerWindow: 60,           // 60 req/min (admin-friendly)
    maxMapSize: 1_000,          // smaller — fewer admin users
    cleanupIntervalMs: 5 * 60 * 1000,
};

let adminLastCleanup = Date.now();

function adminCleanup() {
    const now = Date.now();
    if (now - adminLastCleanup < ADMIN_RATE_CONFIG.cleanupIntervalMs) return;
    adminLastCleanup = now;

    for (const [ip, entry] of adminRateLimitMap.entries()) {
        const fresh = entry.timestamps.filter(
            (t) => now - t < ADMIN_RATE_CONFIG.windowMs,
        );
        if (fresh.length === 0) {
            adminRateLimitMap.delete(ip);
        } else {
            entry.timestamps = fresh;
        }
    }
}

function checkAdminRateLimit(rawIp: string): {
    limited: boolean;
    retryAfterMs?: number;
} {
    adminCleanup();

    const ip = (rawIp.split(',')[0] || 'unknown').trim();
    const now = Date.now();

    if (
        !adminRateLimitMap.has(ip) &&
        adminRateLimitMap.size >= ADMIN_RATE_CONFIG.maxMapSize
    ) {
        return { limited: true, retryAfterMs: ADMIN_RATE_CONFIG.windowMs };
    }

    const entry = adminRateLimitMap.get(ip) || { timestamps: [] };

    // Prune old timestamps
    entry.timestamps = entry.timestamps.filter(
        (t) => now - t < ADMIN_RATE_CONFIG.windowMs,
    );

    if (entry.timestamps.length >= ADMIN_RATE_CONFIG.maxPerWindow) {
        adminRateLimitMap.set(ip, entry);
        const oldest = entry.timestamps[0];
        return {
            limited: true,
            retryAfterMs: ADMIN_RATE_CONFIG.windowMs - (now - oldest),
        };
    }

    entry.timestamps.push(now);
    adminRateLimitMap.set(ip, entry);
    return { limited: false };
}

// ================================================================
// HELPER: Mask card number for safe display
//
// Even admins should not see full card numbers in the UI.
// Show only last 4 digits: **** **** **** 1234
// Full number should only be accessible via a separate
// secure endpoint with audit logging if ever needed.
// ================================================================

function maskCardNumber(decrypted: string): string {
    if (!decrypted || decrypted.length < 4) return '**** (Invalid)';
    const last4 = decrypted.slice(-4);
    return `**** **** **** ${last4}`;
}

// ================================================================
// STATES THAT DON'T NEED DUFFEL SYNC
//
// These are terminal states — the order won't change on Duffel's
// side, so syncing wastes API calls and adds latency.
//
// 'issued' is included because once ticketed, the booking
// status won't revert. Schedule changes are handled by webhooks
// (airline_initiated_change_detected) and the sync engine's
// periodic run, not on every admin page load.
// ================================================================

const FINAL_STATES = ['cancelled', 'failed', 'expired', 'issued'];

// ═══════════════════════════════════════════
// GET — All Bookings (paginated + synced)
// Permission: booking → "view"
//
// ✅ admin   (full ≥ view)
// ✅ editor  (edit ≥ view)
// ✅ viewer  (view ≥ view)
// ❌ none
// ═══════════════════════════════════════════

export async function GET(req: Request) {
    const auth = await hasPermission('booking', 'view');
    if (!auth.success) return auth.response;

    try {
        // ── Admin-specific rate limiting ──
        const ip =
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown-ip';

        const rl = checkAdminRateLimit(ip);
        if (rl.limited) {
            const retryAfter = Math.ceil((rl.retryAfterMs || 60_000) / 1000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Too many requests. Please wait ${retryAfter} seconds.`,
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(retryAfter) },
                },
            );
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // ── Optional Filters ──
        const statusFilter = searchParams.get('status');
        const searchQuery = searchParams.get('search')?.trim();

        const filter: any = {};

        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            filter.status = statusFilter;
        }

        // Search by PNR, booking reference, passenger name, or email
        if (searchQuery) {
            filter.$or = [
                { pnr: { $regex: searchQuery, $options: 'i' } },
                { bookingReference: { $regex: searchQuery, $options: 'i' } },
                {
                    'passengers.firstName': {
                        $regex: searchQuery,
                        $options: 'i',
                    },
                },
                {
                    'passengers.lastName': {
                        $regex: searchQuery,
                        $options: 'i',
                    },
                },
                { 'contact.email': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        const totalBookings = await Booking.countDocuments(filter);

        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // ── Sync only active (non-final) bookings with Duffel ──
        const syncedBookings = await Promise.all(
            bookings.map(async (booking) => {
                if (!FINAL_STATES.includes(booking.status)) {
                    return await syncSingleBooking(booking);
                }
                return booking;
            }),
        );

        const now = new Date();

        // ── Permission check for sensitive data ──
        const canSeePayment =
            auth.user.role === 'admin' ||
            auth.user.permissions?.booking === 'edit' ||
            auth.user.permissions?.booking === 'full';

        // ── Format response data ──
        const formattedData = syncedBookings.map((booking: any) => {
            const isPaymentExpired = booking.paymentDeadline
                ? new Date(booking.paymentDeadline) < now
                : false;

            const flight = booking.flightDetails || {};
            const pricing = booking.pricing || {};
            const contact = booking.contact || {};
            const paymentInfo = booking.paymentInfo || {};

            const ticketLink =
                booking.status === 'issued' && booking.documents?.length > 0
                    ? booking.documents[0]?.url || null
                    : null;

            // ── Card info (masked for security) ──
            let displayCard = 'N/A';
            let cardHolder = 'N/A';

            if (canSeePayment && paymentInfo?.cardNumber) {
                try {
                    const realNum = decrypt(paymentInfo.cardNumber);
                    displayCard = maskCardNumber(realNum);
                } catch (e) {
                    console.error('Decryption Error:', e);
                    displayCard = '**** (Error)';
                }
            }

            if (canSeePayment && paymentInfo?.cardName) {
                cardHolder = paymentInfo.cardName;
            }

            // ── Effective status (display-level expiry correction) ──
            const effectiveStatus =
                booking.status === 'held' && isPaymentExpired
                    ? 'expired'
                    : booking.status;

            return {
                id: booking._id.toString(),
                bookingRef: booking.bookingReference || 'N/A',
                pnr: booking.pnr || '---',

                status: effectiveStatus,

                flight: {
                    airline: flight.airline || 'Unknown',
                    flightNumber: flight.flightNumber || '',
                    route: flight.route || 'Unknown Route',
                    date: flight.departureDate || null,
                    duration: flight.duration || '',
                    tripType: flight.flightType || 'one_way',
                    logoUrl: flight.logoUrl || null,
                },

                passengerName: booking.passengers?.[0]
                    ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
                    : 'Guest',
                passengerCount: booking.passengers?.length || 0,

                contact: {
                    email: contact.email || 'N/A',
                    phone: contact.phone || 'N/A',
                },

                paymentSource: {
                    holderName: cardHolder,
                    cardLast4: displayCard,
                },

                amount: {
                    total: pricing.total_amount || 0,
                    markup: pricing.markup || 0,
                    currency: pricing.currency || 'USD',
                    base_amount: pricing.base_amount || 0,
                },

                timings: {
                    deadline: booking.paymentDeadline,
                    createdAt: booking.createdAt,
                    timeLeft: booking.paymentDeadline
                        ? new Date(booking.paymentDeadline).getTime() -
                          now.getTime()
                        : 0,
                },

                actionData: {
                    ticketUrl: ticketLink,
                },
                updatedAt: booking.updatedAt,
            };
        });

        return NextResponse.json({
            success: true,
            meta: {
                total: totalBookings,
                page,
                limit,
                totalPages: Math.ceil(totalBookings / limit),
            },
            data: formattedData,
        });
    } catch (error: any) {
        console.error('GET Bookings Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 },
        );
    }
}