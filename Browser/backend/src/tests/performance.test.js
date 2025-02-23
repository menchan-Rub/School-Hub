const { startRequest, endRequest, monitorMemory, monitorCPU, monitorEventLoop, getMetrics, getOptimizationRecommendations } = require('../utils/performance');
const logger = require('../utils/logger');

// モックの設定
jest.mock('../utils/logger');
jest.useFakeTimers();

describe('Performance Monitoring Tests', () => {
  let requestId;

  beforeEach(() => {
    // メトリクスのリセット
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Request Performance', () => {
    test('should track request start and end times', () => {
      const req = { method: 'GET', path: '/test' };
      requestId = startRequest(req);
      expect(requestId).toBeDefined();

      const res = { statusCode: 200 };
      const metrics = endRequest(requestId, res);
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('method', 'GET');
      expect(metrics).toHaveProperty('path', '/test');
      expect(metrics).toHaveProperty('statusCode', 200);
    });
  });

  describe('Memory Monitoring', () => {
    test('should monitor memory usage', () => {
      const memoryMetrics = monitorMemory();
      expect(memoryMetrics).toHaveProperty('heapUsed');
      expect(memoryMetrics).toHaveProperty('heapTotal');
      expect(memoryMetrics).toHaveProperty('rss');
      expect(memoryMetrics).toHaveProperty('external');
      expect(memoryMetrics.heapUsed).toBeGreaterThan(0);
    });

    test('should trigger warning on high memory usage', () => {
      // メモリ使用量が閾値を超えた状態をモック
      const mockMemoryUsage = {
        heapUsed: 800,
        heapTotal: 1000,
        external: 100,
        rss: 2000
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      monitorMemory();
      expect(logger.warn).toHaveBeenCalledWith('High memory usage detected', expect.any(Object));
    });
  });

  describe('CPU Monitoring', () => {
    test('should monitor CPU usage', async () => {
      const cpuMetrics = await monitorCPU();
      expect(cpuMetrics).toHaveProperty('user');
      expect(cpuMetrics).toHaveProperty('system');
      expect(cpuMetrics).toHaveProperty('percentage');
      expect(cpuMetrics.percentage).toBeGreaterThanOrEqual(0);
      expect(cpuMetrics.percentage).toBeLessThanOrEqual(100);
    });

    test('should trigger warning on high CPU usage', async () => {
      const mockCpuUsage = {
        user: 50000000,
        system: 40000000
      };
      jest.spyOn(process, 'cpuUsage').mockReturnValue(mockCpuUsage);

      await monitorCPU();
      expect(logger.warn).toHaveBeenCalledWith('High CPU usage detected', expect.any(Object));
    });
  });

  describe('Event Loop Monitoring', () => {
    test('should monitor event loop lag', () => {
      const eventLoopMetrics = monitorEventLoop();
      expect(eventLoopMetrics).toHaveProperty('lag');
      expect(eventLoopMetrics).toHaveProperty('timestamp');
      expect(eventLoopMetrics.lag).toBeGreaterThanOrEqual(0);
    });

    test('should trigger warning on high event loop lag', () => {
      // 高遅延をシミュレート
      jest.spyOn(process, 'hrtime').mockImplementation(() => [0, 150000000]);

      monitorEventLoop();
      jest.runAllImmediates();

      expect(logger.warn).toHaveBeenCalledWith('High event loop lag detected', expect.any(Object));
    });
  });

  describe('Metrics Collection', () => {
    test('should get all performance metrics', () => {
      const metrics = getMetrics();
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('eventLoop');
    });
  });

  describe('Optimization Recommendations', () => {
    test('should provide optimization recommendations', () => {
      const recommendations = getOptimizationRecommendations();
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.every(rec => 
        rec.hasOwnProperty('type') && 
        rec.hasOwnProperty('message') && 
        rec.hasOwnProperty('priority')
      )).toBe(true);
    });

    test('should detect memory leaks', () => {
      // メモリリークをシミュレート
      const mockMemoryUsage = {
        heapUsed: 1000,
        heapTotal: 2000,
        external: 100,
        rss: 3000
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      for (let i = 0; i < 10; i++) {
        mockMemoryUsage.heapUsed += 100;
        monitorMemory();
      }

      const recommendations = getOptimizationRecommendations();
      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'memory',
          severity: 'high'
        })
      );
    });

    test('should detect high CPU usage', async () => {
      const mockCpuUsage = {
        user: 40000000,
        system: 35000000
      };
      jest.spyOn(process, 'cpuUsage').mockReturnValue(mockCpuUsage);

      for (let i = 0; i < 10; i++) {
        await monitorCPU();
      }

      const recommendations = getOptimizationRecommendations();
      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'cpu',
          severity: 'medium'
        })
      );
    });

    test('should detect event loop delays', () => {
      // イベントループ遅延をシミュレート
      jest.spyOn(process, 'hrtime').mockImplementation(() => [0, 60000000]);

      for (let i = 0; i < 10; i++) {
        monitorEventLoop();
        jest.runAllImmediates();
      }

      const recommendations = getOptimizationRecommendations();
      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'eventLoop',
          severity: 'medium'
        })
      );
    });
  });

  describe('Metrics Management', () => {
    test('should clean up old metrics', () => {
      const oldDate = Date.now() - 25 * 60 * 60 * 1000; // 25時間前
      jest.spyOn(Date, 'now').mockReturnValueOnce(oldDate);

      monitorMemory();
      monitorEventLoop();
      jest.runAllImmediates();

      jest.spyOn(Date, 'now').mockRestore();
      const metrics = getMetrics();

      expect(metrics.memory).not.toContainEqual(
        expect.objectContaining({
          timestamp: oldDate
        })
      );
      expect(metrics.eventLoop).not.toContainEqual(
        expect.objectContaining({
          timestamp: oldDate
        })
      );
    });

    test('should maintain active requests count', () => {
      const req1 = { id: '1', url: '/test1', method: 'GET' };
      const req2 = { id: '2', url: '/test2', method: 'POST' };
      const res = { statusCode: 200 };

      startRequest(req1);
      startRequest(req2);
      
      const metrics = getMetrics();
      expect(metrics.activeRequests).toBe(2);

      endRequest('1', res);
      expect(getMetrics().activeRequests).toBe(1);
    });
  });
}); 