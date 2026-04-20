import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await (prisma as any).customer.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, phone,
      address, houseNumber, city,
      photos, bodyMeasurements,
      status, notes, gender, dateOfBirth,
    } = body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = String(firstName).trim();
    if (lastName !== undefined) data.lastName = String(lastName).trim();
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) data.address = address ?? null;
    if (houseNumber !== undefined) data.houseNumber = houseNumber ?? null;
    if (city !== undefined) data.city = city ?? null;
    if (photos !== undefined) data.photos = photos;
    if (bodyMeasurements !== undefined) data.bodyMeasurements = bodyMeasurements;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes ?? null;
    if (gender !== undefined) data.gender = gender ?? null;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    const customer = await (prisma as any).customer.update({
      where: { id: parseInt(params.id) },
      data,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
