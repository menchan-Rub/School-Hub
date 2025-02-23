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

// JavaScriptの設定を取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'javascript'"
    );
    res.json(result.rows[0]?.value || {
      enabled: true,
      strictMode: true,
      allowPopups: false,
      allowModals: true,
      allowGeolocation: false
    });
  } catch (error) {
    logger.error('Error fetching JavaScript settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptの設定を更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('javascript', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'JAVASCRIPT_SETTINGS_CHANGED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating JavaScript settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptコードの実行
router.post('/execute', async (req, res) => {
  const { code, url, context } = req.body;
  try {
    // 実行結果をデータベースに記録
    const result = await pool.query(
      `INSERT INTO javascript_executions (
        code,
        url,
        context,
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *`,
      [code, url, context]
    );

    // WebSocketを通じて実行を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'JAVASCRIPT_EXECUTED',
          execution: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error executing JavaScript:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptの実行履歴を取得
router.get('/history', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM javascript_executions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching JavaScript execution history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptの実行履歴を削除
router.delete('/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM javascript_executions');

    // WebSocketを通じて履歴クリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'JAVASCRIPT_HISTORY_CLEARED'
        }));
      }
    });

    res.json({ message: 'JavaScript execution history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing JavaScript execution history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptエラーの記録
router.post('/errors', async (req, res) => {
  const { message, stack, url, lineNumber, columnNumber } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO javascript_errors (
        message,
        stack,
        url,
        line_number,
        column_number,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *`,
      [message, stack, url, lineNumber, columnNumber]
    );

    // WebSocketを通じてエラーを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'JAVASCRIPT_ERROR',
          error: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording JavaScript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptエラー履歴を取得
router.get('/errors', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM javascript_errors
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching JavaScript errors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// JavaScriptエラー履歴を削除
router.delete('/errors', async (req, res) => {
  try {
    await pool.query('DELETE FROM javascript_errors');

    // WebSocketを通じてエラー履歴クリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'JAVASCRIPT_ERRORS_CLEARED'
        }));
      }
    });

    res.json({ message: 'JavaScript error history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing JavaScript error history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 