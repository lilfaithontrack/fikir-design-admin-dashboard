import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/product-types - Get all product types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) where.isActive = isActive === 'true';

    const productTypes = await prisma.productType.findMany({
      where,
      include: {
        products: {
          select: { id: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(productTypes);
  } catch (error) {
    console.error('Error fetching product types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product types' },
      { status: 500 }
    );
  }
}

// POST /api/product-types - Create new product type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productType = await prisma.productType.create({
      data: body,
    });

    return NextResponse.json(productType, { status: 201 });
  } catch (error) {
    console.error('Error creating product type:', error);
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    );
  }
}
