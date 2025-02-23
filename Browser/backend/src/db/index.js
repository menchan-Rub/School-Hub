const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

class Database {
  constructor() {
    this.pool = new Pool({
      user: config.database.user,
      host: config.database.host,
      database: config.database.name,
      password: config.database.password,
      port: config.database.port,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client', err);
    });

    this.pool.on('connect', (client) => {
      logger.info('New client connected to database');
    });
  }

  async initialize() {
    try {
      // 接続テスト
      const client = await this.pool.connect();
      logger.info('Database connection successful');
      client.release();

      // マイグレーションの実行
      await this.runMigrations();

      return true;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async runMigrations() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // マイグレーションテーブルの作成
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // マイグレーションの実行
      const migrations = [
        'create_users_table',
        'create_history_table',
        'create_bookmarks_table',
        'create_settings_table',
        'create_downloads_table'
      ];

      for (const migration of migrations) {
        const exists = await client.query(
          'SELECT id FROM migrations WHERE name = $1',
          [migration]
        );

        if (exists.rows.length === 0) {
          const sql = require(`./migrations/${migration}`);
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration]
          );
          logger.info(`Migration executed: ${migration}`);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', {
        text,
        duration,
        rows: res.rowCount
      });
      return res;
    } catch (error) {
      logger.error('Query error:', {
        text,
        error: error.message
      });
      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // クエリをインターセプトしてログを追加
    client.query = (...args) => {
      client.lastQuery = args;
      return query(...args);
    };

    // リリース時のラッパー
    client.release = () => {
      client.query = query;
      client.release = release;
      return release();
    };

    return client;
  }

  async transaction(callback) {
    const client = await this.getClient();
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
  }

  async end() {
    await this.pool.end();
    logger.info('Database connection pool has ended');
  }
}

module.exports = new Database(); 