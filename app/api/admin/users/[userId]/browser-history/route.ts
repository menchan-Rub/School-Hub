import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async (req: Request, { params }: { params: { userId: string } }) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.browserHistory.findMany({
        where: {
          userId: params.userId,
          status: 'active'
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.browserHistory.count({
        where: {
          userId: params.userId,
          status: 'active'
        }
      })
    ]);

    return NextResponse.json({
      history,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Admin history fetch error:', error);
    return NextResponse.json(
      { error: '履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (req: Request, { params }: { params: { userId: string } }) => {
  try {
    const { searchParams } = new URL(req.url);
    const historyId = searchParams.get('historyId');

    if (!historyId) {
      return NextResponse.json(
        { error: '履歴IDが必要です' },
        { status: 400 }
      );
    }

    await prisma.browserHistory.update({
      where: {
        id: historyId,
        userId: params.userId
      },
      data: {
        status: 'deleted'
      }
    });

    return NextResponse.json({ message: '履歴を削除しました' });
  } catch (error) {
    console.error('Admin history delete error:', error);
    return NextResponse.json(
      { error: '履歴の削除に失敗しました' },
      { status: 500 }
    );
  }
}); 