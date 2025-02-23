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

// パフォーマンスメトリクスの記録
router.post('/metrics', async (req, res) => {
  const {
    url,
    loadTime,
    domContentLoaded,
    firstPaint,
    firstContentfulPaint,
    largestContentfulPaint,
    firstInputDelay,
    cumulativeLayoutShift,
    memoryUsage,
    cpuUsage
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO performance_metrics (
        url,
        load_time,
        dom_content_loaded,
        first_paint,
        first_contentful_paint,
        largest_contentful_paint,
        first_input_delay,
        cumulative_layout_shift,
        memory_usage,
        cpu_usage,
        recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        url,
        loadTime,
        domContentLoaded,
        firstPaint,
        firstContentfulPaint,
        largestContentfulPaint,
        firstInputDelay,
        cumulativeLayoutShift,
        memoryUsage,
        cpuUsage
      ]
    );

    // WebSocketを通じてメトリクスを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PERFORMANCE_METRICS_RECORDED',
          metrics: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// パフォーマンスメトリクスの取得
router.get('/metrics', async (req, res) => {
  const { url, limit = 100, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM performance_metrics';
    const params = [];

    if (url) {
      query += ' WHERE url = $1';
      params.push(url);
    }

    query += ' ORDER BY recorded_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// パフォーマンス設定の取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'performance'"
    );
    res.json(result.rows[0]?.value || {
      enableMetrics: true,
      samplingRate: 100,
      metricsRetentionDays: 30,
      alertThresholds: {
        loadTime: 5000,
        firstContentfulPaint: 2000,
        largestContentfulPaint: 4000,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1
      }
    });
  } catch (error) {
    logger.error('Error fetching performance settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// パフォーマンス設定の更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('performance', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PERFORMANCE_SETTINGS_UPDATED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating performance settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// パフォーマンスアラートの取得
router.get('/alerts', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM performance_alerts
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching performance alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// パフォーマンスアラートの記録
router.post('/alerts', async (req, res) => {
  const { url, metricName, value, threshold, details } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO performance_alerts (
        url,
        metric_name,
        value,
        threshold,
        details,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *`,
      [url, metricName, value, threshold, details]
    );

    // WebSocketを通じてアラートを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PERFORMANCE_ALERT',
          alert: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording performance alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 