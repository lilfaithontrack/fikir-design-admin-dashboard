# Category & Product Type System

This document describes the hierarchical category system and product type logic for the Fikir Design Admin Dashboard.

## Overview

The system supports a 3-level category hierarchy:
- **Level 0 (Product Types)**: Root categories like "Clothing", "Accessories", "Fabrics"
- **Level 1 (Categories)**: Second-level categories like "Men's Wear", "Women's Wear"
- **Level 2 (Subcategories)**: Third-level categories like "Shirts", "Dresses", "Pants"

## Database Schema

### Category Model

```prisma
model Category {
  id          Int          @id @default(autoincrement())
  name        String       @db.VarChar(200)
  slug        String       @unique @db.VarChar(255)
  description String?      @db.Text
  categoryType CategoryType @default(subcategory)
  
  // Hierarchy
  parentId    Int?         @map("parent_id")
  level       Int          @default(0)
  sortOrder   Int          @default(0) @map("sort_order")
  
  // Display
  isActive    Boolean      @default(true) @map("is_active")
  imageUrl    String?      @map("image_url") @db.VarChar(500)
  icon        String?      @db.VarChar(50)
  
  // Metadata
  metadata    Json?        @db.Json
  
  // Relations
  parent      Category?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[]   @relation("CategoryHierarchy")
  products    Product[]
}
```

### Product Type Model

```prisma
model ProductType {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(100)
  displayName String   @map("display_name") @db.VarChar(200)
  description String?  @db.Text
  icon        String?  @db.VarChar(50)
  
  // Configuration
  hasVariants Boolean  @default(false) @map("has_variants")
  hasSize     Boolean  @default(false) @map("has_size")
  hasColor    Boolean  @default(false) @map("has_color")
  
  // Size Options (JSON array)
  sizeOptions Json?    @map("size_options") @db.Json
  
  // Color Options (JSON array)
  colorOptions Json?   @map("color_options") @db.Json
  
  // Measurement Requirements
  requiresMeasurements Boolean @default(false) @map("requires_measurements")
  measurementFields Json?  @map("measurement_fields") @db.Json
  
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  
  products    Product[]
}
```

## API Endpoints

### Categories

#### GET /api/categories
- Query params:
  - `tree=true` - Returns nested tree structure
  - `type=product_type|category|subcategory` - Filter by type
  - `parentId=<id>` - Get children of specific parent
- Returns: Array of categories or nested tree

#### POST /api/categories
- Body: Category creation data
- Returns: Created category

#### PUT /api/categories
- Body: Category update data with `id`
- Returns: Updated category

#### DELETE /api/categories
- Query params: `id=<category_id>`
- Returns: Success message

#### GET /api/categories/[id]
- Returns: Single category with full path (breadcrumb)

#### PATCH /api/categories/[id]
- Body: 
  - `action=move`, `parentId=<new_parent_id>` - Move category to new parent
  - `action=reorder`, `categoryIds=[...]` - Reorder categories
- Returns: Updated category or success message

#### DELETE /api/categories/[id]
- Returns: Success message

## Utility Functions

### Category Utils (`src/lib/category-utils.ts`)

```typescript
import {
  getCategoryTree,
  getCategoryWithPath,
  getCategoryPath,
  getCategoriesByType,
  getRootCategories,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategory,
  getCategoryWithProductCount,
  searchCategories,
  getCategorySiblings,
  reorderCategories,
} from '@/lib/category-utils';
```

### Key Functions

#### `getCategoryTree()`
Returns the full category tree as a nested structure.

```typescript
const tree = await getCategoryTree();
// Returns: CategoryTree[]
```

#### `getCategoryWithPath(categoryId)`
Get a category with its full breadcrumb path.

```typescript
const category = await getCategoryWithPath(5);
// Returns: CategoryWithHierarchy with path: ["Clothing", "Men's Wear", "Shirts"]
```

#### `createCategory(data)`
Create a new category with automatic level calculation.

```typescript
const category = await createCategory({
  name: 'New Category',
  slug: 'new-category',
  categoryType: 'subcategory',
  parent: { connect: { id: 3 } },
});
```

