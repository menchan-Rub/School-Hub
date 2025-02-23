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

// Cookie一覧の取得
router.get('/', async (req, res) => {
  const { domain } = req.query;
  try {
    let query = 'SELECT * FROM cookies';
    const params = [];

    if (domain) {
      query += ' WHERE domain = $1';
      params.push(domain);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching cookies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cookieの設定
router.post('/', async (req, res) => {
  const { name, value, domain, path, expires, http_only, secure, same_site } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cookies (
        name,
        value,
        domain,
        path,
        expires,
        http_only,
        secure,
        same_site
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (domain, name, path) DO UPDATE
      SET value = EXCLUDED.value,
          expires = EXCLUDED.expires,
          http_only = EXCLUDED.http_only,
          secure = EXCLUDED.secure,
          same_site = EXCLUDED.same_site,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [name, value, domain, path, expires, http_only, secure, same_site]
    );

    // WebSocketを通じてCookie変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'COOKIE_UPDATED',
          cookie: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error setting cookie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cookieの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cookies WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cookie not found' });
    }

    // WebSocketを通じてCookie削除を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'COOKIE_DELETED',
          cookieId: id
        }));
      }
    });

    res.json({ message: 'Cookie deleted successfully' });
  } catch (error) {
    logger.error('Error deleting cookie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ドメインのCookieを全て削除
router.delete('/domain/:domain', async (req, res) => {
  const { domain } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cookies WHERE domain = $1 RETURNING *',
      [domain]
    );

    // WebSocketを通じてCookie削除を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOMAIN_COOKIES_DELETED',
          domain,
          count: result.rowCount
        }));
      }
    });

    res.json({
      message: `Deleted ${result.rowCount} cookies for domain ${domain}`
    });
  } catch (error) {
    logger.error('Error deleting domain cookies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cookieポリシーの取得
router.get('/policy', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'cookie_policy'"
    );
    res.json(result.rows[0]?.value || {
      allowAll: false,
      allowThirdParty: false,
      blockTracking: true,
      clearOnExit: false
    });
  } catch (error) {
    logger.error('Error fetching cookie policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cookieポリシーの更新
router.put('/policy', async (req, res) => {
  const policy = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('cookie_policy', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [policy]
    );

    // WebSocketを通じてポリシー変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'COOKIE_POLICY_UPDATED',
          policy: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating cookie policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 期限切れのCookieを削除
router.delete('/expired', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cookies WHERE expires < CURRENT_TIMESTAMP RETURNING *'
    );

    if (result.rowCount > 0) {
      // WebSocketを通じて期限切れCookieの削除を通知
      global.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'EXPIRED_COOKIES_DELETED',
            count: result.rowCount
          }));
        }
      });
    }

    res.json({
      message: `Deleted ${result.rowCount} expired cookies`
    });
  } catch (error) {
    logger.error('Error deleting expired cookies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 