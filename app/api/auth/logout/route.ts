import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      try {
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.id;

        const currentIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        await Admin.updateOne(
          { _id: userId, "loginHistory.ip": currentIp },
          { $set: { "loginHistory.$.status": "completed" } }
        );
      }catch{

      }
    }

    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Logout failed" }, 
      { status: 500 }
    );
  }
}