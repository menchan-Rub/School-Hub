const { createLogFile, writeLog, rotateLog, searchLogs, deleteLogs, getLogStats } = require('../utils/logs');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// モックの設定
jest.mock('../utils/logger');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('Logs Management Tests', () => {
  const testLogDir = path.join(__dirname, '../../logs');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Log File Creation', () => {
    test('should create new log file', async () => {
      const logType = 'application';
      const date = new Date('2024-02-20');
      jest.spyOn(Date, 'now').mockReturnValue(date.getTime());

      await createLogFile(logType);

      expect(fs.mkdir).toHaveBeenCalledWith(testLogDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`${logType}-2024-02-20.log`),
        expect.any(String),
        'utf8'
      );
    });

    test('should handle file creation errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Failed to create file'));

      await expect(createLogFile('error')).rejects.toThrow('Failed to create file');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Log Writing', () => {
    test('should write log with metadata', async () => {
      const logType = 'application';
      const message = 'Test log message';
      const metadata = { userId: '123', action: 'test' };

      await writeLog(logType, message, metadata);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(message),
        { flag: 'a', encoding: 'utf8' }
      );
    });

    test('should format log message correctly', async () => {
      const message = 'Test log message';
      const metadata = { userId: '123' };

      await writeLog('application', message, metadata);

      const writeCall = fs.writeFile.mock.calls[0];
      const logContent = writeCall[1];

      expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
      expect(logContent).toContain(message);
      expect(logContent).toContain(JSON.stringify(metadata));
    });
  });

  describe('Log Rotation', () => {
    test('should rotate logs when size exceeds limit', async () => {
      fs.stat.mockResolvedValue({ size: 11 * 1024 * 1024 }); // 11MB

      await rotateLog('application');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Log rotated'),
        expect.any(Object)
      );
    });

    test('should keep rotated log backups', async () => {
      const date = new Date('2024-02-20');
      jest.spyOn(Date, 'now').mockReturnValue(date.getTime());

      await rotateLog('application');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('application-2024-02-20'),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('Log Search', () => {
    test('should search logs by date range', async () => {
      const searchOptions = {
        startDate: '2024-02-19',
        endDate: '2024-02-20',
        type: 'application'
      };

      fs.readdir.mockResolvedValue(['application-2024-02-19.log', 'application-2024-02-20.log']);
      fs.readFile.mockResolvedValue('Test log content');

      const results = await searchLogs(searchOptions);

      expect(results).toBeInstanceOf(Array);
      expect(fs.readFile).toHaveBeenCalled();
    });

    test('should search logs by content', async () => {
      const searchOptions = {
        content: 'error',
        type: 'error'
      };

      fs.readdir.mockResolvedValue(['error-2024-02-20.log']);
      fs.readFile.mockResolvedValue('Test error log content');

      const results = await searchLogs(searchOptions);

      expect(results).toBeInstanceOf(Array);
      expect(results.every(log => log.includes('error'))).toBe(true);
    });
  });

  describe('Log Deletion', () => {
    test('should delete logs by date range', async () => {
      const deleteOptions = {
        startDate: '2024-02-19',
        endDate: '2024-02-20',
        type: 'application'
      };

      fs.readdir.mockResolvedValue(['application-2024-02-19.log', 'application-2024-02-20.log']);

      await deleteLogs(deleteOptions);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Logs deleted'),
        expect.any(Object)
      );
    });

    test('should handle deletion errors', async () => {
      fs.unlink.mockRejectedValue(new Error('Failed to delete file'));

      await expect(deleteLogs({ type: 'error' })).rejects.toThrow('Failed to delete file');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Log Statistics', () => {
    test('should get log statistics', async () => {
      fs.readdir.mockResolvedValue(['application-2024-02-20.log', 'error-2024-02-20.log']);
      fs.stat.mockResolvedValue({ size: 1024 });

      const stats = await getLogStats();

      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('fileCount');
      expect(stats).toHaveProperty('typeBreakdown');
    });

    test('should calculate statistics correctly', async () => {
      fs.readdir.mockResolvedValue(['application-2024-02-20.log', 'error-2024-02-20.log']);
      fs.stat.mockResolvedValue({ size: 1024 });

      const stats = await getLogStats();

      expect(stats.fileCount).toBe(2);
      expect(stats.totalSize).toBe(2048);
      expect(stats.typeBreakdown).toHaveProperty('application');
      expect(stats.typeBreakdown).toHaveProperty('error');
    });
  });
}); 