import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import { decrypt, encrypt, generateBookingReference } from './utils';
import Booking from '@/models/Booking.model';
import { format, parseISO } from 'date-fns';
import { isAdmin } from '../../lib/auth';
import { sendBookingProcessingEmail, sendNewBookingAdminNotification } from '@/app/emails/email';

// --- Type Definitions ---
interface PassengerInput {
    id: string;
    type: 'adult' | 'child' | 'infant_without_seat';
    title: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dob: string;
    email?: string;
    phone?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportCountry?: string;
}

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

// --- 🛡️ Rate Limiter ---
const rateLimitMap = new Map();
function isRateLimited(ip: string) {
    const windowMs = 60 * 1000;
    const maxRequests = 20;
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

const validatePhoneNumber = (phone: string | undefined) => {
    if (!phone) return undefined;

    const cleaned = phone.trim().replace(/[\s-]/g, '');

    if (cleaned.length < 10 || cleaned.length > 17) {
        return undefined;
    }

    return cleaned;
};

export async function POST(request: Request) {
    let newBookingId = null;
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';

    if (isRateLimited(ip)) {
        return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    try {
        await dbConnect();

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 },
            );
        }

        const { offer_id, contact, passengers, payment, flight_details, pricing } = body;

        if (!offer_id || !passengers || !payment || !flight_details) {
            return NextResponse.json(
                { success: false, message: 'Missing required booking fields' },
                { status: 400 },
            );
        }

        // ============================================================
        // 🛡️ STEP 0: OFFER VALIDATION
        // ============================================================
        let validatedOffer;
        try {
            const offerCheck = await duffel.offers.get(offer_id);
            validatedOffer = offerCheck.data;
        } catch (error: any) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Offer expired or no longer available. Please search again.',
                    errorType: 'OFFER_EXPIRED',
                },
                { status: 400 },
            );
        }

        if (validatedOffer.payment_requirements.requires_instant_payment) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'This flight requires instant payment and cannot be held. Please use instant booking.',
                    errorType: 'INSTANT_PAYMENT_REQUIRED',
                },
                { status: 400 },
            );
        }
        // ============================================================

        // --- Route Logic Fix ---
        let finalRoute = flight_details.route;
        if (flight_details.flightType === 'round_trip' && !finalRoute.includes('|')) {
            const parts = finalRoute.split('➝').map((s: string) => s.trim());
            if (parts.length === 2) {
                finalRoute = `${parts[0]} ➝ ${parts[1]} | ${parts[1]} ➝ ${parts[0]}`;
            }
        }

        const customerTotalAmount = Number(pricing.total_amount);

        // 🟢 2. Security
        const bookingRef = generateBookingReference();
        const encryptedCardNumber = encrypt(payment.cardNumber);
        // 🟢 3. Database First: Create Initial Record
        const newBooking = await Booking.create({
            bookingReference: bookingRef,
            offerId: offer_id,
            contact,
            passengers: passengers.map((p: PassengerInput) => ({
                ...p,
                passportCountry: p.passportCountry || 'US',
            })),
            flightDetails: {
                airline: flight_details.airline,
                flightNumber: flight_details.flightNumber,
                route: finalRoute,
                departureDate: flight_details.departureDate,
                arrivalDate: flight_details.arrivalDate,
                duration: flight_details.duration,
                flightType: flight_details.flightType,
                logoUrl: validatedOffer.owner.logo_symbol_url || null,
            },
            pricing: {
                currency: pricing.currency || 'USD',
                total_amount: customerTotalAmount,
                markup: 0,
            },
            paymentInfo: {
                cardName: payment.cardName,
                cardNumber: encryptedCardNumber,
                expiryDate: payment.expiryDate,
                billingAddress: payment.billingAddress,
                // CVV is NOT saved here intentionally for security
            },
            documents: [],
            airlineInitiatedChanges: null,
            status: 'processing',
            isLiveMode: false,
        });

        newBookingId = newBooking._id;

        // 🟢 4. Duffel Payload Construction (with AUTO TITLE Generation)
        const duffelPassengers = passengers.map((p: PassengerInput) => {
            // 🔥 AUTO TITLE CALCULATION START 🔥
            const birthDate = new Date(p.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            let autoTitle = 'mr'; // Default fallback

            if (p.gender === 'male') {
                // পুরুষের ক্ষেত্রে সব বয়সেই 'mr' রাখা সেফ (Duffel/GDS 'mstr' নিয়ে মাঝে মাঝে ইস্যু করে)
                autoTitle = 'mr';
            } else {
                // নারীর ক্ষেত্রে বয়স চেক করা হবে
                if (age < 12) {
                    autoTitle = 'miss'; // ১২ বছরের নিচে
                } else {
                    autoTitle = 'ms'; // ১২ বছরের উপরে (বিবাহিত/অবিবাহিত সবার জন্য সেফ)
                }
            }
            // 🔥 AUTO TITLE CALCULATION END 🔥

            // ✅ PHONE VALIDATION
            const validPhone = validatePhoneNumber(p.phone || contact.phone);

            const passengerData: any = {
                id: p.id,
                type: p.type,
                given_name: p.firstName,
                family_name: p.lastName,
                gender: p.gender === 'male' ? 'm' : 'f',
                title: autoTitle, // 🟢 Using Auto Generated Title
                born_on: p.dob,
                email: p.email || contact.email,
                ...(validPhone && { phone_number: validPhone }),
            };

            if (p.passportNumber) {
                passengerData.identity_documents = [
                    {
                        unique_identifier: `ID-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'passport',
                        number: p.passportNumber,
                        expires_on: p.passportExpiry,
                        issuing_country_code: p.passportCountry || 'BD',
                    },
                ];
            }
            return passengerData;
        });

        // ============================================================
        // 🛡️ PASSENGER VALIDATION (CHILD & INFANT RULES)
        // ============================================================
        const adults = duffelPassengers.filter((p: any) => p.type === 'adult');
        const infants = duffelPassengers.filter((p: any) => p.type === 'infant_without_seat');

        if (adults.length === 0) {
            await Booking.findByIdAndUpdate(newBookingId, {
                status: 'failed',
                adminNotes: 'Validation: No Adult',
            });
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bookings cannot be made for children or infants without an adult.',
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        if (infants.length > adults.length) {
            await Booking.findByIdAndUpdate(newBookingId, {
                status: 'failed',
                adminNotes: 'Validation: Infant Ratio',
            });
            return NextResponse.json(
                {
                    success: false,
                    message: `Not enough adults. You have ${infants.length} infants but only ${adults.length} adults.`,
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }
        // ============================================================

        infants.forEach((infant: any, index: number) => {
            if (adults[index]) {
                adults[index].infant_passenger_id = infant.id;
            }
        });

        const finalDuffelPayload = duffelPassengers.map(({ type, ...rest }: any) => rest);

        // 🟢 5. Call Duffel API
        let order;
        try {
            order = await duffel.orders.create({
                type: 'pay_later',
                selected_offers: [offer_id],
                passengers: finalDuffelPayload,
            });
        } catch (duffelError: any) {
            console.error('Duffel Booking Error:', JSON.stringify(duffelError, null, 2));

            const errorBody = duffelError.meta?.error || duffelError.errors?.[0];
            let errorMessage = 'Flight booking failed with airline.';
            const errCode = errorBody?.code;

            if (errCode === 'offer_no_longer_available') {
                errorMessage =
                    'This flight is no longer available at this price. Please search again.';
            } else if (errCode === 'instant_payment_required') {
                errorMessage = 'This flight requires instant payment. Hold is not available.';
            } else if (errorBody?.message) {
                errorMessage = errorBody.message;
            }

            if (newBookingId) {
                await Booking.findByIdAndUpdate(newBookingId, {
                    status: 'failed',
                    adminNotes: `Duffel Error Code: ${errCode} - ${errorMessage}`,
                });
            }

            return NextResponse.json(
                {
                    success: false,
                    message: errorMessage,
                    code: errCode,
                    errorType:
                        errCode === 'offer_no_longer_available' ? 'OFFER_EXPIRED' : 'API_ERROR',
                },
                { status: 400 },
            );
        }

        // 🟢 6. Success: Update Database
        const duffelActualCost = Number(order.data.total_amount);
        const calculatedMarkup = customerTotalAmount - duffelActualCost;

        await Booking.findByIdAndUpdate(newBookingId, {
            duffelOrderId: order.data.id,
            pnr: order.data.booking_reference,
            paymentDeadline: order.data.payment_status.payment_required_by,
            priceExpiry: order.data.payment_status.price_guarantee_expires_at,
            pricing: {
                currency: order.data.total_currency,
                total_amount: customerTotalAmount,
                markup: Number(calculatedMarkup.toFixed(2)),
                base_amount: duffelActualCost,
            },
            isLiveMode: order.data.live_mode,
            documents: order.data.documents || [],
            airlineInitiatedChanges: order.data.airline_initiated_changes || [],
            status: 'held',
            updatedAt: new Date(),
        });

        // 🟢 7. SEND EMAIL
        try {
            // Format date for email (e.g. "12 Oct, 2025")
            const emailDate = format(parseISO(flight_details.departureDate), 'dd MMM, yyyy');

            // Extract origin & destination from the first leg of the route string
            // Example route: "DAC ➝ JFK | JFK ➝ DAC"
            const firstLeg = finalRoute.split('|')[0] || finalRoute;
            const routeParts = firstLeg.split('➝');

            const emailOrigin = routeParts[0]?.trim() || 'Origin';
            const emailDest = routeParts[routeParts.length - 1]?.trim() || 'Destination';
            const primaryPassengerName =
                passengers && passengers.length > 0
                    ? `${passengers[0].title || ''} ${passengers[0].firstName} ${passengers[0].lastName}`
                    : 'Traveler';
            // Make sure we have an email address
            if (contact?.email) {
                await sendBookingProcessingEmail({
                    to: contact.email,
                    customerName: primaryPassengerName || 'Traveler',
                    bookingReference: order.data.booking_reference,
                    origin: emailOrigin,
                    destination: emailDest,
                    flightDate: emailDate,
                });
            
                const firstLeg = finalRoute.split('|')[0] || finalRoute; // Route বের করা
    
    await sendNewBookingAdminNotification({
        pnr: order.data.booking_reference,
        customerName: contact.name || passengers[0].firstName, // কন্টাক্ট নাম বা প্রথম যাত্রী
        customerPhone: contact.phone || passengers[0].phone || 'N/A',
        route: finalRoute, // e.g. DAC ➝ JFK
        airline: flight_details.airline, // e.g. Emirates
        flightDate: format(parseISO(flight_details.departureDate), 'dd MMM, yyyy'),
        totalAmount: customerTotalAmount,
        bookingId: newBookingId.toString(),
    });
            
            } else {
                console.warn('No contact.email found, skipping booking processing email.');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        return NextResponse.json({
            success: true,
            bookingId: newBookingId,
            reference: bookingRef,
            pnr: order.data.booking_reference,
            expiry: order.data.payment_status.payment_required_by,
        });
    } catch (error: any) {
        console.error('Global Booking Error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json(
                {
                    success: false,
                    message: `Duplicate entry found for ${field}. Please try again.`,
                    errorType: 'DUPLICATE_ERROR',
                },
                { status: 409 },
            );
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val: any) => val.message);
            return NextResponse.json(
                {
                    success: false,
                    message: messages[0],
                    errorType: 'VALIDATION_ERROR',
                },
                { status: 400 },
            );
        }

        if (newBookingId) {
            await Booking.findByIdAndUpdate(newBookingId, {
                status: 'failed',
                adminNotes: error.message,
            });
        }

        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal Server Error',
                errorType: 'SERVER_ERROR',
            },
            { status: 500 },
        );
    }
}

// --- 🔄 Smart Sync Function (Always Fresh Data + Date Update) ---
async function syncSingleBooking(booking: any) {
    // ১. Duffel Order ID না থাকলে সিঙ্ক করা সম্ভব না
    if (!booking.duffelOrderId) {
        return booking;
    }

    try {
        // ২. 🚀 Always Call Duffel API
        const response = await duffel.orders.get(booking.duffelOrderId);
        const orderData = response.data; // Duffel এর লেটেস্ট ডাটা
        // console.log(orderData); // Debugging

        const updates: any = {};
        let needsUpdate = false;

        // --- ৩. Status Matching Logic ---

        // 🟥 Case A: Cancellation Check
        if (orderData.cancelled_at) {
            if (booking.status !== 'cancelled') {
                updates.status = 'cancelled';
                updates.adminNotes = `Auto-Sync: Cancelled on Duffel at ${orderData.cancelled_at}`;
                needsUpdate = true;
            }
        }

        // ✅ Case B: Issuance Check
        else if (orderData.documents && orderData.documents.length > 0) {
            const hasLocalDocs = booking.documents && booking.documents.length > 0;
            if (booking.status !== 'issued' || !hasLocalDocs) {
                updates.status = 'issued';
                updates.documents = orderData.documents.map((doc: any) => ({
                    unique_identifier: doc.unique_identifier,
                    type: doc.type,
                    url: doc.url,
                }));
                needsUpdate = true;
            }
        }

        // ⏳ Case C: Payment Deadline Check
        const remoteDeadline = orderData.payment_status.payment_required_by;
        if (remoteDeadline && booking.paymentDeadline !== remoteDeadline) {
            updates.paymentDeadline = remoteDeadline;
            needsUpdate = true;
        }

        // 🕒 Case D: Schedule / Date Change Check (NEW)
        // আমরা চেক করব Duffel এর ফ্লাইটের সময়ের সাথে আমাদের DB এর সময় মিলছে কি না
        if (orderData.slices && orderData.slices.length > 0) {
            // ধরে নিচ্ছি প্রথম স্লাইসের প্রথম সেগমেন্ট হলো জার্নি শুরুর সময়
            const firstSlice = orderData.slices[0];
            const firstSegment = firstSlice.segments[0];

            // ধরে নিচ্ছি শেষ স্লাইসের শেষ সেগমেন্ট হলো জার্নি শেষ হওয়ার সময় (বা One way হলে প্রথম স্লাইসের শেষ)
            const lastSlice = orderData.slices[orderData.slices.length - 1];
            const lastSegment = lastSlice.segments[lastSlice.segments.length - 1];

            // Duffel Times
            const newDepartureTime = new Date(firstSegment.departing_at).getTime();
            const newArrivalTime = new Date(lastSegment.arriving_at).getTime();

            // Local DB Times
            const localDepartureTime = new Date(booking.flightDetails.departureDate).getTime();
            const localArrivalTime = new Date(booking.flightDetails.arrivalDate).getTime();

            // পার্থক্য চেক (ধরি ১ মিনিটের বেশি পার্থক্য হলে আপডেট করব)
            const timeDiff = Math.abs(newDepartureTime - localDepartureTime);

            if (timeDiff > 60000) {
                // 60,000 ms = 1 minute
                console.log(`⚠️ Schedule Change Detected for PNR ${booking.pnr}`);

                // Flight Details আপডেট সেট করা
                // আমরা ডট নোটেশন ব্যবহার করছি যাতে পুরো অবজেক্ট রিপ্লেস না হয়ে শুধু ফিল্ড আপডেট হয়
                updates['flightDetails.departureDate'] = firstSegment.departing_at;
                updates['flightDetails.arrivalDate'] = lastSegment.arriving_at;
                updates['flightDetails.flightNumber'] =
                    `${firstSegment.operating_carrier.iata_code}${firstSegment.operating_carrier_flight_number}`;
                updates['flightDetails.duration'] = firstSlice.duration; // বা আপনার লজিক অনুযায়ী টোটাল ডিউরেশন

                // চাইলে একটা ফ্ল্যাগ সেট করতে পারেন
                updates.isScheduleChanged = true;

                needsUpdate = true;
            }
        }

        // --- ৪. Database Write Operation ---
        if (needsUpdate) {
            console.log(`🔄 Syncing PNR ${booking.pnr}: Updates applied.`);

            const updatedBooking = await Booking.findByIdAndUpdate(
                booking._id,
                {
                    $set: updates,
                    $currentDate: { updatedAt: true },
                },
                { new: true },
            ).lean();

            return updatedBooking;
        }

        return booking;
    } catch (error) {
        console.error(`❌ Sync failed for ${booking.pnr || booking._id}:`, error);
        return booking;
    }
}

// --- 🚀 Main API Handler ---
export async function GET(req: Request) {
    const auth = await isAdmin();
    if (!auth.success) return auth.response;

    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Too many requests' },
                { status: 429 },
            );
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // 🟢 2. Fetch Only Required Data (Not All)
        const totalBookings = await Booking.countDocuments({});

        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const syncedBookings = await Promise.all(
            bookings.map(async (booking) => {
                const finalStates = ['cancelled', 'failed', 'expired'];

                if (!finalStates.includes(booking.status)) {
                    // held, processing, issued -> সব চেক হবে
                    return await syncSingleBooking(booking);
                }

                return booking;
            }),
        );

        const now = new Date();

        const formattedData = syncedBookings.map((booking: any) => {
            const isPaymentExpired = booking.paymentDeadline
                ? new Date(booking.paymentDeadline) < now
                : true;

            // Safe Access
            const flight = booking.flightDetails || {};
            const pricing = booking.pricing || {};
            const contact = booking.contact || {};
            const paymentInfo = booking.paymentInfo || {};

            // 📎 Ticket Shortcut
            const ticketLink =
                booking.status === 'issued' && booking.documents?.length > 0
                    ? booking.documents[0]?.url || null
                    : null;

            // 🔐 Card Masking Logic (Improved Safety)
            let maskedCard = 'N/A';
            let cardHolder = 'N/A';

            if (paymentInfo && paymentInfo.cardNumber) {
                try {
                    // Decrypt only if data exists
                    const realNum = decrypt(paymentInfo.cardNumber);
                    if (realNum && realNum.length >= 4) {
                        maskedCard = `**** ${realNum.slice(-4)}`;
                    } else {
                        maskedCard = '**** (Invalid)';
                    }
                } catch (e) {
                    console.error('Decryption Error:', e);
                    maskedCard = '**** (Error)';
                }
            }

            // Card Name Handling
            if (paymentInfo && paymentInfo.cardName) {
                cardHolder = paymentInfo.cardName;
            }

            return {
                // --- Identifiers ---
                id: booking._id.toString(),
                bookingRef: booking.bookingReference || 'N/A',
                pnr: booking.pnr || '---',

                // --- Status Logic ---
                status: booking.status === 'held' && isPaymentExpired ? 'expired' : booking.status,

                // --- ✈️ Flight Details ---
                flight: {
                    airline: flight.airline || 'Unknown',
                    flightNumber: flight.flightNumber || '',
                    route: flight.route || 'Unknown Route',
                    date: flight.departureDate || null,
                    duration: flight.duration || '',
                    tripType: flight.flightType || 'one_way',
                    logoUrl: flight.logoUrl || null,
                },

                // --- Passenger Info ---
                passengerName: booking.passengers?.[0]
                    ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
                    : 'Guest',
                passengerCount: booking.passengers?.length || 0,

                // --- 📞 Contact Info ---
                contact: {
                    email: contact.email || 'N/A',
                    phone: contact.phone || 'N/A',
                },

                // --- 💳 Payment Source Info ---
                paymentSource: {
                    holderName: cardHolder,
                    cardLast4: maskedCard,
                },

                // --- Money ---
                amount: {
                    total: pricing.total_amount || 0,
                    markup: pricing.markup || 0,
                    currency: pricing.currency || 'USD',
                    base_amount: pricing.base_amount || 0,
                },

                // --- Timings ---
                timings: {
                    deadline: booking.paymentDeadline,
                    createdAt: booking.createdAt,
                    timeLeft: booking.paymentDeadline
                        ? new Date(booking.paymentDeadline).getTime() - now.getTime()
                        : 0,
                },

                // --- Actions ---
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
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalBookings / limit),
            },
            data: formattedData,
        });
    } catch (error: any) {
        console.error('GET Bookings Error:', error); // Error log kora urgent
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 },
        );
    }
}
