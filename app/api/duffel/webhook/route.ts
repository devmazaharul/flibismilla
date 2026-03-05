// app/api/duffel/webhook/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { sendTicketIssuedEmail } from '@/app/emails/email';
import { getShortDateTime } from '../booking/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const WEBHOOK_ACTOR = 'duffel-webhook';

// ================================================================
// HELPER: Create admin note matching new schema structure
// Schema: adminNotes: [{ note: String, addedBy: String, createdAt: Date }]
// ================================================================
function createAdminNote(message: string) {
    return {
        note: message,
        addedBy: WEBHOOK_ACTOR,
        createdAt: new Date(),
    };
}

// ================================================================
// HELPER: Map Duffel documents to DB schema format
// Duffel returns 'type', but our schema uses 'docType' to avoid
// collision with Mongoose's reserved 'type' keyword.
// ================================================================
function mapDocsForDb(duffelDocs: any[]) {
    return duffelDocs
        .filter((doc: any) => doc.url)
        .map((doc: any) => ({
            unique_identifier: doc.unique_identifier || '',
            docType: doc.type || 'electronic_ticket', // ✅ schema field = docType
            url: doc.url || '',
        }));
}

// ================================================================
// HELPER: Map Duffel documents for email template
// Email templates expect 'type' (not 'docType'), so we keep the
// original Duffel field name for email rendering purposes only.
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
// HELPER: Delay utility (used for ticket generation wait)
// ⚠️ WARNING: setTimeout in serverless is unreliable.
// Consider migrating to a queue-based approach (BullMQ, SQS)
// for production-critical ticket polling.
// ================================================================
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ================================================================
// 🔒 Verify Duffel Webhook Signature (HMAC SHA-256)
// Protects against forged webhook events.
// Uses timing-safe comparison to prevent timing attacks.
// ================================================================
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
    const timestampMatch = signature.match(/t=([^,]+)/);
    const hashMatch = signature.match(/v2=([^,]+)/);

    const timestamp = timestampMatch?.[1]?.trim();
    const receivedHash = hashMatch?.[1]?.trim();

    if (!timestamp || !receivedHash) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    const receivedBuffer = Buffer.from(receivedHash);
    const expectedBuffer = Buffer.from(expectedHash);

    if (receivedBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

// ================================================================
// 🔍 Fetch Full Order from Duffel API
// The webhook payload is minimal (just IDs). We always need to
// fetch the full order to get slices, documents, PNR, etc.
// ================================================================
async function fetchOrder(orderId: string): Promise<any | null> {
    try {
        const res = await duffel.orders.get(orderId);
        return res.data;
    } catch (err: any) {
        console.error(`❌ Duffel fetch failed [${orderId}]:`, err.message);
        return null;
    }
}

// ================================================================
// 🛠️ Build Email Data
// Combines booking DB data (contact, passengers) with Duffel API
// data (slices, documents, PNR) for the email template.
// ================================================================
function buildEmailData(
    bookingDoc: any,
    order: any,
    emailDocs: { url: string; unique_identifier: string; type: string }[],
) {
    const slices = order.slices || [];
    const firstSlice = slices[0];
    const firstSegment = firstSlice?.segments?.[0];

    const originName = firstSlice?.origin?.city_name || firstSlice?.origin?.iata_code || 'Origin';
    const destinationName =
        firstSlice?.destination?.city_name || firstSlice?.destination?.iata_code || 'Destination';

    return {
        pnr: order.booking_reference,
        contact: {
            email: bookingDoc.contact?.email || '',
            phone: bookingDoc.contact?.phone || '',
        },
        passengers: bookingDoc.passengers || [],
        flightDetails: {
            airline: firstSegment?.operating_carrier?.name || order.owner?.name || 'Airline',
            route: `${originName} - ${destinationName}`,
            departureDate:
                firstSegment?.departing_at || order.created_at || new Date().toISOString(),
        },
        documents: emailDocs,
    };
}

// ================================================================
// 📧 Ticket Issuance + Email Handler
//
// This function is called from multiple event handlers:
// - air.payment.succeeded (primary)
// - air.order.changed (fallback if docs weren't ready)
// - order.created (rare: instant ticketing airlines)
//
// Idempotency: Checks emailSent flag before proceeding.
// ================================================================
async function handleTicketIssuance(bookingId: string, duffelOrderId: string): Promise<boolean> {
    // 1. Fresh DB read to get latest state
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        console.log(`ℹ️ Booking not found (possibly deleted): ${bookingId}`);
        return false;
    }

    // 2. Idempotency check — don't send duplicate emails
    if (booking.emailSent) {
        console.log(`ℹ️ Email already sent, skipping: ${bookingId}`);
        return true;
    }

    // 3. Fetch full order from Duffel API
    const order = await fetchOrder(duffelOrderId);
    if (!order) {
        console.error(`❌ Cannot fetch order for ticketing: ${duffelOrderId}`);
        return false;
    }

    // 4. Check if documents (e-tickets) are available
    const rawDocs = (order.documents || []).filter((doc: any) => doc.url);

    // if (rawDocs.length === 0) {
    //     // Documents not ready yet — sync PNR only
    //     console.log(`ℹ️ No documents available yet: ${duffelOrderId}`);
    //     await Booking.findByIdAndUpdate(bookingId, {
    //         $set: {
    //             pnr: order.booking_reference || booking.pnr,
    //         },
    //     });
    //     return false;
    // }

    // 5. Map documents for DB storage and email separately
    const dbDocs = mapDocsForDb(rawDocs);
    const emailDocs = mapDocsForEmail(rawDocs);

    // 6. Update DB FIRST (mark as issued + emailSent=true)
    //    If email fails later, we'll revert emailSent
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

    // 7. Send confirmation email
    try {
        const emailData = buildEmailData(booking, order, emailDocs);
        await sendTicketIssuedEmail(emailData);
        console.log(
            `✅ Email sent | PNR: ${order.booking_reference} | To: ${booking.contact?.email}`,
        );
        return true;
    } catch (emailErr: any) {
        console.error('❌ Email send failed:', emailErr.message);

        // Revert emailSent flag so retry mechanisms can pick it up
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
//
// Duffel sends webhook events for order lifecycle changes.
// Each event contains: { type: "event.type", data: { object: {...} } }
//
// We respond 200 quickly to prevent Duffel retries, then process.
// If we return 4xx/5xx, Duffel will retry with exponential backoff.
// ================================================================
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature =
            req.headers.get('x-duffel-signature') || req.headers.get('X-Duffel-Signature');

        // ── Signature Verification ──
        if (!signature) {
            return NextResponse.json({ message: 'Missing signature header' }, { status: 401 });
        }

        const secret = process.env.DUFFEL_WEBHOOK_SECRET;
        if (!secret) {
            console.error('❌ DUFFEL_WEBHOOK_SECRET not configured');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        if (!verifySignature(rawBody, signature, secret)) {
            console.error('❌ Webhook signature verification failed');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
        }

        // ── Parse Event ──
        let event: any;
        try {
            event = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { type, data: rawData } = event;

        // Duffel wraps data in: { data: { object: { ... } } }
        const data = rawData?.object ?? rawData ?? {};

        console.log(
            `🔔 Webhook received: [${type}] | Keys: ${Object.keys(data).join(', ') || 'empty'}`,
        );

        await dbConnect();

        switch (type) {
            // ════════════════════════════════════════════════════
            // ✅ ORDER CREATED
            //
            // Payload: data.object = { id: "ord_xxx", offer_id: "off_xxx" }
            // Note: Payload is minimal — no slices, documents, or PNR.
            // We must fetch the full order from Duffel API.
            // ════════════════════════════════════════════════════
            case 'order.created': {
                const orderId = data.id;
                if (!orderId) {
                    console.warn('⚠️ order.created: Missing order ID in payload');
                    break;
                }

                const booking = await Booking.findOne({ duffelOrderId: orderId });
                if (!booking) {
                    console.warn(`⚠️ order.created: No booking found for order ${orderId}`);
                    break;
                }

                // Idempotency: skip if already issued
                if (booking.status === 'issued') {
                    console.log(`ℹ️ order.created: Already issued, skipping ${orderId}`);
                    break;
                }

                // Fetch full order details from Duffel
                const order = await fetchOrder(orderId);
                if (!order) {
                    console.error(`❌ order.created: Cannot fetch order ${orderId}`);
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

                const hasTickets = order.documents && order.documents.length > 0;

                if (hasTickets) {
                    // Rare: Some airlines issue tickets instantly
                    console.log(`🎫 Instant ticket issuance detected | Order: ${orderId}`);
                    await handleTicketIssuance(booking._id.toString(), orderId);
                } else {
                    // Normal flow: Hold order awaiting payment
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: {
                            status: 'held',
                            pnr: order.booking_reference || booking.pnr,
                            ...(order.payment_status?.payment_required_by && {
                                paymentDeadline: new Date(order.payment_status.payment_required_by),
                            }),
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `Order held. PNR: ${order.booking_reference || 'N/A'}. Payment deadline: ${getShortDateTime(order.payment_status?.payment_required_by) || 'N/A'}`,
                            ),
                        },
                    });

                    console.log(
                        `🕐 Order held | PNR: ${order.booking_reference} | Deadline:${getShortDateTime(order.payment_status?.payment_required_by)}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ❌ ORDER CREATION FAILED
            //
            // Payload: data.object = { id: "ord_xxx" }
            // The airline rejected the booking request.
            // ════════════════════════════════════════════════════
            case 'order.creation_failed': {
                const orderId = data.id || data.order_id;
                if (!orderId) {
                    console.warn('⚠️ order.creation_failed: Missing order ID');
                    break;
                }

                const failureReason = data?.failure_reason || data?.message || 'Unknown reason';

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
                    console.log(`❌ Order creation failed | ${orderId} | ${failureReason}`);
                } else {
                    console.warn(`⚠️ order.creation_failed: No booking for ${orderId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 💰 PAYMENT SUCCEEDED
            //
            // Primary trigger for ticket issuance.
            // Fires when admin issues payment via Duffel dashboard
            // or when the payment API call completes successfully.
            //
            // Payload: data.object = { payment_id: "pay_xxx" }
            // Strategy: Find booking by payment_id → fetch order
            //           by duffelOrderId → issue ticket + send email
            // ════════════════════════════════════════════════════
            case 'air.payment.succeeded': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn('⚠️ air.payment.succeeded: Missing payment_id');
                    break;
                }

                console.log(`💰 Payment succeeded | Payment: ${paymentId}`);

                // Find booking by payment_id
                let booking = await Booking.findOne({ payment_id: paymentId });

                // Race condition mitigation: Issue API may not have saved
                // payment_id to DB yet. Wait and retry once.
                if (!booking) {
                    console.log(`⏳ Booking not found by payment_id, retrying in 3s...`);
                    await delay(3000);
                    booking = await Booking.findOne({ payment_id: paymentId });
                }

                // Fallback: Try idempotency_key if provided
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

                // Idempotency: skip if already issued and email sent
                if (booking.status === 'issued' && booking.emailSent) {
                    console.log(`ℹ️ Already issued and emailed, skipping | Payment: ${paymentId}`);
                    break;
                }

                const duffelOrderId = booking.duffelOrderId;
                if (!duffelOrderId) {
                    console.error(`❌ Booking ${booking._id} has no duffelOrderId`);
                    await Booking.findByIdAndUpdate(booking._id, {
                        $push: {
                            adminNotes: createAdminNote(
                                `Payment succeeded (${paymentId}) but booking has no duffelOrderId. Manual intervention required.`,
                            ),
                        },
                    });
                    break;
                }

                // Update payment status
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

                console.log(`💰 Payment captured | Order: ${duffelOrderId}`);

                // Wait for airline to generate ticket documents
                // ⚠️ In production, consider using a job queue instead of delay
                console.log(`⏳ Waiting 3s for ticket generation...`);
                await delay(3000);

                // Attempt 1: Try to fetch and send ticket
                const sent1 = await handleTicketIssuance(booking._id.toString(), duffelOrderId);

                if (!sent1) {
                    // Documents not ready — wait and retry
                    console.log(`⏳ Documents not ready, retrying in 5s...`);
                    await delay(5000);

                    // Attempt 2
                    const sent2 = await handleTicketIssuance(booking._id.toString(), duffelOrderId);

                    if (!sent2) {
                        // Still no documents — rely on air.order.changed event
                        console.log(
                            `⚠️ Documents still not ready after 8s. Will handle via air.order.changed event.`,
                        );
                        await Booking.findByIdAndUpdate(booking._id, {
                            $push: {
                                adminNotes: createAdminNote(
                                    `Payment captured (${paymentId}). Waiting for airline to generate ticket documents. Will process on air.order.changed event.`,
                                ),
                            },
                        });
                    }
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ❌ PAYMENT FAILED
            //
            // Payload: data.object = { payment_id: "pay_xxx" }
            // ════════════════════════════════════════════════════
            case 'air.payment.failed': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn('⚠️ air.payment.failed: Missing payment_id');
                    break;
                }

                let booking = await Booking.findOne({ payment_id: paymentId });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({ payment_id: paymentId });
                }

                if (booking) {
                    const failureReason = data?.failure_reason || 'Unknown reason';

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
                    console.warn(`⚠️ No booking found for failed payment: ${paymentId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ⏳ PAYMENT PENDING
            //
            // Payload: data.object = { payment_id: "pay_xxx" }
            // Payment is being processed by the airline/acquirer.
            // ════════════════════════════════════════════════════
            case 'air.payment.pending': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn('⚠️ air.payment.pending: Missing payment_id');
                    break;
                }

                let booking = await Booking.findOne({ payment_id: paymentId });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({ payment_id: paymentId });
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
                    console.log(`⏳ Payment pending | Payment: ${paymentId}`);
                } else {
                    console.warn(`⚠️ No booking found for pending payment: ${paymentId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🚫 PAYMENT CANCELLED
            //
            // Payload: data.object = { payment_id: "pay_xxx" }
            // Payment was cancelled before completion.
            // ════════════════════════════════════════════════════
            case 'air.payment.cancelled': {
                const paymentId = data.payment_id || data.id;
                if (!paymentId) {
                    console.warn('⚠️ air.payment.cancelled: Missing payment_id');
                    break;
                }

                let booking = await Booking.findOne({ payment_id: paymentId });
                if (!booking) {
                    await delay(2000);
                    booking = await Booking.findOne({ payment_id: paymentId });
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
                    console.log(`🚫 Payment cancelled | Payment: ${paymentId}`);
                } else {
                    console.warn(`⚠️ No booking found for cancelled payment: ${paymentId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🔄 ORDER CHANGED
            //
            // Fallback handler: If ticket documents weren't available
            // during air.payment.succeeded, this event fires when the
            // airline updates the order (e.g., attaches documents).
            //
            // Also handles post-issuance document updates.
            // ════════════════════════════════════════════════════
            case 'air.order.changed': {
                const orderId = data.order_id || data.id;
                if (!orderId) {
                    console.warn('⚠️ air.order.changed: Missing order ID');
                    break;
                }

                const booking = await Booking.findOne({ duffelOrderId: orderId });
                if (!booking) {
                    console.warn(`⚠️ air.order.changed: No booking for order ${orderId}`);
                    break;
                }

                if (!booking.emailSent) {
                    // Primary case: Ticket not yet sent, attempt issuance
                    console.log(`🎯 air.order.changed → Attempting ticket issuance...`);
                    await handleTicketIssuance(booking._id.toString(), orderId);
                } else {
                    // Post-issuance: Refresh documents (e.g., updated itinerary)
                    const order = await fetchOrder(orderId);
                    if (order?.documents?.length > 0) {
                        const dbDocs = mapDocsForDb(order.documents);

                        await Booking.findByIdAndUpdate(booking._id, {
                            $set: {
                                documents: dbDocs,
                                pnr: order.booking_reference || booking.pnr,
                            },
                            $push: {
                                adminNotes: createAdminNote(
                                    `Order changed post-issuance. Documents refreshed. PNR: ${order.booking_reference || booking.pnr}`,
                                ),
                            },
                        });
                    }
                    console.log(`ℹ️ Order changed (post-issuance) | PNR: ${booking.pnr}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 📋 CANCELLATION REQUESTED
            //
            // Payload: data.object = { id: "ore_xxx", order_id: "ord_xxx" }
            // Cancellation has been submitted, pending airline confirmation.
            // ════════════════════════════════════════════════════
            case 'order_cancellation.created': {
                const orderId = data.order_id;
                if (!orderId) {
                    console.warn('⚠️ order_cancellation.created: Missing order_id');
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
                    console.log(`📋 Cancellation requested | Order: ${orderId}`);
                } else {
                    console.warn(`⚠️ order_cancellation.created: No booking for ${orderId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ✅ CANCELLATION CONFIRMED
            //
            // Payload: data.object = { id: "ore_xxx", order_id: "ord_xxx" }
            // Airline has confirmed the cancellation. Refund may apply.
            // ════════════════════════════════════════════════════
            case 'order_cancellation.confirmed': {
                const orderId = data.order_id;
                if (!orderId) {
                    console.warn('⚠️ order_cancellation.confirmed: Missing order_id');
                    break;
                }

                // Fetch full order for refund details
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
                    console.log(`❌ Cancellation confirmed | Order: ${orderId}`);
                } else {
                    console.warn(`⚠️ order_cancellation.confirmed: No booking for ${orderId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // ⚠️ AIRLINE-INITIATED CHANGE DETECTED
            //
            // The airline has modified the booking (schedule change,
            // equipment swap, route change, etc.). Store the raw change
            // data and alert admin for review.
            // ════════════════════════════════════════════════════
            case 'order.airline_initiated_change_detected': {
                const orderId = data.id || data.order_id;
                if (!orderId) {
                    console.warn('⚠️ airline_initiated_change: Missing order ID');
                    break;
                }

                // Fetch full order for complete change details
                const order = await fetchOrder(orderId);

                const result = await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: {
                            // Store raw change data for admin review
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
                    console.log(`⚠️ Airline schedule change | Order: ${orderId}`);
                } else {
                    console.warn(`⚠️ airline_change: No booking for ${orderId}`);
                }
                break;
            }

            // ════════════════════════════════════════════════════
            // 🏓 PING (Health Check)
            //
            // Duffel sends this to verify webhook endpoint is alive.
            // Payload: data = {} (empty)
            // ════════════════════════════════════════════════════
            case 'ping.triggered': {
                console.log('🏓 Webhook ping OK');
                break;
            }

            // ════════════════════════════════════════════════════
            // 🔕 IGNORED EVENTS
            // These events are not relevant to our booking flow.
            // Logged for monitoring but no action taken.
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

        // Always return 200 to acknowledge receipt.
        // Returning non-2xx causes Duffel to retry the webhook.
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('🔥 Webhook fatal error:', error.message, error.stack);

        // Return 500 so Duffel retries this event
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
