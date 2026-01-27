export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Destination from '@/models/Destination.model';
import { isAdmin, isAuthenticated } from '@/app/api/lib/auth';

const destinationSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(1),
    country: z.string().min(2),
    description: z.string().min(10),
    currency: z.string().min(1),
    language: z.string().min(1),
    bestTime: z.string().min(1),
    rating: z.number(),
    reviews: z.number(),
    image: z.string().url(),
    gallery: z.array(z.string()).min(1),
    attractions: z.array(z.string()).min(1),
    isActive: z.boolean(),
});

// --- GET Request ---
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        await dbConnect();

        const destination = await Destination.findById(params.id);

        if (!destination) {
            return NextResponse.json(
                { success: false, message: 'Destination not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: destination });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Server Error', error: error.message },
            { status: 500 },
        );
    }
}

// --- PUT Request ---
export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }, // ✅ Type updated for Promise
) {
       const auth = await isAuthenticated();
        if (!auth.success) return auth.response;
    
    try {
        const params = await props.params; // ✅ Await params here
        await dbConnect();

        const body = await req.json();

        const validation = destinationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: 'Validation Error', errors: validation.error.format() },
                { status: 400 },
            );
        }

        const updatedDestination = await Destination.findByIdAndUpdate(params.id, validation.data, {
            new: true,
        });

        if (!updatedDestination) {
            return NextResponse.json(
                { success: false, message: 'Destination not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Updated successfully',
            data: updatedDestination,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Update Failed', error: error.message },
            { status: 500 },
        );
    }
}

// ✅ API 1: Delete Destination
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
       const auth = await isAdmin();
        if (!auth.success) return auth.response;
    
    try {
        const params = await props.params;
        await dbConnect();

        const deletedDestination = await Destination.findByIdAndDelete(params.id);

        if (!deletedDestination) {
            return NextResponse.json(
                { success: false, message: 'Destination not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Destination deleted successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Delete Failed', error: error.message },
            { status: 500 },
        );
    }
}

// ✅ API 2: Update Destination Status (isActive)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
       const auth = await isAuthenticated();
        if (!auth.success) return auth.response;
    
    try {
        const params = await props.params;
        await dbConnect();

        const body = await req.json();

        // শুধু isActive ফিল্ডটি আপডেট হবে, বাকি সব আগের মতোই থাকবে
        const updatedDestination = await Destination.findByIdAndUpdate(
            params.id,
            { isActive: body.isActive },
            { new: true }, // আপডেটেড ডাটা রিটার্ন করবে
        );

        if (!updatedDestination) {
            return NextResponse.json(
                { success: false, message: 'Destination not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: body.isActive ? 'Destination Published' : 'Destination Hidden',
            data: updatedDestination,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Status Update Failed', error: error.message },
            { status: 500 },
        );
    }
}
