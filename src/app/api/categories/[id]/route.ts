import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getCategoryWithPath,
  moveCategory,
  getCategorySiblings,
  reorderCategories,
  deleteCategory,
} from '@/lib/category-utils';

// GET /api/categories/[id] - Get single category with path
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await getCategoryWithPath(parseInt(params.id));

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Move category to new parent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, parentId, categoryIds } = body;

    if (action === 'move') {
      // Move category to new parent
      const category = await moveCategory(
        parseInt(params.id),
        parentId ? parseInt(parentId) : null
      );
      return NextResponse.json(category);
    }

    if (action === 'reorder' && categoryIds) {
      // Reorder categories within same parent
      await reorderCategories(null, categoryIds);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCategory(parseInt(params.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
