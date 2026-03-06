// app/api/auth/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import ActivityLog from '@/models/ActivityLog';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { COOKIE_NAME } from '@/app/api/controller/constant';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Token থেকে user বের করো
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse('Invalid or expired token', 401);
    }

    await dbConnect();

    // 2️⃣ Admin/Staff profile fetch
    const profile = await Admin.findById(decoded.id)
      .select(
        '-password -resetPasswordToken -resetPasswordExpire -twoFactorSecret'
      )
      .populate('createdBy', 'name email adminId')
      .populate('blockedBy', 'name email')
      .lean();

    if (!profile) {
      return errorResponse('Profile not found', 404);
    }

    // 3️⃣ Blocked check
    if (profile.status === 'blocked') {
      return errorResponse(
        `Your account is blocked. Reason: ${profile.blockReason || 'Contact administrator'}`,
        403
      );
    }

    // 4️⃣ Current session info
    const currentSessionId = decoded.sessionId || null;
    const currentSession = profile.activeSessions?.find(
      (s) => s.sessionId === currentSessionId
    ) || null;

    // 5️⃣ Recent activity (নিজের last 10 activities)
    const recentActivity = await ActivityLog.find({
      $or: [
        { admin: decoded.id },
        { target: decoded.id }
      ],
    })
      .populate('admin', 'name email adminId')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 6️⃣ Session stats
    const totalActiveSessions = profile.activeSessions?.length || 0;
    const totalLoginHistory = profile.loginHistory?.length || 0;

    // 7️⃣ Response
    return successResponse('Profile fetched successfully', {
      profile: {
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        adminId: profile.adminId,
        role: profile.role,
        status: profile.status,
        isVerified: profile.isVerified,
        permissions: profile.permissions,
        isTwoFactorEnabled: profile.isTwoFactorEnabled,
        isOnline: profile.isOnline,
        lastLogin: profile.lastLogin,
        lastActive: profile.lastActive,
        createdBy: profile.createdBy,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      currentSession,
      recentActivity,
      stats: {
        totalActiveSessions,
        totalLoginHistory,
      },
    });
  } catch (error: unknown) {
    console.error('Profile Fetch Error:', error);
    return errorResponse('Internal server error', 500);
  }
}