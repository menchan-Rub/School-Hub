import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('シードを開始します...');

  // システム設定の初期データを作成
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      maintenance: false,
      language: 'ja',
      autoBackup: true,
      queryLogging: true,
      defaultLocale: 'ja-JP',
      timezone: 'Asia/Tokyo'
    }
  });

  // 管理者ユーザーの作成
  const adminPassword = process.env.ADMIN_PASSWORD || 'iromochi218';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@school-hub.com' },
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

  // テストユーザーの作成
  const testUsers = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        name: `テストユーザー${i}`,
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'user'
      }
    });
    testUsers.push(user);
  }

  // テストサーバーの作成
  const servers = [];
  for (let i = 1; i <= 5; i++) {
    const server = await prisma.server.create({
      data: {
        name: `テストサーバー${i}`,
        ownerId: testUsers[0].id,
        status: 'online',
        memberCount: Math.floor(Math.random() * 100),
        messageCount: Math.floor(Math.random() * 1000),
        boostLevel: Math.floor(Math.random() * 3),
        isVerified: Math.random() > 0.5
      }
    });
    servers.push(server);
  }

  // テストメッセージの作成
  for (const server of servers) {
    for (let i = 0; i < 5; i++) {
      await prisma.message.create({
        data: {
          content: `テストメッセージ ${i + 1}`,
          serverId: server.id,
          userId: testUsers[Math.floor(Math.random() * testUsers.length)].id
        }
      });
    }
  }

  // 監査ログの作成
  const actions = ['create', 'update', 'delete', 'login'];
  for (let i = 0; i < 10; i++) {
    await prisma.auditLog.create({
      data: {
        action: actions[Math.floor(Math.random() * actions.length)],
        details: `テスト監査ログ ${i + 1}`,
        adminId: admin.id
      }
    });
  }

  // セキュリティアラートの作成
  const alertTypes = ['high', 'medium', 'low'];
  for (let i = 0; i < 5; i++) {
    await prisma.securityAlert.create({
      data: {
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: `テストセキュリティアラート ${i + 1}`,
        resolved: Math.random() > 0.5
      }
    });
  }

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