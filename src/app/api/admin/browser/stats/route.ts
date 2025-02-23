import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalHistory,
      blockedUrls,
      popularDomains
    ] = await Promise.all([
      prisma.user.count(),
      prisma.browserHistory.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.browserHistory.count(),
      prisma.browserHistory.count({
        where: {
          blocked: true
        }
      }),
      prisma.$queryRaw<{ domain: string; visits: number }[]>(
        Prisma.sql`
          SELECT 
            domain,
            COUNT(*) as visits
          FROM "BrowserHistory"
          WHERE timestamp >= ${thirtyDaysAgo}
          GROUP BY domain
          ORDER BY visits DESC
          LIMIT 10
        `
      )
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers: activeUsers.length,
      totalHistory,
      blockedUrls,
      popularDomains
    });
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    return NextResponse.json(
      { error: '統計データの取得に失敗しました' },
      { status: 500 }
    );
  }
} 