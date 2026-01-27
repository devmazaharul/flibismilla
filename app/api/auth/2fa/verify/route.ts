import { NextResponse } from 'next/server';
import { verify } from 'otplib';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { JWT_SECRET, COOKIE_NAME, TOKEN_EXPIRATION, SESSION_EXPIRATION, MAX_DEVICE } from '@/app/api/controller/constant';
import { getDeviceInfo } from '../../login/route';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { userId, code } = await req.json();

    const admin = await Admin.findById(userId);
    if (!admin || !admin.twoFactorSecret) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }

    const isValid = await verify({ 
      secret: admin.twoFactorSecret ,
      token: code, 
    });

    if (!isValid.valid) {
      return NextResponse.json({ success: false, message: "Invalid or expired code." }, { status: 400 });
    }

      const deviceInfo = await getDeviceInfo(req);
    
      await Admin.findByIdAndUpdate(admin._id, { 
            $set: { 
                failedLoginAttempts: 0, 
                lockUntil: null,
                lastLogin: new Date()
            },
            $push: {
                loginHistory: {
                    $each: [deviceInfo], // Add new device info
                    $position: 0,        // Add to the top
                    $slice: MAX_DEVICE            // Keep only latest 5 entries
                }
            }
        });
    


    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ id: admin._id.toString(), email: admin.email, role: admin.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(secret);
          const cookieStore = await cookies();
          cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: SESSION_EXPIRATION, 
            path: '/', 
          });


    return NextResponse.json({ success: true, message: "Login successful!" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}