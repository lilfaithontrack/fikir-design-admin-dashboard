import { Category, CategoryType, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Enforces: product_type (root) → category (under product_type) → subcategory (under category).
 * Example: Women → Clothing → Traditional cloth
 */
export async function assertValidCategoryHierarchy(
  categoryType: CategoryType,
  parentId: number | null | undefined
): Promise<void> {
  if (categoryType === 'product_type') {
    if (parentId != null && parentId !== undefined && !Number.isNaN(Number(parentId))) {
      throw new Error('A product type cannot have a parent.');
    }
    return;
  }

  if (
    parentId === null ||
    parentId === undefined ||
    (typeof parentId === 'number' && Number.isNaN(parentId))
  ) {
    throw new Error('A category or subcategory must have a parent.');
  }

  const pid = Number(parentId);
  const parent = await prisma.category.findUnique({
    where: { id: pid },
    select: { id: true, categoryType: true },
  });

  if (!parent) {
    throw new Error('Parent not found.');
  }

  if (categoryType === 'category') {
    if (parent.categoryType !== 'product_type') {
      throw new Error('A category must belong to a product type.');
    }
    return;
  }

  if (categoryType === 'subcategory') {
    if (parent.categoryType !== 'category') {
      throw new Error('A subcategory must belong to a category.');
    }
  }
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
  level: number;
  path: string[];
}

export interface CategoryWithHierarchy extends Category {
  parent?: CategoryWithHierarchy;
  children?: CategoryWithHierarchy[];
  level: number;
  path: string[];
  productCount?: number;
}

/**
 * Get category tree structure (nested hierarchy)
 */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });

  const buildTree = (parentId: number | null, level: number = 0): CategoryTree[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        level,
        path: [],
        children: buildTree(cat.id, level + 1),
      }));
  };

  return buildTree(null);
}

/**
 * Get category with full path (breadcrumb)
 */
export async function getCategoryWithPath(categoryId: number): Promise<CategoryWithHierarchy | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      parent: true,
      children: true,
    },
  });

  if (!category) return null;

  const path = await getCategoryPath(categoryId);
  const level = path.length;

  const { parent, children, ...categoryData } = category;

  return {
    ...categoryData,
    level,
    path,
    parent: undefined,
    children: undefined,
  };
}

/**
 * Get category path (breadcrumb from root to category)
 */
export async function getCategoryPath(categoryId: number): Promise<string[]> {
  const path: string[] = [];
  let currentCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, parentId: true },
  });

  while (currentCategory) {
    path.unshift(currentCategory.name);
    if (currentCategory.parentId) {
      currentCategory = await prisma.category.findUnique({
        where: { id: currentCategory.parentId },
        select: { id: true, name: true, parentId: true },
      });
    } else {
      currentCategory = null;
    }
  }

  return path;
}

/**
 * Get categories by type (product_type, category, subcategory)
 */
export async function getCategoriesByType(
  type: CategoryType,
  parentId?: number
): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      categoryType: type,
      parentId: parentId,
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Get root categories (product types)
 */
export async function getRootCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Get subcategories for a category
 */
export async function getSubcategories(parentId: number): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      parentId,
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Create category with automatic level calculation
 */
export async function createCategory(
  data: Prisma.CategoryCreateInput
): Promise<Category> {
  let level = 0;
  
  if (data.parent) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parent.connect?.id as number },
      select: { level: true },
    });
    level = (parent?.level ?? -1) + 1;
  }

  return prisma.category.create({
    data: {
      ...data,
      level,
    },
  });
}

/**
 * Update category and cascade level updates to children
 */
export async function updateCategory(
  id: number,
  data: Prisma.CategoryUpdateInput
): Promise<Category> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { parentId: true, level: true },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // If parent changed, update level
  if (data.parent && data.parent.connect?.id !== undefined && data.parent.connect.id !== category.parentId) {
    const newParent = await prisma.category.findUnique({
      where: { id: data.parent.connect.id as number },
      select: { level: true },
    });
    const newLevel = (newParent?.level ?? -1) + 1;
    
    // Update category and all descendants
    await updateCategoryLevel(id, newLevel);
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Recursively update category levels
 */
async function updateCategoryLevel(categoryId: number, newLevel: number): Promise<void> {
  await prisma.category.update({
    where: { id: categoryId },
    data: { level: newLevel },
  });

  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  for (const child of children) {
    await updateCategoryLevel(child.id, newLevel + 1);
  }
}

/**
 * Delete category (prevent if has children or products)
 */
export async function deleteCategory(id: number): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          children: true,
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category._count.children > 0) {
    throw new Error('Cannot delete category with subcategories');
  }

  if (category._count.products > 0) {
    throw new Error('Cannot delete category with products');
  }

  await prisma.category.delete({
    where: { id },
  });
}

/**
 * Move category to new parent
 */
export async function moveCategory(
  categoryId: number,
  newParentId: number | null
): Promise<Category> {
  // Prevent circular reference
  if (newParentId) {
    const isDescendant = await checkIsDescendant(newParentId, categoryId);
    if (isDescendant) {
      throw new Error('Cannot move category to its own descendant');
    }
  }

  const newParent = newParentId
    ? await prisma.category.findUnique({
        where: { id: newParentId },
        select: { level: true },
      })
    : null;

  const newLevel = (newParent?.level ?? -1) + 1;

  // Update category and all descendants
  await updateCategoryLevel(categoryId, newLevel);

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      parentId: newParentId,
      level: newLevel,
    },
  });
}

/**
 * Check if targetId is a descendant of sourceId
 */
async function checkIsDescendant(targetId: number, sourceId: number): Promise<boolean> {
  let currentId: number | null = targetId;

  while (currentId) {
    if (currentId === sourceId) return true;

    const cat: { parentId: number | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    currentId = cat?.parentId ?? null;
  }
  
  return false;
}

/**
 * Get category with product count
 */
export async function getCategoryWithProductCount(
  categoryId: number
): Promise<CategoryWithHierarchy | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) return null;

  const path = await getCategoryPath(categoryId);
  const level = path.length;

  const { _count, ...categoryData } = category;

  return {
    ...categoryData,
    level,
    path,
    productCount: _count.products,
  };
}

/**
 * Search categories by name
 */
export async function searchCategories(query: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: {
      name: {
        contains: query,
      },
      isActive: true,
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
    take: 20,
  });
}

/**
 * Get category siblings (categories with same parent)
 */
export async function getCategorySiblings(categoryId: number): Promise<Category[]> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });

  if (!category) return [];

  return prisma.category.findMany({
    where: {
      parentId: category.parentId,
      id: { not: categoryId },
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Reorder categories within same parent
 */
export async function reorderCategories(
  parentId: number | null,
  categoryIds: number[]
): Promise<void> {
  const updates = categoryIds.map((id, index) =>
    prisma.category.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
}
