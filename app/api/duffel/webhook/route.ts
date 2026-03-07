// app/api/duffel/webhook/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import {
    sendTicketIssuedEmail,
    sendBookingProcessingEmail,
    sendNewBookingAdminNotification,
} from '@/app/emails/email';
import { getShortDateTime } from '../booking/utils';
import { format, parseISO } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const WEBHOOK_ACTOR = 'duffel-webhook';

// ================================================================
// HELPER: Create admin note matching schema
// ================================================================
function createAdminNote(message: string) {
    return {
        note: message,
        addedBy: WEBHOOK_ACTOR,
        createdAt: new Date(),
    };
}

// ================================================================
// HELPER: Map Duffel documents → DB schema (docType)
// ================================================================
function mapDocsForDb(duffelDocs: any[]) {
    return duffelDocs
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            docType: doc.type || 'electronic_ticket',
            url: doc.url || '',
        }));
}

// ================================================================
// HELPER: Map Duffel documents → Email template (type)
// ================================================================
function mapDocsForEmail(duffelDocs: any[]) {
    return duffelDocs
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            type: doc.type || 'electronic_ticket',
            url: doc.url || '',
        }));
}

// ================================================================
// HELPER: Delay utility
// ================================================================
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ================================================================
// 🔒 Verify Duffel Webhook Signature (HMAC SHA-256)
// ================================================================
function verifySignature(
    rawBody: string,
    signature: string,
    secret: string,
): boolean {
    const timestampMatch = signature.match(/t=([^,]+)/);
    const hashMatch = signature.match(/v2=([^,]+)/);

    const timestamp = timestampMatch?.[1]?.trim();
    const receivedHash = hashMatch?.[1]?.trim();

    if (!timestamp || !receivedHash) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

    const receivedBuffer = Buffer.from(receivedHash);
    const expectedBuffer = Buffer.from(expectedHash);

    if (receivedBuffer.length !== expectedBuffer.length)
        return false;

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

// ================================================================
// 🔍 Fetch Full Order from Duffel API
// ================================================================
async function fetchOrder(orderId: string): Promise<any | null> {
    try {
        const res = await duffel.orders.get(orderId);
        return res.data;
    } catch (err: any) {
        console.error(
            `❌ Duffel fetch failed [${orderId}]:`,
            err.message,
        );
        return null;
    }
}

// ================================================================
// 🛠️ Build Email Data (for ticket issued email)
// ================================================================
function buildEmailData(
    bookingDoc: any,
    order: any,
    emailDocs: {
        url: string;
        unique_identifier: string;
        type: string;
    }[],
) {
    const slices = order.slices || [];
    const firstSlice = slices[0];
    const firstSegment = firstSlice?.segments?.[0];

    const originName =
        firstSlice?.origin?.city_name ||
        firstSlice?.origin?.iata_code ||
        'Origin';
    const destinationName =
        firstSlice?.destination?.city_name ||
        firstSlice?.destination?.iata_code ||
        'Destination';

    return {
        pnr: order.booking_reference,
        contact: {
            email: bookingDoc.contact?.email || '',
            phone: bookingDoc.contact?.phone || '',
        },
        passengers: bookingDoc.passengers || [],
        flightDetails: {
            airline:
                firstSegment?.operating_carrier?.name ||
                order.owner?.name ||
                'Airline',
            route: `${originName} - ${destinationName}`,
            departureDate:
                firstSegment?.departing_at ||
                order.created_at ||
                new Date().toISOString(),
        },
        documents: emailDocs,
    };
}

// ================================================================
// 📧 Send Confirmation Emails (Processing + Admin Notification)
//
// Called from order.created handler. Uses booking DB data for
// contact/passenger info and Duffel order for PNR.
//
// Non-blocking: failure is logged but does not affect order status.
// ================================================================
async function sendConfirmationEmails(
    booking: any,
    order: any,
): Promise<void> {
    try {
        const primaryPassenger = booking.passengers?.[0];
        const primaryPassengerName = primaryPassenger
            ? `${primaryPassenger.title || ''} ${primaryPassenger.firstName || ''} ${primaryPassenger.lastName || ''}`.trim()
            : 'Traveler';

        // Safe date parsing
        let depDate: Date;
        const rawDep = booking.flightDetails?.departureDate;
        if (typeof rawDep === 'string') {
            depDate = parseISO(rawDep);
        } else {
            depDate = new Date(rawDep || Date.now());
        }

        // Fallback if date is invalid
        if (isNaN(depDate.getTime())) {
            depDate = new Date();
        }

        const emailDate = format(depDate, 'dd MMM, yyyy');
        const route = booking.flightDetails?.route || 'N/A';

        // ── Customer confirmation email ──
        if (booking.contact?.email) {
            await sendBookingProcessingEmail({
                to: booking.contact.email,
                customerName: primaryPassengerName,
                bookingReference: order.booking_reference,
                route,
                flightDate: emailDate,
            });
            console.log(
                `📧 Customer confirmation sent | PNR: ${order.booking_reference} | To: ${booking.contact.email}`,
            );
        } else {
            console.warn(
                `⚠️ No contact email found for booking ${booking._id}, skipping customer email`,
            );
        }

        // ── Admin notification email ──
        await sendNewBookingAdminNotification({
            pnr: order.booking_reference,
            customerName:
                booking.contact?.name ||
                primaryPassengerName ||
                'Traveler',
            customerPhone:
                booking.contact?.phone ||
                primaryPassenger?.phone ||
                'N/A',
            route,
            airline: booking.flightDetails?.airline || 'N/A',
            flightDate: emailDate,
            totalAmount: booking.pricing?.total_amount || 0,
            bookingId: booking._id.toString(),
        });
        console.log(
            `📧 Admin notification sent | PNR: ${order.booking_reference}`,
        );
    } catch (emailError: any) {
        // Email failure is non-fatal — log and continue
        console.error(
            `❌ Failed to send confirmation emails for booking ${booking._id}:`,
            emailError.message || emailError,
        );
    }
}

// ================================================================
// 📧 Ticket Issuance + Email Handler
// ================================================================
async function handleTicketIssuance(
    bookingId: string,
    duffelOrderId: string,
): Promise<boolean> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        console.log(
            `ℹ️ Booking not found (possibly deleted): ${bookingId}`,
        );
        return false;
    }

    if (booking.emailSent) {
        console.log(
            `ℹ️ Email already sent, skipping: ${bookingId}`,
        );
        return true;
    }

    const order = await fetchOrder(duffelOrderId);
    if (!order) {
        console.error(
            `❌ Cannot fetch order for ticketing: ${duffelOrderId}`,
        );
        return false;
    }

    const rawDocs = (order.documents || []).filter(
        (doc: any) => doc.url,
    );

    const dbDocs = mapDocsForDb(rawDocs);
    const emailDocs = mapDocsForEmail(rawDocs);

    await Booking.findByIdAndUpdate(bookingId, {
        $set: {
            status: 'issued',
            pnr: order.booking_reference || booking.pnr,
            documents: dbDocs,
            emailSent: true,
        },
        $push: {
            adminNotes: createAdminNote(
                `Ticket issued successfully. PNR: ${order.booking_reference}. Documents: ${dbDocs.length}`,
            ),
        },
    });

    try {
        const emailData = buildEmailData(
            booking,
            order,
            emailDocs,
        );
        await sendTicketIssuedEmail(emailData);
        console.log(
            `✅ Ticket email sent | PNR: ${order.booking_reference} | To: ${booking.contact?.email}`,
        );
        return true;
    } catch (emailErr: any) {
        console.error(
            '❌ Ticket email send failed:',
            emailErr.message,
        );

        await Booking.findByIdAndUpdate(bookingId, {
            $set: { emailSent: false },
            $push: {
                adminNotes: createAdminNote(
                    `Email send failed: ${emailErr.message}. Ticket is issued but customer not notified.`,
                ),
            },
        });
        return false;
    }
}

