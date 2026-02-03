import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // 👈 Type টি Promise হতে হবে
) {
  try {
    // 🟢 1. Params Await করা (Latest Next.js Rule)
    const { id } = await params;
    
    await dbConnect();

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    // Frontend এর জন্য ডাটা সাজানো
    const formattedData = {
      bookingReference: booking.bookingReference,
      pnr: booking.pnr,
      contact: booking.contact,
      status: booking.status,
      flight: {
        airline: booking.flightDetails.airline,
        route: booking.flightDetails.route,
        date: new Date(booking.flightDetails.departureDate).toLocaleDateString(),
      }
    };

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Booking Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}