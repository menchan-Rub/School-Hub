const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT
});

// 設定の取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 特定の設定の取得
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Setting not found' });
    } else {
      res.json(result.rows[0].value);
    }
  } catch (error) {
    logger.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 設定の更新または作成
router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE
       SET value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value]
    );
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 設定の削除
router.delete('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING *', [key]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Setting not found' });
    } else {
      res.json({ message: 'Setting deleted successfully' });
    }
  } catch (error) {
    logger.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// デフォルト設定の初期化
router.post('/initialize', async (req, res) => {
  try {
    const defaultSettings = {
      'theme': { mode: 'system' },
      'search.engine': 'https://www.google.com/search?q={searchTerms}',
      'downloads.location': '~/Downloads',
      'privacy.doNotTrack': true,
      'security.webrtc': 'default_public_interface_only',
      'performance.hardware_acceleration': true,
      'language': 'ja',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await pool.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    res.json({ message: 'Default settings initialized successfully' });
  } catch (error) {
    logger.error('Error initializing settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 