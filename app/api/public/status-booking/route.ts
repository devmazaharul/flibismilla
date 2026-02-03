import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

// 1. Duffel Init
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

export async function POST(req: Request) {
  try {
    // 🟢 1. Input Parsing & Validation
    const body = await req.json();
    const { pnr, email } = body;

    // Validation: Check if fields exist
    if (!pnr || !email) {
      return NextResponse.json(
        { success: false, message: "PNR and Email are required." },
        { status: 400 }
      );
    }

    // Validation: PNR Length (Standard 6 chars)
    if (pnr.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid PNR format. Must be 6 characters." },
        { status: 400 }
      );
    }

    // Validation: Email Format (Basic Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address format." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 🟢 2. Database Search (Secure Match)
    // PNR এবং Email দুটোই মিলতে হবে। Case Insensitive করার জন্য Regex বা UpperCase ব্যবহার করা হয়েছে।
    const booking = await Booking.findOne({
      pnr: pnr.toUpperCase(),
      'contact.email': { $regex: new RegExp(`^${email}$`, 'i') } // Case insensitive email check
    }).lean();

    if (!booking) {
      // Security Tip: জেনেরিক এরর মেসেজ দিন যাতে কেউ বুঝতে না পারে কোনটা ভুল ছিল
      return NextResponse.json(
        { success: false, message: "No booking found with this PNR and Email combination." },
        { status: 404 }
      );
    }

    // 🟢 3. Fetch Fresh Data from Duffel (Real-time Status)
    // ডাটাবেস আপডেট না থাকলেও যেন ইউজার রিয়েল টাইম স্ট্যাটাস দেখে
    let airlineData;
    try {
      const duffelRes = await duffel.orders.get(booking.duffelOrderId);
      airlineData = duffelRes.data;
    } catch (err) {
      console.error("Duffel Sync Error:", err);
      // Duffel ফেইল করলে ডাটাবেস থেকে দেখাবে, তবে একটি ফ্ল্যাগ থাকবে
      // এখানে আমরা সিম্পল রাখার জন্য ডাটাবেস ডাটা ব্যবহার করতে পারি অথবা এরর দিতে পারি
    }

    if (!airlineData) {
       return NextResponse.json({ success: false, message: "Unable to retrieve flight details." }, { status: 502 });
    }

    // 🟢 4. Data Sanitization (Very Important) 🛡️
    // আমরা ফ্রন্টএন্ডে সব ডাটা পাঠাব না। সেনসিটিভ ডাটা রিমুভ করে "Safe Public Object" বানাব।

    // A. Flight Segments (Only essential info)
    const safeSegments = airlineData.slices.map((slice: any) => {
        return slice.segments.map((seg: any) => ({
            airline: seg.operating_carrier.name,
            airlineLogo: seg.operating_carrier.logo_symbol_url, // Duffel logo url if available
            flightNumber: `${seg.operating_carrier.iata_code} ${seg.operating_carrier_flight_number}`,
            aircraft: seg.aircraft?.name || 'Aircraft',
            origin: seg.origin.iata_code,
            originCity: seg.origin.city_name,
            destination: seg.destination.iata_code,
            destinationCity: seg.destination.city_name,
            departingAt: seg.departing_at,
            arrivingAt: seg.arriving_at,
            duration: seg.duration,
           baggage: seg.passengers?.[0]?.baggages?.[0]
                        ? `${seg.passengers[0].baggages[0].quantity} PC (${seg.passengers[0].baggages[0].quantity * 23} KG)`
                        : 'Check Airline Rule',
        }));
    }).flat();

    // B. Passengers (Hide IDs, show Names)
    const safePassengers = airlineData.passengers.map((p: any) => ({
        fullName: `${p.given_name} ${p.family_name}`,
        type: p.type, // adult, child etc.
        ticketNumber: airlineData.documents?.find((d:any) => d.passenger_ids.includes(p.id))?.unique_identifier || null
    }));

    // C. Documents (Only Ticket PDF)
    const safeDocuments = airlineData.documents?.map((doc: any) => ({
        type: doc.type,
        url: doc?.url
    })) || [];

    // 🟢 5. Final Safe Response
    const publicResponse = {
        pnr: booking.pnr,
        bookingRef: booking.bookingReference,
        status: booking.status, // issued, held, cancelled
        bookedAt: booking.createdAt,
        
        // Flight Info
        segments: safeSegments,
        
        // People
        passengers: safePassengers,
        
        // Files (Ticket)
        documents: safeDocuments,

        // Policies (Simple View)
        isRefundable: airlineData.conditions?.refund_before_departure?.allowed || false,
        isChangeable: airlineData.conditions?.change_before_departure?.allowed || false,
        
    };

    return NextResponse.json({
        success: true,
        data: publicResponse
    });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}