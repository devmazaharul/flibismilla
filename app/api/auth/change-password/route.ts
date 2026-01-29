import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';
import { COOKIE_NAME, JWT_SECRET, SALT_ROUNDS } from '@/app/api/controller/constant';
import { cookies } from 'next/headers';
import { changePasswordSchema } from '../../controller/helper/validation';
import { sendPasswordChangedEmail } from '../../../emails/email';

export async function PUT(req: Request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secret);
            payload = verifiedPayload;
        } catch (err) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 },
            );
        }

        const body = await req.json();
        const validation = changePasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error.issues[0].message },
                { status: 400 },
            );
        }

        const { currentPassword, newPassword } = validation.data;

        const admin = await Admin.findById(payload.id);
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Account not found' },
                { status: 404 },
            );
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Current password is incorrect' },
                { status: 400 },
            );
        }

        const isSameAsOld = await bcrypt.compare(newPassword, admin.password);
        if (isSameAsOld) {
            return NextResponse.json(
                { success: false, message: 'New password cannot be the same as old' },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        admin.password = hashedPassword;
        await admin.save();
        // send email notification about password change
        await sendPasswordChangedEmail(admin.email, admin.name);

        //remove cookie to force re-login
        const response = NextResponse.next();
        response.cookies.set({
            name: COOKIE_NAME,
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
        });

        return NextResponse.json(
            { success: true, message: 'Password changed successfully. Please log in again.' },
            { status: 200 },
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 },
        );
    }
}
