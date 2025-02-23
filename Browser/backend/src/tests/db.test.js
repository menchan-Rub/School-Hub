const { Pool } = require('pg');
const db = require('../utils/database');
const logger = require('../utils/logger');

jest.mock('../utils/logger');
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }))
}));

describe('Database Tests', () => {
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      pool.connect.mockResolvedValue();

      await expect(db.initialize()).resolves.not.toThrow();
      expect(logger.info).toHaveBeenCalledWith('Database connected successfully');
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      pool.connect.mockRejectedValue(error);

      await expect(db.initialize()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalledWith('Database connection failed:', error);
    });

    test('should close connection properly', async () => {
      await db.cleanup();
      expect(pool.end).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    });
  });

  describe('Query Execution', () => {
    test('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      pool.query.mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM test');
      expect(result).toEqual(mockResult);
    });

    test('should handle query errors', async () => {
      const error = new Error('Query failed');
      pool.query.mockRejectedValue(error);

      await expect(db.query('INVALID SQL')).rejects.toThrow('Query failed');
      expect(logger.error).toHaveBeenCalledWith('Query execution failed:', error);
    });

    test('should handle parameterized queries', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      pool.query.mockResolvedValue(mockResult);

      await db.query('SELECT * FROM test WHERE id = $1', [1]);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM test WHERE id = $1',
        [1]
      );
    });
  });

  describe('Transaction Management', () => {
    test('should execute transaction successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [] });

      await db.transaction(async (client) => {
        await client.query('INSERT INTO test VALUES ($1)', [1]);
        await client.query('UPDATE test SET value = $1', [2]);
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should rollback transaction on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Transaction failed')); // First query fails

      await expect(db.transaction(async (client) => {
        await client.query('INSERT INTO test VALUES ($1)', [1]);
      })).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Database Initialization', () => {
    test('should create tables successfully', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await db.createTables();
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
      expect(logger.info).toHaveBeenCalledWith('Tables created successfully');
    });

    test('should create indices successfully', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await db.createIndices();
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX'));
      expect(logger.info).toHaveBeenCalledWith('Indices created successfully');
    });

    test('should insert initial data successfully', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await db.insertInitialData();
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
      expect(logger.info).toHaveBeenCalledWith('Initial data inserted successfully');
    });
  });

  describe('Health Check', () => {
    test('should check database health successfully', async () => {
      pool.query.mockResolvedValue({ rows: [{ now: new Date() }] });

      const health = await db.checkHealth();
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeDefined();
    });

    test('should detect unhealthy database', async () => {
      pool.query.mockRejectedValue(new Error('Health check failed'));

      const health = await db.checkHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBeDefined();
    });

    test('should measure query response time', async () => {
      const start = Date.now();
      pool.query.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ rows: [{ now: new Date() }] }), 100);
      }));

      const health = await db.checkHealth();
      expect(health.responseTime).toBeGreaterThanOrEqual(100);
    });
  });
}); 