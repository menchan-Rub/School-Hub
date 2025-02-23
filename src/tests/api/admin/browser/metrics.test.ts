import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/admin/browser/metrics/route';
import { getServerSession } from 'next-auth';
import { PerformanceUtils } from '@/browser/utils/performance-utils';

jest.mock('next-auth');
jest.mock('@/browser/utils/performance-utils');

describe('Browser Metrics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('認証されていないユーザーからのリクエストを拒否する', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks();

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('管理者以外のユーザーからのリクエストを拒否する', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'USER' }
    });
    const { req, res } = createMocks();

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('メトリクスを正常に取得できる', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    const mockMetrics = {
      timestamp: Date.now(),
      memory: {
        process: {
          heapUsed: { value: 100, unit: 'MB' }
        },
        system: {
          used: { value: 1000, unit: 'MB' }
        }
      },
      cpu: {
        loadAverage: {
          '1min': 0.5
        }
      }
    };

    (PerformanceUtils.createPerformanceMetrics as jest.Mock).mockReturnValue(mockMetrics);

    const { req, res } = createMocks();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockMetrics);
  });

  it('エラー発生時に500エラーを返す', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' }
    });

    (PerformanceUtils.createPerformanceMetrics as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    const { req, res } = createMocks();
    const response = await GET();

    expect(response.status).toBe(500);
  });
}); 