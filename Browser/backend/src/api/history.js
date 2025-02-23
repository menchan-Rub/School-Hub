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

// 履歴一覧の取得
router.get('/', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM history ORDER BY visit_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴の追加
router.post('/', async (req, res) => {
  const { url, title, favicon_url } = req.body;
  try {
    // 既存のエントリーを更新するか、新しいエントリーを作成
    const result = await pool.query(
      `INSERT INTO history (url, title, favicon_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (url) DO UPDATE
       SET visit_date = CURRENT_TIMESTAMP,
           last_visit_date = CURRENT_TIMESTAMP,
           title = EXCLUDED.title,
           favicon_url = EXCLUDED.favicon_url
       RETURNING *`,
      [url, title, favicon_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating history entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴の検索
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM history
       WHERE title ILIKE $1 OR url ILIKE $1
       ORDER BY visit_date DESC
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error searching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 履歴の削除（期間指定）
router.delete('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = 'DELETE FROM history';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE visit_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE visit_date >= $1';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE visit_date <= $1';
      params.push(endDate);
    }

    await pool.query(query, params);
    res.json({ message: 'History deleted successfully' });
  } catch (error) {
    logger.error('Error deleting history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 特定の履歴エントリーの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM history WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'History entry not found' });
    } else {
      res.json({ message: 'History entry deleted successfully' });
    }
  } catch (error) {
    logger.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 