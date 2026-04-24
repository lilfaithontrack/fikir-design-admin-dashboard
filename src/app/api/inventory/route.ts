import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/inventory - Get all inventory
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const lowStock = searchParams.get('lowStock');

    const where: any = {};
    if (productId) where.productId = parseInt(productId);
    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventory.fields.lowStockThreshold };
    }

    const inventory = await prisma.inventory.findMany({
      where,
      select: {
        id: true,
        productId: true,
        quantity: true,
        lowStockThreshold: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create inventory record
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    const inventory = await prisma.inventory.create({
      data: body,
      include: {
        product: true,
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory - Update inventory
export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const id = body.id;
    if (id === undefined || id === null) {
      return NextResponse.json(
        { error: 'Inventory id is required' },
        { status: 400 }
      );
    }

    const data: Prisma.InventoryUpdateInput = {};
    if (body.quantity !== undefined && body.quantity !== null) {
      data.quantity = Number(body.quantity);
    }
    if (
      body.lowStockThreshold !== undefined &&
      body.lowStockThreshold !== null
    ) {
      data.lowStockThreshold = Number(body.lowStockThreshold);
    }

    const inventory = await prisma.inventory.update({
      where: { id: Number(id) },
      data,
      include: {
        product: true,
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
