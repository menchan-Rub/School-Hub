const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// バックアップの作成
router.post('/', async (req, res) => {
  const { type = 'full' } = req.body;
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups');
    await fs.mkdir(backupDir, { recursive: true });

    let backupPath;
    let backupSize;

    if (type === 'database') {
      // データベースのバックアップ
      backupPath = path.join(backupDir, `database-${timestamp}.sql`);
      await createDatabaseBackup(backupPath);
    } else if (type === 'settings') {
      // 設定のバックアップ
      backupPath = path.join(backupDir, `settings-${timestamp}.json`);
      await createSettingsBackup(backupPath);
    } else {
      // 完全バックアップ
      backupPath = path.join(backupDir, `full-${timestamp}.tar.gz`);
      await createFullBackup(backupPath);
    }

    const stats = await fs.stat(backupPath);
    backupSize = stats.size;

    // バックアップ情報をデータベースに記録
    const result = await pool.query(
      `INSERT INTO backups (
        type,
        file_path,
        file_size,
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *`,
      [type, backupPath, backupSize]
    );

    // WebSocketを通じてバックアップ完了を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'BACKUP_CREATED',
          backup: result.rows[0]
        }));
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// バックアップ一覧の取得
router.get('/', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM backups
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// バックアップのダウンロード
router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM backups WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const backup = result.rows[0];
    const filePath = backup.file_path;

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backup file not found on disk' });
    }

    // ファイルのダウンロード
    res.download(filePath);
  } catch (error) {
    logger.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// バックアップの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM backups WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const backup = result.rows[0];

    // ファイルの削除
    try {
      await fs.unlink(backup.file_path);
    } catch (error) {
      logger.warn('Error deleting backup file:', error);
    }

    // WebSocketを通じてバックアップ削除を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'BACKUP_DELETED',
          backupId: id
        }));
      }
    });

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// バックアップ設定の取得
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'backup'"
    );
    res.json(result.rows[0]?.value || {
      schedule: {
        enabled: true,
        frequency: 'daily',
        time: '00:00',
        retentionDays: 30
      },
      types: ['database', 'settings'],
      compression: true,
      location: path.join(__dirname, '../../backups')
    });
  } catch (error) {
    logger.error('Error fetching backup settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// バックアップ設定の更新
router.put('/settings', async (req, res) => {
  const settings = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value)
       VALUES ('backup', $1)
       ON CONFLICT (key) DO UPDATE
       SET value = $1
       RETURNING value`,
      [settings]
    );

    // WebSocketを通じて設定変更を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'BACKUP_SETTINGS_UPDATED',
          settings: result.rows[0].value
        }));
      }
    });

    res.json(result.rows[0].value);
  } catch (error) {
    logger.error('Error updating backup settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// データベースバックアップの作成
async function createDatabaseBackup(filePath) {
  const { database, user, password, host, port } = config.database;
  const command = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -F p ${database} > ${filePath}`;
  await execAsync(command);
}

// 設定バックアップの作成
async function createSettingsBackup(filePath) {
  const result = await pool.query('SELECT * FROM settings');
  const settings = result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
}

// 完全バックアップの作成
async function createFullBackup(filePath) {
  const backupDir = path.dirname(filePath);
  const dbBackupPath = path.join(backupDir, 'database.sql');
  const settingsBackupPath = path.join(backupDir, 'settings.json');

  // データベースとファイルのバックアップを作成
  await createDatabaseBackup(dbBackupPath);
  await createSettingsBackup(settingsBackupPath);

  // バックアップファイルをアーカイブ
  const command = `tar -czf ${filePath} -C ${backupDir} database.sql settings.json`;
  await execAsync(command);

  // 一時ファイルの削除
  await fs.unlink(dbBackupPath);
  await fs.unlink(settingsBackupPath);
}

module.exports = router; 