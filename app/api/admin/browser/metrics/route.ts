import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerformanceUtils } from '@/browser/utils/performance-utils';

export async function GET() {
    try {
        // セッションの確認
        const session = await getServerSession(authOptions);
        if (!session?.user?.role === 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // メトリクスの取得
        const metrics = PerformanceUtils.createPerformanceMetrics();

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('[BROWSER_METRICS_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
} 