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

// セキュリティ設定の取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'security'"
    );
    res.json(result.rows[0]?.value || {
      xssProtection: true,
      contentSecurityPolicy: true,
      httpsOnly: true,
      blockMixedContent: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      frameOptions: 'SAMEORIGIN'
    });
  } catch (error) {
    logger.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セキュリティ設定の更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('security', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SECURITY_SETTINGS_UPDATED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セキュリティ警告の記録
router.post('/alerts', async (req, res) => {
  const { type, url, details, severity } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO security_alerts (
        type,
        url,
        details,
        severity,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *`,
      [type, url, details, severity]
    );

    // WebSocketを通じて警告を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SECURITY_ALERT',
          alert: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording security alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セキュリティ警告の取得
router.get('/alerts', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM security_alerts
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セキュリティ警告の削除
router.delete('/alerts', async (req, res) => {
  try {
    await pool.query('DELETE FROM security_alerts');

    // WebSocketを通じて警告クリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SECURITY_ALERTS_CLEARED'
        }));
      }
    });

    res.json({ message: 'Security alerts cleared successfully' });
  } catch (error) {
    logger.error('Error clearing security alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 証明書の検証結果を記録
router.post('/certificates', async (req, res) => {
  const { domain, valid, issuer, validFrom, validTo, fingerprint } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO certificate_validations (
        domain,
        valid,
        issuer,
        valid_from,
        valid_to,
        fingerprint,
        checked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *`,
      [domain, valid, issuer, validFrom, validTo, fingerprint]
    );

    // WebSocketを通じて証明書検証結果を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'CERTIFICATE_VALIDATED',
          validation: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error recording certificate validation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 証明書の検証履歴を取得
router.get('/certificates', async (req, res) => {
  const { domain } = req.query;
  try {
    let query = 'SELECT * FROM certificate_validations';
    const params = [];

    if (domain) {
      query += ' WHERE domain = $1';
      params.push(domain);
    }

    query += ' ORDER BY checked_at DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching certificate validations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 