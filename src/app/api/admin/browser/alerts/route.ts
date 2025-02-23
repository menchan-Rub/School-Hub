import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const alerts = await prisma.browserSecurityAlert.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('アラート取得エラー:', error);
    return new NextResponse(null, { status: 500 });
  }
} 