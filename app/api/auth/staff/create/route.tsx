// app/api/auth/staff/create/route.ts

import { NextRequest } from 'next/server';

import ActivityLog from '@/models/ActivityLog';
import {
  getCurrentAdmin,
  isAdmin,
  generateAdminId,
} from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { ICreateStaffBody, IPermissions } from '@/types/admin';
import bcrypt from 'bcryptjs';
import dbConnect from '@/connection/db';
import Admin from '@/models/Admin.model';

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, IPermissions> = {
  editor: {
    dashboard: 'view',
    products: 'edit',
    orders: 'edit',
    customers: 'view',
    staff: 'none',
    settings: 'none',
    reports: 'view',
  },
  viewer: {
    dashboard: 'view',
    products: 'view',
    orders: 'view',
    customers: 'view',
    staff: 'none',
    settings: 'none',
    reports: 'view',
  },
};

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Auth Check
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return errorResponse('Unauthorized - Please login', 401);
    }

    // 2️⃣ Only admin can create staff
    if (!isAdmin(currentAdmin)) {
      return errorResponse(
        'Forbidden - Only admin can create staff',
        403
      );
    }

    await dbConnect();

    // 3️⃣ Parse body
    const body: ICreateStaffBody = await request.json();
    const { name, email, password, phone, role, permissions } = body;

    // 4️⃣ Validation
    if (!name?.trim()) {
      return errorResponse('Name is required');
    }

    if (!email?.trim()) {
      return errorResponse('Email is required');
    }

    if (!password) {
      return errorResponse('Password is required');
    }

    if (password.length < 6) {
      return errorResponse(
        'Password must be at least 6 characters'
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format');
    }

    // 5️⃣ Check duplicate email
    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingAdmin) {
      return errorResponse('This email is already registered');
    }

    // 6️⃣ Validate role
    const allowedRoles: string[] = ['editor', 'viewer'];
    const staffRole = role || 'editor';

    if (!allowedRoles.includes(staffRole)) {
      return errorResponse(
        'Staff role can only be "editor" or "viewer"'
      );
    }

    // 7️⃣ Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8️⃣ Determine permissions
    const staffPermissions: IPermissions = permissions
      ? { ...DEFAULT_PERMISSIONS[staffRole], ...permissions }
      : DEFAULT_PERMISSIONS[staffRole];

    // 9️⃣ Create staff
    const newStaff = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || null,
      role: staffRole,
      adminId: generateAdminId(),
      permissions: staffPermissions,
      createdBy: currentAdmin._id,
      status: 'active',
      isVerified: true,
      isOnline: false,
      lastLogin: new Date(),
      lastActive: new Date(),
      loginHistory: [],
      activeSessions: [],
      failedLoginAttempts: 0,
    });

    // 🔟 Activity Log
    await ActivityLog.create({
      admin: currentAdmin._id,
      action: 'created_staff',
      target: newStaff._id,
      details: `Created staff "${newStaff.name}" with role "${staffRole}"`,
    });

    // 1️⃣1️⃣ Response - password বাদ দাও
    const staffResponse = newStaff.toObject();
    delete (staffResponse as unknown as Record<string, unknown>).password;

    return successResponse(
      'Staff created successfully',
      staffResponse,
      201
    );
  } catch (error: unknown) {
    console.error('Create Staff Error:', error);

    // Mongoose duplicate key error
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return errorResponse('This email is already registered');
    }

    return errorResponse('Internal server error', 500);
  }
}