const { checkHealth, checkDatabase, checkMemory, checkDiskSpace, checkConnections } = require('../utils/health');
const logger = require('../utils/logger');
const { Pool } = require('pg');

// モックの設定
jest.mock('../utils/logger');
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe('Health Check Tests', () => {
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('Overall Health Check', () => {
    test('should perform complete health check', async () => {
      const healthStatus = await checkHealth();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('checks');
      expect(healthStatus.checks).toHaveProperty('database');
      expect(healthStatus.checks).toHaveProperty('memory');
      expect(healthStatus.checks).toHaveProperty('diskSpace');
    });

    test('should return healthy status when all checks pass', async () => {
      pool.query.mockResolvedValue({ rows: [{ now: new Date() }] });
      
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 100,
        heapTotal: 1000,
        external: 50,
        rss: 500
      });

      const healthStatus = await checkHealth();
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.checks.database.status).toBe('healthy');
      expect(healthStatus.checks.memory.status).toBe('healthy');
    });

    test('should return unhealthy status on check failure', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      const healthStatus = await checkHealth();
      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.checks.database.status).toBe('error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Database Health Check', () => {
    test('should check database connectivity', async () => {
      pool.query.mockResolvedValue({ rows: [{ now: new Date() }] });

      const dbHealth = await checkDatabase();
      expect(dbHealth.status).toBe('healthy');
      expect(dbHealth.responseTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle connection failures', async () => {
      pool.query.mockRejectedValue(new Error('Connection failed'));

      const dbHealth = await checkDatabase();
      expect(dbHealth.status).toBe('error');
      expect(dbHealth.error).toBeDefined();
      expect(logger.error).toHaveBeenCalled();
    });

    test('should measure response time', async () => {
      pool.query.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({ rows: [{ now: new Date() }] });
        }, 100);
      }));

      const dbHealth = await checkDatabase();
      expect(dbHealth.responseTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Health Check', () => {
    test('should check memory usage', () => {
      const memoryHealth = checkMemory();

      expect(memoryHealth).toHaveProperty('status');
      expect(memoryHealth).toHaveProperty('used');
      expect(memoryHealth).toHaveProperty('total');
      expect(memoryHealth).toHaveProperty('percentage');
    });

    test('should warn on high memory usage', () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 800,
        heapTotal: 1000,
        external: 100,
        rss: 2000
      });

      const memoryHealth = checkMemory();
      expect(memoryHealth.status).toBe('warning');
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should calculate usage percentage', () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 500,
        heapTotal: 1000,
        external: 100,
        rss: 1500
      });

      const memoryHealth = checkMemory();
      expect(memoryHealth.percentage).toBe(50);
    });
  });

  describe('Disk Space Check', () => {
    test('should check disk space usage', async () => {
      const diskHealth = await checkDiskSpace();

      expect(diskHealth).toHaveProperty('status');
      expect(diskHealth).toHaveProperty('free');
      expect(diskHealth).toHaveProperty('total');
      expect(diskHealth).toHaveProperty('percentage');
    });

    test('should warn on low disk space', async () => {
      jest.spyOn(require('fs'), 'statfs').mockImplementation((path, callback) => {
        callback(null, {
          blocks: 1000,
          bfree: 50,
          bavail: 50
        });
      });

      const diskHealth = await checkDiskSpace();
      expect(diskHealth.status).toBe('warning');
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should handle check errors', async () => {
      jest.spyOn(require('fs'), 'statfs').mockImplementation((path, callback) => {
        callback(new Error('Failed to check disk space'));
      });

      const diskHealth = await checkDiskSpace();
      expect(diskHealth.status).toBe('error');
      expect(diskHealth.error).toBeDefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Connection Health Check', () => {
    test('should check active connections', () => {
      const connectionHealth = checkConnections();

      expect(connectionHealth).toHaveProperty('status');
      expect(connectionHealth).toHaveProperty('active');
      expect(connectionHealth).toHaveProperty('limit');
      expect(connectionHealth).toHaveProperty('percentage');
    });

    test('should warn on high connection count', () => {
      global.wss = {
        clients: new Set(Array(900).fill(null))
      };

      const connectionHealth = checkConnections();
      expect(connectionHealth.status).toBe('warning');
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should calculate connection percentage', () => {
      global.wss = {
        clients: new Set(Array(500).fill(null))
      };

      const connectionHealth = checkConnections();
      expect(connectionHealth.percentage).toBe(50);
    });
  });

  describe('Health Check Logging', () => {
    test('should log health check results', async () => {
      await checkHealth();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Health check completed'),
        expect.any(Object)
      );
    });

    test('should log warnings on degraded health', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await checkHealth();
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should log errors on health check failures', async () => {
      const error = new Error('Critical error');
      pool.query.mockRejectedValue(error);

      await checkHealth();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Health check failed'),
        expect.objectContaining({ error })
      );
    });
  });
}); 