import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      (prisma as any).customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          houseNumber: true,
          city: true,
          photos: true,
          bodyMeasurements: true,
          status: true,
          totalOrders: true,
          totalSpent: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Convert Decimal to string for JSON serialization
    const serializedCustomers = customers.map((c: any) => ({
      ...c,
      totalSpent: c.totalSpent.toString(),
    }));

    return NextResponse.json({
      customers: serializedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, phone,
      address, houseNumber, city,
      photos, bodyMeasurements,
      status, notes, gender, dateOfBirth,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 });
    }

    const customer = await (prisma as any).customer.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        address: address ?? null,
        houseNumber: houseNumber ?? null,
        city: city ?? null,
        photos: photos ?? undefined,
        bodyMeasurements: bodyMeasurements ?? undefined,
        status: status ?? 'active',
        notes: notes ?? null,
        gender: gender ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
