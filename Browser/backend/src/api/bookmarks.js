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

// ブックマーク一覧の取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, f.name as folder_name FROM bookmarks b LEFT JOIN folders f ON b.folder_id = f.id ORDER BY b.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ブックマークの追加
router.post('/', async (req, res) => {
  const { url, title, folder_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bookmarks (url, title, folder_id) VALUES ($1, $2, $3) RETURNING *',
      [url, title, folder_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating bookmark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ブックマークの更新
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { url, title, folder_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bookmarks SET url = $1, title = $2, folder_id = $3 WHERE id = $4 RETURNING *',
      [url, title, folder_id, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bookmark not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    logger.error('Error updating bookmark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ブックマークの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bookmarks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bookmark not found' });
    } else {
      res.json({ message: 'Bookmark deleted successfully' });
    }
  } catch (error) {
    logger.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// フォルダ一覧の取得
router.get('/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM folders ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 