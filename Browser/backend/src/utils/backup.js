const logger = require('./logger');
const { Pool } = require('pg');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// バックアップ設定
const backupConfig = {
  dir: path.join(__dirname, '../../backups'),
  retention: 7, // バックアップの保持日数
  compress: true,
  schedule: '0 0 * * *', // 毎日0時にバックアップ
  types: ['database', 'settings', 'logs']
};

// バックアップの作成
const createBackup = async (type = 'full') => {
  try {
    // バックアップディレクトリの作成
    await fs.mkdir(backupConfig.dir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupConfig.dir, `backup-${type}-${timestamp}`);

    let result;
    switch (type) {
      case 'database':
        result = await createDatabaseBackup(backupPath);
        break;
      case 'settings':
        result = await createSettingsBackup(backupPath);
        break;
      case 'full':
        result = await createFullBackup(backupPath);
        break;
      default:
        throw new Error(`Unknown backup type: ${type}`);
    }

    // 古いバックアップの削除
    await cleanupOldBackups();

    logger.info('Backup created successfully', { type, path: backupPath });
    return result;
  } catch (error) {
    logger.error('Backup creation failed:', error);
    throw error;
  }
};

// データベースのバックアップ
const createDatabaseBackup = async (filePath) => {
  const { database, user, password, host, port } = config.database;
  const dumpFile = `${filePath}.sql`;

  try {
    // pg_dumpを使用してバックアップを作成
    const command = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p -f ${dumpFile}`;
    await execAsync(command);

    if (backupConfig.compress) {
      // バックアップファイルの圧縮
      await execAsync(`gzip ${dumpFile}`);
      return `${dumpFile}.gz`;
    }

    return dumpFile;
  } catch (error) {
    logger.error('Database backup failed:', error);
    throw error;
  }
};

// 設定のバックアップ
const createSettingsBackup = async (filePath) => {
  try {
    const pool = new Pool(config.database);
    const client = await pool.connect();

    // 設定テーブルのデータを取得
    const result = await client.query('SELECT * FROM settings');
    const settings = result.rows;

    // JSONファイルとして保存
    const settingsFile = `${filePath}-settings.json`;
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));

    client.release();
    await pool.end();

    if (backupConfig.compress) {
      await execAsync(`gzip ${settingsFile}`);
      return `${settingsFile}.gz`;
    }

    return settingsFile;
  } catch (error) {
    logger.error('Settings backup failed:', error);
    throw error;
  }
};

// 完全バックアップ
const createFullBackup = async (filePath) => {
  try {
    const results = {
      database: await createDatabaseBackup(filePath),
      settings: await createSettingsBackup(filePath)
    };

    // ログファイルのバックアップ
    const logDir = path.join(__dirname, '../../logs');
    const logBackupDir = `${filePath}-logs`;
    await fs.mkdir(logBackupDir);
    
    const logFiles = await fs.readdir(logDir);
    for (const file of logFiles) {
      await fs.copyFile(
        path.join(logDir, file),
        path.join(logBackupDir, file)
      );
    }

    if (backupConfig.compress) {
      await execAsync(`tar -czf ${logBackupDir}.tar.gz -C ${logBackupDir} .`);
      await fs.rm(logBackupDir, { recursive: true });
      results.logs = `${logBackupDir}.tar.gz`;
    } else {
      results.logs = logBackupDir;
    }

    return results;
  } catch (error) {
    logger.error('Full backup failed:', error);
    throw error;
  }
};

// バックアップのリストア
const restoreBackup = async (backupPath, type = 'full') => {
  try {
    switch (type) {
      case 'database':
        await restoreDatabase(backupPath);
        break;
      case 'settings':
        await restoreSettings(backupPath);
        break;
      case 'full':
        await restoreFullBackup(backupPath);
        break;
      default:
        throw new Error(`Unknown restore type: ${type}`);
    }

    logger.info('Backup restored successfully', { type, path: backupPath });
  } catch (error) {
    logger.error('Backup restoration failed:', error);
    throw error;
  }
};

// データベースのリストア
const restoreDatabase = async (backupPath) => {
  const { database, user, password, host, port } = config.database;

  try {
    let restorePath = backupPath;
    if (backupPath.endsWith('.gz')) {
      // 圧縮ファイルの展開
      await execAsync(`gunzip -k ${backupPath}`);
      restorePath = backupPath.slice(0, -3);
    }

    // pg_restoreを使用してリストア
    const command = `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${restorePath}`;
    await execAsync(command);

    // 一時ファイルの削除
    if (backupPath.endsWith('.gz')) {
      await fs.unlink(restorePath);
    }
  } catch (error) {
    logger.error('Database restore failed:', error);
    throw error;
  }
};

// 設定のリストア
const restoreSettings = async (backupPath) => {
  try {
    let settingsData = await fs.readFile(
      backupPath.endsWith('.gz')
        ? (await execAsync(`gunzip -c ${backupPath}`)).stdout
        : backupPath,
      'utf-8'
    );

    const settings = JSON.parse(settingsData);
    const pool = new Pool(config.database);
    const client = await pool.connect();

    // トランザクション内で設定を復元
    await client.query('BEGIN');
    await client.query('DELETE FROM settings');
    
    for (const setting of settings) {
      await client.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2)',
        [setting.key, setting.value]
      );
    }

    await client.query('COMMIT');
    client.release();
    await pool.end();
  } catch (error) {
    logger.error('Settings restore failed:', error);
    throw error;
  }
};

// 完全バックアップのリストア
const restoreFullBackup = async (backupPath) => {
  try {
    await restoreDatabase(`${backupPath}.sql.gz`);
    await restoreSettings(`${backupPath}-settings.json.gz`);

    // ログの復元
    const logBackup = `${backupPath}-logs.tar.gz`;
    const logDir = path.join(__dirname, '../../logs');
    
    await fs.mkdir(logDir, { recursive: true });
    await execAsync(`tar -xzf ${logBackup} -C ${logDir}`);

    logger.info('Full backup restored successfully');
  } catch (error) {
    logger.error('Full backup restore failed:', error);
    throw error;
  }
};

// 古いバックアップの削除
const cleanupOldBackups = async () => {
  try {
    const files = await fs.readdir(backupConfig.dir);
    const now = Date.now();
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(backupConfig.dir, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtime.getTime();

      if (age > backupConfig.retention * 24 * 60 * 60 * 1000) {
        await fs.unlink(filePath);
        deleted++;
      }
    }

    logger.info('Old backups cleaned up', { deleted });
    return deleted;
  } catch (error) {
    logger.error('Backup cleanup failed:', error);
    throw error;
  }
};

// バックアップの一覧取得
const listBackups = async () => {
  try {
    const files = await fs.readdir(backupConfig.dir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(backupConfig.dir, file);
      const stats = await fs.stat(filePath);

      backups.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime,
        type: getBackupType(file)
      });
    }

    return backups.sort((a, b) => b.created - a.created);
  } catch (error) {
    logger.error('Failed to list backups:', error);
    throw error;
  }
};

// バックアップタイプの判定
const getBackupType = (filename) => {
  if (filename.includes('-full-')) return 'full';
  if (filename.includes('-database-')) return 'database';
  if (filename.includes('-settings-')) return 'settings';
  return 'unknown';
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups
}; 