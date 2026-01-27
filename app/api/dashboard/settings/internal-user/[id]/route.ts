export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { isAdmin } from '@/app/api/lib/auth'; // আপনার পাথ অনুযায়ী

// ✅ Type Definition for Next.js 15 Params
type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * ✅ DELETE API
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  // 🛡️ Admin Verification
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    await dbConnect();

    // ✅ FIX: Await params here
    const { id } = await params; 

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is missing." },
        { status: 400 }
      );
    }

    // নিজের একাউন্ট ডিলিট চেক
    if (id === auth.user.id) {
      return NextResponse.json(
        { success: false, message: "Action Denied: You cannot delete your own account." },
        { status: 400 }
      );
    }

    const deletedUser = await Admin.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: "User not found or already removed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member has been successfully removed."
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ✅ UPDATE API (PUT)
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    await dbConnect();
    
    // ✅ FIX: Await params here
    const { id } = await params;
    
    const body = await req.json();
    const { name, role } = body;

    const updatedUser = await Admin.findByIdAndUpdate(
      id,
      { $set: { name, role } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Staff details updated successfully.",
      user: updatedUser
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * ✅ BLOCK API (PATCH)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    await dbConnect();

    // ✅ FIX: Await params here
    const { id } = await params;

    if (id === auth.user.id) {
      return NextResponse.json({ success: false, message: "You cannot block your own account." }, { status: 400 });
    }
    //alkready blocked check
    const userToBlock = await Admin.findById(id);
    if (userToBlock && userToBlock.isVerified === false) {
      return NextResponse.json({ success: false, message: "User is already blocked." }, { status: 400 });
    }

    const blockedUser = await Admin.findByIdAndUpdate(
      id,
      { $set: { isVerified: false } },
      { new: true }
    );

    if (!blockedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User has been blocked successfully."
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}