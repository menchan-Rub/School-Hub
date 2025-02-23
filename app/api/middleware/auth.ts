import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    role: {
      name: string;
      permissions: any;
    };
  };
}

// 通常の認証ミドルウェア
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    // リクエストにユーザー情報を追加
    req.user = {
      id: user.id,
      role: user.role
    };

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: '認証に失敗しました' });
  }
}

// 管理者用の認証ミドルウェア
export async function adminMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    await authMiddleware(req, res, async () => {
      // 管理者権限チェック
      if (req.user.role.name !== 'admin') {
        return res.status(403).json({ error: '管理者権限が必要です' });
      }
      return next();
    });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(403).json({ error: '管理者認証に失敗しました' });
  }
}

// ミドルウェアをAPI Routeで使用するためのラッパー関数
export function withAuth(handler: any) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    return new Promise((resolve) => {
      authMiddleware(req, res, () => resolve(handler(req, res)));
    });
  };
}

export function withAdminAuth(handler: any) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    return new Promise((resolve) => {
      adminMiddleware(req, res, () => resolve(handler(req, res)));
    });
  };
} 