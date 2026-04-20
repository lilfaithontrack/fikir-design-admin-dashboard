import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('fikir2024', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fikir.com' },
    update: {},
    create: {
      email: 'admin@fikir.com',
      firstName: 'Fikir',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });

  console.log('Admin user created/updated:', {
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    password: 'fikir2024',
  });
}

createAdminUser()
  .catch((e) => {
    console.error('Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
