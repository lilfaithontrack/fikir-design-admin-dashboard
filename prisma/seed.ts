import 'dotenv/config';
import { PrismaClient, CategoryType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ============================================
  // PRODUCT TYPES (Root Level - Level 0)
  // ============================================
  
  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'All clothing items including traditional and modern wear',
      categoryType: CategoryType.product_type,
      level: 0,
      sortOrder: 1,
      isActive: true,
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Fashion accessories and complementary items',
      categoryType: CategoryType.product_type,
      level: 0,
      sortOrder: 2,
      isActive: true,
    },
  });

  const fabrics = await prisma.category.upsert({
    where: { slug: 'fabrics' },
    update: {},
    create: {
      name: 'Fabrics',
      slug: 'fabrics',
      description: 'Raw materials and fabrics for custom designs',
      categoryType: CategoryType.product_type,
      level: 0,
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('✓ Product types created');

  // ============================================
  // CATEGORIES (Level 1)
  // ============================================

  // Under Clothing
  const mensWear = await prisma.category.upsert({
    where: { slug: 'mens-wear' },
    update: {},
    create: {
      name: "Men's Wear",
      slug: 'mens-wear',
      description: "Clothing for men including shirts, pants, suits",
      categoryType: CategoryType.category,
      parentId: clothing.id,
      level: 1,
      sortOrder: 1,
      isActive: true,
    },
  });

  const womensWear = await prisma.category.upsert({
    where: { slug: 'womens-wear' },
    update: {},
    create: {
      name: "Women's Wear",
      slug: 'womens-wear',
      description: "Clothing for women including dresses, skirts, blouses",
      categoryType: CategoryType.category,
      parentId: clothing.id,
      level: 1,
      sortOrder: 2,
      isActive: true,
    },
  });

  const traditionalWear = await prisma.category.upsert({
    where: { slug: 'traditional-wear' },
    update: {},
    create: {
      name: 'Traditional Wear',
      slug: 'traditional-wear',
      description: 'Ethiopian traditional clothing and cultural attire',
      categoryType: CategoryType.category,
      parentId: clothing.id,
      level: 1,
      sortOrder: 3,
      isActive: true,
    },
  });

  const kidsWear = await prisma.category.upsert({
    where: { slug: 'kids-wear' },
    update: {},
    create: {
      name: "Kids' Wear",
      slug: 'kids-wear',
      description: 'Clothing for children and babies',
      categoryType: CategoryType.category,
      parentId: clothing.id,
      level: 1,
      sortOrder: 4,
      isActive: true,
    },
  });

  console.log('✓ Categories created');

  // ============================================
  // SUBCATEGORIES (Level 2)
  // ============================================

  // Men's Wear Subcategories
  await prisma.category.upsert({
    where: { slug: 'mens-shirts' },
    update: {},
    create: {
      name: 'Shirts',
      slug: 'mens-shirts',
      description: 'Men\'s shirts in various styles',
      categoryType: CategoryType.subcategory,
      parentId: mensWear.id,
      level: 2,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'mens-pants' },
    update: {},
    create: {
      name: 'Pants & Trousers',
      slug: 'mens-pants',
      description: 'Men\'s pants, trousers, and casual bottoms',
      categoryType: CategoryType.subcategory,
      parentId: mensWear.id,
      level: 2,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'mens-suits' },
    update: {},
    create: {
      name: 'Suits & Jackets',
      slug: 'mens-suits',
      description: 'Formal suits and jackets for men',
      categoryType: CategoryType.subcategory,
      parentId: mensWear.id,
      level: 2,
      sortOrder: 3,
      isActive: true,
    },
  });

  // Women's Wear Subcategories
  await prisma.category.upsert({
    where: { slug: 'womens-dresses' },
    update: {},
    create: {
      name: 'Dresses',
      slug: 'womens-dresses',
      description: 'Women\'s dresses in various styles',
      categoryType: CategoryType.subcategory,
      parentId: womensWear.id,
      level: 2,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'womens-tops' },
    update: {},
    create: {
      name: 'Tops & Blouses',
      slug: 'womens-tops',
      description: 'Women\'s tops, blouses, and shirts',
      categoryType: CategoryType.subcategory,
      parentId: womensWear.id,
      level: 2,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'womens-skirts' },
    update: {},
    create: {
      name: 'Skirts',
      slug: 'womens-skirts',
      description: 'Women\'s skirts in various lengths',
      categoryType: CategoryType.subcategory,
      parentId: womensWear.id,
      level: 2,
      sortOrder: 3,
      isActive: true,
    },
  });

  // Traditional Wear Subcategories
  await prisma.category.upsert({
    where: { slug: 'habesha-kemis' },
    update: {},
    create: {
      name: 'Habesha Kemis',
      slug: 'habesha-kemis',
      description: 'Traditional Ethiopian dress for women',
      categoryType: CategoryType.subcategory,
      parentId: traditionalWear.id,
      level: 2,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'gabi' },
    update: {},
    create: {
      name: 'Gabi & Netela',
      slug: 'gabi',
      description: 'Traditional Ethiopian wraps and shawls',
      categoryType: CategoryType.subcategory,
      parentId: traditionalWear.id,
      level: 2,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'shema' },
    update: {},
    create: {
      name: 'Shema',
      slug: 'shema',
      description: 'Traditional Ethiopian men\'s wear',
      categoryType: CategoryType.subcategory,
      parentId: traditionalWear.id,
      level: 2,
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('✓ Subcategories created');

  // ============================================
  // PRODUCT TYPES
  // ============================================

  await prisma.productType.upsert({
    where: { name: 'shirt' },
    update: {},
    create: {
      name: 'shirt',
      displayName: 'Shirt',
      description: 'Standard shirt with size and color options',
      icon: 'shirt',
      hasVariants: true,
      hasSize: true,
      hasColor: true,
      sizeOptions: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colorOptions: ['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow'],
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.productType.upsert({
    where: { name: 'dress' },
    update: {},
    create: {
      name: 'dress',
      displayName: 'Dress',
      description: 'Dress with size and color options',
      icon: 'shirt',
      hasVariants: true,
      hasSize: true,
      hasColor: true,
      sizeOptions: ['XS', 'S', 'M', 'L', 'XL'],
      colorOptions: ['White', 'Black', 'Blue', 'Red', 'Pink', 'Yellow'],
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.productType.upsert({
    where: { name: 'traditional' },
    update: {},
    create: {
      name: 'traditional',
      displayName: 'Traditional Wear',
      description: 'Traditional Ethiopian clothing with measurements',
      icon: 'shirt',
      hasVariants: true,
      hasSize: true,
      hasColor: true,
      requiresMeasurements: true,
      measurementFields: [
        { name: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
        { name: 'chest', label: 'Chest', unit: 'cm' },
        { name: 'waist', label: 'Waist', unit: 'cm' },
        { name: 'length', label: 'Length', unit: 'cm' },
      ],
      sizeOptions: ['S', 'M', 'L', 'XL'],
      colorOptions: ['White', 'Black', 'Red', 'Green', 'Gold'],
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log('✓ Product types created');

  // ============================================
  // CREATE ADMIN USER
  // ============================================

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  if (adminPassword.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminEmail = 'admin@fikir.com';

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username: adminUsername,
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        email: adminEmail,
        role: UserRole.admin,
        isActive: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: UserRole.admin,
        isActive: true,
      },
    });
  }

  console.log(`✓ Admin user ready — username: ${adminUsername} / password: (see ADMIN_PASSWORD in .env)`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
