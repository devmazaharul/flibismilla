// app/api/dashboard/bookings/issue-ticket/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { hasPermission } from '@/app/api/lib/auth';

export const dynamic = 'force-dynamic';

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const ACTOR = 'issue-ticket-api';

// ================================================================
// HELPER: Admin Note (matches schema structure)
// Schema: adminNotes: [{ note: String, addedBy: String, createdAt: Date }]
// ================================================================
function createAdminNote(message: string) {
    return {
        note: message,
        addedBy: ACTOR,
        createdAt: new Date(),
    };
}

// ================================================================
// HELPER: Format admin note for payment captured
// Clean, structured, all data at a glance
// ================================================================
function buildPaymentCapturedNote({
    method,
    amount,
    currency,
    paymentId,
    orderId,
    pnr,
}: {
    method: string;
    amount: string;
    currency: string;
    paymentId: string;
    orderId: string;
    pnr: string;
}): string {
    const methodLabel =
        method === 'stripe'
            ? 'Stripe → Duffel Balance'
            : 'Duffel Balance (Direct)';

    const lines = [
        `✅ Payment Captured`,
        ``,
        `Method    : ${methodLabel}`,
        `Amount    : ${amount} ${currency}`,
        `Payment ID: ${paymentId}`,
        `Order     : ${orderId}`,
        `PNR       : ${pnr}`,
        ``,
        `⏳ Waiting for webhook to issue ticket & send email.`,
    ];

    return lines.join('\n');
}

// ================================================================
// HELPER: Map Duffel documents to DB schema format
// Duffel returns 'type', schema uses 'docType' to avoid
// Mongoose reserved keyword conflict.
// ================================================================
function mapDocsForDb(duffelDocs: any[]) {
    return (duffelDocs || [])
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            docType: doc.type || 'electronic_ticket',
            url: doc.url || '',
        }));
}

// ================================================================
// RATE LIMITER (In-memory, per-instance)
// ================================================================
const rateLimitMap = new Map<
    string,
    { count: number; startTime: number }
>();

function isRateLimited(ip: string): boolean {
    const WINDOW = 60 * 1000;
    const MAX = 5;
    const now = Date.now();
    const data = rateLimitMap.get(ip) || {
        count: 0,
        startTime: now,
    };

    if (now - data.startTime > WINDOW) {
        data.count = 1;
        data.startTime = now;
    } else {
        data.count++;
    }

    rateLimitMap.set(ip, data);
    return data.count > MAX;
}

// ================================================================
// TYPES
// ================================================================
type ClientPayWith = 'balance' | 'stripe';
const VALID_METHODS: ClientPayWith[] = ['balance', 'stripe'];

