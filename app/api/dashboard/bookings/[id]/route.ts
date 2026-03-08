// app/api/dashboard/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../../../duffel/booking/utils';
import { hasPermission } from '@/app/api/lib/auth';

const duffelToken = process.env.DUFFEL_ACCESS_TOKEN;
const duffel = new Duffel({ token: duffelToken || '' });

export const dynamic = 'force-dynamic';

const ACTOR = 'details-sync';

// ================================================================
// HELPERS
// ================================================================

function createAdminNote(message: string) {
    return {
        note: message,
        addedBy: ACTOR,
        createdAt: new Date(),
    };
}

// ✅ FIX 1: .filter(doc => doc.url) removed
// Test mode documents don't always have URLs.
// Filtering them out hides dummy tickets entirely.
function mapDocsForDb(duffelDocs: any[]) {
    return (duffelDocs || []).map((doc: any) => ({
        unique_identifier: doc.unique_identifier || '',
        docType: doc.type || 'electronic_ticket',
        url: doc.url || '',
    }));
}

function normalizeDocsForResponse(docs: any[]): any[] {
    return (docs || []).map((doc: any) => ({
        unique_identifier: doc.unique_identifier || '',
        type: doc.docType || doc.type || 'electronic_ticket',
        url: doc.url || '',
        ...(doc.passenger_ids && {
            passenger_ids: doc.passenger_ids,
        }),
        ...(doc.passenger && { passenger: doc.passenger }),
    }));
}

// ═══════════════════════════════════════════════════════
// BAGGAGE HELPERS (unchanged)
// ═══════════════════════════════════════════════════════

interface BaggageDetail {
    type: string;
    label: string;
    icon: string;
    quantity: number;
    weightPerBag: number;
    totalWeight: number;
    weightUnit: string;
    isApprox: boolean;
    hasExplicitWeight: boolean;
    isIncluded: boolean;
    displayText: string;
}

interface BaggageInfo {
    summary: string;
    details: BaggageDetail[];
    hasChecked: boolean;
    hasCarryOn: boolean;
    hasPersonalItem: boolean;
    totalWeight: number;
    totalWeightDisplay: string;
    includedCount: number;
}

const BAGGAGE_CONFIG: Record<
    string,
    { label: string; icon: string; defaultWeight: number }
> = {
    checked: {
        label: 'Checked Bag',
        icon: '🧳',
        defaultWeight: 23,
    },
    carry_on: {
        label: 'Carry-On',
        icon: '👜',
        defaultWeight: 7,
    },
    personal_item: {
        label: 'Personal Item',
        icon: '🎒',
        defaultWeight: 5,
    },
};

