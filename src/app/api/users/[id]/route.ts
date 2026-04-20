import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizeUsername } from '@/lib/auth';
import { getCurrentUserFromRequest } from '@/lib/session-user';
import { ALL_ROLE_VALUES, canManageStaff } from '@/lib/staff-roles';

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUserFromRequest(request);
    if (!me || !canManageStaff(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUserFromRequest(request);
    if (!me || !canManageStaff(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);

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

    const updateData: Record<string, unknown> = {};
    if (typeof firstName === 'string') updateData.firstName = firstName.trim();
    if (typeof lastName === 'string') updateData.lastName = lastName.trim();
    if (phone !== undefined) {
      updateData.phone = typeof phone === 'string' && phone.trim() !== '' ? phone.trim() : null;
    }
    if (typeof rawEmail === 'string') {
      updateData.email = rawEmail.trim() === '' ? null : rawEmail.trim().toLowerCase();
    }
    if (typeof rawUsername === 'string' && rawUsername.trim() !== '') {
      updateData.username = normalizeUsername(rawUsername);
    }
    if (typeof role === 'string') {
      const nextRole = ALL_ROLE_VALUES.includes(role as UserRole) ? (role as UserRole) : undefined;
      if (nextRole) {
        if (nextRole === 'admin' && me.role !== 'admin') {
          return NextResponse.json({ error: 'Only an administrator can assign the admin role' }, { status: 403 });
        }
        updateData.role = nextRole;
      }
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    if (password && typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUserFromRequest(request);
    if (!me || !canManageStaff(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (me.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
