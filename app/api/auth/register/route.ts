import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin.model';
import dbConnect from '@/connection/db';
import { SALT_ROUNDS } from '../../controller/constant';
import { isAdmin } from '../../lib/auth';
import { sendTeamInviteEmail } from '@/app/emails/email';


const MAX_STAFF_LIMIT = 5;

export async function POST(req: Request) {

  const auth = await isAdmin();
  if (!auth.success) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access. Please login first." },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const body = await req.json();
    const { name, email, password, role } = body;
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Name, Email, Password, and Role are required." },
        { status: 400 }
      );
    }


    const currentStaffCount = await Admin.countDocuments({ adminId: auth.user._id });


    if (currentStaffCount >= MAX_STAFF_LIMIT) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Limit Reached! You verify limit is (1 Admin + 5 Staff). You already have ${currentStaffCount} staff members.` 
        },
        { status: 403 }
      );
    }


    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 }
      );
    }


    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,            // 'editor' or 'viewer'
      adminId: auth.user._id, // Link to Parent Admin
    });

    // email send 
 
await sendTeamInviteEmail(email, {
    invitedBy: auth.user.name||"Admin Name",
    invitedName:name,
    role: role,
    link: "https://flybismillah.com/access"
});

    return NextResponse.json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!`,
      userId: newStaff._id
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}