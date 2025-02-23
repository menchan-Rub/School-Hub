const { collectSystemMetrics, collectDatabaseMetrics, collectApplicationMetrics, recordError, pruneMetrics, checkHealth, getEventLoopLag, getWebSocketConnectionCount } = require('../utils/monitoring');
const logger = require('../utils/logger');

// モックの設定
jest.mock('../utils/logger');
jest.useFakeTimers();

describe('System Monitoring Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('System Metrics', () => {
    test('should collect system metrics', () => {
      const metrics = collectSystemMetrics();
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
    });

    test('should alert on high resource usage', () => {
      const mockMetrics = {
        memory: { used: 90, total: 100 },
        cpu: { usage: 95 }
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMetrics.memory);
      
      collectSystemMetrics();
      expect(logger.warn).toHaveBeenCalledWith('High resource usage detected', expect.any(Object));
    });
  });

  describe('Database Metrics', () => {
    test('should collect database metrics', async () => {
      const metrics = await collectDatabaseMetrics();
      expect(metrics).toHaveProperty('connections');
      expect(metrics).toHaveProperty('queryCount');
      expect(metrics).toHaveProperty('slowQueries');
    });

    test('should alert on connection pool issues', async () => {
      const mockMetrics = {
        connections: 95,
        maxConnections: 100
      };
      jest.spyOn(global, 'pool').mockReturnValue(mockMetrics);

      await collectDatabaseMetrics();
      expect(logger.warn).toHaveBeenCalledWith('High database connection usage', expect.any(Object));
    });
  });

  describe('Application Metrics', () => {
    test('should collect application metrics', () => {
      const metrics = collectApplicationMetrics();
      expect(metrics).toHaveProperty('requestCount');
      expect(metrics).toHaveProperty('errorCount');
      expect(metrics).toHaveProperty('responseTime');
    });

    test('should track error rates', () => {
      const error = new Error('Test error');
      recordError(error);
      
      const metrics = collectApplicationMetrics();
      expect(metrics.errorCount).toBeGreaterThan(0);
      expect(logger.error).toHaveBeenCalledWith('Error recorded', expect.any(Object));
    });
  });

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      const health = await checkHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('components');
      expect(health.components).toHaveProperty('database');
      expect(health.components).toHaveProperty('application');
    });

    test('should detect unhealthy state', async () => {
      const mockUnhealthyState = {
        database: { status: 'error' },
        application: { status: 'warning' }
      };
      jest.spyOn(global, 'healthState').mockReturnValue(mockUnhealthyState);

      const health = await checkHealth();
      expect(health.status).toBe('unhealthy');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    test('should monitor event loop lag', () => {
      const lag = getEventLoopLag();
      expect(typeof lag).toBe('number');
      expect(lag).toBeGreaterThanOrEqual(0);
    });

    test('should monitor WebSocket connections', () => {
      const connectionCount = getWebSocketConnectionCount();
      expect(typeof connectionCount).toBe('number');
      expect(connectionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Metrics Management', () => {
    test('should prune old metrics', () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      jest.spyOn(Date, 'now').mockReturnValueOnce(oldDate.getTime());

      pruneMetrics();
      expect(logger.info).toHaveBeenCalledWith('Old metrics pruned', expect.any(Object));
    });
  });
}); 