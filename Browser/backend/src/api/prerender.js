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

// プリレンダリングの設定を取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'prerender'"
    );
    res.json(result.rows[0]?.value || {
      enabled: true,
      timeout: 30000,
      userAgent: 'Lightweight Browser Prerenderer',
      waitForSelector: 'body',
      removeScriptTags: true,
      cacheLifetime: 3600
    });
  } catch (error) {
    logger.error('Error fetching prerender settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プリレンダリングの設定を更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('prerender', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PRERENDER_SETTINGS_CHANGED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating prerender settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ページのプリレンダリング
router.post('/', async (req, res) => {
  const { url, options } = req.body;
  try {
    // プリレンダリング結果をデータベースに保存
    const result = await pool.query(
      `INSERT INTO prerender_cache (
        url,
        html,
        status_code,
        headers,
        created_at,
        expires_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      ON CONFLICT (url) DO UPDATE
      SET html = EXCLUDED.html,
          status_code = EXCLUDED.status_code,
          headers = EXCLUDED.headers,
          created_at = CURRENT_TIMESTAMP,
          expires_at = EXCLUDED.expires_at
      RETURNING *`,
      [
        url,
        '<html>...</html>', // 実際のレンダリング結果
        200,
        { 'content-type': 'text/html' },
        new Date(Date.now() + (options?.cacheLifetime || 3600) * 1000)
      ]
    );

    // WebSocketを通じてプリレンダリング完了を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PAGE_PRERENDERED',
          url,
          timestamp: new Date()
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error prerendering page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プリレンダリングキャッシュの取得
router.get('/:url', async (req, res) => {
  const { url } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM prerender_cache WHERE url = $1',
      [decodeURIComponent(url)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prerendered page not found' });
    }

    const cache = result.rows[0];

    // キャッシュの有効期限チェック
    if (new Date(cache.expires_at) < new Date()) {
      await pool.query('DELETE FROM prerender_cache WHERE url = $1', [url]);
      return res.status(404).json({ error: 'Prerendered page expired' });
    }

    // キャッシュされたヘッダーを設定
    Object.entries(cache.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(cache.status_code).send(cache.html);
  } catch (error) {
    logger.error('Error fetching prerendered page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プリレンダリングキャッシュの削除
router.delete('/:url', async (req, res) => {
  const { url } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM prerender_cache WHERE url = $1 RETURNING *',
      [decodeURIComponent(url)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prerendered page not found' });
    }

    // WebSocketを通じてキャッシュ削除を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PRERENDER_CACHE_DELETED',
          url
        }));
      }
    });

    res.json({ message: 'Prerendered page deleted successfully' });
  } catch (error) {
    logger.error('Error deleting prerendered page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プリレンダリングキャッシュの統計情報を取得
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_pages,
        SUM(LENGTH(html)) as total_size,
        MIN(created_at) as oldest_page,
        MAX(created_at) as newest_page
      FROM prerender_cache
    `);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching prerender stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プリレンダリングキャッシュの全クリア
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM prerender_cache');

    // WebSocketを通じてキャッシュクリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PRERENDER_CACHE_CLEARED'
        }));
      }
    });

    res.json({ message: 'Prerender cache cleared successfully' });
  } catch (error) {
    logger.error('Error clearing prerender cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 