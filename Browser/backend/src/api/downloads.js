const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');
const path = require('path');
const fs = require('fs').promises;

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// ダウンロード一覧の取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM downloads ORDER BY start_time DESC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching downloads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロードの開始
router.post('/', async (req, res) => {
  const { url, filename } = req.body;
  try {
    // ダウンロードエントリの作成
    const result = await pool.query(
      `INSERT INTO downloads (
        url,
        filename,
        status,
        start_time
      ) VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
      RETURNING *`,
      [url, filename]
    );

    const download = result.rows[0];

    // WebSocketクライアントに通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOWNLOAD_STARTED',
          download
        }));
      }
    });

    res.status(201).json(download);

    // ダウンロード処理の開始
    startDownload(download);
  } catch (error) {
    logger.error('Error starting download:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロードの状態更新
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, local_path } = req.body;
  try {
    const result = await pool.query(
      `UPDATE downloads
       SET status = $1,
           local_path = $2,
           end_time = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE end_time END
       WHERE id = $3
       RETURNING *`,
      [status, local_path, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Download not found' });
    } else {
      // WebSocketを通じて状態更新を通知
      const download = result.rows[0];
      global.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'DOWNLOAD_UPDATED',
            download
          }));
        }
      });

      res.json(download);
    }
  } catch (error) {
    logger.error('Error updating download status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロードのキャンセル
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE downloads
       SET status = 'cancelled', end_time = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Download not found or already completed' });
    }

    // WebSocketクライアントに通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOWNLOAD_CANCELLED',
          download: result.rows[0]
        }));
      }
    });

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error cancelling download:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロードの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ダウンロードエントリの取得
    const download = await pool.query(
      'SELECT * FROM downloads WHERE id = $1',
      [id]
    );

    if (download.rows.length === 0) {
      return res.status(404).json({ error: 'Download not found' });
    }

    // ローカルファイルの削除
    if (download.rows[0].local_path) {
      try {
        await fs.unlink(download.rows[0].local_path);
      } catch (error) {
        logger.warn('Error deleting local file:', error);
      }
    }

    // データベースからの削除
    await pool.query('DELETE FROM downloads WHERE id = $1', [id]);

    res.json({ message: 'Download deleted successfully' });
  } catch (error) {
    logger.error('Error deleting download:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロード履歴のクリア
router.delete('/', async (req, res) => {
  try {
    // 完了したダウンロードのみを削除
    const downloads = await pool.query(
      "SELECT * FROM downloads WHERE status IN ('completed', 'failed', 'cancelled')"
    );

    // ローカルファイルの削除
    for (const download of downloads.rows) {
      if (download.local_path) {
        try {
          await fs.unlink(download.local_path);
        } catch (error) {
          logger.warn('Error deleting local file:', error);
        }
      }
    }

    // データベースからの削除
    await pool.query(
      "DELETE FROM downloads WHERE status IN ('completed', 'failed', 'cancelled')"
    );

    res.json({ message: 'Download history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing download history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ダウンロード処理の実行
async function startDownload(download) {
  try {
    // ダウンロードディレクトリの作成
    await fs.mkdir(config.downloads.path, { recursive: true });

    const localPath = path.join(config.downloads.path, download.filename);
    
    // TODO: 実際のダウンロード処理を実装
    // 例: fetch, axios, または他のダウンロードライブラリを使用

    // ダウンロードの完了を記録
    await pool.query(
      `UPDATE downloads
       SET status = 'completed',
           end_time = CURRENT_TIMESTAMP,
           local_path = $1
       WHERE id = $2`,
      [localPath, download.id]
    );

    // WebSocketクライアントに通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOWNLOAD_COMPLETED',
          download: {
            ...download,
            status: 'completed',
            local_path: localPath
          }
        }));
      }
    });
  } catch (error) {
    logger.error('Error during download:', error);

    // エラーを記録
    await pool.query(
      `UPDATE downloads
       SET status = 'failed',
           end_time = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [download.id]
    );

    // WebSocketクライアントに通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DOWNLOAD_FAILED',
          download: {
            ...download,
            status: 'failed'
          }
        }));
      }
    });
  }
}

module.exports = router; 