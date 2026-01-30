import { sendBookingEmail } from "@/app/emails/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      packageTitle,
      packagePrice,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      returnDate,
      guests,
      notes,
    } = body;


    if (
      !packageTitle ||
      !packagePrice ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !travelDate ||
      !guests
    ) {
      return NextResponse.json(
        { success: false, message: "Required booking details are missing." },
        { status: 400 }
      );
    }

    const emailResult = await sendBookingEmail({
      packageTitle,
      packagePrice,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      returnDate,
      guests,
      notes: notes || "",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send booking request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking request received successfully!",
      bookingId: emailResult.id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}