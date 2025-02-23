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

// タブ一覧の取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tabs ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching tabs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// タブの作成
router.post('/', async (req, res) => {
  const { url, title, favicon_url, is_active } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tabs (url, title, favicon_url, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [url, title, favicon_url, is_active]
    );

    // WebSocketを通じてタブの作成を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'TAB_CREATED',
          tab: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating tab:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// タブの更新
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { url, title, favicon_url, is_active } = req.body;
  try {
    // アクティブタブの場合、他のタブを非アクティブにする
    if (is_active) {
      await pool.query(
        'UPDATE tabs SET is_active = false WHERE id != $1',
        [id]
      );
    }

    const result = await pool.query(
      `UPDATE tabs
       SET url = COALESCE($1, url),
           title = COALESCE($2, title),
           favicon_url = COALESCE($3, favicon_url),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [url, title, favicon_url, is_active, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tab not found' });
    } else {
      // WebSocketを通じてタブの更新を通知
      global.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'TAB_UPDATED',
            tab: result.rows[0]
          }));
        }
      });

      res.json(result.rows[0]);
    }
  } catch (error) {
    logger.error('Error updating tab:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// タブの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM tabs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tab not found' });
    } else {
      // WebSocketを通じてタブの削除を通知
      global.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'TAB_DELETED',
            tabId: id
          }));
        }
      });

      res.json({ message: 'Tab deleted successfully' });
    }
  } catch (error) {
    logger.error('Error deleting tab:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// タブの並び替え
router.post('/reorder', async (req, res) => {
  const { tabIds } = req.body;
  try {
    // トランザクションを開始
    await pool.query('BEGIN');

    // 各タブの順序を更新
    for (let i = 0; i < tabIds.length; i++) {
      await pool.query(
        'UPDATE tabs SET position = $1 WHERE id = $2',
        [i, tabIds[i]]
      );
    }

    // トランザクションをコミット
    await pool.query('COMMIT');

    // 更新後のタブ一覧を取得
    const result = await pool.query(
      'SELECT * FROM tabs ORDER BY position ASC'
    );

    // WebSocketを通じてタブの並び替えを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'TABS_REORDERED',
          tabs: result.rows
        }));
      }
    });

    res.json(result.rows);
  } catch (error) {
    // エラーが発生した場合はロールバック
    await pool.query('ROLLBACK');
    logger.error('Error reordering tabs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 