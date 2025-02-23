import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerformanceUtils } from '@/browser/utils/performance-utils';

export async function POST() {
    try {
        // セッションの確認
        const session = await getServerSession(authOptions);
        if (!session?.user?.role === 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // メモリとCPUの最適化を実行
        await PerformanceUtils.optimizeForLowMemory();
        await PerformanceUtils.optimizeForLowCPU();

        // 最適化後のメトリクスを取得
        const metrics = PerformanceUtils.createPerformanceMetrics();

        return NextResponse.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('[BROWSER_OPTIMIZE_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
} 