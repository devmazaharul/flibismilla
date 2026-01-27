import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose'; 
import { z } from 'zod';
import { cookies } from 'next/headers';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { 
  COOKIE_NAME, 
  JWT_ALGORITHM, 
  JWT_SECRET, 
  LOCKOUT_DURATION, 
  MAX_DEVICE, 
  MAX_LOGIN_ATTEMPTS, 
  SESSION_EXPIRATION, 
  TOKEN_EXPIRATION 
} from '@/app/api/controller/constant';
import { UAParser } from 'ua-parser-js';

// Input Validation Schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- Helper Function: Get Device Info ---
export async function getDeviceInfo(req: Request) {
  const userAgent = req.headers.get('user-agent') || '';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceName = result.device.model 
    ? `${result.device.vendor || ''} ${result.device.model}` 
    : 'Desktop PC';
  
  const browser = `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`;
  const os = `${result.os.name || 'Unknown'} ${result.os.version || ''}`;

  let location = 'Unknown Location';
  // Skip external API call for localhost to save time
  if (ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(1500) });
      const geoData = await geoRes.json();
      if (geoData.status === 'success') {
        location = `${geoData.city}, ${geoData.country}`;
      }
    } catch (e) {
      // Fail silently
    }
  }

  return {
    device: `${deviceName} (${os})`,
    browser: browser,
    ip: ip,
    location: location,
    time: new Date(),
    status: 'current'
  };
}


export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input data", details: validation.error.flatten() }, 
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // 🛡️ --- NEW: Check if Account is Verified/Blocked ---
    if (admin.isVerified === false) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Your account is disabled. Please contact the system administrator." 
        }, 
        { status: 403 } // Forbidden
      );
    }

    // 1. Check Account Lock Status (Failed attempts lock)
    if (admin.lockUntil && new Date(admin.lockUntil).getTime() > Date.now()) {
      const remainingTime = Math.ceil((new Date(admin.lockUntil).getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { success: false, message: `Account is temporarily locked. Try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, admin.password);

    // ❌ Failed Login Handling
    if (!isMatch) {
      const attempts = (admin.failedLoginAttempts || 0) + 1;
      let updateData: any = { $set: { failedLoginAttempts: attempts } };
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.$set.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
        updateData.$set.failedLoginAttempts = 0;
      }

      await Admin.findByIdAndUpdate(admin._id, updateData);
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Password Matched! 
    
    // 3. Check 2FA status
    if (admin.isTwoFactorEnabled) {
      return NextResponse.json({ 
        success: true, 
        require2FA: true,
        userId: admin._id,
        message: "Please enter the 6-digit code from your authenticator app."
      });
    }

    // --- Proceed with Full Login if 2FA is OFF ---

    const deviceInfo = await getDeviceInfo(req);

    // 4. Update DB (Reset limits & Update History)
    // 💡 এখানে আগের সব স্ট্যাটাস 'completed' করে নতুনটাকে 'current' করা হচ্ছে
    await Admin.findByIdAndUpdate(admin._id, { 
        $set: { 
            failedLoginAttempts: 0, 
            lockUntil: null,
            lastLogin: new Date(),
            "loginHistory.$[].status": "completed" // Reset old sessions
        }
    });

    await Admin.findByIdAndUpdate(admin._id, {
        $push: {
            loginHistory: {
                $each: [deviceInfo],
                $position: 0,
                $slice: MAX_DEVICE           
            }
        }
    });

    // 5. Generate Token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
        id: admin._id.toString(), 
        email: admin.email, 
        role: admin.role 
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM || 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(secret);

    // 6. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict', 
      maxAge: SESSION_EXPIRATION, 
      path: '/', 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Login successful" 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}