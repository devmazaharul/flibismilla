export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/connection/db";
import Offer from "@/models/Offer.model";
import { isAuthenticated } from "../../lib/auth";

const offerSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(1),
  description: z.string().min(10),
  image: z.string().url(),
  whatsappMessage: z.string().min(1),
  isLarge: z.boolean(),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: offers.length, data: offers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
     const auth = await isAuthenticated();
      if (!auth.success) return auth.response;
  
  try {
    await dbConnect();
    const body = await req.json();

    const validation = offerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation Error", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { slug } = validation.data;
    const existingOffer = await Offer.findOne({ slug });
    if (existingOffer) {
      return NextResponse.json(
        { success: false, message: "An offer with this name already exists" },
        { status: 409 }
      );
    }

    const newOffer = await Offer.create(validation.data);

    return NextResponse.json({ 
      success: true, 
      message: "Offer created successfully", 
      data: newOffer 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}