import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const productTypeId = searchParams.get('productTypeId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (productTypeId) where.productTypeId = parseInt(productTypeId);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          nameAm: true,
          sku: true,
          descriptionShort: true,
          descriptionShortAm: true,
          descriptionDetailed: true,
          descriptionDetailedAm: true,
          categoryId: true,
          productTypeId: true,
          basePrice: true,
          costPrice: true,
          defaultShippingFee: true,
          defaultServiceFee: true,
          estimatedLaborCost: true,
          estimatedMaterialCost: true,
          fabricComposition: true,
          fabricCompositionAm: true,
          careInstructions: true,
          careInstructionsAm: true,
          designNotes: true,
          designNotesAm: true,
          measurementGuideSummary: true,
          measurementGuideSummaryAm: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          productType: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
            },
          },
          inventory: {
            select: {
              id: true,
              quantity: true,
              lowStockThreshold: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const dec = (v: unknown) =>
      v !== undefined && v !== null ? String(v) : null

    const serializedProducts = products.map((product: any) => {
      const inv = Array.isArray(product.inventory)
        ? product.inventory[0]
        : product.inventory
      const { basePrice, inventory: _inv, ...rest } = product
      return {
        ...rest,
        price: basePrice?.toString(),
        costPrice: dec(product.costPrice),
        defaultShippingFee: dec(product.defaultShippingFee),
        defaultServiceFee: dec(product.defaultServiceFee),
        estimatedLaborCost: dec(product.estimatedLaborCost),
        estimatedMaterialCost: dec(product.estimatedMaterialCost),
        inventory: inv ?? undefined,
      }
    })

    return NextResponse.json({
      products: serializedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
function slugify(name: string) {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'product'
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const sku = String(body.sku || '').trim();
    if (!name || !sku) {
      return NextResponse.json(
        { error: 'Name and SKU are required' },
        { status: 400 }
      );
    }

    const basePrice = body.basePrice ?? body.price;
    if (basePrice === undefined || basePrice === null || basePrice === '') {
      return NextResponse.json(
        { error: 'Price (basePrice) is required' },
        { status: 400 }
      );
    }

    const slug =
      String(body.slug || '').trim() ||
      `${slugify(name)}-${Date.now().toString(36)}`;

    const num = (v: unknown, fallback?: number) => {
      if (v === undefined || v === null || v === '') return fallback
      const x = Number(v)
      return Number.isFinite(x) ? x : fallback
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        basePrice,
        categoryId:
          body.categoryId != null && body.categoryId !== ''
            ? parseInt(String(body.categoryId), 10)
            : null,
        productTypeId:
          body.productTypeId != null && body.productTypeId !== ''
            ? parseInt(String(body.productTypeId), 10)
            : null,
        status: body.status || 'draft',
        descriptionShort: body.descriptionShort
          ? String(body.descriptionShort)
          : null,
        descriptionDetailed: body.descriptionDetailed
          ? String(body.descriptionDetailed)
          : null,
        nameAm: body.nameAm ? String(body.nameAm) : null,
        descriptionShortAm: body.descriptionShortAm
          ? String(body.descriptionShortAm)
          : null,
        descriptionDetailedAm: body.descriptionDetailedAm
          ? String(body.descriptionDetailedAm)
          : null,
        costPrice: num(body.costPrice, undefined),
        defaultShippingFee: num(body.defaultShippingFee, 0) ?? 0,
        defaultServiceFee: num(body.defaultServiceFee, 0) ?? 0,
        estimatedLaborCost: num(body.estimatedLaborCost, undefined),
        estimatedMaterialCost: num(body.estimatedMaterialCost, undefined),
        fabricComposition: body.fabricComposition
          ? String(body.fabricComposition)
          : null,
        fabricCompositionAm: body.fabricCompositionAm
          ? String(body.fabricCompositionAm)
          : null,
        careInstructions: body.careInstructions
          ? String(body.careInstructions)
          : null,
        careInstructionsAm: body.careInstructionsAm
          ? String(body.careInstructionsAm)
          : null,
        designNotes: body.designNotes ? String(body.designNotes) : null,
        designNotesAm: body.designNotesAm ? String(body.designNotesAm) : null,
        measurementGuideSummary: body.measurementGuideSummary
          ? String(body.measurementGuideSummary)
          : null,
        measurementGuideSummaryAm: body.measurementGuideSummaryAm
          ? String(body.measurementGuideSummaryAm)
          : null,
      },
      include: {
        category: true,
        productType: true,
        inventory: true,
      },
    });

    if (!product.inventory?.length) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: Number(body.initialQuantity) || 0,
          lowStockThreshold: Number(body.lowStockThreshold) || 10,
        },
      });
    }

    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        productType: true,
        inventory: { select: { id: true, quantity: true, lowStockThreshold: true } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