// ================================================================
// 🔄 MAIN WEBHOOK HANDLER
// ================================================================
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature =
            req.headers.get('x-duffel-signature') ||
            req.headers.get('X-Duffel-Signature');

        if (!signature) {
            return NextResponse.json(
                { message: 'Missing signature header' },
                { status: 401 },
            );
        }

        const secret = process.env.DUFFEL_WEBHOOK_SECRET;
        if (!secret) {
            console.error(
                '❌ DUFFEL_WEBHOOK_SECRET not configured',
            );
            return NextResponse.json(
                { message: 'Server configuration error' },
                { status: 500 },
            );
        }

        if (!verifySignature(rawBody, signature, secret)) {
            console.error(
                '❌ Webhook signature verification failed',
            );
            return NextResponse.json(
                { message: 'Invalid signature' },
                { status: 403 },
            );
        }

        let event: any;
        try {
            event = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { message: 'Invalid JSON body' },
                { status: 400 },
            );
        }

        const { type, data: rawData } = event;
        const data = rawData?.object ?? rawData ?? {};

        console.log(
            `🔔 Webhook received: [${type}] | Keys: ${Object.keys(data).join(', ') || 'empty'}`,
        );

        await dbConnect();

        switch (type) {
            // ════════════════════════════════════════════════════
            // ✅ ORDER CREATED
            //
            // This is where confirmation emails are sent.
            // The booking API creates the order and saves it to DB,
            // then Duffel fires this webhook to confirm creation.
            // We send customer + admin notification emails here.
            // ════════════════════════════════════════════════════
            case 'order.created': {
                const orderId = data.id;
                if (!orderId) {
                    console.warn(
                        '⚠️ order.created: Missing order ID in payload',
                    );
                    break;
                }

                const booking = await Booking.findOne({
                    duffelOrderId: orderId,
                });
                if (!booking) {
                    console.warn(
                        `⚠️ order.created: No booking found for order ${orderId}`,
                    );
                    break;
                }

                // Idempotency: skip if already issued
                if (booking.status === 'issued') {
                    console.log(
                        `ℹ️ order.created: Already issued, skipping ${orderId}`,
                    );
                    break;
                }

                // Fetch full order details from Duffel
                const order = await fetchOrder(orderId);
                if (!order) {
                    console.error(
                        `❌ order.created: Cannot fetch order ${orderId}`,
                    );
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: { status: 'held' },
                        $push: {
                            adminNotes: createAdminNote(
                                `Order created but failed to fetch details from Duffel. Order: ${orderId}`,
                            ),
                        },
                    });
                    break;
                }

                const hasTickets =
                    order.documents && order.documents.length > 0;

                if (hasTickets) {
                    // Rare: Some airlines issue tickets instantly
                    console.log(
                        `🎫 Instant ticket issuance detected | Order: ${orderId}`,
                    );
                    await handleTicketIssuance(
                        booking._id.toString(),
                        orderId,
                    );

                    // Still send admin notification for instant tickets
                    await sendConfirmationEmails(booking, order);
                } else {
                    // Normal flow: Hold order awaiting payment
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: {
                            status: 'held',
                            pnr:
                                order.booking_reference ||
                                booking.pnr,
                            ...(order.payment_status
                                ?.payment_required_by && {
                                paymentDeadline: new Date(
                                    order.payment_status.payment_required_by,
                                ),
                            }),
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `Order held. PNR: ${order.booking_reference || 'N/A'}. Payment deadline: ${getShortDateTime(order.payment_status?.payment_required_by) || 'N/A'}`,
                            ),
                        },
                    });

                    console.log(
                        `🕐 Order held | PNR: ${order.booking_reference} | Deadline: ${getShortDateTime(order.payment_status?.payment_required_by)}`,
                    );

                    // ══════════════════════════════════════════
                    // 📧 SEND CONFIRMATION EMAILS
                    // Customer processing email + Admin notification
                    // Non-blocking: email failure won't affect booking
                    // ══════════════════════════════════════════
                    await sendConfirmationEmails(booking, order);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ❌ ORDER CREATION FAILED
            // ════════════════════════════════════════════════════
            case 'order.creation_failed': {
                const orderId = data.id || data.order_id;
                if (!orderId) {
                    console.warn(
                        '⚠️ order.creation_failed: Missing order ID',
                    );
                    break;
                }

                const failureReason =
                    data?.failure_reason ||
                    data?.message ||
                    'Unknown reason';

                const result = await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: { status: 'failed' },
                        $push: {
                            adminNotes: createAdminNote(
                                `Order creation failed. Reason: ${failureReason}`,
                            ),
                        },
                    },
                );

                if (result) {
                    console.log(
                        `❌ Order creation failed | ${orderId} | ${failureReason}`,
                    );
                } else {
                    console.warn(
                        `⚠️ order.creation_failed: No booking for ${orderId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 💰 PAYMENT SUCCEEDED
            // ════════════════════════════════════════════════════
            case 'air.payment.succeeded': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn(
                        '⚠️ air.payment.succeeded: Missing payment_id',
                    );
                    break;
                }

                console.log(
                    `💰 Payment succeeded | Payment: ${paymentId}`,
                );

                let booking = await Booking.findOne({
                    payment_id: paymentId,
                });

                if (!booking) {
                    console.log(
                        `⏳ Booking not found by payment_id, retrying in 3s...`,
                    );
                    await delay(3000);
                    booking = await Booking.findOne({
                        payment_id: paymentId,
                    });
                }

                if (!booking && event.idempotency_key) {
                    booking = await Booking.findOne({
                        payment_id: event.idempotency_key,
                    });
                }

                if (!booking) {
                    console.warn(
                        `⚠️ No booking found for payment ${paymentId}. Possibly created outside this system.`,
                    );
                    break;
                }

                if (
                    booking.status === 'issued' &&
                    booking.emailSent
                ) {
                    console.log(
                        `ℹ️ Already issued and emailed, skipping | Payment: ${paymentId}`,
                    );
                    break;
                }

                const duffelOrderId = booking.duffelOrderId;
                if (!duffelOrderId) {
                    console.error(
                        `❌ Booking ${booking._id} has no duffelOrderId`,
                    );
                    await Booking.findByIdAndUpdate(booking._id, {
                        $push: {
                            adminNotes: createAdminNote(
                                `Payment succeeded (${paymentId}) but booking has no duffelOrderId. Manual intervention required.`,
                            ),
                        },
                    });
                    break;
                }

                await Booking.findByIdAndUpdate(booking._id, {
                    $set: {
                        paymentStatus: 'captured',
                        payment_id: paymentId,
                    },
                    $push: {
                        adminNotes: createAdminNote(
                            ` Payment Captured | Method: ${booking.clientPayWith}
    Client Paid: ${booking.pricing.total_amount} ${booking.pricing.currency}
   Duffel Payment ID: ${booking.payment_id}
    Order: ${booking.duffelOrderId} | PNR: ${booking.pnr || 'N/A'}
   🏦 Duffel Balance Used: ${booking.pricing.base_amount}
   ⏳ Status: Waiting for webhook to issue ticket.`,
                        ),
                    },
                });

                console.log(
                    `💰 Payment captured | Order: ${duffelOrderId}`,
                );

                console.log(
                    `⏳ Waiting 3s for ticket generation...`,
                );
                await delay(3000);

                const sent1 = await handleTicketIssuance(
                    booking._id.toString(),
                    duffelOrderId,
                );

                if (!sent1) {
                    console.log(
                        `⏳ Documents not ready, retrying in 5s...`,
                    );
                    await delay(5000);

                    const sent2 = await handleTicketIssuance(
                        booking._id.toString(),
                        duffelOrderId,
                    );

                    if (!sent2) {
                        console.log(
                            `⚠️ Documents still not ready after 8s. Will handle via air.order.changed event.`,
                        );
                        await Booking.findByIdAndUpdate(
                            booking._id,
                            {
                                $push: {
                                    adminNotes: createAdminNote(
                                        `Payment captured (${paymentId}). Waiting for airline to generate ticket documents. Will process on air.order.changed event.`,
                                    ),
                                },
                            },
                        );
                    }
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ❌ PAYMENT FAILED
            // ════════════════════════════════════════════════════
            case 'air.payment.failed': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn(
                        '⚠️ air.payment.failed: Missing payment_id',
                    );
                    break;
                }

                let booking = await Booking.findOne({
                    payment_id: paymentId,
                });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({
                        payment_id: paymentId,
                    });
                }

                if (booking) {
                    const failureReason =
                        data?.failure_reason || 'Unknown reason';

                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: { paymentStatus: 'failed' },
                        $push: {
                            adminNotes: createAdminNote(
                                `Payment failed. Payment ID: ${paymentId}. Reason: ${failureReason}`,
                            ),
                        },
                    });
                    console.log(
                        `❌ Payment failed | Payment: ${paymentId} | Reason: ${failureReason}`,
                    );
                } else {
                    console.warn(
                        `⚠️ No booking found for failed payment: ${paymentId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ⏳ PAYMENT PENDING
            // ════════════════════════════════════════════════════
            case 'air.payment.pending': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn(
                        '⚠️ air.payment.pending: Missing payment_id',
                    );
                    break;
                }

                let booking = await Booking.findOne({
                    payment_id: paymentId,
                });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({
                        payment_id: paymentId,
                    });
                }

                if (booking) {
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: {
                            paymentStatus: 'pending',
                            payment_id: paymentId,
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `Payment pending processing. Payment ID: ${paymentId}`,
                            ),
                        },
                    });
                    console.log(
                        `⏳ Payment pending | Payment: ${paymentId}`,
                    );
                } else {
                    console.warn(
                        `⚠️ No booking found for pending payment: ${paymentId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🚫 PAYMENT CANCELLED
            // ════════════════════════════════════════════════════
            case 'air.payment.cancelled': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn(
                        '⚠️ air.payment.cancelled: Missing payment_id',
                    );
                    break;
                }

                let booking = await Booking.findOne({
                    payment_id: paymentId,
                });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({
                        payment_id: paymentId,
                    });
                }

                if (booking) {
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: { paymentStatus: 'failed' },
                        $push: {
                            adminNotes: createAdminNote(
                                `Payment cancelled. Payment ID: ${paymentId}`,
                            ),
                        },
                    });
                    console.log(
                        `🚫 Payment cancelled | Payment: ${paymentId}`,
                    );
                } else {
                    console.warn(
                        `⚠️ No booking found for cancelled payment: ${paymentId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🔄 ORDER CHANGED
            // ════════════════════════════════════════════════════
            case 'air.order.changed': {
                const orderId = data.order_id || data.id;
                if (!orderId) {
                    console.warn(
                        '⚠️ air.order.changed: Missing order ID',
                    );
                    break;
                }

                const booking = await Booking.findOne({
                    duffelOrderId: orderId,
                });
                if (!booking) {
                    console.warn(
                        `⚠️ air.order.changed: No booking for order ${orderId}`,
                    );
                    break;
                }

                if (!booking.emailSent) {
                    console.log(
                        `🎯 air.order.changed → Attempting ticket issuance...`,
                    );
                    await handleTicketIssuance(
                        booking._id.toString(),
                        orderId,
                    );
                } else {
                    const order = await fetchOrder(orderId);
                    if (order?.documents?.length > 0) {
                        const dbDocs = mapDocsForDb(
                            order.documents,
                        );

                        await Booking.findByIdAndUpdate(
                            booking._id,
                            {
                                $set: {
                                    documents: dbDocs,
                                    pnr:
                                        order.booking_reference ||
                                        booking.pnr,
                                },
                                $push: {
                                    adminNotes: createAdminNote(
                                        `Order changed post-issuance. Documents refreshed. PNR: ${order.booking_reference || booking.pnr}`,
                                    ),
                                },
                            },
                        );
                    }
                    console.log(
                        `ℹ️ Order changed (post-issuance) | PNR: ${booking.pnr}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 📋 CANCELLATION REQUESTED
            // ════════════════════════════════════════════════════
            case 'order_cancellation.created': {
                const orderId = data.order_id;
                if (!orderId) {
                    console.warn(
                        '⚠️ order_cancellation.created: Missing order_id',
                    );
                    break;
                }

                const result = await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $push: {
                            adminNotes: createAdminNote(
                                `Cancellation requested. Awaiting airline confirmation. Cancellation ID: ${data.id || 'N/A'}`,
                            ),
                        },
                    },
                );

                if (result) {
                    console.log(
                        `📋 Cancellation requested | Order: ${orderId}`,
                    );
                } else {
                    console.warn(
                        `⚠️ order_cancellation.created: No booking for ${orderId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ✅ CANCELLATION CONFIRMED
            // ════════════════════════════════════════════════════
            case 'order_cancellation.confirmed': {
                const orderId = data.order_id;
                if (!orderId) {
                    console.warn(
                        '⚠️ order_cancellation.confirmed: Missing order_id',
                    );
                    break;
                }

                const order = await fetchOrder(orderId);

                const refundInfo = order
                    ? `Refund Amount: ${order.total_amount || 'N/A'} ${order.total_currency || ''}`
                    : 'Could not fetch refund details';

                const result = await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: {
                            status: 'cancelled',
                            paymentStatus: 'refunded',
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `Cancellation confirmed by airline. ${refundInfo}. Cancellation ID: ${data.id || 'N/A'}`,
                            ),
                        },
                    },
                );

                if (result) {
                    console.log(
                        `❌ Cancellation confirmed | Order: ${orderId}`,
                    );
                } else {
                    console.warn(
                        `⚠️ order_cancellation.confirmed: No booking for ${orderId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ⚠️ AIRLINE-INITIATED CHANGE DETECTED
            // ════════════════════════════════════════════════════
            case 'order.airline_initiated_change_detected': {
                const orderId = data.id || data.order_id;
                if (!orderId) {
                    console.warn(
                        '⚠️ airline_initiated_change: Missing order ID',
                    );
                    break;
                }

                const order = await fetchOrder(orderId);

                const result = await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: {
                            airlineInitiatedChanges: order || data,
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `ALERT: Airline-initiated schedule change detected. Order: ${orderId}. Immediate review required.`,
                            ),
                        },
                    },
                );

                if (result) {
                    console.log(
                        `⚠️ Airline schedule change | Order: ${orderId}`,
                    );
                } else {
                    console.warn(
                        `⚠️ airline_change: No booking for ${orderId}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🏓 PING
            // ════════════════════════════════════════════════════
            case 'ping.triggered': {
                console.log('🏓 Webhook ping OK');
                break;
            }

            // ════════════════════════════════════════════════════
            // 🔕 IGNORED EVENTS
            // ════════════════════════════════════════════════════
            case 'air.airline_credit.created':
            case 'air.airline_credit.spent':
            case 'air.airline_credit.invalidated':
            case 'stays.booking_creation_failed':
            case 'stays.booking.created':
            case 'stays.booking.cancelled':
            case 'assistant.conversation.updated': {
                console.log(`🔕 Ignored event: ${type}`);
                break;
            }

            default: {
                console.log(`❓ Unhandled event type: ${type}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(
            '🔥 Webhook fatal error:',
            error.message,
            error.stack,
        );

        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 },
        );
    }
}