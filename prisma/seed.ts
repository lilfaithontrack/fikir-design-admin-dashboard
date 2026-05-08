import 'dotenv/config';
import {
  PrismaClient,
  Prisma,
  CategoryType,
  UserRole,
  OrderStatus,
  ProductStatus,
  WorkflowStage,
  ClothType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const money = (n: number | string) => new Prisma.Decimal(n);

async function assertMigrationsApplied() {
  const rows = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*) AS c FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'categories'
  `;
  const n = Number(rows[0]?.c ?? 0);
  if (n === 0) {
    throw new Error(
      'Database has no Prisma tables yet (categories missing).\n' +
        'On the VPS run migrations first, then seed:\n' +
        '  npx prisma migrate deploy\n' +
        '  npm run seed\n' +
        'Or one command:\n' +
        '  npm run db:setup\n' +
        'Tip: type migrate deploy on its own line after generate — do not paste multiple commands into one line.',
    );
  }
}

async function upsertAdminAndStaff() {
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fikirdesign.com').trim().toLowerCase();

  if (adminPassword.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  const staffSeedPassword = (process.env.STAFF_SEED_PASSWORD || 'staff123').trim();
  if (staffSeedPassword.length < 6) {
    throw new Error('STAFF_SEED_PASSWORD must be at least 6 characters');
  }

  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  const hashedStaff = await bcrypt.hash(staffSeedPassword, 10);

  const adminExisting = await prisma.user.findFirst({
    where: { OR: [{ username: adminUsername }, { email: adminEmail }] },
  });

  const admin =
    adminExisting != null
      ? await prisma.user.update({
          where: { id: adminExisting.id },
          data: {
            username: adminUsername,
            firstName: 'Admin',
            lastName: 'User',
            password: hashedAdmin,
            email: adminEmail,
            role: UserRole.admin,
            isActive: true,
          },
        })
      : await prisma.user.create({
          data: {
            username: adminUsername,
            email: adminEmail,
            firstName: 'Admin',
            lastName: 'User',
            password: hashedAdmin,
            role: UserRole.admin,
            isActive: true,
          },
        });

  console.log(`✓ Admin — username: ${adminUsername} | email: ${adminEmail} (password: ADMIN_PASSWORD)`);

  const staffDefs: { username: string; email: string; firstName: string; lastName: string; role: UserRole }[] = [
    { username: 'manager', email: 'manager@fikirdesign.com', firstName: 'Sara', lastName: 'Manager', role: UserRole.manager },
    { username: 'designer1', email: 'designer@fikirdesign.com', firstName: 'Liya', lastName: 'Designer', role: UserRole.designer },
    { username: 'sewer1', email: 'sewer@fikirdesign.com', firstName: 'Tigist', lastName: 'Sewer', role: UserRole.sewer },
    { username: 'sales1', email: 'sales@fikirdesign.com', firstName: 'Daniel', lastName: 'Sales', role: UserRole.sales },
    { username: 'store1', email: 'store@fikirdesign.com', firstName: 'Meron', lastName: 'Store', role: UserRole.store_keeper },
  ];

  for (const s of staffDefs) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: s.username }, { email: s.email }] },
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: s.username,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          password: hashedStaff,
          role: s.role,
          isActive: true,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          username: s.username,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          password: hashedStaff,
          role: s.role,
          isActive: true,
        },
      });
    }
  }

  console.log(`✓ Staff demo users (password: STAFF_SEED_PASSWORD / default staff123) — ${staffDefs.map((x) => x.username).join(', ')}`);

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: money(0), currency: 'ETB' },
  });

  return admin;
}

async function main() {
  console.log('Starting seed...');
  await assertMigrationsApplied();

  const adminUser = await upsertAdminAndStaff();

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
  // DEMO CUSTOMERS, PRODUCTS, INVENTORY, ORDERS, RAW MATERIALS
  // ============================================

  const habeshaSub = await prisma.category.findUnique({ where: { slug: 'habesha-kemis' } });
  const shirtType = await prisma.productType.findUnique({ where: { name: 'shirt' } });
  const dressType = await prisma.productType.findUnique({ where: { name: 'dress' } });

  if (!habeshaSub || !shirtType || !dressType) {
    throw new Error('Seed prerequisites missing: expected categories and product types');
  }

  const customerA = await prisma.customer.upsert({
    where: { email: 'customer.demo@fikirdesign.com' },
    update: {},
    create: {
      firstName: 'Aster',
      lastName: 'Bekele',
      email: 'customer.demo@fikirdesign.com',
      phone: '+251911000001',
      city: 'Addis Ababa',
      address: 'Bole',
    },
  });

  const customerB = await prisma.customer.upsert({
    where: { email: 'business.client@fikirdesign.com' },
    update: {},
    create: {
      firstName: 'Yonas',
      lastName: 'Tadesse',
      email: 'business.client@fikirdesign.com',
      phone: '+251911000002',
      city: 'Hawassa',
    },
  });

  let productShirt = await prisma.product.findUnique({ where: { sku: 'SEED-SHIRT-001' } });
  if (!productShirt) {
    productShirt = await prisma.product.create({
      data: {
        name: 'Classic Cotton Shirt',
        slug: 'seed-classic-cotton-shirt',
        sku: 'SEED-SHIRT-001',
        basePrice: money(1299.99),
        costPrice: money(650),
        status: ProductStatus.active,
        productTypeId: shirtType.id,
        categoryId: habeshaSub.id,
        createdBy: adminUser.id,
        publishedAt: new Date(),
        descriptionShort: 'Demo product for inventory dashboard',
      },
    });
    await prisma.inventory.create({
      data: {
        productId: productShirt.id,
        quantity: 42,
        lowStockThreshold: 8,
      },
    });
  }

  let productDress = await prisma.product.findUnique({ where: { sku: 'SEED-DRESS-001' } });
  if (!productDress) {
    productDress = await prisma.product.create({
      data: {
        name: 'Habesha Kemis — Demo',
        slug: 'seed-habesha-kemis-demo',
        sku: 'SEED-DRESS-001',
        basePrice: money(4500),
        costPrice: money(2200),
        status: ProductStatus.active,
        productTypeId: dressType.id,
        categoryId: habeshaSub.id,
        createdBy: adminUser.id,
        publishedAt: new Date(),
        descriptionShort: 'Traditional dress — demo listing',
      },
    });
    await prisma.inventory.create({
      data: {
        productId: productDress.id,
        quantity: 15,
        lowStockThreshold: 3,
      },
    });
  }

  let rmCotton = await prisma.rawMaterial.findFirst({ where: { name: 'Seed Habesha Cotton Roll' } });
  if (!rmCotton) {
    rmCotton = await prisma.rawMaterial.create({
      data: {
        name: 'Seed Habesha Cotton Roll',
        clothType: ClothType.habesha_cotton,
        colorOrPattern: 'White / Gold trim',
        supplier: 'Demo Supplier PLC',
        quantityInStock: money(120),
        lowStockAlert: money(20),
        costPerMeter: money(85),
        widthCm: money(150),
      },
    });
  } else {
    await prisma.rawMaterial.update({
      where: { id: rmCotton.id },
      data: {
        quantityInStock: money(120),
        lowStockAlert: money(20),
        costPerMeter: money(85),
        isActive: true,
      },
    });
  }

  let rmChiffon = await prisma.rawMaterial.findFirst({ where: { name: 'Seed Chiffon Bolt' } });
  if (!rmChiffon) {
    rmChiffon = await prisma.rawMaterial.create({
      data: {
        name: 'Seed Chiffon Bolt',
        clothType: ClothType.chiffon,
        colorOrPattern: 'Emerald',
        supplier: 'Textile Importers',
        quantityInStock: money(45),
        lowStockAlert: money(10),
        costPerMeter: money(120),
        widthCm: money(140),
      },
    });
  }

  let order1 = await prisma.order.findUnique({ where: { orderNumber: 'ORD-SEED-2026-001' } });
  if (!order1) {
    order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-SEED-2026-001',
        customerId: customerA.id,
        status: OrderStatus.design_in_progress,
        currentStage: WorkflowStage.designer,
        subtotal: money(5799.99),
        tax: money(0),
        shipping: money(150),
        discount: money(0),
        total: money(5949.99),
        isHighPriority: false,
        notes: 'Demo order from seed',
        items: {
          create: [
            {
              productId: productShirt.id,
              name: productShirt.name,
              sku: productShirt.sku,
              quantity: 1,
              price: money(1299.99),
              discount: money(0),
              tax: money(0),
              total: money(1299.99),
            },
            {
              productId: productDress.id,
              name: productDress.name,
              sku: productDress.sku,
              quantity: 1,
              price: money(4500),
              discount: money(0),
              tax: money(0),
              total: money(4500),
            },
          ],
        },
      },
    });
    await prisma.workflowStageEvent.create({
      data: {
        orderId: order1.id,
        fromStage: WorkflowStage.crm_data,
        toStage: WorkflowStage.designer,
        actorUserId: adminUser.id,
        actorRole: UserRole.admin,
        comment: 'Seed: moved to designer stage',
      },
    });
  }

  let order2 = await prisma.order.findUnique({ where: { orderNumber: 'ORD-SEED-2026-002' } });
  if (!order2) {
    order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-SEED-2026-002',
        customerId: customerB.id,
        status: OrderStatus.pending,
        currentStage: WorkflowStage.crm_data,
        subtotal: money(1299.99),
        tax: money(0),
        shipping: money(0),
        discount: money(0),
        total: money(1299.99),
        items: {
          create: [
            {
              productId: productShirt.id,
              name: productShirt.name,
              sku: productShirt.sku,
              quantity: 1,
              price: money(1299.99),
              discount: money(0),
              tax: money(0),
              total: money(1299.99),
            },
          ],
        },
      },
    });
  }

  await prisma.customer.update({
    where: { id: customerA.id },
    data: {
      totalOrders: 1,
      totalSpent: money(5949.99),
      lastOrderDate: new Date(),
    },
  });

  await prisma.customer.update({
    where: { id: customerB.id },
    data: {
      totalOrders: 1,
      totalSpent: money(1299.99),
      lastOrderDate: new Date(),
    },
  });

  console.log('✓ Demo customers, products, inventory, orders, raw materials');

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
