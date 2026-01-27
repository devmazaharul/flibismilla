import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized: Please login first" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    await dbConnect();
    
    const admin = await Admin.findById(payload.id)
      .select('-password -twoFactorSecret')
      .lean();

    if (!admin) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

  
    if (admin.isVerified === false) {
      return NextResponse.json({ 
        success: false, 
        message: "Your account is disabled. Access denied." 
      }, { status: 403 });
    }

        const validRoles = ['admin', 'editor','viewer'];
    if (!admin.role || !validRoles.includes(admin.role)) {
      return NextResponse.json({ 
        success: false, 
        message: "Forbidden: You don't have permission to access this resource." 
      }, { status: 403 });
    }


    return NextResponse.json({
      success: true,
      user: admin,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Session expired or invalid token" }, { status: 401 });
  }
}