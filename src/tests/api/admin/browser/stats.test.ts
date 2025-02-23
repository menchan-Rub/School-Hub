import type { NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/admin/browser/stats/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma');

describe('Browser Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('認証されていないユーザーからのリクエストを拒否する', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks();

    const response = await GET() as NextResponse;
    expect(response.status).toBe(401);
  });

  it('管理者以外のユーザーからのリクエストを拒否する', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'USER' }
    });
    const { req, res } = createMocks();

    const response = await GET() as NextResponse;
    expect(response.status).toBe(401);
  });

  it('統計情報を正常に取得できる', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    const mockStats = {
      totalUsers: 100,
      activeUsers: 50,
      totalHistory: 1000,
      blockedUrls: 10,
      popularDomains: [
        {
          domain: 'example.com',
          visits: 500
        }
      ]
    };

    (prisma.user.count as jest.Mock).mockResolvedValue(mockStats.totalUsers);
    (prisma.browserHistory.groupBy as jest.Mock).mockResolvedValue(
      Array(mockStats.activeUsers).fill({})
    );
    (prisma.browserHistory.count as jest.Mock)
      .mockResolvedValueOnce(mockStats.totalHistory)
      .mockResolvedValueOnce(mockStats.blockedUrls);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockStats.popularDomains);

    const { req, res } = createMocks();
    const response = await GET() as NextResponse;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockStats);
  });

  it('エラー発生時に500エラーを返す', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    (prisma.user.count as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const { req, res } = createMocks();
    const response = await GET() as NextResponse;

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('統計データの取得に失敗しました');
  });

  it('アクティブユーザーの計算が正しく行われる', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    await GET();

    expect(prisma.browserHistory.groupBy).toHaveBeenCalledWith({
      by: ['userId'],
      where: {
        timestamp: {
          gte: expect.any(Date)
        }
      }
    });
  });

  it('人気ドメインのクエリが正しく実行される', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    await GET();

    expect(prisma.$queryRaw).toHaveBeenCalledWith(
      expect.stringContaining('SELECT')
    );
  });
}); 