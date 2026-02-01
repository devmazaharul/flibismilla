export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import dbConnect from "@/connection/db";
import Offer from "@/models/Offer.model";


export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}

