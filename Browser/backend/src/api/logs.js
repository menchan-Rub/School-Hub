const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// ログファイルの一覧取得
router.get('/files', async (req, res) => {
  try {
    const logDir = path.join(__dirname, '../../logs');
    const files = await fs.readdir(logDir);
    
    const logFiles = await Promise.all(files.map(async file => {
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    }));

    res.json(logFiles);
  } catch (error) {
    logger.error('Error fetching log files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ログファイルの内容取得
router.get('/files/:filename', async (req, res) => {
  const { filename } = req.params;
  const { limit = 1000, offset = 0 } = req.query;
  
  try {
    const logDir = path.join(__dirname, '../../logs');
    const filePath = path.join(logDir, filename);

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Log file not found' });
    }

    // ファイルの内容を読み取り
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // ページネーション
    const totalLines = lines.length;
    const paginatedLines = lines.slice(offset, offset + limit);

    res.json({
      filename,
      totalLines,
      offset: parseInt(offset),
      limit: parseInt(limit),
      lines: paginatedLines
    });
  } catch (error) {
    logger.error('Error reading log file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// アプリケーションログの記録
router.post('/application', async (req, res) => {
  const { level, message, context } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO application_logs (
        level,
        message,
        context,
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *`,
      [level, message, context]
    );

    // WebSocketを通じてログを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'APPLICATION_LOG',
          log: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording application log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// アプリケーションログの取得
router.get('/application', async (req, res) => {
  const { level, from, to, limit = 100, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM application_logs';
    const params = [];
    const conditions = [];

    if (level) {
      conditions.push('level = $' + (params.length + 1));
      params.push(level);
    }

    if (from) {
      conditions.push('created_at >= $' + (params.length + 1));
      params.push(from);
    }

    if (to) {
      conditions.push('created_at <= $' + (params.length + 1));
      params.push(to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching application logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ログレベルの設定取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'logging'"
    );
    res.json(result.rows[0]?.value || {
      consoleLevel: 'info',
      fileLevel: 'debug',
      retention: {
        days: 30,
        maxSize: 1024 * 1024 * 100 // 100MB
      },
      enableStackTrace: true
    });
  } catch (error) {
    logger.error('Error fetching log settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ログレベルの設定更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('logging', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'LOGGING_SETTINGS_UPDATED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating log settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 