import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 管理者ロールの作成
  const adminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {
      permissions: {
        admin: true,
        manageUsers: true,
        manageRoles: true,
        security: ['view', 'edit'],
        users: ['view', 'create', 'edit', 'delete'],
        announcements: ['view', 'create', 'edit', 'delete'],
        settings: ['view', 'edit'],
        audit_logs: ['view'],
        messages: ['view', 'delete']
      }
    },
    create: {
      name: 'super_admin',
      permissions: {
        admin: true,
        manageUsers: true,
        manageRoles: true,
        security: ['view', 'edit'],
        users: ['view', 'create', 'edit', 'delete'],
        announcements: ['view', 'create', 'edit', 'delete'],
        settings: ['view', 'edit'],
        audit_logs: ['view'],
        messages: ['view', 'delete']
      }
    }
  });

  // 一般ユーザーロールの作成
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {
      permissions: {
        users: ['view'],
        announcements: ['view'],
        settings: ['view', 'edit']
      }
    },
    create: {
      name: 'user',
      permissions: {
        users: ['view'],
        announcements: ['view'],
        settings: ['view', 'edit']
      }
    }
  });

  // 管理者ユーザーの作成
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@school-hub.com' },
    update: {
      roleId: adminRole.id,
      password: hashedAdminPassword
    },
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@school-hub.com',
      name: 'Administrator',
      password: hashedAdminPassword,
      roleId: adminRole.id
    }
  });

  console.log('Seed completed successfully');
  console.log('Admin role ID:', adminRole.id);
  console.log('User role ID:', userRole.id);
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 