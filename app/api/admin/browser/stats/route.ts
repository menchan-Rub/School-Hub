import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async () => {
  try {
    const [totalUsers, activeUsers, totalHistory, blockedUrls] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),
      
      // アクティブユーザー数（過去7日間）
      prisma.browserHistory.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }).then(users => users.length),

      // 総履歴数
      prisma.browserHistory.count(),

      // ブロックされたURL数
      prisma.browserHistory.count({
        where: {
          status: 'blocked'
        }
      })
    ]);

    // 人気のドメイン
    const popularDomains = await prisma.$queryRaw`
      SELECT 
        regexp_replace(url, '^https?://([^/]+).*', '\\1') as domain,
        COUNT(*) as visits
      FROM "BrowserHistory"
      GROUP BY domain
      ORDER BY visits DESC
      LIMIT 10
    `;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalHistory,
      blockedUrls,
      popularDomains
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: '統計データの取得に失敗しました' },
      { status: 500 }
    );
  }
}); 