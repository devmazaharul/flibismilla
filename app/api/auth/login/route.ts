// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import ActivityLog from '@/models/ActivityLog';
import { createToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Admin from '@/models/Admin.model';

function extractDeviceInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'Unknown';

  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/([\d.]+)/);
    browser = `Safari ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match?.[1] || ''}`.trim();
  }

  let device = 'Unknown Device';
  if (userAgent.includes('iPhone')) device = 'iPhone';
  else if (userAgent.includes('iPad')) device = 'iPad';
  else if (userAgent.includes('Android')) {
    device = userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
  } else if (userAgent.includes('Macintosh')) device = 'Mac';
  else if (userAgent.includes('Windows')) device = 'Windows PC';
  else if (userAgent.includes('Linux')) device = 'Linux PC';

  return { browser, device, ip, userAgent };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    // 1️⃣ Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 2️⃣ Find admin
    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3️⃣ Status check
    if (admin.status === 'blocked') {
      return NextResponse.json(
        {
          success: false,
          message: `Account blocked: ${admin.blockReason || 'Contact administrator'}`,
        },
        { status: 403 }
      );
    }

    if (admin.status === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Account suspended. Contact administrator' },
        { status: 403 }
      );
    }

    // 4️⃣ Lock check
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const remainingMin = Math.ceil(
        (admin.lockUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          success: false,
          message: `Account locked. Try again in ${remainingMin} minutes`,
        },
        { status: 423 }
      );
    }

    // 5️⃣ Password verify
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      const failedAttempts = admin.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = {
        failedLoginAttempts: failedAttempts,
      };

      if (failedAttempts >= 5) {
        updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.failedLoginAttempts = 0;
      }

      await Admin.findByIdAndUpdate(admin._id, { $set: updateData });

      // Activity log
      await ActivityLog.create({
        admin: admin._id,
        action: 'failed_login',
        target: admin._id,
        details: `Failed login attempt (${failedAttempts}/5)`,
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        device: request.headers.get('user-agent') || '',
      });

      return NextResponse.json(
        {
          success: false,
          message: `Invalid password. ${5 - failedAttempts} attempts remaining`,
        },
        { status: 401 }
      );
    }

    // 6️⃣ Generate session
    const sessionId: string = uuidv4();
    const { browser, device, ip } = extractDeviceInfo(request);
    const location = 'Unknown';

    // 7️⃣ Create JWT
    const token = await createToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      sessionId,
    });

    // 8️⃣ Update admin: session + login info
    await Admin.findByIdAndUpdate(admin._id, {
      $set: {
        isOnline: true,
        lastLogin: new Date(),
        lastActive: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
      $push: {
        activeSessions: {
          sessionId,
          device,
          browser,
          ip,
          location,
          loginTime: new Date(),
          lastActive: new Date(),
        },
        loginHistory: {
          $each: [
            {
              device,
              browser,
              ip,
              location,
              time: new Date(),
              status: 'current',
            },
          ],
          $slice: -50,
        },
      },
    });

    // 9️⃣ Activity log
    await ActivityLog.create({
      admin: admin._id,
      action: 'login',
      target: admin._id,
      details: `Login from ${device} - ${browser} - ${ip}`,
      ip,
      device: request.headers.get('user-agent') || '',
    });

    // 🔟 Build response WITH cookie
    const adminData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminId: admin.adminId,
      avatar: admin.avatar,
      status: admin.status,
      permissions: admin.permissions,
    };

    // ✅ Response banao
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          admin: adminData,
          sessionId,
          // ✅ Frontend ke bolo kothay redirect korbe
          redirectUrl: '/admin',
        },
      },
      { status: 200 }
    );

    // ✅ Cookie set koro RESPONSE er upor
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',       // ← 'lax' use koro, 'strict' na
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}