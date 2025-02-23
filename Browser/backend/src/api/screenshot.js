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

// スクリーンショット一覧の取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM screenshots ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching screenshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// スクリーンショットの保存
router.post('/', async (req, res) => {
  const { url, title, imageData, fullPage } = req.body;
  try {
    // ファイル名の生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const filePath = path.join(config.screenshots.directory, filename);

    // Base64データをデコードしてファイルに保存
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, imageBuffer);

    // データベースに保存
    const result = await pool.query(
      `INSERT INTO screenshots (
        url,
        title,
        filename,
        full_page,
        file_size,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *`,
      [url, title, filename, fullPage, imageBuffer.length]
    );

    // WebSocketを通じて通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SCREENSHOT_TAKEN',
          screenshot: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error saving screenshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// スクリーンショットの取得
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM screenshots WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const screenshot = result.rows[0];
    const filePath = path.join(config.screenshots.directory, screenshot.filename);

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Screenshot file not found on disk' });
    }

    // 画像ファイルを送信
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${screenshot.filename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error fetching screenshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// スクリーンショットの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM screenshots WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const screenshot = result.rows[0];
    const filePath = path.join(config.screenshots.directory, screenshot.filename);

    // ファイルの削除
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('Error deleting screenshot file:', error);
    }

    // WebSocketを通じて通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'SCREENSHOT_DELETED',
          screenshotId: id
        }));
      }
    });

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    logger.error('Error deleting screenshot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// スクリーンショットの検索
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM screenshots
       WHERE title ILIKE $1 OR url ILIKE $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error searching screenshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 