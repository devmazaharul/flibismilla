import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { APP_URL } from '../../controller/constant';
import { sendForgotPasswordEmail } from '@/app/emails/email';


export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      return NextResponse.json({ 
        success: true, 
        message: "If this email is registered, you will receive a reset link shortly." 
      });
    }

    // 1. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash and Save Token to DB (Expires in 15 mins)
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes


    await admin.save({ validateBeforeSave: false });

    // 3. Construct Reset URL
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    // 4. Send Email
    try {
        await sendForgotPasswordEmail(admin.email, { 
            name: admin.name, 
            link: resetUrl 
        });
    } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return NextResponse.json({ message: "Failed to send email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: "Reset link sent to your email." 
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}