const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// キャッシュの設定を取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'cache'"
    );
    res.json(result.rows[0]?.value || {
      enabled: true,
      maxSize: config.cache.maxSize,
      maxAge: config.cache.maxAge,
      clearOnExit: false
    });
  } catch (error) {
    logger.error('Error fetching cache settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュの設定を更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('cache', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'CACHE_SETTINGS_CHANGED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating cache settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュエントリーの保存
router.post('/', async (req, res) => {
  const { url, data, contentType, expires } = req.body;
  try {
    // キャッシュキーの生成
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    const filename = `${hash}.cache`;
    const filePath = path.join(config.cache.directory, filename);

    // キャッシュデータの保存
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, Buffer.from(data));

    // データベースにメタデータを保存
    const result = await pool.query(
      `INSERT INTO cache_entries (
        url,
        hash,
        content_type,
        size,
        expires,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (url) DO UPDATE
      SET hash = EXCLUDED.hash,
          content_type = EXCLUDED.content_type,
          size = EXCLUDED.size,
          expires = EXCLUDED.expires,
          created_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [url, hash, contentType, Buffer.byteLength(data), expires]
    );

    // キャッシュサイズの確認と古いエントリーの削除
    await cleanupCache();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error saving cache entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュエントリーの取得
router.get('/:hash', async (req, res) => {
  const { hash } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cache_entries WHERE hash = $1',
      [hash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cache entry not found' });
    }

    const entry = result.rows[0];
    const filePath = path.join(config.cache.directory, `${hash}.cache`);

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Cache file not found' });
    }

    // キャッシュの有効期限チェック
    if (entry.expires && new Date(entry.expires) < new Date()) {
      await deleteCache(entry);
      return res.status(404).json({ error: 'Cache entry expired' });
    }

    // キャッシュデータを送信
    res.setHeader('Content-Type', entry.content_type);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error fetching cache entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュエントリーの削除
router.delete('/:hash', async (req, res) => {
  const { hash } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cache_entries WHERE hash = $1 RETURNING *',
      [hash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cache entry not found' });
    }

    // キャッシュファイルの削除
    const filePath = path.join(config.cache.directory, `${hash}.cache`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('Error deleting cache file:', error);
    }

    res.json({ message: 'Cache entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting cache entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュの統計情報を取得
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_entries,
        SUM(size) as total_size,
        MIN(created_at) as oldest_entry,
        MAX(created_at) as newest_entry
      FROM cache_entries
    `);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュの全クリア
router.delete('/', async (req, res) => {
  try {
    // データベースからすべてのエントリーを削除
    await pool.query('DELETE FROM cache_entries');

    // キャッシュディレクトリのクリア
    try {
      const files = await fs.readdir(config.cache.directory);
      await Promise.all(
        files.map(file =>
          fs.unlink(path.join(config.cache.directory, file))
        )
      );
    } catch (error) {
      logger.warn('Error clearing cache directory:', error);
    }

    // WebSocketを通じてキャッシュクリアを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'CACHE_CLEARED'
        }));
      }
    });

    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャッシュのクリーンアップ処理
async function cleanupCache() {
  try {
    // 期限切れのエントリーを削除
    const expiredResult = await pool.query(
      'DELETE FROM cache_entries WHERE expires < CURRENT_TIMESTAMP RETURNING hash'
    );

    // 期限切れのファイルを削除
    await Promise.all(
      expiredResult.rows.map(({ hash }) =>
        fs.unlink(path.join(config.cache.directory, `${hash}.cache`))
          .catch(error => logger.warn('Error deleting expired cache file:', error))
      )
    );

    // キャッシュサイズの確認
    const { rows: [stats] } = await pool.query(
      'SELECT SUM(size) as total_size FROM cache_entries'
    );

    if (stats.total_size > config.cache.maxSize) {
      // 古いエントリーを削除してサイズを制限内に収める
      const oversize = stats.total_size - config.cache.maxSize;
      const oversizeResult = await pool.query(
        `DELETE FROM cache_entries
         WHERE id IN (
           SELECT id FROM cache_entries
           ORDER BY created_at ASC
           LIMIT (
             SELECT COUNT(*) FROM cache_entries
             WHERE size <= $1
           )
         )
         RETURNING hash`,
        [oversize]
      );

      // 削除されたファイルを削除
      await Promise.all(
        oversizeResult.rows.map(({ hash }) =>
          fs.unlink(path.join(config.cache.directory, `${hash}.cache`))
            .catch(error => logger.warn('Error deleting oversize cache file:', error))
        )
      );
    }
  } catch (error) {
    logger.error('Error cleaning up cache:', error);
  }
}

// キャッシュエントリーの削除ヘルパー関数
async function deleteCache(entry) {
  try {
    await pool.query('DELETE FROM cache_entries WHERE hash = $1', [entry.hash]);
    const filePath = path.join(config.cache.directory, `${entry.hash}.cache`);
    await fs.unlink(filePath);
  } catch (error) {
    logger.error('Error deleting cache entry:', error);
  }
}

module.exports = router; 