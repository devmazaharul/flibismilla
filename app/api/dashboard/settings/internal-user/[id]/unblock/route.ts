export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { isAdmin } from '@/app/api/lib/auth';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * ✅ UNBLOCK USER API
 * Route: /api/dashboard/settings/internal-user/[id]/unblock
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    await dbConnect();
    const { id } = await params;

    //already unblocked check
    const userToUnblock = await Admin.findById(id);
    if (userToUnblock && userToUnblock.isVerified === true) {
      return NextResponse.json({ success: false, message: "User is already unblocked." }, { status: 400 });
    }

    const unblockedUser = await Admin.findByIdAndUpdate(
      id,
      { $set: { isVerified: true } }, 
      { new: true }
    );

    if (!unblockedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${unblockedUser.name} has been unblocked successfully.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}