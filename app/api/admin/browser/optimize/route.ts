import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerformanceUtils } from '@/browser/utils/performance-utils';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.role || !['super_admin', 'admin'].includes(session.user.role)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const result = await PerformanceUtils.optimizePerformance();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to optimize browser performance:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 