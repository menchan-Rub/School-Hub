const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// 基本的なヘルスチェック
router.get('/', async (req, res) => {
  try {
    // データベース接続のチェック
    const dbStartTime = Date.now();
    await pool.query('SELECT 1');
    const dbResponseTime = Date.now() - dbStartTime;

    // メモリ使用量のチェック
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB

    // ヘルスステータスの判定
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: dbResponseTime
        },
        memory: {
          status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal
        }
      }
    };

    // ヘルスチェックの記録
    await pool.query(
      `INSERT INTO health_checks (
        status,
        details,
        checked_at
      ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [status.status, status]
    );

    res.json(status);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    const status = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };

    // 失敗したヘルスチェックの記録
    try {
      await pool.query(
        `INSERT INTO health_checks (
          status,
          details,
          checked_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [status.status, status]
      );
    } catch (dbError) {
      logger.error('Failed to record health check:', dbError);
    }

    res.status(503).json(status);
  }
});

// 詳細なヘルスチェック
router.get('/details', async (req, res) => {
  try {
    const checks = await Promise.all([
      checkDatabase(),
      checkMemory(),
      checkDiskSpace(),
      checkConnections()
    ]);

    const status = {
      status: checks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0],
        memory: checks[1],
        disk: checks[2],
        connections: checks[3]
      }
    };

    // 詳細ヘルスチェックの記録
    await pool.query(
      `INSERT INTO health_checks (
        status,
        details,
        checked_at
      ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [status.status, status]
    );

    res.json(status);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ヘルスチェック履歴の取得
router.get('/history', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM health_checks
       ORDER BY checked_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching health check history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// データベースの状態チェック
async function checkDatabase() {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: null,
      error: error.message
    };
  }
}

// メモリ使用状況のチェック
function checkMemory() {
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 1024 * 1024 * 1024; // 1GB

  return {
    status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
    used: memoryUsage.heapUsed,
    total: memoryUsage.heapTotal,
    external: memoryUsage.external,
    error: null
  };
}

// ディスク使用状況のチェック
async function checkDiskSpace() {
  try {
    // ここで実際のディスク使用状況をチェック
    // 例: df コマンドの実行結果を解析
    return {
      status: 'healthy',
      used: 0,
      total: 0,
      error: null
    };
  } catch (error) {
    return {
      status: 'unknown',
      used: null,
      total: null,
      error: error.message
    };
  }
}

// 接続状況のチェック
function checkConnections() {
  const wsConnections = Array.from(global.wss.clients).length;
  const connectionThreshold = 1000;

  return {
    status: wsConnections < connectionThreshold ? 'healthy' : 'warning',
    websocket: {
      active: wsConnections,
      threshold: connectionThreshold
    },
    error: null
  };
}

module.exports = router; 