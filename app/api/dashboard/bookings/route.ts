export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import dbConnect from "@/connection/db";
import Offer from "@/models/Offer.model";
import { isAdmin } from "../../lib/auth";
import { isRateLimited, syncSingleBooking } from "../../duffel/booking/route";
import Booking from "@/models/Booking.model";
import { decrypt } from "../../duffel/booking/utils";


// ================================================================
// GET /api/duffel/booking
//
// Admin-only endpoint. Returns paginated bookings with:
// - Real-time Duffel sync for active bookings
// - Decrypted (masked) card display
// - Computed effective status
// - Flight, passenger, pricing summaries
// ================================================================

export async function GET(req: Request) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const ip =
      req.headers.get('x-forwarded-for') || 'unknown-ip';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests',
        },
        { status: 429 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(
      searchParams.get('page') || '1',
    );
    const limit = parseInt(
      searchParams.get('limit') || '20',
    );
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments(
      {},
    );

    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Sync active bookings with Duffel (skip final states)
    const syncedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const finalStates = [
          'cancelled',
          'failed',
          'expired',
        ];

        if (!finalStates.includes(booking.status)) {
          return await syncSingleBooking(booking);
        }

        return booking;
      }),
    );

    const now = new Date();

    // Format response data
    const formattedData = syncedBookings.map(
      (booking: any) => {
        // Payment deadline check — false if no deadline set
        const isPaymentExpired =
          booking.paymentDeadline
            ? new Date(booking.paymentDeadline) < now
            : false;

        const flight = booking.flightDetails || {};
        const pricing = booking.pricing || {};
        const contact = booking.contact || {};
        const paymentInfo = booking.paymentInfo || {};

        // Ticket URL shortcut (only for issued bookings)
        const ticketLink =
          booking.status === 'issued' &&
          booking.documents?.length > 0
            ? booking.documents[0]?.url || null
            : null;

        // Card decryption and masking
        let maskedCard = 'N/A';
        let cardHolder = 'N/A';

        if (paymentInfo?.cardNumber) {
          try {
            const realNum = decrypt(
              paymentInfo.cardNumber,
            );
            if (realNum && realNum.length >= 4) {
              maskedCard = realNum;
            } else {
              maskedCard = '**** (Invalid)';
            }
          } catch (e) {
            console.error('Decryption Error:', e);
            maskedCard = '**** (Error)';
          }
        }

        if (paymentInfo?.cardName) {
          cardHolder = paymentInfo.cardName;
        }

        // Effective status: held + expired deadline = expired
        const effectiveStatus =
          booking.status === 'held' && isPaymentExpired
            ? 'expired'
            : booking.status;

        return {
          // Identifiers
          id: booking._id.toString(),
          bookingRef:
            booking.bookingReference || 'N/A',
          pnr: booking.pnr || '---',

          // Status
          status: effectiveStatus,

          // Flight Details
          flight: {
            airline: flight.airline || 'Unknown',
            flightNumber: flight.flightNumber || '',
            route: flight.route || 'Unknown Route',
            date: flight.departureDate || null,
            duration: flight.duration || '',
            tripType:
              flight.flightType || 'one_way',
            logoUrl: flight.logoUrl || null,
          },

          // Passenger Summary
          passengerName: booking.passengers?.[0]
            ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
            : 'Guest',
          passengerCount:
            booking.passengers?.length || 0,

          // Contact
          contact: {
            email: contact.email || 'N/A',
            phone: contact.phone || 'N/A',
          },

          // Payment Source
          paymentSource: {
            holderName: cardHolder,
            cardLast4: maskedCard,
          },

          // Pricing
          amount: {
            total: pricing.total_amount || 0,
            markup: pricing.markup || 0,
            currency: pricing.currency || 'USD',
            base_amount: pricing.base_amount || 0,
          },

          // Timing
          timings: {
            deadline: booking.paymentDeadline,
            createdAt: booking.createdAt,
            timeLeft: booking.paymentDeadline
              ? new Date(
                  booking.paymentDeadline,
                ).getTime() - now.getTime()
              : 0,
          },

          // Action Data
          actionData: {
            ticketUrl: ticketLink,
          },
          updatedAt: booking.updatedAt,
        };
      },
    );

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
      {
        success: false,
        message: 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}