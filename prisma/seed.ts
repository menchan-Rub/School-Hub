import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('シードを開始します...');

  // 特権ユーザー（管理者）の作成
  const adminPassword = process.env.ADMIN_PASSWORD || 'iromochi218';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { 
      email: process.env.ADMIN_EMAIL || 'admin@school-hub.com'
    },
    update: {
      passwordHash: hashedPassword,
      role: 'super_admin'
    },
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@school-hub.com',
      name: 'システム管理者',
      passwordHash: hashedPassword,
      role: 'super_admin'
    }
  });

  console.log('特権ユーザー（管理者）を作成/更新しました:', admin.email);
  console.log('シードが完了しました');
}

main()
  .catch((e) => {
    console.error('シード中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 