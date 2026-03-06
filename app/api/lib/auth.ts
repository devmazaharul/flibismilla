import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/connection/db';
import Admin, { AdminDocument } from '@/models/Admin.model';
import { COOKIE_NAME, JWT_SECRET } from '@/app/api/controller/constant';
import { verifyToken } from '@/lib/auth';

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


// lib/auth.ts এ নতুন function add করো

// ✅ Verify session is still active (Force logout detection)
export async function getCurrentAdminWithSession(): Promise<{
  admin: AdminDocument | null;
  sessionId: string | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return {
        admin: null,
        sessionId: null,
        error: 'No token found',
      };
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return {
        admin: null,
        sessionId: null,
        error: 'Invalid token',
      };
    }

    await dbConnect();

    const admin = await Admin.findById(decoded.id).select(
      '+password'
    );

    if (!admin) {
      return {
        admin: null,
        sessionId: null,
        error: 'Admin not found',
      };
    }

    // ❌ Blocked check
    if (admin.status === 'blocked') {
      return {
        admin: null,
        sessionId: null,
        error: 'Account blocked',
      };
    }

    // ❌ Session validity check (Force Logout detection)
    const sessionId = decoded.sessionId || null;

    if (sessionId) {
      const sessionExists = admin.activeSessions?.some(
        (s) => s.sessionId === sessionId
      );

      if (!sessionExists) {
        // Session removed = Force logged out
        return {
          admin: null,
          sessionId,
          error: 'Session expired or force logged out',
        };
      }

      // ✅ Update lastActive for this session
      await Admin.updateOne(
        {
          _id: admin._id,
          'activeSessions.sessionId': sessionId,
        },
        {
          $set: {
            'activeSessions.$.lastActive': new Date(),
            lastActive: new Date(),
          },
        }
      );
    }

    return { admin, sessionId, error: null };
  } catch {
    return {
      admin: null,
      sessionId: null,
      error: 'Auth error',
    };
  }
}