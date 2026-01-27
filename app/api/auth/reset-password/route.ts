import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/connection/db'; 
import Admin from '@/models/Admin.model';

import { MIN_PASSWORD,MAX_PASSWORD } from '../../controller/constant';

// 1. Zod Schema for Strong Password Validation
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
                { error: 'Weak password', details: validation.error.flatten() },
                { status: 400 },
            );
        }

        const { token, password } = validation.data;
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        // 4. Find Admin with matching token AND check if it is not expired
        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }, // $gt means "Greater Than" current time
        });

        if (!admin) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        // 5. Hash the New Password
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(password, salt);

        // 6. Clear the reset fields (Prevent reuse of token)
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        // Optional: Reset failed login attempts if any
        admin.failedLoginAttempts = 0;
        admin.lockUntil = undefined;

        await admin.save();

        return NextResponse.json({
            success: true,
            message: 'Password reset successful. You can now login.',
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
