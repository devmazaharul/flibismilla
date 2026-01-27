export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { isAuthenticated } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  const auth = await isAuthenticated();
  if (!auth.success) return auth.response;

  try {
    await dbConnect();

    if (auth.user.role === 'viewer') {
      return NextResponse.json(
        { success: false, message: "Access denied. Viewers cannot view team settings." }, 
        { status: 403 }
      );
    }

    const users = await Admin.find({
      role: { $in: ['editor', 'viewer'] }
    })
    .select('name email role lastLogin createdAt isTwoFactorEnabled failedLoginAttempts isVerified') 
    .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      users: users,
      count: users.length 
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}