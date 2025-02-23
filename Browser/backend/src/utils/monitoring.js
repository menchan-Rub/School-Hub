const logger = require('./logger');
const os = require('os');
const { Pool } = require('pg');
const config = require('../config');

// モニタリング設定
const monitoringConfig = {
  enabled: true,
  interval: 60000, // 1分
  retention: 7 * 24 * 60 * 60 * 1000, // 7日間
  alerts: {
    enabled: true,
    channels: ['log', 'email']
  }
};

// メトリクスの保存
const metrics = {
  system: [],
  database: [],
  application: [],
  errors: []
};

// システムメトリクスの収集
const collectSystemMetrics = () => {
  const systemMetrics = {
    timestamp: Date.now(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    },
    cpu: {
      loadAvg: os.loadavg(),
      cpus: os.cpus().length
    },
    uptime: os.uptime()
  };

  metrics.system.push(systemMetrics);
  pruneMetrics('system');

  return systemMetrics;
};

// データベースメトリクスの収集
const collectDatabaseMetrics = async () => {
  const pool = new Pool(config.database);

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM pg_stat_database WHERE datname = $1', [config.database.database]);
    
    const dbMetrics = {
      timestamp: Date.now(),
      connections: result.rows[0].numbackends,
      transactions: {
        committed: result.rows[0].xact_commit,
        rolled_back: result.rows[0].xact_rollback
      },
      blocks: {
        read: result.rows[0].blks_read,
        hit: result.rows[0].blks_hit
      },
      tuples: {
        returned: result.rows[0].tup_returned,
        fetched: result.rows[0].tup_fetched,
        inserted: result.rows[0].tup_inserted,
        updated: result.rows[0].tup_updated,
        deleted: result.rows[0].tup_deleted
      }
    };

    metrics.database.push(dbMetrics);
    pruneMetrics('database');

    client.release();
    return dbMetrics;
  } catch (error) {
    logger.error('Failed to collect database metrics:', error);
    return null;
  } finally {
    await pool.end();
  }
};

// アプリケーションメトリクスの収集
const collectApplicationMetrics = () => {
  const appMetrics = {
    timestamp: Date.now(),
    process: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    eventLoop: {
      lag: getEventLoopLag()
    },
    activeRequests: getActiveRequestCount(),
    websocketConnections: getWebSocketConnectionCount()
  };

  metrics.application.push(appMetrics);
  pruneMetrics('application');

  return appMetrics;
};

// エラーメトリクスの記録
const recordError = (error) => {
  const errorMetric = {
    timestamp: Date.now(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context: error.context || {}
  };

  metrics.errors.push(errorMetric);
  pruneMetrics('errors');

  // アラートの発行
  if (shouldAlertError(error)) {
    sendAlert('error', errorMetric);
  }

  return errorMetric;
};

// メトリクスの古いデータを削除
const pruneMetrics = (type) => {
  const now = Date.now();
  metrics[type] = metrics[type].filter(
    metric => now - metric.timestamp < monitoringConfig.retention
  );
};

// アラートの送信
const sendAlert = (type, data) => {
  if (!monitoringConfig.alerts.enabled) return;

  monitoringConfig.alerts.channels.forEach(channel => {
    switch (channel) {
      case 'log':
        logger.warn('Monitoring alert:', { type, data });
        break;
      case 'email':
        // TODO: メール送信の実装
        break;
      default:
        logger.warn('Unknown alert channel:', channel);
    }
  });
};

// ヘルスチェック
const checkHealth = async () => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    checks: {
      system: await checkSystemHealth(),
      database: await checkDatabaseHealth(),
      application: checkApplicationHealth()
    }
  };

  // 全体のステータスを判定
  if (Object.values(health.checks).some(check => check.status === 'error')) {
    health.status = 'error';
  } else if (Object.values(health.checks).some(check => check.status === 'warning')) {
    health.status = 'warning';
  }

  return health;
};

// システムヘルスチェック
const checkSystemHealth = async () => {
  const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
  const loadAvg = os.loadavg()[0];

  return {
    status: memoryUsage > 90 || loadAvg > os.cpus().length ? 'warning' : 'ok',
    memory: {
      usage: memoryUsage,
      total: os.totalmem(),
      free: os.freemem()
    },
    cpu: {
      loadAvg,
      cores: os.cpus().length
    }
  };
};

// データベースヘルスチェック
const checkDatabaseHealth = async () => {
  const pool = new Pool(config.database);

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return {
      status: 'ok',
      connected: true
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      connected: false,
      error: error.message
    };
  } finally {
    await pool.end();
  }
};

// アプリケーションヘルスチェック
const checkApplicationHealth = () => {
  const memoryUsage = process.memoryUsage();
  const eventLoopLag = getEventLoopLag();

  return {
    status: eventLoopLag > 100 ? 'warning' : 'ok',
    memory: memoryUsage,
    eventLoop: {
      lag: eventLoopLag
    }
  };
};

// ヘルパー関数
const getEventLoopLag = () => {
  // TODO: 実際のイベントループ遅延の計測を実装
  return 0;
};

const getActiveRequestCount = () => {
  // TODO: アクティブなリクエスト数の取得を実装
  return 0;
};

const getWebSocketConnectionCount = () => {
  // TODO: WebSocket接続数の取得を実装
  return 0;
};

const shouldAlertError = (error) => {
  // TODO: エラーアラートの条件を実装
  return error.name === 'FatalError';
};

module.exports = {
  collectSystemMetrics,
  collectDatabaseMetrics,
  collectApplicationMetrics,
  recordError,
  checkHealth,
  sendAlert
}; 