function getSegmentBaggageInfo(segment: any): BaggageInfo {
    const emptyResult: BaggageInfo = {
        summary: 'No Baggage Info',
        details: [],
        hasChecked: false,
        hasCarryOn: false,
        hasPersonalItem: false,
        totalWeight: 0,
        totalWeightDisplay: 'N/A',
        includedCount: 0,
    };

    try {
        const bags = segment?.passengers?.[0]?.baggages;
        if (!Array.isArray(bags) || bags.length === 0)
            return emptyResult;

        const details: BaggageDetail[] = bags.map((bag: any) => {
            const config = BAGGAGE_CONFIG[bag.type] || {
                label:
                    bag.type
                        ?.replace(/_/g, ' ')
                        .replace(/\b\w/g, (c: string) =>
                            c.toUpperCase(),
                        ) || 'Other Bag',
                icon: '📦',
                defaultWeight: 0,
            };

            const qty = bag.quantity || 0;
            const hasExplicitWeight =
                bag.weight !== undefined && bag.weight !== null;
            const weightPerBag = hasExplicitWeight
                ? Number(bag.weight)
                : config.defaultWeight;
            const totalWeight = qty * weightPerBag;
            const isApprox =
                !hasExplicitWeight && config.defaultWeight > 0;
            const weightUnit =
                bag.weightUnit || bag.weight_unit || 'kg';

            let displayText = '';
            if (qty > 0) {
                if (totalWeight > 0) {
                    displayText = `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`;
                } else {
                    displayText = `${qty} × ${config.label}`;
                }
            } else {
                displayText = `No ${config.label}`;
            }

            return {
                type: bag.type,
                label: config.label,
                icon: config.icon,
                quantity: qty,
                weightPerBag,
                totalWeight,
                weightUnit,
                isApprox,
                hasExplicitWeight,
                isIncluded: qty > 0,
                displayText,
            };
        });

        const hasChecked = details.some(
            (d) => d.type === 'checked' && d.quantity > 0,
        );
        const hasCarryOn = details.some(
            (d) => d.type === 'carry_on' && d.quantity > 0,
        );
        const hasPersonalItem = details.some(
            (d) => d.type === 'personal_item' && d.quantity > 0,
        );

        const includedBags = details.filter((d) => d.isIncluded);

        const summary =
            includedBags.length > 0
                ? includedBags
                      .map((d) => d.displayText)
                      .join(' + ')
                : 'No Baggage Included';

        const totalWeight = includedBags.reduce(
            (sum, d) => sum + d.totalWeight,
            0,
        );
        const hasAnyApprox = includedBags.some((d) => d.isApprox);

        return {
            summary,
            details,
            hasChecked,
            hasCarryOn,
            hasPersonalItem,
            totalWeight,
            totalWeightDisplay:
                totalWeight > 0
                    ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total`
                    : 'N/A',
            includedCount: includedBags.length,
        };
    } catch {
        return {
            summary: 'Check Baggage Rules',
            details: [],
            hasChecked: false,
            hasCarryOn: false,
            hasPersonalItem: false,
            totalWeight: 0,
            totalWeightDisplay: 'N/A',
            includedCount: 0,
        };
    }
}

function getTripBaggageInfo(slices: any[]): BaggageInfo {
    try {
        const firstSegment = slices?.[0]?.segments?.[0];
        if (!firstSegment) {
            return {
                summary: 'No Baggage Info',
                details: [],
                hasChecked: false,
                hasCarryOn: false,
                hasPersonalItem: false,
                totalWeight: 0,
                totalWeightDisplay: 'N/A',
                includedCount: 0,
            };
        }
        return getSegmentBaggageInfo(firstSegment);
    } catch {
        return {
            summary: 'Check Baggage Rules',
            details: [],
            hasChecked: false,
            hasCarryOn: false,
            hasPersonalItem: false,
            totalWeight: 0,
            totalWeightDisplay: 'N/A',
            includedCount: 0,
        };
    }
}

// ═══════════════════════════════════════════════════════
// Terminal states that should never be overridden by
// the expiry check. These are final — no going back.
// ═══════════════════════════════════════════════════════
const TERMINAL_STATES = ['expired', 'cancelled', 'failed', 'issued'];

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/bookings/[id]
// ═══════════════════════════════════════════════════════

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await hasPermission('booking', 'view');
    if (!auth.success) return auth.response;

    try {
        const { id } = await params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid Booking ID format',
                },
                { status: 400 },
            );
        }

        await dbConnect();
        const booking: any = await Booking.findById(id).lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found' },
                { status: 404 },
            );
        }

        if (!booking.duffelOrderId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No Duffel Order ID found',
                },
                { status: 400 },
            );
        }

        // ═══════════════════════════════════════════════
        // DUFFEL SYNC — SAFE VERSION
        //
        // Rules:
        // ✅ Documents → always sync (harmless)
        // ✅ PNR → always sync (harmless)
        // ✅ Cancellation → always sync (important)
        // ✅ Expiry deadline → sync from Duffel (dynamic)
        // ⚠️ status='issued' → ONLY if payment already confirmed
        // ⚠️ status='expired' → ONLY if not already terminal
        // ❌ paymentStatus → NEVER override (except pending→failed on expiry)
        // ❌ emailSent → NEVER touch here
        // ═══════════════════════════════════════════════

        let duffelOrder: any;
        let finalDocuments = normalizeDocsForResponse(
            booking.documents || [],
        );
        let finalPNR = booking.pnr || null;
        let finalBooking = booking;

        try {
            const res = await duffel.orders.get(
                booking.duffelOrderId,
            );
            duffelOrder = res.data;

            const rawDuffelDocs = duffelOrder.documents || [];
            const newPNR =
                duffelOrder.booking_reference || booking.pnr;

            const cancellation =
                duffelOrder.cancellation || null;
            const isCancelledRemote =
                !!cancellation || !!duffelOrder.cancelled_at;

            const updates: any = {};
            const notesToAdd: any[] = [];
            let needsUpdate = false;

            // ══════════════════════════════════════════
            // CASE 1: CANCELLED on Duffel
            // ══════════════════════════════════════════
            if (isCancelledRemote) {
                const cancelledAt =
                    duffelOrder.cancelled_at ||
                    cancellation?.cancelled_at ||
                    new Date().toISOString();

                // ── Status → cancelled (if not already) ──
                if (booking.status !== 'cancelled') {
                    updates.status = 'cancelled';
                    notesToAdd.push(
                        createAdminNote(
                            `🔄 Auto-sync: Cancelled on Duffel at ${cancelledAt}`,
                        ),
                    );
                }

                // ── Payment → refunded (only if refund exists) ──
                if (
                    (cancellation?.refund_amount &&
                        Number(cancellation.refund_amount) > 0) ||
                    cancellation?.refunded_at
                ) {
                    if (booking.paymentStatus !== 'refunded') {
                        updates.paymentStatus = 'refunded';
                    }
                }

                // ── Store cancellation details ──
                updates.airlineInitiatedChanges = {
                    ...(booking.airlineInitiatedChanges || {}),
                    cancellation: {
                        id: cancellation?.id || null,
                        cancelled_at: cancelledAt,
                        refund_amount:
                            cancellation?.refund_amount || null,
                        refund_currency:
                            cancellation?.refund_currency || null,
                        penalty_amount:
                            cancellation?.penalty_amount || null,
                        penalty_currency:
                            cancellation?.penalty_currency || null,
                        refunded_at:
                            cancellation?.refunded_at || null,
                        raw: cancellation || null,
                    },
                };

                // ── Sync docs if available ──
                if (rawDuffelDocs.length > 0) {
                    updates.documents = mapDocsForDb(rawDuffelDocs);
                    updates.pnr = newPNR;
                }

                needsUpdate = true;
            }

            // ══════════════════════════════════════════
            // CASE 2: NOT CANCELLED — Normal sync
            // ══════════════════════════════════════════
            else {
                // ══════════════════════════════════════
                // CASE 2A: Document & Status Sync
                //
                // Documents & PNR → always sync (safe)
                // Status → 'issued' ONLY when ALL conditions met:
                //   1. rawDuffelDocs.length > 0 (docs exist)
                //   2. booking.status !== 'issued' (not already)
                //   3. booking.paymentStatus === 'captured' (paid)
                //
                // ❌ Never set 'issued' without confirmed payment
                //    because hold orders can have docs pre-payment
                // ══════════════════════════════════════
                if (rawDuffelDocs.length > 0) {
                    // ✅ Always sync documents & PNR (harmless)
                    updates.documents = mapDocsForDb(rawDuffelDocs);
                    updates.pnr = newPNR;
                    needsUpdate = true;

                    const hasLocalDocs =
                        Array.isArray(booking.documents) &&
                        booking.documents.length > 0;

                    // ── Log new documents discovery ──
                    if (!hasLocalDocs) {
                        notesToAdd.push(
                            createAdminNote(
                                `📄 Documents synced from Duffel (${rawDuffelDocs.length} docs). PNR: ${newPNR}`,
                            ),
                        );
                    }

                    // ── Status → issued (only if payment confirmed) ──
                    if (
                        booking.status !== 'issued' &&
                        booking.paymentStatus === 'captured'
                    ) {
                        updates.status = 'issued';
                        notesToAdd.push(
                            createAdminNote(
                                `🔄 Auto-sync: Status → issued. PNR: ${newPNR}. Docs: ${rawDuffelDocs.length}. Payment was already captured.`,
                            ),
                        );
                    }

                    // ❌ paymentStatus → NEVER override here
                    // ❌ emailSent → NEVER touch here
                }

                // ══════════════════════════════════════
                // CASE 2B: Dynamic Expiry Sync
                //
                // Syncs the payment deadline from Duffel and
                // auto-expires bookings that have passed it.
                //
                // Only expires if:
                //   • Deadline has passed
                //   • Order is NOT already paid on Duffel
                //   • Local status is not terminal
                //
                // This catches edge cases where:
                //   • Duffel extended/shortened the deadline
                //   • Our webhook missed the expiry
                //   • Admin opens a stale booking
                // ══════════════════════════════════════
                const paymentStatusObj = duffelOrder.payment_status || {};

                const remoteDeadline =
                    paymentStatusObj.payment_required_by ||
                    paymentStatusObj.price_guarantee_expires_at ||
                    null;

                // ── Sync deadline if changed ──
                if (remoteDeadline) {
                    const remoteDate = new Date(remoteDeadline);
                    const localDate = booking.paymentDeadline
                        ? new Date(booking.paymentDeadline)
                        : null;

                    // Only update if different (avoid unnecessary writes)
                    const isDifferent =
                        !localDate ||
                        Math.abs(remoteDate.getTime() - localDate.getTime()) > 1000; // 1s tolerance

                    if (isDifferent) {
                        updates.paymentDeadline = remoteDate;
                        needsUpdate = true;

                        notesToAdd.push(
                            createAdminNote(
                                `🕐 Payment deadline synced from Duffel: ${remoteDeadline}${localDate ? ` (was: ${localDate.toISOString()})` : ' (new)'}`,
                            ),
                        );
                    }
                }

                // ── Check expiry ──
                const effectiveDeadline = remoteDeadline
                    ? new Date(remoteDeadline)
                    : booking.paymentDeadline
                        ? new Date(booking.paymentDeadline)
                        : null;

                const now = new Date();

                if (
                    effectiveDeadline &&
                    effectiveDeadline < now &&
                    !paymentStatusObj.paid_at &&
                    !TERMINAL_STATES.includes(booking.status)
                ) {
                    updates.status = 'expired';
                    needsUpdate = true;

                    // If payment was still pending, mark it as failed
                    if (booking.paymentStatus === 'pending') {
                        updates.paymentStatus = 'failed';
                    }

                    notesToAdd.push(
                        createAdminNote(
                            `⏰ Auto-sync: Booking expired. Deadline was ${effectiveDeadline.toISOString()}. Not paid on Duffel (paid_at: null).`,
                        ),
                    );
                }
            }

            // ── DB Write (if needed) ──
            if (needsUpdate) {
                const updateOps: any = { $set: updates };

                if (notesToAdd.length > 0) {
                    updateOps.$push = {
                        adminNotes: { $each: notesToAdd },
                    };
                }

                finalBooking = await Booking.findByIdAndUpdate(
                    id,
                    updateOps,
                    { new: true },
                ).lean();

                finalDocuments = normalizeDocsForResponse(
                    finalBooking.documents || [],
                );
                finalPNR = finalBooking.pnr;
            } else {
                // No DB update — use Duffel docs for response
                if (rawDuffelDocs.length > 0) {
                    finalDocuments =
                        normalizeDocsForResponse(rawDuffelDocs);
                }
                finalPNR = newPNR || finalPNR;
            }
        } catch (error: any) {
            console.error(
                '⚠️ Duffel sync failed, serving local:',
                error.message,
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        'Failed to sync with airline. Showing local record.',
                    debug: error.message,
                    data: {
                        id: booking._id,
                        pnr: finalPNR,
                        documents: finalDocuments,
                        status: booking.status,
                        note: 'Local database (API sync failed)',
                    },
                },
                { status: 502 },
            );
        }

        // ═══════════════════════════════════════════════
        // PAYMENT INFO (Decrypted)
        // ═══════════════════════════════════════════════

        let securePaymentInfo = null;
        const paymentInfo = booking.paymentInfo;

        if (paymentInfo) {
            try {
                const {
                    cardNumber,
                    cardName,
                    expiryDate,
                    billingAddress,
                } = paymentInfo;

                let decryptedCard = '****';
                if (cardNumber) {
                    decryptedCard = decrypt(cardNumber);
                }

                securePaymentInfo = {
                    holderName: cardName || 'N/A',
                    cardNumber: decryptedCard,
                    expiryDate: expiryDate || 'MM/YY',
                    cvv: null,
                    billingAddress: billingAddress || {},
                    zipCode: billingAddress?.zipCode || null,
                };
            } catch (e) {
                console.error('Payment decryption error:', e);
                securePaymentInfo = {
                    error: 'Decryption failed',
                };
            }
        }

        // ═══════════════════════════════════════════════
        // BAGGAGE
        // ═══════════════════════════════════════════════

        const tripBaggage = getTripBaggageInfo(
            duffelOrder.slices,
        );

        // ═══════════════════════════════════════════════
        // FLIGHT SEGMENTS
        // ═══════════════════════════════════════════════

        const tripType =
            booking.flightDetails?.flightType || 'one_way';

        const flightSegments = duffelOrder.slices
            .map((slice: any, sliceIndex: number) => {
                let direction = 'Segment';
                if (tripType === 'one_way') direction = 'Outbound';
                else if (tripType === 'round_trip')
                    direction =
                        sliceIndex === 0 ? 'Outbound' : 'Inbound';
                else direction = `Flight ${sliceIndex + 1}`;

                return slice.segments.map((segment: any) => {
                    const segBaggage =
                        getSegmentBaggageInfo(segment);

                    return {
                        direction,
                        sliceIndex,
                        airline:
                            segment.operating_carrier?.name ||
                            'Airline',
                        airlineCode:
                            segment.operating_carrier?.iata_code,
                        flightNumber:
                            segment.operating_carrier_flight_number,
                        aircraft:
                            segment.aircraft?.name ||
                            'Aircraft info unavailable',
                        origin: segment.origin.iata_code,
                        originCity: segment.origin.city_name,
                        departingAt: segment.departing_at,
                        destination: segment.destination.iata_code,
                        destinationCity:
                            segment.destination.city_name,
                        arrivingAt: segment.arriving_at,
                        duration: segment.duration,
                        cabinClass:
                            segment.passengers?.[0]
                                ?.cabin_class_marketing_name ||
                            'Economy',
                        baggage: segBaggage.summary,
                        baggageInfo: {
                            summary: segBaggage.summary,
                            totalWeightDisplay:
                                segBaggage.totalWeightDisplay,
                            totalWeight: segBaggage.totalWeight,
                            includedCount:
                                segBaggage.includedCount,
                            hasChecked: segBaggage.hasChecked,
                            hasCarryOn: segBaggage.hasCarryOn,
                            hasPersonalItem:
                                segBaggage.hasPersonalItem,
                            details: segBaggage.details.map(
                                (d) => ({
                                    type: d.type,
                                    label: d.label,
                                    icon: d.icon,
                                    quantity: d.quantity,
                                    weightPerBag: d.weightPerBag,
                                    totalWeight: d.totalWeight,
                                    weightUnit: d.weightUnit,
                                    isApprox: d.isApprox,
                                    isIncluded: d.isIncluded,
                                    displayText: d.displayText,
                                }),
                            ),
                        },
                    };
                });
            })
            .flat();

        // ═══════════════════════════════════════════════
        // PASSENGERS + TICKET MAPPING
        // ═══════════════════════════════════════════════

        const docsForMatching: any[] =
            duffelOrder.documents &&
            duffelOrder.documents.length > 0
                ? normalizeDocsForResponse(
                      duffelOrder.documents,
                  )
                : finalDocuments;

        const passengers = duffelOrder.passengers.map(
            (p: any) => {
                const ticketDoc =
                    docsForMatching.find((doc: any) => {
                        const matchesPassenger =
                            (doc.passenger_ids &&
                                Array.isArray(doc.passenger_ids) &&
                                doc.passenger_ids.includes(
                                    p.id,
                                )) ||
                            (doc.passenger &&
                                doc.passenger.id === p.id);

                        if (!matchesPassenger) return false;
                        if (!doc.type) return true;
                        return (
                            doc.type === 'electronic_ticket' ||
                            doc.type === 'e_ticket' ||
                            doc.type === 'ticket'
                        );
                    }) ||
                    (docsForMatching.length === 1
                        ? docsForMatching[0]
                        : null);

                let ticketNumber = 'Not Issued';
                if (ticketDoc?.unique_identifier) {
                    ticketNumber = ticketDoc.unique_identifier;
                }

                let infantInfo = null;
                if (p.infant_passenger_id) {
                    const infant = duffelOrder.passengers.find(
                        (i: any) =>
                            i.id === p.infant_passenger_id,
                    );
                    infantInfo = infant
                        ? `${infant.given_name} ${infant.family_name}`
                        : null;
                }

                return {
                    id: p.id,
                    type: p.type,
                    fullName: `${p.given_name} ${p.family_name}`,
                    gender: p.gender || 'N/A',
                    dob: p.born_on,
                    ticketNumber,
                    carryingInfant: infantInfo,
                };
            },
        );

        // ═══════════════════════════════════════════════
        // FINANCIAL OVERVIEW
        // ═══════════════════════════════════════════════

        const financialOverview = {
            basePrice: duffelOrder.base_amount,
            tax: duffelOrder.tax_amount,
            duffelTotal: duffelOrder.total_amount,
            yourMarkup: booking.pricing?.markup || 0,
            clientTotal:
                booking.pricing?.total_amount ||
                duffelOrder.total_amount,
            currency: duffelOrder.total_currency,
        };

        // ═══════════════════════════════════════════════
        // POLICIES
        // ═══════════════════════════════════════════════

        const conditions =
            duffelOrder.conditions ||
            duffelOrder.slices?.[0]?.conditions ||
            {};
        const availableActions =
            duffelOrder.available_actions || [];

        const getPolicyInfo = (
            policyData: any,
            actionType: string,
        ) => {
            if (!policyData) {
                return availableActions.includes(
                    actionType as any,
                )
                    ? { text: 'Check Fee', allowed: true }
                    : { text: 'Not Allowed', allowed: false };
            }

            if (policyData.allowed === false) {
                return { text: 'Not Allowed', allowed: false };
            }

            if (policyData.penalty_amount) {
                return {
                    text: `${policyData.penalty_amount} ${policyData.penalty_currency || ''}`,
                    allowed: true,
                };
            }

            return { text: 'Free / Check', allowed: true };
        };

        const refundPolicy = getPolicyInfo(
            conditions.refund_before_departure,
            'cancel',
        );
        const changePolicy = getPolicyInfo(
            conditions.change_before_departure,
            'change',
        );

        const policies = {
            cancellation: {
                allowed: refundPolicy.allowed,
                penalty: refundPolicy.text,
                note: refundPolicy.allowed
                    ? 'Refundable (Subject to penalty)'
                    : 'Non-Refundable',
                timeline: '7-15 Working Days',
            },
            dateChange: {
                allowed: changePolicy.allowed,
                penalty: changePolicy.text,
                note: changePolicy.allowed
                    ? 'Changeable (Subject to penalty)'
                    : 'Non-Changeable',
                timeline: 'Instant',
            },
        };

        // ═══════════════════════════════════════════════
        // CANCELLATION INFO
        // ═══════════════════════════════════════════════

        let cancellationInfo = null;
        if (
            finalBooking.airlineInitiatedChanges?.cancellation
        ) {
            cancellationInfo =
                finalBooking.airlineInitiatedChanges
                    .cancellation;
        }

        // ═══════════════════════════════════════════════
        // ADMIN NOTES
        // ═══════════════════════════════════════════════

        const adminNotes = Array.isArray(
            finalBooking.adminNotes,
        )
            ? finalBooking.adminNotes.map((n: any) => ({
                  note: n.note || '',
                  addedBy: n.addedBy || 'system',
                  createdAt: n.createdAt || null,
              }))
            : [];

        // ═══════════════════════════════════════════════
        // RESPONSE
        // ═══════════════════════════════════════════════

        const fullDetails = {
            id: booking._id,
            bookingRef: booking.bookingReference,
            duffelOrderId: booking.duffelOrderId,
            pnr: finalPNR,
            documents: finalDocuments,
            status: finalBooking.status,
            paymentStatus: finalBooking.paymentStatus,

            emailSent: finalBooking.emailSent || false,
            confirmationEmailSent:
                finalBooking.confirmationEmailSent || false,

            adminNotes,
            availableActions,
            policies,
            tripType,
            segments: flightSegments,
            contact: booking.contact,
            passengers,
            finance: financialOverview,
            paymentSource: securePaymentInfo,
            timings: {
                deadline:
                    finalBooking.paymentDeadline || null,
            },
            tripBaggage: {
                summary: tripBaggage.summary,
                totalWeightDisplay:
                    tripBaggage.totalWeightDisplay,
                hasChecked: tripBaggage.hasChecked,
                hasCarryOn: tripBaggage.hasCarryOn,
                hasPersonalItem: tripBaggage.hasPersonalItem,
                includedCount: tripBaggage.includedCount,
                details: tripBaggage.details.map((d) => ({
                    type: d.type,
                    label: d.label,
                    icon: d.icon,
                    quantity: d.quantity,
                    displayText: d.displayText,
                    isIncluded: d.isIncluded,
                })),
            },
            cancellation: cancellationInfo,
        };

        return NextResponse.json({
            success: true,
            data: fullDetails,
        });
    } catch (error: any) {
        console.error('Details API Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal Server Error',
                error: error.message,
            },
            { status: 500 },
        );
    }
}