import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';

type AuthResult = 
  | { success: false; response: NextResponse; user: null }
  | { success: true; response: null; user: any };

export async function isAuthenticated(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return {
        success: false,
        user: null,
        response: NextResponse.json({ success: false, message: "Unauthorized: Please login first" }, { status: 401 })
      };
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    await dbConnect();
    const user = await Admin.findById(payload.id).select('name email role isVerified');

    if (!user || user.isVerified === false) {
      return {
        success: false,
        user: null,
        response: NextResponse.json({ success: false, message: "Account disabled or not found" }, { status: 403 })
      };
    }

    const validRoles = ['admin', 'editor'];
    
    if (!user.role || !validRoles.includes(user.role)) {
      return {
        success: false,
        user: null,
        response: NextResponse.json({ success: false, message: "Forbidden: Access denied" }, { status: 403 })
      };
    }

    return { success: true, response: null, user: user };

  } catch (error) {
    return {
      success: false,
      user: null,
      response: NextResponse.json({ success: false, message: "Session expired. Please login again." }, { status: 401 })
    };
  }
}

type AdminAuthResult = 
  | { success: false; response: NextResponse }
  | { success: true; user: any };

export async function isAdmin(): Promise<AdminAuthResult> {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return { success: false, response: auth.response };
  }

  if (auth.user.role !== 'admin') {
    return {
      success: false,
      response: NextResponse.json({ 
        success: false, 
        message: "Forbidden: Only Admin has permission to perform this action." 
      }, { status: 403 })
    };
  }

  return { success: true, user: auth.user };
}