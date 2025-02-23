const backup = require('../utils/backup');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

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
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe('Backup Management', () => {
  let pool;
  const backupDir = path.join(__dirname, '../../backups');

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('Backup Creation', () => {
    test('should create full backup', async () => {
      const mockDate = new Date('2024-02-20');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      await backup.createBackup('full');

      expect(fs.mkdir).toHaveBeenCalledWith(backupDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('full-backup-2024-02-20'),
        expect.any(String)
      );
    });

    test('should create database backup', async () => {
      const filePath = path.join(backupDir, 'database-backup.sql');
      
      await backup.createDatabaseBackup(filePath);

      expect(pool.query).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.any(String)
      );
    });

    test('should create settings backup', async () => {
      const filePath = path.join(backupDir, 'settings-backup.json');
      pool.query.mockResolvedValue({
        rows: [{ key: 'test', value: 'value' }]
      });

      await backup.createSettingsBackup(filePath);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM settings');
      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.any(String),
        'utf8'
      );
    });

    test('should handle backup creation errors', async () => {
      const error = new Error('Backup failed');
      fs.writeFile.mockRejectedValue(error);

      await expect(backup.createBackup('full')).rejects.toThrow('Backup failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Backup Restoration', () => {
    test('should restore full backup', async () => {
      const backupPath = path.join(backupDir, 'full-backup-2024-02-20.zip');
      fs.readFile.mockResolvedValue('backup data');

      await backup.restoreBackup(backupPath, 'full');

      expect(pool.query).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Backup restored'),
        expect.any(Object)
      );
    });

    test('should restore database backup', async () => {
      const backupPath = path.join(backupDir, 'database-backup.sql');
      fs.readFile.mockResolvedValue('SQL statements');

      await backup.restoreDatabase(backupPath);

      expect(pool.query).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database restored'),
        expect.any(Object)
      );
    });

    test('should restore settings backup', async () => {
      const backupPath = path.join(backupDir, 'settings-backup.json');
      fs.readFile.mockResolvedValue(JSON.stringify([
        { key: 'test', value: 'value' }
      ]));

      await backup.restoreSettings(backupPath);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO settings'),
        expect.any(Array)
      );
    });

    test('should handle restoration errors', async () => {
      const error = new Error('Restore failed');
      fs.readFile.mockRejectedValue(error);

      await expect(backup.restoreBackup('invalid-path', 'full')).rejects.toThrow('Restore failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Backup Management', () => {
    test('should list available backups', async () => {
      fs.readdir.mockResolvedValue([
        'full-backup-2024-02-20.zip',
        'database-backup-2024-02-19.sql'
      ]);

      const backups = await backup.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0]).toHaveProperty('type');
      expect(backups[0]).toHaveProperty('date');
      expect(backups[0]).toHaveProperty('size');
    });

    test('should clean up old backups', async () => {
      const oldDate = new Date('2024-01-01');
      fs.readdir.mockResolvedValue([
        'full-backup-2024-01-01.zip',
        'full-backup-2024-02-20.zip'
      ]);
      fs.stat.mockImplementation((path) => {
        return Promise.resolve({
          mtime: path.includes('2024-01-01') ? oldDate : new Date(),
          size: 1024
        });
      });

      await backup.cleanupOldBackups();

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-01')
      );
    });

    test('should get backup type from filename', () => {
      const type = backup.getBackupType('full-backup-2024-02-20.zip');
      expect(type).toBe('full');
    });
  });

  describe('Backup Verification', () => {
    test('should verify database backup integrity', async () => {
      const backupPath = path.join(backupDir, 'database-backup.sql');
      fs.readFile.mockResolvedValue('valid SQL statements');

      const isValid = await backup.verifyBackup(backupPath, 'database');
      expect(isValid).toBe(true);
    });

    test('should verify settings backup integrity', async () => {
      const backupPath = path.join(backupDir, 'settings-backup.json');
      fs.readFile.mockResolvedValue(JSON.stringify({
        settings: [{ key: 'test', value: 'value' }]
      }));

      const isValid = await backup.verifyBackup(backupPath, 'settings');
      expect(isValid).toBe(true);
    });

    test('should detect corrupted backups', async () => {
      const backupPath = path.join(backupDir, 'corrupted-backup.zip');
      fs.readFile.mockRejectedValue(new Error('Corrupted file'));

      const isValid = await backup.verifyBackup(backupPath, 'full');
      expect(isValid).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Backup verification failed'),
        expect.any(Object)
      );
    });
  });

  describe('Backup Scheduling', () => {
    test('should schedule regular backups', () => {
      const schedule = backup.scheduleBackups('0 0 * * *');
      expect(schedule).toBeDefined();
    });

    test('should handle scheduled backup failures', async () => {
      const error = new Error('Scheduled backup failed');
      fs.writeFile.mockRejectedValue(error);

      await backup.performScheduledBackup();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled backup failed'),
        expect.any(Object)
      );
    });
  });
}); 