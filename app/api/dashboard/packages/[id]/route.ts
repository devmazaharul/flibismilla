export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Package from '@/models/Package.model';
import { isAdmin, isAuthenticated } from '@/app/api/lib/auth';
import { generatedSlug } from '@/app/admin/(content)/utils/main';
import { packageSchema } from '@/app/admin/(content)/validation/package';

type Props = {
  params: Promise<{ id: string }>
}

// 1. DELETE Method
export async function DELETE(req: Request, { params }: Props) {
   const auth = await isAdmin();
        if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    await dbConnect();
    
    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Package deleted successfully" 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PATCH Method
export async function PATCH(req: Request, { params }: Props) {
  const auth = await isAuthenticated();
  if (!auth.success) return auth.response;

  try {
    // 🔥 FIX: await params
    const { id } = await params;
    
    await dbConnect();
    const body = await req.json();

    const updatedPackage = await Package.findByIdAndUpdate(
      id, 
      { $set: { isFeatured: body.isFeatured } }, 
      { new: true }
    );

    if (!updatedPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: body.isFeatured ? "Package Published" : "Package Hidden",
      data: updatedPackage 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// 3. GET Single Package (To pre-fill the Edit Form)
export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params; 
    await dbConnect();

    const singlePackage = await Package.findById(id);

    if (!singlePackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: singlePackage },{ status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 4. PUT Method (Update Package with Validation)
export async function PUT(req: Request, { params }: Props) {
  // A. Auth Check
  const auth = await isAuthenticated();
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const validation = packageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation Failed", 
          details: validation.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const data = validation.data;

    const newSlug = generatedSlug(data.title);

    // D. Update Database
    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      {
        title: data.title,
        slug: newSlug, // Title চেঞ্জ হলে Slug ও চেঞ্জ হবে
        price: data.price,
        image: data.imageUrl,
        category: data.category,
        location: data.location,
        description: data.description,
        included: data.included.map((item: any) => item.value), 
      },
      { new: true, runValidators: true } 
    );

    if (!updatedPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Package updated successfully", 
      data: updatedPackage 
    });

  } catch (error: any) {
    // Duplicate Title Error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A package with this title already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