#### `moveCategory(categoryId, newParentId)`
Move a category to a new parent with automatic level updates.

```typescript
await moveCategory(5, 3); // Move category 5 to be under category 3
```

#### `deleteCategory(categoryId)`
Delete a category (prevents deletion if has children or products).

```typescript
await deleteCategory(5);
```

## Seeding the Database

Run the seed script to populate initial data:

```bash
npm run seed
```

This will create:
- 3 Product Types: Clothing, Accessories, Fabrics
- 4 Categories under Clothing: Men's Wear, Women's Wear, Traditional Wear, Kids' Wear
- 9 Subcategories across the categories
- 3 Product Types with configurations
- 1 Admin user (email: admin@fikir.com, password: admin123)

## Usage Examples

### Getting Categories in a Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { CategoryTree } from '@/lib/category-utils';

export default function CategoryTreeComponent() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);

  useEffect(() => {
    fetch('/api/categories?tree=true')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  return (
    <div>
      {categories.map(category => (
        <CategoryNode key={category.id} category={category} />
      ))}
    </div>
  );
}

function CategoryNode({ category }: { category: CategoryTree }) {
  return (
    <div style={{ marginLeft: `${category.level * 20}px` }}>
      {category.name}
      {category.children.map(child => (
        <CategoryNode key={child.id} category={child} />
      ))}
    </div>
  );
}
```

### Creating a New Category

```typescript
async function createNewCategory() {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'New Category',
      slug: 'new-category',
      description: 'Category description',
      categoryType: 'subcategory',
      parentId: 3,
    }),
  });
  
  const category = await response.json();
}
```

### Moving a Category

```typescript
async function moveCategory(categoryId: number, newParentId: number) {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'move',
      parentId: newParentId,
    }),
  });
  
  const result = await response.json();
}
```

## Category Hierarchy Structure

### Example Hierarchy

```
Clothing (Level 0 - Product Type)
├── Men's Wear (Level 1 - Category)
│   ├── Shirts (Level 2 - Subcategory)
│   ├── Pants & Trousers (Level 2 - Subcategory)
│   └── Suits & Jackets (Level 2 - Subcategory)
├── Women's Wear (Level 1 - Category)
│   ├── Dresses (Level 2 - Subcategory)
│   ├── Tops & Blouses (Level 2 - Subcategory)
│   └── Skirts (Level 2 - Subcategory)
├── Traditional Wear (Level 1 - Category)
│   ├── Habesha Kemis (Level 2 - Subcategory)
│   ├── Gabi & Netela (Level 2 - Subcategory)
│   └── Shema (Level 2 - Subcategory)
└── Kids' Wear (Level 1 - Category)

Accessories (Level 0 - Product Type)
├── Bags (Level 1 - Category)
├── Jewelry (Level 1 - Category)
└── Shoes (Level 1 - Category)

Fabrics (Level 0 - Product Type)
├── Cotton (Level 1 - Category)
├── Silk (Level 1 - Category)
└── Traditional Fabrics (Level 1 - Category)
```

## Product Types Configuration

### Shirts
- Has variants: Yes
- Has size: Yes
- Has color: Yes
- Sizes: XS, S, M, L, XL, XXL
- Colors: White, Black, Blue, Red, Green, Yellow

### Dresses
- Has variants: Yes
- Has size: Yes
- Has color: Yes
- Sizes: XS, S, M, L, XL
- Colors: White, Black, Blue, Red, Pink, Yellow

### Traditional Wear
- Has variants: Yes
- Has size: Yes
- Has color: Yes
- Requires measurements: Yes
- Measurement fields: Shoulder, Chest, Waist, Length
- Sizes: S, M, L, XL
- Colors: White, Black, Red, Green, Gold

## Next Steps

1. Set up the MySQL database connection in `.env.local`
2. Run `npx prisma db push` to create the database tables
3. Run `npm run seed` to populate initial data
4. Use the API endpoints to manage categories
5. Implement the UI components for category management
