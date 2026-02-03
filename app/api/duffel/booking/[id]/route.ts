import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import mongoose from 'mongoose';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../utils';

const duffelToken = process.env.DUFFEL_ACCESS_TOKEN;
const duffel = new Duffel({ token: duffelToken || '' });

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 🟢 1. ID Validation
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid Booking ID format' },
                { status: 400 },
            );
        }

        // 🟢 2. Database Connection
        await dbConnect();
        const booking = await Booking.findById(id).lean();

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found' },
                { status: 404 },
            );
        }

        if (!booking.duffelOrderId) {
            return NextResponse.json(
                { success: false, message: 'No Duffel Order ID found' },
                { status: 400 },
            );
        }

        // 🟢 3. Duffel API Fetch
        let duffelOrder;
        try {
            const res = await duffel.orders.get(booking.duffelOrderId);
            duffelOrder = res.data;
        } catch (error: any) {
            console.error('❌ Duffel API Error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to retrieve order from airline',
                    debug: error.message,
                },
                { status: 502 },
            );
        }

        // 🟢 4. Payment Info (Updated: No CVV Handling) 🛡️
        let securePaymentInfo = null;
        const paymentInfo = booking.paymentInfo; // Get object first

        if (paymentInfo) {
            try {
                // 🟢 REMOVED: 'cvv' from destructuring since it's not in DB
                const { cardNumber, cardName, expiryDate, billingAddress } = paymentInfo;

                // Decrypt Card safely
                let decryptedCard = '****';
                if (cardNumber) {
                    decryptedCard = decrypt(cardNumber);
                }

                // 🟢 REMOVED: CVV Decryption Logic entirely

                securePaymentInfo = {
                    holderName: cardName || 'N/A',
                    cardNumber: decryptedCard,
                    expiryDate: expiryDate || 'MM/YY',
                    cvv: null, // 🟢 No CVV available from DB
                    billingAddress: billingAddress || {},
                };
            } catch (e) {
                console.error('Payment Processing Error:', e);
                securePaymentInfo = { error: 'Payment Data Error' };
            }
        }

        // 🟢 5. Flight Segments
        const tripType = booking.flightDetails?.flightType || 'one_way';

        const flightSegments = duffelOrder.slices
            .map((slice: any, sliceIndex: number) => {
                let direction = 'Segment';
                if (tripType === 'one_way') direction = 'Outbound';
                else if (tripType === 'round_trip')
                    direction = sliceIndex === 0 ? 'Outbound' : 'Inbound';
                else direction = `Flight ${sliceIndex + 1}`;

                return slice.segments.map((segment: any) => ({
                    direction: direction,
                    sliceIndex: sliceIndex,
                    airline: segment.operating_carrier?.name || 'Airline',
                    airlineCode: segment.operating_carrier?.iata_code,
                    flightNumber: segment.operating_carrier_flight_number,
                    aircraft: segment.aircraft?.name || 'Aircraft info unavailable',
                    origin: segment.origin.iata_code,
                    originCity: segment.origin.city_name,
                    departingAt: segment.departing_at,
                    destination: segment.destination.iata_code,
                    destinationCity: segment.destination.city_name,
                    arrivingAt: segment.arriving_at,
                    duration: segment.duration,
                    cabinClass: segment.passengers?.[0]?.cabin_class_marketing_name || 'Economy',
                    baggage: segment.passengers?.[0]?.baggages?.[0]
                        ? `${segment.passengers[0].baggages[0].quantity} PC (${segment.passengers[0].baggages[0].quantity * 23} KG)`
                        : 'Check Airline Rule',
                }));
            })
            .flat();

        // 🟢 6. Passengers
        const documents = duffelOrder.documents || [];
        const passengers = duffelOrder.passengers.map((p: any) => {
            const ticketDoc = documents.find(
                (doc: any) => doc.type === 'electronic_ticket' && doc.passenger_ids?.includes(p.id),
            );
            return {
                id: p.id,
                type: p.type,
                fullName: `${p.given_name} ${p.family_name}`,
                gender: p.gender || 'N/A',
                ticketNumber: ticketDoc ? ticketDoc.unique_identifier : 'Not Issued',
            };
        });

        // 🟢 7. Finance
        const financialOverview = {
            basePrice: duffelOrder.base_amount,
            tax: duffelOrder.tax_amount,
            duffelTotal: duffelOrder.total_amount,
            yourMarkup: booking.pricing?.markup || 0,
            clientTotal: booking.pricing?.total_amount || duffelOrder.total_amount,
            currency: duffelOrder.total_currency,
        };

        // 🟢 8. Policies Logic (Safe Extraction)
        const conditions = duffelOrder.conditions || duffelOrder.slices?.[0]?.conditions || {};
        const availableActions = duffelOrder.available_actions || [];

        const getPolicyInfo = (policyData: any, actionType: string) => {
            // If policy data is missing
            if (!policyData) {
                return availableActions.includes(actionType as any)
                    ? { text: 'Check Fee', allowed: true }
                    : { text: 'Not Allowed', allowed: false };
            }

            // If allowed is explicitly false
            if (policyData.allowed === false) {
                return { text: 'Not Allowed', allowed: false };
            }

            // If there is a penalty
            if (policyData.penalty_amount) {
                return {
                    text: `${policyData.penalty_amount} ${policyData.penalty_currency || ''}`,
                    allowed: true,
                };
            }

            return { text: 'Free / Check', allowed: true };
        };

        const refundPolicy = getPolicyInfo(conditions.refund_before_departure, 'cancel');
        const changePolicy = getPolicyInfo(conditions.change_before_departure, 'change');

        const policies = {
            cancellation: {
                allowed: refundPolicy.allowed,
                penalty: refundPolicy.text,
                note: refundPolicy.allowed ? 'Refundable (Subject to penalty)' : 'Non-Refundable',
                timeline: '7-15 Working Days',
            },
            dateChange: {
                allowed: changePolicy.allowed,
                penalty: changePolicy.text,
                note: changePolicy.allowed ? 'Changeable (Subject to penalty)' : 'Non-Changeable',
                timeline: 'Instant',
            },
        };

        // 🟢 9. Response
        const fullDetails = {
            id: booking._id,
            bookingRef: booking.bookingReference,
            duffelOrderId: booking.duffelOrderId,
            pnr: duffelOrder.booking_reference,
            status: booking.status,
            availableActions: availableActions,
            policies: policies,
            tripType: tripType,
            segments: flightSegments,
            contact: booking.contact,
            passengers: passengers,
            finance: financialOverview,
            paymentSource: securePaymentInfo,
            documents: documents,
        };

        return NextResponse.json({ success: true, data: fullDetails });
    } catch (error: any) {
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