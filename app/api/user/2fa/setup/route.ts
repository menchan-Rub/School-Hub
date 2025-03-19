import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

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
    
    // シークレットを生成
    const secret = speakeasy.generateSecret({
      name: `SchoolHub:${user.email}`,
      length: 20,
    });
    
    // QRコードを生成
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    // シークレットを一時的に保存（検証前）
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
      },
    });
    
    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('2FAセットアップエラー:', error);
    return new NextResponse('サーバーエラーが発生しました', { status: 500 });
  }
} 