import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('認証が必要です', { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });
    
    if (!user) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }
    
    return NextResponse.json({
      enabled: !!user.twoFactorEnabled,
    });
  } catch (error) {
    console.error('2FA状態取得エラー:', error);
    return new NextResponse('サーバーエラーが発生しました', { status: 500 });
  }
} 