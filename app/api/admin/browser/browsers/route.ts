import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PerformanceUtils } from '@/browser/utils/performance-utils';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.role || !['super_admin', 'admin'].includes(session.user.role)) {
            console.error('Unauthorized access attempt:', session?.user?.email);
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const stats = await PerformanceUtils.getBrowserStats();
        return NextResponse.json(stats.browsers || []);
    } catch (error) {
        console.error('Failed to get browser information:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 