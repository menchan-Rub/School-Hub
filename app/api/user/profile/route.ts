import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// プロフィール更新リクエストのバリデーション
const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('認証が必要です', { status: 401 });
    }
    
    const body = await req.json();
    
    // リクエストデータのバリデーション
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return new NextResponse('無効なデータです', { status: 400 });
    }
    
    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!existingUser) {
      return new NextResponse('ユーザーが見つかりません', { status: 404 });
    }
    
    // メールアドレスが変更されている場合、重複チェック
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });
      
      if (emailExists) {
        return new NextResponse('このメールアドレスは既に使用されています', { status: 400 });
      }
    }
    
    // プロフィール更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        email: body.email,
        image: body.image,
      },
    });
    
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    return new NextResponse('サーバーエラーが発生しました', { status: 500 });
  }
} 