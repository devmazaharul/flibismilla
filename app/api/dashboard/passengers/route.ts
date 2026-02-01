import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

export async function GET() {
  try {
    await dbConnect();

    // শুধুমাত্র সফল বা হোল্ড বুকিংগুলো থেকে প্যাসেঞ্জার নিন (failed বাদ দিতে পারেন চাইলে)
    const bookings = await Booking.find({}, 'passengers contact createdAt bookingReference')
      .sort({ createdAt: -1 })
      .lean();

    const passengerList: any[] = [];
    const seenPassports = new Set(); // ডুপ্লিকেট এড়ানোর জন্য

    bookings.forEach((booking: any) => {
      if (booking.passengers && Array.isArray(booking.passengers)) {
        booking.passengers.forEach((p: any) => {
          // ইউনিক আইডেন্টিফায়ার তৈরি (পাসপোর্ট নম্বর অথবা নাম+জন্মতারিখ)
          const uniqueKey = p.passportNumber 
            ? p.passportNumber 
            : `${p.firstName}-${p.lastName}-${p.dob}`;

          if (!seenPassports.has(uniqueKey)) {
            seenPassports.add(uniqueKey);
            passengerList.push({
              id: p._id || Math.random().toString(36).substr(2, 9),
              title: p.title,
              firstName: p.firstName,
              lastName: p.lastName,
              type: p.type, // adult, child, infant
              gender: p.gender,
              dob: p.dob,
              passportNumber: p.passportNumber || 'N/A',
              passportExpiry: p.passportExpiry || 'N/A',
              passportCountry: p.passportCountry || 'N/A',
              // বুকিং থেকে কন্টাক্ট ইনফো নেওয়া হচ্ছে
              email: p.email || booking.contact?.email || 'N/A',
              phone: p.phone || booking.contact?.phone || 'N/A',
              lastBookingRef: booking.bookingReference,
              lastTravelDate: booking.createdAt,
            });
          }
        });
      }
    });

    return NextResponse.json({ success: true, data: passengerList });
  } catch (error) {
    console.error("Passenger Fetch Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}