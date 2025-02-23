import type { NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/admin/browser/alerts/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

jest.mock('next-auth');
jest.mock('@/lib/prisma');

describe('Browser Alerts API', () => {
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

  it('アラートを正常に取得できる', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    const mockAlerts = [
      {
        id: '1',
        severity: 'warning',
        message: 'テストアラート',
        createdAt: new Date()
      }
    ];

    (prisma.browserSecurityAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

    const { req, res } = createMocks();
    const response = await GET() as NextResponse;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      type: 'warning',
      message: 'テストアラート'
    });
  });

  it('エラー発生時に500エラーを返す', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    (prisma.browserSecurityAlert.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const { req, res } = createMocks();
    const response = await GET() as NextResponse;

    expect(response.status).toBe(500);
  });

  it('24時間以内のアラートのみを取得する', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    await GET();

    expect(prisma.browserSecurityAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: expect.any(Date)
          }
        }
      })
    );
  });
}); 