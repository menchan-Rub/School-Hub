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

// 開発者ツールの状態を取得
router.get('/state', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'devtools'"
    );
    res.json(result.rows[0]?.value || {
      isOpen: false,
      activePanel: 'console',
      position: 'bottom',
      size: { width: '100%', height: '300px' }
    });
  } catch (error) {
    logger.error('Error fetching devtools state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 開発者ツールの状態を更新
router.put('/state', async (req, res) => {
  const state = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('devtools', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [state]
    );

    // WebSocketを通じて状態変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DEVTOOLS_STATE_CHANGED',
          state: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating devtools state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// コンソールログの記録
router.post('/console', async (req, res) => {
  const { level, message, source, lineNumber } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO devtools_logs (
        level,
        message,
        source,
        line_number,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *`,
      [level, message, source, lineNumber]
    );

    // WebSocketを通じてログを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'CONSOLE_LOG',
          log: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording console log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// コンソールログの取得
router.get('/console', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM devtools_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching console logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// コンソールログのクリア
router.delete('/console', async (req, res) => {
  try {
    await pool.query('DELETE FROM devtools_logs');

    // WebSocketを通じてログクリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'CONSOLE_CLEARED'
        }));
      }
    });

    res.json({ message: 'Console logs cleared successfully' });
  } catch (error) {
    logger.error('Error clearing console logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ネットワークリクエストの記録
router.post('/network', async (req, res) => {
  const { url, method, headers, status, responseTime, size } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO devtools_network (
        url,
        method,
        headers,
        status,
        response_time,
        size,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *`,
      [url, method, headers, status, responseTime, size]
    );

    // WebSocketを通じてリクエストを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'NETWORK_REQUEST',
          request: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording network request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ネットワークリクエストの取得
router.get('/network', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM devtools_network
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching network requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ネットワークリクエストのクリア
router.delete('/network', async (req, res) => {
  try {
    await pool.query('DELETE FROM devtools_network');

    // WebSocketを通じてリクエストクリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'NETWORK_CLEARED'
        }));
      }
    });

    res.json({ message: 'Network requests cleared successfully' });
  } catch (error) {
    logger.error('Error clearing network requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 