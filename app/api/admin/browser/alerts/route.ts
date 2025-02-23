import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // セッションの確認
        const session = await getServerSession(authOptions);
        if (!session?.user?.role === 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 直近のアラートを取得
        const alerts = await prisma.browserSecurityAlert.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24時間以内
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100
        });

        // アラートをフロントエンド用に整形
        const formattedAlerts = alerts.map(alert => ({
            type: alert.severity as 'warning' | 'error',
            message: alert.message,
            timestamp: alert.createdAt.getTime()
        }));

        return NextResponse.json(formattedAlerts);
    } catch (error) {
        console.error('[BROWSER_ALERTS_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
} 