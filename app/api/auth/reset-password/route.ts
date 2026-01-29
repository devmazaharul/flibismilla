import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { MIN_PASSWORD, MAX_PASSWORD, COOKIE_NAME } from '../../controller/constant';
import { cookies } from 'next/headers';
import { sendForgotPasswordEmail, sendPasswordChangedEmail } from '@/app/emails/email';

// 1. Zod Schema
const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is missing'),
    password: z
        .string()
        .min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters`)
        .max(MAX_PASSWORD, `Password must be at most ${MAX_PASSWORD} characters`)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export async function PUT(req: Request) {
    try {
        await dbConnect();

        // 2. Parse & Validate Input
        const body = await req.json();
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: 'Weak password or invalid input',
                    details: validation.error.flatten(),
                },
                { status: 400 },
            );
        }

        const { token, password } = validation.data;
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Find Admin with matching token AND check if it is not expired
        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!admin) {
            return NextResponse.json(
                { message: 'Invalid or expired reset token' },
                { status: 400 },
            );
        }

        // 4. Check if new password is the same as the old password
        // ✅ FIX: Compare Plain Text (password) vs DB Hash (admin.password)
        const isSamePassword = await bcrypt.compare(password, admin.password);

        if (isSamePassword) {
            return NextResponse.json(
                { message: 'New password must be different from the old password' },
                { status: 400 },
            );
        }

        // 5. Hash the New Password and Update
        const salt = await bcrypt.genSalt(12);
        const newHashPass = await bcrypt.hash(password, salt);

        // ✅ FIX: Actually assign the new password to the admin document
        admin.password = newHashPass;

        // 6. Clear the reset fields
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        // Reset failed login attempts
        admin.failedLoginAttempts = 0;
        admin.lockUntil = undefined;

        await admin.save();

        //if cookies/sessions were used, we would invalidate them here
        const cookieStore = await cookies();
        if (cookieStore.has(COOKIE_NAME)) {
            cookieStore.delete(COOKIE_NAME);
        }

        // send email notification about password change (optional)
        await sendPasswordChangedEmail(admin.email, admin.name);

        return NextResponse.json({
            success: true,
            message: 'Password reset successful. You can now login.',
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
