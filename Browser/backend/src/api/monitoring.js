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

// システムステータスの取得
router.get('/status', async (req, res) => {
  try {
    // データベース接続のチェック
    const dbStatus = await checkDatabaseStatus();
    
    // メモリ使用量の取得
    const memoryUsage = process.memoryUsage();
    
    // CPU使用率の取得
    const cpuUsage = process.cpuUsage();
    
    // アクティブなWebSocket接続数の取得
    const wsConnections = Array.from(global.wss.clients).length;

    const status = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      connections: {
        websocket: wsConnections
      },
      database: dbStatus
    };

    res.json(status);
  } catch (error) {
    logger.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// システムメトリクスの記録
router.post('/metrics', async (req, res) => {
  const { type, value, tags } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO system_metrics (
        type,
        value,
        tags,
        recorded_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *`,
      [type, value, tags]
    );

    // WebSocketを通じてメトリクスを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SYSTEM_METRIC_RECORDED',
          metric: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording system metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// システムメトリクスの取得
router.get('/metrics', async (req, res) => {
  const { type, from, to, limit = 100, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM system_metrics';
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push('type = $' + (params.length + 1));
      params.push(type);
    }

    if (from) {
      conditions.push('recorded_at >= $' + (params.length + 1));
      params.push(from);
    }

    if (to) {
      conditions.push('recorded_at <= $' + (params.length + 1));
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY recorded_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// システムアラートの記録
router.post('/alerts', async (req, res) => {
  const { type, message, severity, details } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO system_alerts (
        type,
        message,
        severity,
        details,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *`,
      [type, message, severity, details]
    );

    // WebSocketを通じてアラートを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SYSTEM_ALERT',
          alert: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording system alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// システムアラートの取得
router.get('/alerts', async (req, res) => {
  const { severity, limit = 100, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM system_alerts';
    const params = [];

    if (severity) {
      query += ' WHERE severity = $1';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching system alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// データベースの状態をチェックする関数
async function checkDatabaseStatus() {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    return {
      connected: true,
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      connected: false,
      responseTime: null,
      error: error.message
    };
  }
}

module.exports = router; 