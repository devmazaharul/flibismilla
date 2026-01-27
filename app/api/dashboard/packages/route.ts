export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Package from '@/models/Package.model';

import { generatedSlug } from '@/app/admin/(content)/utils/main';
import { isAuthenticated } from '../../lib/auth';
import { packageApiSchema } from './validation';


export async function POST(req: Request) {
    // 2. Authentication Check
    const auth = await isAuthenticated();
    if (!auth.success) return auth.response;

    try {
        await dbConnect();
        const body = await req.json();

        // 3. Validation
        const validation = packageApiSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Validation Failed',
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const data = validation.data;

        // Slug Generation
        const slug = generatedSlug(data.title);

        // 4. Save to Database
        const newPackage = await Package.create({
            title: data.title,
            slug: slug,
            price: data.price,
            image: data.imageUrl, 
            category: data.category,
            location: data.location,
            description: data.description,
            included: data.included,
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Package created successfully',
                data: newPackage,
            },
            { status: 201 },
        );
    } catch (error: any) {
 
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'A package with this title already exists.' },
                { status: 409 },
            );
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ==========================================
// GET Method: Fetch All Packages

// ==========================================

export async function GET() {
  try {
    await dbConnect();
    const packages = await Package.find({})
      .sort({ createdAt: -1 })

      if(!packages){
        return NextResponse.json(
          { error: "No packages found" }, 
          { status: 404 }
        );
      }
      

    return NextResponse.json({
      success: true,
      data: packages
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}