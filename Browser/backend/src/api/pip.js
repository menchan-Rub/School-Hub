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

// PiP状態の取得
router.get('/state', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pip_state WHERE active = true'
    );
    res.json(result.rows[0] || { active: false });
  } catch (error) {
    logger.error('Error fetching PiP state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PiP状態の更新
router.post('/state', async (req, res) => {
  const { url, title, videoTime, windowPosition, windowSize, active } = req.body;
  try {
    // 既存のアクティブなPiP状態を無効化
    if (active) {
      await pool.query(
        'UPDATE pip_state SET active = false WHERE active = true'
      );
    }

    // 新しいPiP状態を保存
    const result = await pool.query(
      `INSERT INTO pip_state (
        url,
        title,
        video_time,
        window_position,
        window_size,
        active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *`,
      [url, title, videoTime, windowPosition, windowSize, active]
    );

    // WebSocketを通じて状態変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PIP_STATE_CHANGED',
          state: result.rows[0]
        }));
      }
    });

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating PiP state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PiPの終了
router.post('/exit', async (req, res) => {
  try {
    await pool.query('UPDATE pip_state SET active = false WHERE active = true');

    // WebSocketを通じてPiP終了を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PIP_EXITED'
        }));
      }
    });

    res.json({ message: 'PiP exited successfully' });
  } catch (error) {
    logger.error('Error exiting PiP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PiP履歴の取得
router.get('/history', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM pip_state
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching PiP history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PiP履歴の削除
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM pip_state WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PiP history entry not found' });
    }

    res.json({ message: 'PiP history entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting PiP history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PiP履歴の全削除
router.delete('/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM pip_state WHERE NOT active');
    res.json({ message: 'PiP history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing PiP history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 