import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizeUsername } from '@/lib/auth';
import { getCurrentUserFromRequest } from '@/lib/session-user';
import { ALL_ROLE_VALUES, canManageStaff } from '@/lib/staff-roles';

// GET /api/users - List staff (authenticated)
export async function GET(request: NextRequest) {
  try {
    const me = await getCurrentUserFromRequest(request);
    if (!me || !canManageStaff(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (role) where.role = role as UserRole;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create staff (admin / manager)
export async function POST(request: NextRequest) {
  try {
    const me = await getCurrentUserFromRequest(request);
    if (!me || !canManageStaff(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      password,
      username: rawUsername,
      email: rawEmail,
      firstName,
      lastName,
      phone,
      role,
      isActive,
    } = body;

    const username = typeof rawUsername === 'string' ? normalizeUsername(rawUsername) : '';
    if (!username || username.length < 2) {
      return NextResponse.json({ error: 'Username is required (min 2 characters)' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
    }

    const email =
      typeof rawEmail === 'string' && rawEmail.trim() !== '' ? rawEmail.trim().toLowerCase() : null;

    const requestedRole = ALL_ROLE_VALUES.includes(role as UserRole) ? (role as UserRole) : 'staff';
    if (requestedRole === 'admin' && me.role !== 'admin') {
      return NextResponse.json({ error: 'Only an administrator can create admin accounts' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: phone ? String(phone).trim() : null,
        role: requestedRole,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user (username or email may already exist)' },
      { status: 500 }
    );
  }
}
