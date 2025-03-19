import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('認証が必要です', { status: 401 });
    }
    
    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }
    
    // 2FAを無効化
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: '2FAが無効化されました',
    });
  } catch (error) {
    console.error('2FA無効化エラー:', error);
    return new NextResponse('サーバーエラーが発生しました', { status: 500 });
  }
} 