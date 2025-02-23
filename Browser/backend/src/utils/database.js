const { Pool } = require('pg');
const logger = require('./logger');
const config = require('../config');

// データベースプール
const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
  ssl: config.database.ssl,
  max: config.database.pool?.max || 10,
  min: config.database.pool?.min || 2,
});

// クエリの実行
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      text,
      duration,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('Query error', {
      text,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// トランザクションの実行
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// データベースの初期化
const initialize = async () => {
  try {
    // テーブルの作成
    await createTables();
    // インデックスの作成
    await createIndices();
    // 初期データの挿入
    await insertInitialData();

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// テーブルの作成
const createTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      favicon_url TEXT,
      last_visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES folders(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      folder_id INTEGER REFERENCES folders(id),
      favicon_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT,
      size BIGINT,
      status TEXT,
      start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP WITH TIME ZONE,
      local_path TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value JSONB,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pip_state (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      video_time INTEGER,
      window_position JSONB,
      window_size JSONB,
      active BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reader_history (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      content TEXT,
      word_count INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// インデックスの作成
const createIndices = async () => {
  await query(`
    CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
    CREATE INDEX IF NOT EXISTS idx_history_visit_date ON history(visit_date);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX IF NOT EXISTS idx_pip_state_active ON pip_state(active);
    CREATE INDEX IF NOT EXISTS idx_reader_history_url ON reader_history(url);
  `);
};

// 初期データの挿入
const insertInitialData = async () => {
  // デフォルト設定の挿入
  await query(`
    INSERT INTO settings (key, value)
    VALUES
      ('theme', '{"mode":"system"}'::jsonb),
      ('search.engine', '"https://www.google.com/search?q={searchTerms}"'::jsonb),
      ('downloads.location', '"~/Downloads"'::jsonb),
      ('privacy.doNotTrack', 'true'::jsonb),
      ('security.webrtc', '"default_public_interface_only"'::jsonb),
      ('performance.hardware_acceleration', 'true'::jsonb),
      ('language', '"ja"'::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `);

  // デフォルトフォルダの作成
  await query(`
    INSERT INTO folders (name)
    VALUES ('ブックマークバー'), ('その他のブックマーク')
    ON CONFLICT DO NOTHING;
  `);
};

// データベースの状態チェック
const checkHealth = async () => {
  try {
    const result = await query('SELECT 1');
    return result.rows.length === 1;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// データベースのクリーンアップ
const cleanup = async () => {
  try {
    // 古い履歴の削除
    await query(`
      DELETE FROM history
      WHERE visit_date < NOW() - INTERVAL '90 days';
    `);

    // 完了したダウンロードの削除
    await query(`
      DELETE FROM downloads
      WHERE status = 'completed'
      AND end_time < NOW() - INTERVAL '30 days';
    `);

    // 非アクティブなPiP状態の削除
    await query(`
      DELETE FROM pip_state
      WHERE NOT active
      AND created_at < NOW() - INTERVAL '7 days';
    `);

    logger.info('Database cleanup completed');
  } catch (error) {
    logger.error('Database cleanup failed:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  initialize,
  checkHealth,
  cleanup
}; 