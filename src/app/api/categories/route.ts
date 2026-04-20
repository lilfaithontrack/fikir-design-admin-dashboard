import { NextRequest, NextResponse } from 'next/server';
import type { CategoryType, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  assertValidCategoryHierarchy,
} from '@/lib/category-utils';

// GET /api/categories - Get all categories or category tree
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tree = searchParams.get('tree') === 'true';
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    if (tree) {
      // Return nested tree structure
      const categories = await getCategoryTree();
      return NextResponse.json(categories);
    }

    if (type) {
      // Get categories by type
      const categories = await prisma.category.findMany({
        where: {
          categoryType: type as any,
          parentId: parentId ? parseInt(parentId) : null,
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
      return NextResponse.json(categories);
    }

    // Flat list for admin (all categories, with parent + product counts)
    const categories = await prisma.category.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    const withNameAm = categories.map((c) => ({
      ...c,
      nameAm:
        c.metadata &&
        typeof c.metadata === 'object' &&
        c.metadata !== null &&
        'nameAm' in c.metadata
          ? String((c.metadata as { nameAm?: string }).nameAm)
          : undefined,
    }));

    return NextResponse.json(withNameAm);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

const CATEGORY_TYPES = new Set([
  'product_type',
  'category',
  'subcategory',
]);

function toCategoryCreateInput(
  body: Record<string, unknown>
): Prisma.CategoryCreateInput {
  const name = String(body.name || '').trim();
  const slug =
    String(body.slug || '').trim() ||
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const rawType = String(body.categoryType || 'subcategory');
  const categoryType = CATEGORY_TYPES.has(rawType)
    ? (rawType as Prisma.CategoryCreateInput['categoryType'])
    : 'subcategory';

  const parentRaw = body.parentId;
  const parentId =
    parentRaw !== undefined &&
    parentRaw !== null &&
    parentRaw !== '' &&
    !Number.isNaN(Number(parentRaw))
      ? Number(parentRaw)
      : undefined;

  const input: Prisma.CategoryCreateInput = {
    name,
    slug,
    categoryType,
  };

  if (body.description != null && String(body.description).trim()) {
    input.description = String(body.description).trim();
  }
  if (body.sortOrder != null && String(body.sortOrder) !== '') {
    input.sortOrder = Number(body.sortOrder);
  }
  if (Number.isFinite(parentId)) {
    input.parent = { connect: { id: parentId! } };
  }

  if (input.categoryType === 'product_type') {
    delete input.parent;
  }

  return input;
}

function toCategoryUpdateInput(
  body: Record<string, unknown>
): Prisma.CategoryUpdateInput {
  const data: Prisma.CategoryUpdateInput = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim();
  if (body.description !== undefined)
    data.description =
      body.description === null || body.description === ''
        ? null
        : String(body.description);
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  if (body.categoryType !== undefined) {
    const rawType = String(body.categoryType);
    if (CATEGORY_TYPES.has(rawType)) {
      data.categoryType = rawType as Prisma.CategoryUpdateInput['categoryType'];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'parentId')) {
    const parentRaw = body.parentId;
    if (parentRaw === null || parentRaw === '') {
      data.parent = { disconnect: true };
    } else if (!Number.isNaN(Number(parentRaw))) {
      data.parent = { connect: { id: Number(parentRaw) } };
    }
  }

  return data;
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const rawType = String(body.categoryType || 'subcategory');
    const categoryType = (CATEGORY_TYPES.has(rawType)
      ? rawType
      : 'subcategory') as CategoryType;

    const parentRaw = body.parentId;
    const parentIdResolved =
      parentRaw !== undefined &&
      parentRaw !== null &&
      parentRaw !== '' &&
      !Number.isNaN(Number(parentRaw))
        ? Number(parentRaw)
        : null;

    await assertValidCategoryHierarchy(categoryType, parentIdResolved);

    const input = toCategoryCreateInput(body);
    if (!input.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await createCategory(input);

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    const message = error instanceof Error ? error.message : '';
    if (message && !message.toLowerCase().includes('prisma')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown> & { id?: number };
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { categoryType: true, parentId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const mergedType =
      rest.categoryType !== undefined &&
      CATEGORY_TYPES.has(String(rest.categoryType))
        ? (String(rest.categoryType) as CategoryType)
        : existing.categoryType;

    let mergedParentId: number | null = existing.parentId;
    if (Object.prototype.hasOwnProperty.call(rest, 'parentId')) {
      const pr = rest.parentId;
      if (pr === null || pr === '') {
        mergedParentId = null;
      } else if (!Number.isNaN(Number(pr))) {
        mergedParentId = Number(pr);
      }
    }

    await assertValidCategoryHierarchy(mergedType, mergedParentId);

    const data = toCategoryUpdateInput(rest);
    const category = await updateCategory(id, data);

    return NextResponse.json(category);
  } catch (error: unknown) {
    console.error('Error updating category:', error);
    const message = error instanceof Error ? error.message : '';
    if (message && !message.toLowerCase().includes('prisma')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await deleteCategory(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
