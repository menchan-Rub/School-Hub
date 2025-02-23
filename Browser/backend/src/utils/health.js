const logger = require('./logger');
const os = require('os');
const { Pool } = require('pg');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

// ヘルスチェックの設定
const healthConfig = {
  checks: {
    database: true,
    memory: true,
    cpu: true,
    disk: true,
    network: true
  },
  thresholds: {
    memory: 90, // メモリ使用率の警告しきい値（%）
    cpu: 80, // CPU使用率の警告しきい値（%）
    disk: 90, // ディスク使用率の警告しきい値（%）
    connections: 1000 // 同時接続数の警告しきい値
  }
};

// ヘルスチェックの実行
const checkHealth = async () => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    checks: {}
  };

  try {
    // データベースのチェック
    if (healthConfig.checks.database) {
      health.checks.database = await checkDatabase();
    }

    // メモリのチェック
    if (healthConfig.checks.memory) {
      health.checks.memory = checkMemory();
    }

    // CPUのチェック
    if (healthConfig.checks.cpu) {
      health.checks.cpu = await checkCPU();
    }

    // ディスクのチェック
    if (healthConfig.checks.disk) {
      health.checks.disk = await checkDiskSpace();
    }

    // ネットワーク接続のチェック
    if (healthConfig.checks.network) {
      health.checks.network = checkConnections();
    }

    // 全体のステータスを判定
    if (Object.values(health.checks).some(check => check.status === 'error')) {
      health.status = 'error';
    } else if (Object.values(health.checks).some(check => check.status === 'warning')) {
      health.status = 'warning';
    }

    return health;
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      status: 'error',
      timestamp: Date.now(),
      error: error.message
    };
  }
};

// データベースのヘルスチェック
const checkDatabase = async () => {
  const pool = new Pool(config.database);

  try {
    const client = await pool.connect();
    const startTime = Date.now();
    await client.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    // コネクション数の取得
    const { rows } = await client.query('SELECT count(*) FROM pg_stat_activity');
    const connectionCount = parseInt(rows[0].count);

    client.release();
    await pool.end();

    return {
      status: connectionCount > healthConfig.thresholds.connections ? 'warning' : 'ok',
      responseTime,
      connections: connectionCount,
      details: {
        host: config.database.host,
        database: config.database.database
      }
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};

// メモリのヘルスチェック
const checkMemory = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total) * 100;

  return {
    status: usagePercent > healthConfig.thresholds.memory ? 'warning' : 'ok',
    total,
    free,
    used,
    usagePercent: usagePercent.toFixed(2),
    details: process.memoryUsage()
  };
};

// CPUのヘルスチェック
const checkCPU = async () => {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuCount = cpus.length;
  const loadPercent = (loadAvg[0] / cpuCount) * 100;

  return {
    status: loadPercent > healthConfig.thresholds.cpu ? 'warning' : 'ok',
    loadAverage: loadAvg,
    cpuCount,
    loadPercent: loadPercent.toFixed(2),
    details: {
      model: cpus[0].model,
      speed: cpus[0].speed
    }
  };
};

// ディスク容量のチェック
const checkDiskSpace = async () => {
  try {
    const rootPath = path.parse(process.cwd()).root;
    const stats = await fs.statfs(rootPath);

    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const used = total - free;
    const usagePercent = (used / total) * 100;

    return {
      status: usagePercent > healthConfig.thresholds.disk ? 'warning' : 'ok',
      total,
      free,
      used,
      usagePercent: usagePercent.toFixed(2),
      path: rootPath
    };
  } catch (error) {
    logger.error('Disk space check failed:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};

// ネットワーク接続のチェック
const checkConnections = () => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const connections = {
      active: 0,
      interfaces: []
    };

    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      const activeInterfaces = interfaces.filter(iface => !iface.internal);
      connections.active += activeInterfaces.length;
      connections.interfaces.push({
        name,
        addresses: activeInterfaces.map(iface => ({
          address: iface.address,
          family: iface.family,
          netmask: iface.netmask
        }))
      });
    }

    return {
      status: 'ok',
      ...connections
    };
  } catch (error) {
    logger.error('Network connections check failed:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
};

// ヘルスチェックの結果をログに記録
const logHealthCheck = async () => {
  try {
    const health = await checkHealth();
    if (health.status !== 'ok') {
      logger.warn('Health check warning:', health);
    } else {
      logger.debug('Health check passed:', health);
    }
    return health;
  } catch (error) {
    logger.error('Health check logging failed:', error);
    throw error;
  }
};

module.exports = {
  checkHealth,
  checkDatabase,
  checkMemory,
  checkCPU,
  checkDiskSpace,
  checkConnections,
  logHealthCheck
}; 