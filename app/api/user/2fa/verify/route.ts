import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

// バックアップコードを生成する関数
function generateBackupCodes(count = 10): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // 8文字のランダムな16進数コードを生成
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('認証が必要です', { status: 401 });
    }
    
    const body = await req.json();
    const { code } = body;
    
    if (!code) {
      return new NextResponse('認証コードが必要です', { status: 400 });
    }
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || !user.twoFactorSecret) {
      return new NextResponse('2FA設定が見つかりません', { status: 404 });
    }
    
    // 認証コードを検証
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    
    if (!verified) {
      return new NextResponse('無効な認証コードです', { status: 400 });
    }
    
    // バックアップコードを生成
    const backupCodes = generateBackupCodes();
    
    // 2FAを有効化し、バックアップコードを保存
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: '2FAが有効化されました',
      backupCodes,
    });
  } catch (error) {
    console.error('2FA検証エラー:', error);
    return new NextResponse('サーバーエラーが発生しました', { status: 500 });
  }
} 