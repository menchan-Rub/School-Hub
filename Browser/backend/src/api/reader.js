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

// リーダーモードの設定を取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'reader_mode'"
    );
    res.json(result.rows[0]?.value || {
      fontSize: 16,
      lineHeight: 1.6,
      fontFamily: 'system-ui',
      theme: 'light',
      margin: 'auto',
      width: 'narrow'
    });
  } catch (error) {
    logger.error('Error fetching reader mode settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// リーダーモードの設定を更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('reader_mode', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );
    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating reader mode settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ページをリーダーモードで表示
router.post('/parse', async (req, res) => {
  const { url, html } = req.body;
  try {
    // HTMLをパースしてメインコンテンツを抽出
    const content = await parseContent(html);

    // リーダーモードの履歴を保存
    await pool.query(
      `INSERT INTO reader_history (
        url,
        title,
        content,
        word_count,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [url, content.title, content.text, content.wordCount]
    );

    res.json(content);
  } catch (error) {
    logger.error('Error parsing content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// リーダーモードの履歴を取得
router.get('/history', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM reader_history
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching reader mode history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// リーダーモードの履歴を削除
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM reader_history WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reader history entry not found' });
    }

    res.json({ message: 'Reader history entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting reader history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// リーダーモードの履歴を全削除
router.delete('/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM reader_history');
    res.json({ message: 'Reader history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing reader history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HTMLコンテンツをパースしてメインコンテンツを抽出する関数
async function parseContent(html) {
  try {
    // ここで実際のパース処理を実装
    // 例: Readability.jsやその他のライブラリを使用

    // ダミーの実装
    return {
      title: 'Example Title',
      text: 'Example content...',
      wordCount: 100,
      estimatedReadTime: 1
    };
  } catch (error) {
    logger.error('Error parsing HTML content:', error);
    throw error;
  }
}

module.exports = router; 