import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Built-in Node library
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { APP_URL } from '../../controller/constant';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    // Security: Don't tell if email exists or not to prevent user enumeration
    if (!admin) {
      return NextResponse.json({ message: "If this email is registered, you will receive a reset link shortly." });
    }
    // 1. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // 2. Hash and Save Token to DB (Expires in 15 mins)
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).update(resetToken).digest('hex');
    admin.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); 

    await admin.save();
    // 3. Construct Reset URL
    const resetUrl = `${APP_URL}/reset-password/${resetToken}`;
    // TODO: Send email using Resend/Nodemailer here
    console.log("Reset Link:", resetUrl); 

    return NextResponse.json({ message: "Reset link sent to your email." });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}