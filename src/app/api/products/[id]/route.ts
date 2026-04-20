import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const OMIT_FROM_PRODUCT_UPDATE = new Set([
  'id',
  'category',
  'productType',
  'images',
  'inventory',
  'variants',
  'variantCombinations',
  'attributes',
  'orderItems',
  'createdAt',
  'updatedAt',
]);

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        category: true,
        productType: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        variantCombinations: true,
        attributes: true,
        inventory: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const p = product as Record<string, unknown>
    const dec = (v: unknown) =>
      v !== undefined && v !== null ? String(v) : null

    return NextResponse.json({
      ...product,
      price: dec(p.basePrice),
      basePrice: p.basePrice,
      costPrice: dec(p.costPrice),
      defaultShippingFee: dec(p.defaultShippingFee),
      defaultServiceFee: dec(p.defaultServiceFee),
      estimatedLaborCost: dec(p.estimatedLaborCost),
      estimatedMaterialCost: dec(p.estimatedMaterialCost),
      compareAtPrice: dec(p.compareAtPrice),
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { price, ...rest } = body;
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (!OMIT_FROM_PRODUCT_UPDATE.has(k)) flat[k] = v;
    }
    if (price !== undefined) {
      flat.basePrice = body.basePrice ?? price;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(params.id) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: flat as any,
      include: {
        category: true,
        productType: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
