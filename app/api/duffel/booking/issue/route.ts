import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db'; // পাথ ঠিক আছে কিনা চেক করুন
import Booking from '@/models/Booking.model'; // পাথ ঠিক আছে কিনা চেক করুন
import { decrypt } from '../utils';
import { isAdmin } from '@/app/api/lib/auth';

// 1. Duffel Configuration
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

// --- 🛡️ 2. Rate Limiter Helper ---
const rateLimitMap = new Map();

function isRateLimited(ip: string) {
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 5; // Max 5 requests per minute
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, startTime: now };

    if (now - clientData.startTime > windowMs) {
        clientData.count = 1;
        clientData.startTime = now;
    } else {
        clientData.count++;
    }

    rateLimitMap.set(ip, clientData);
    return clientData.count > maxRequests;
}

// --- 🚀 3. Main POST API Handler ---
export async function POST(req: Request) {
    const auth = await isAdmin();
    if (!auth.success) return auth.response;

    let bookingIdForError = null;

    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Too many attempts. Please wait 1 minute.' },
                { status: 429 },
            );
        }

        // 🟢 1. Parse Body (cvv comes here)
        const body = await req.json();
        const { bookingId, paymentMethod, cvv } = body; // paymentMethod: 'card' | 'balance'

        bookingIdForError = bookingId;

        // Basic Validation
        if (!bookingId || !paymentMethod) {
            return NextResponse.json(
                { success: false, message: 'Booking ID or Payment Method is missing' },
                { status: 400 },
            );
        }

        // 🟢 2. CVV Validation (Only if Card is selected)
        if (paymentMethod === 'card' && !cvv) {
            return NextResponse.json(
                { success: false, message: 'CVV is required for card payment' },
                { status: 400 },
            );
        }

        await dbConnect();
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found in database' },
                { status: 404 },
            );
        }

        // 🛑 Retry Guard
        if ((booking.retryCount || 0) >= 3) {
            return NextResponse.json(
                { success: false, message: 'Maximum retry limit reached. Please contact support.' },
                { status: 403 },
            );
        }

        // 3. Get Duffel Order Details
        let orderDetails;
        try {
            const res = await duffel.orders.get(booking.duffelOrderId);
            orderDetails = res.data as any;
        } catch (err) {
            console.error('Duffel Connection Error:', err);
            return NextResponse.json(
                { success: false, message: 'Failed to connect with Duffel API.' },
                { status: 502 },
            );
        }

        // Check Cancellation
        if (orderDetails.cancelled_at) {
            await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
            return NextResponse.json(
                { success: false, message: 'Airline cancelled this booking.' },
                { status: 400 },
            );
        }

        // Check if Already Issued
        if (orderDetails.documents?.length > 0) {
            const formattedDocs = orderDetails.documents.map((doc: any) => ({
                unique_identifier: doc.unique_identifier,
                type: doc.type,
                url: doc.url,
            }));

            const updated = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    status: 'issued',
                    pnr: orderDetails.booking_reference,
                    documents: formattedDocs,
                },
                { new: true },
            );

            return NextResponse.json({
                success: true,
                message: 'Ticket is already issued!',
                data: updated,
            });
        }

        // 💰 4. Prepare Payment Payload
        const amountToPay = orderDetails.total_amount;
        const currency = orderDetails.total_currency;

        const paymentPayload: any = {
            order_id: booking.duffelOrderId,
            payment: {
                amount: amountToPay,
                currency: currency,
                type: 'balance', // Default
            },
        };

        // 🔐 5. Payment Logic Implementation
        if (paymentMethod === 'card') {
            console.log('Processing Card Payment...');

            if (!booking.paymentInfo?.cardNumber) {
                return NextResponse.json(
                    { success: false, message: 'Card data missing in database' },
                    { status: 400 },
                );
            }

            try {
                // Decrypt card number from DB
                const decryptedCardNum = decrypt(booking.paymentInfo.cardNumber);

                // Format expiry date
                const [expMonth, expYearShort] = booking.paymentInfo.expiryDate.split('/');
                const expYearFull = expYearShort.length === 2 ? `20${expYearShort}` : expYearShort;

                // Construct Card Details
                paymentPayload.payment.type = 'card';
                paymentPayload.payment.card_details = {
                    number: decryptedCardNum,
                    cvv: cvv, // 🟢 Runtime CVV from Request Body
                    exp_month: expMonth,
                    exp_year: expYearFull,
                    name: booking.paymentInfo.cardName,
                };
            } catch (decryptionError) {
                console.error('Decryption Failed:', decryptionError);
                return NextResponse.json(
                    { success: false, message: 'Failed to decrypt card info.' },
                    { status: 500 },
                );
            }
        } else {
            // Balance Payment
            console.log('Processing Balance Payment...');
            paymentPayload.payment.type = 'balance';
        }

        // ⚡ 6. Execute Payment
        console.log(`Charging ${amountToPay} ${currency} via ${paymentMethod}...`);

        const paymentResponse = await duffel.payments.create(paymentPayload);

        // ✅ 7. Success Handling
        if (paymentResponse.data) {
            console.log('Payment Successful! Fetching Documents...');

            // Re-fetch order for documents
            const updatedOrder = await duffel.orders.get(booking.duffelOrderId);

            const pdfDocuments =
                updatedOrder.data.documents?.map((doc: any) => ({
                    unique_identifier: doc.unique_identifier,
                    type: doc.type,
                    url: doc.url,
                })) || [];

            // Update Database
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    status: 'issued',
                    pnr: updatedOrder.data.booking_reference,
                    documents: pdfDocuments,
                    $set: {
                        retryCount: 0,
                        adminNotes: `Ticket Issued via ${paymentMethod} at ${new Date().toLocaleString()}`,
                    },
                },
                { new: true },
            );

            return NextResponse.json({
                success: true,
                message: 'Ticket Issued Successfully!',
                data: updatedBooking,
            });
        }
    } catch (error: any) {
        console.error('Payment Error:', JSON.stringify(error, null, 2));

        const errorMessage =
            error.errors?.[0]?.message || error.message || 'Payment Processing Failed';

        // Increase retry count on failure
        if (bookingIdForError) {
            await Booking.findByIdAndUpdate(bookingIdForError, {
                $inc: { retryCount: 1 },
                lastRetryAt: new Date(),
                adminNotes: `Payment Failed: ${errorMessage}`,
            });
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
}
