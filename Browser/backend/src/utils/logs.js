const logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

// ログ設定
const logConfig = {
  dir: path.join(__dirname, '../../logs'),
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  rotateInterval: 24 * 60 * 60 * 1000, // 24時間
  types: ['error', 'access', 'debug', 'security']
};

// ログファイルの作成
const createLogFile = async (type) => {
  const date = new Date().toISOString().split('T')[0];
  const filename = `${type}-${date}.log`;
  const filepath = path.join(logConfig.dir, filename);

  try {
    // ログディレクトリの作成
    await fs.mkdir(logConfig.dir, { recursive: true });
    
    // ファイルが存在しない場合は作成
    await fs.access(filepath).catch(async () => {
      await fs.writeFile(filepath, '');
    });

    return filepath;
  } catch (error) {
    logger.error('Failed to create log file:', error);
    throw error;
  }
};

// ログの書き込み
const writeLog = async (type, message, metadata = {}) => {
  try {
    const filepath = await createLogFile(type);
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      type,
      message,
      ...metadata
    }) + '\n';

    await fs.appendFile(filepath, logEntry);

    // ファイルサイズをチェック
    const stats = await fs.stat(filepath);
    if (stats.size > logConfig.maxSize) {
      await rotateLog(type);
    }
  } catch (error) {
    logger.error('Failed to write log:', error);
    throw error;
  }
};

// ログローテーション
const rotateLog = async (type) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const baseFilename = `${type}-${date}.log`;
    const files = await fs.readdir(logConfig.dir);
    
    // 同じ種類のログファイルを取得
    const logFiles = files.filter(file => file.startsWith(`${type}-`));
    
    // ファイル数が上限を超えている場合、古いファイルを削除
    if (logFiles.length >= logConfig.maxFiles) {
      const oldestFile = logFiles.sort()[0];
      await fs.unlink(path.join(logConfig.dir, oldestFile));
    }

    // 現在のファイルをリネーム
    const currentFile = path.join(logConfig.dir, baseFilename);
    const newFile = path.join(logConfig.dir, `${type}-${date}-${Date.now()}.log`);
    await fs.rename(currentFile, newFile);

    // 新しいファイルを作成
    await createLogFile(type);

    logger.info('Log rotation completed', { type });
  } catch (error) {
    logger.error('Failed to rotate log:', error);
    throw error;
  }
};

// ログの検索
const searchLogs = async (options = {}) => {
  try {
    const {
      type,
      startDate,
      endDate,
      query,
      limit = 100,
      offset = 0
    } = options;

    const files = await fs.readdir(logConfig.dir);
    const logFiles = type
      ? files.filter(file => file.startsWith(`${type}-`))
      : files.filter(file => logConfig.types.some(t => file.startsWith(`${t}-`)));

    let results = [];
    for (const file of logFiles) {
      const content = await fs.readFile(path.join(logConfig.dir, file), 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        const log = JSON.parse(line);
        
        // 日付フィルター
        if (startDate && new Date(log.timestamp) < new Date(startDate)) continue;
        if (endDate && new Date(log.timestamp) > new Date(endDate)) continue;

        // クエリフィルター
        if (query && !JSON.stringify(log).toLowerCase().includes(query.toLowerCase())) continue;

        results.push(log);
      }
    }

    // ソートと制限
    results = results
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);

    return results;
  } catch (error) {
    logger.error('Failed to search logs:', error);
    throw error;
  }
};

// ログの削除
const deleteLogs = async (options = {}) => {
  try {
    const { type, before } = options;
    const files = await fs.readdir(logConfig.dir);
    let deleted = 0;

    for (const file of files) {
      if (type && !file.startsWith(`${type}-`)) continue;

      const filePath = path.join(logConfig.dir, file);
      const stats = await fs.stat(filePath);

      if (before && stats.mtime < new Date(before)) {
        await fs.unlink(filePath);
        deleted++;
      }
    }

    logger.info('Logs deleted', { deleted });
    return deleted;
  } catch (error) {
    logger.error('Failed to delete logs:', error);
    throw error;
  }
};

// ログ統計の取得
const getLogStats = async () => {
  try {
    const files = await fs.readdir(logConfig.dir);
    const stats = {
      totalSize: 0,
      fileCount: files.length,
      typeStats: {}
    };

    for (const type of logConfig.types) {
      const typeFiles = files.filter(file => file.startsWith(`${type}-`));
      let typeSize = 0;

      for (const file of typeFiles) {
        const filePath = path.join(logConfig.dir, file);
        const fileStats = await fs.stat(filePath);
        typeSize += fileStats.size;
      }

      stats.typeStats[type] = {
        fileCount: typeFiles.length,
        totalSize: typeSize
      };
      stats.totalSize += typeSize;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get log stats:', error);
    throw error;
  }
};

module.exports = {
  writeLog,
  rotateLog,
  searchLogs,
  deleteLogs,
  getLogStats
}; 