// ================================================================
// POST /api/dashboard/bookings/issue-ticket
//
// Flow:
// 1. Validate booking state
// 2. Fetch latest order from Duffel
// 3. Pay via Duffel balance
// 4. Update DB with payment info
// 5. Webhook handles status='issued' + email
// ================================================================
export async function POST(req: Request) {
    const auth = await hasPermission('booking', 'edit');
    if (!auth.success) return auth.response;

    let bookingIdForError: string | null = null;

    try {
        // ── Rate Limit ──
        const ip =
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Too many attempts. Wait 1 minute.',
                },
                { status: 429 },
            );
        }

        // ── Parse Body ──
        const body = await req.json();
        const { bookingId, paymentMethod = 'balance' } = body as {
            bookingId?: string;
            paymentMethod?: string;
        };

        bookingIdForError = bookingId || null;

        // ── Input Validation ──
        if (!bookingId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Booking ID is required.',
                },
                { status: 400 },
            );
        }

        if (!VALID_METHODS.includes(paymentMethod as ClientPayWith)) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid payment method: "${paymentMethod}". Use: balance or stripe`,
                },
                { status: 400 },
            );
        }

        const method = paymentMethod as ClientPayWith;

        await dbConnect();

        // ── Find Booking ──
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found.' },
                { status: 404 },
            );
        }

        if (!booking.duffelOrderId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No Duffel order linked to this booking.',
                },
                { status: 400 },
            );
        }

        // ── Already Issued Guard ──
        if (booking.status === 'issued' && booking.emailSent) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Ticket already issued and email sent.',
                },
                { status: 400 },
            );
        }

        // ── Retry Limit Guard ──
        if ((booking.retryCount || 0) >= 5) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Max retry limit (5) reached. Contact support.',
                },
                { status: 403 },
            );
        }

        // ── Fetch Latest Order from Duffel ──
        let order: any;
        try {
            const res = await duffel.orders.get(booking.duffelOrderId);
            order = res.data;
        } catch (err: any) {
            console.error('❌ Duffel fetch error:', err.message);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to connect with Duffel API.',
                },
                { status: 502 },
            );
        }

        // ── Cancelled Check ──
        if (order.cancellation || order.cancelled_at) {
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { status: 'cancelled' },
                $push: {
                    adminNotes: createAdminNote(
                        `❌ Issue blocked: Order cancelled on Duffel. Cancelled at: ${order.cancelled_at || 'unknown'}`,
                    ),
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Airline cancelled this booking.',
                },
                { status: 400 },
            );
        }

        // ── Expiry Check ──
        const expiresAt =
            order.payment_status?.payment_required_by ||
            order.payment_status?.price_guarantee_expires_at;

        if (expiresAt && new Date(expiresAt) < new Date()) {
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { status: 'expired' },
                $push: {
                    adminNotes: createAdminNote(
                        `⏰ Issue blocked: Order expired. Deadline was: ${expiresAt}`,
                    ),
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Booking expired. Create a new one.',
                },
                { status: 400 },
            );
        }

        // ── Already Has Documents ──
        if (order.documents && order.documents.length > 0) {
            const docs = mapDocsForDb(order.documents);

            await Booking.findByIdAndUpdate(bookingId, {
                $set: {
                    status: 'issued',
                    pnr: order.booking_reference || booking.pnr,
                    documents: docs,
                    paymentStatus: 'captured',
                    clientPayWith: method,
                },
                $push: {
                    adminNotes: createAdminNote(
                        `📄 Already issued on Duffel (${docs.length} documents found). PNR: ${order.booking_reference || 'N/A'}. Synced to DB.`,
                    ),
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    'Ticket already issued. Email will be sent via webhook.',
                alreadyIssued: true,
            });
        }

        // ── Validate Payment Amount ──
        const amountToPay = order.total_amount;
        const currency = order.total_currency;

        if (!amountToPay || !currency) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Amount or currency missing from Duffel.',
                },
                { status: 400 },
            );
        }

        // ════════════════════════════════════════════════════
        // PAYMENT EXECUTION
        // ════════════════════════════════════════════════════

        console.log(
            `💳 Paying ${amountToPay} ${currency} | Method: ${method} | Order: ${booking.duffelOrderId}`,
        );

        const paymentRes = await duffel.payments.create({
            order_id: booking.duffelOrderId,
            payment: {
                amount: amountToPay,
                currency: currency,
                type: 'balance',
            },
        });

        const payment = paymentRes.data as any;

        if (!payment || payment.status !== 'succeeded') {
            throw new Error(
                payment?.failure_reason ||
                    `Payment failed (status: ${payment?.status || 'unknown'})`,
            );
        }

        console.log(`✅ Payment succeeded | ID: ${payment.id}`);

        // ════════════════════════════════════════════════════
        // DB UPDATE (Post-Payment)
        //
        // ❌ DO NOT set status='issued' — webhook handles it
        // ❌ DO NOT send email — webhook handles it
        // ✅ Track payment details
        // ✅ Append admin note with full context
        // ════════════════════════════════════════════════════

        const pnr = order.booking_reference || booking.pnr || 'N/A';

        await Booking.findByIdAndUpdate(bookingId, {
            $set: {
                paymentStatus: 'captured',
                payment_id: payment.id,
                clientPayWith: method,
                retryCount: 0,
                lastRetryAt: new Date(),
            },
            $push: {
                adminNotes: createAdminNote(
                    buildPaymentCapturedNote({
                        method,
                        amount: amountToPay,
                        currency,
                        paymentId: payment.id,
                        orderId: booking.duffelOrderId,
                        pnr,
                    }),
                ),
            },
        });

        return NextResponse.json({
            success: true,
            message:
                method === 'stripe'
                    ? 'Stripe payment confirmed & airline paid. Ticket issuing...'
                    : 'Duffel balance payment done. Ticket issuing...',
            paymentId: payment.id,
            clientPayWith: method,
            amount: amountToPay,
            currency,
        });
    } catch (error: any) {
        console.error('❌ Issue Error:', {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
        });

        // ── Error Message Mapping ──
        let errorMessage = 'Payment failed. Try again.';
        let statusCode = 400;

        const duffelErrors = error?.response?.data?.errors;
        const firstError = Array.isArray(duffelErrors)
            ? duffelErrors[0]
            : null;

        if (firstError) {
            const code = firstError.code || firstError.type || '';
            const msg = firstError.message || firstError.title || '';

            const errorMap: Record<string, string> = {
                order_requires_instant_payment:
                    'Instant payment required. Create a new booking.',
                order_expired:
                    'Booking expired. Create a new booking.',
                insufficient_balance:
                    'Duffel balance insufficient. Top up your account.',
                order_already_paid: 'This order is already paid.',
                order_not_found: 'Order not found in Duffel.',
                validation_error: msg || 'Invalid payment data.',
            };

            if (errorMap[code]) {
                errorMessage = errorMap[code];
            } else if (/instant_payment/i.test(msg)) {
                errorMessage =
                    errorMap.order_requires_instant_payment;
            } else if (/expired/i.test(msg)) {
                errorMessage = errorMap.order_expired;
            } else if (/insufficient.*balance/i.test(msg)) {
                errorMessage = errorMap.insufficient_balance;
            } else if (/already.*paid/i.test(msg)) {
                errorMessage = errorMap.order_already_paid;
            } else if (msg) {
                errorMessage = msg;
            }

            statusCode = error?.response?.status || 400;

            // Auto-expire
            if (
                code === 'order_expired' ||
                /expired/i.test(msg)
            ) {
                if (bookingIdForError) {
                    await Booking.findByIdAndUpdate(
                        bookingIdForError,
                        {
                            $set: { status: 'expired' },
                            $push: {
                                adminNotes: createAdminNote(
                                    `⏰ Auto-expired: Duffel returned order_expired. Error: ${msg || code}`,
                                ),
                            },
                        },
                    ).catch(() => {});
                }
            }
        } else if (error?.response?.status >= 500) {
            errorMessage = 'Airline system unavailable. Try later.';
            statusCode = 502;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        // ── Update Retry Count & Log Failure ──
        if (bookingIdForError) {
            try {
                await Booking.findByIdAndUpdate(bookingIdForError, {
                    $inc: { retryCount: 1 },
                    $set: {
                        lastRetryAt: new Date(),
                        paymentStatus: 'failed',
                    },
                    $push: {
                        adminNotes: createAdminNote(
                            `❌ Payment failed: ${errorMessage}. Retry count incremented.`,
                        ),
                    },
                });
            } catch (updateErr) {
                console.error(
                    'Failed to update retry count:',
                    updateErr,
                );
            }
        }

        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: statusCode },
        );
    }
}