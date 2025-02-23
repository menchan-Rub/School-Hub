const path = require('path');
const defaultConfig = require('./default');

module.exports = {
  ...defaultConfig,
  env: 'production',
  
  // サーバー設定
  server: {
    trustProxy: true,
  },

  // データベース設定
  database: {
    ...defaultConfig.database,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: true,
  },

  // ログ設定
  logging: {
    ...defaultConfig.logging,
    level: 'warn',
    console: false,
  },

  // セキュリティ設定
  security: {
    ...defaultConfig.security,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分
      max: 50, // より厳しいレート制限
    },
    bcrypt: {
      saltRounds: 14, // より強力なハッシュ
    },
  },

  // キャッシュ設定
  cache: {
    ...defaultConfig.cache,
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    maxSize: 500 * 1024 * 1024, // 500MB
  },

  // バックアップ設定
  backup: {
    enabled: true,
    schedule: '0 */6 * * *', // 6時間ごと
    retention: 30, // 30日間保持
    compress: true,
  },

  // モニタリング設定
  monitoring: {
    enabled: true,
    interval: 30 * 1000, // 30秒
    alerting: {
      enabled: true,
      channels: ['email', 'slack'],
    },
    metrics: {
      memory: true,
      cpu: true,
      disk: true,
      network: true,
      postgres: true,
    },
  },

  // WebSocket設定
  websocket: {
    maxPayload: 5 * 1024 * 1024, // 5MB（より制限的）
    pingInterval: 30000,
    pingTimeout: 5000,
  },

  // 圧縮設定
  compression: {
    enabled: true,
    level: 6,
    threshold: 1024, // 1KB
  },

  // スタティックファイル設定
  static: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
    etag: true,
    lastModified: true,
  },

  // CEF設定
  cef: {
    ...defaultConfig.cef,
    cachePath: '/var/cache/cef',
    userDataPath: '/var/lib/cef/user_data',
  },

  // ダウンロード設定
  downloads: {
    ...defaultConfig.downloads,
    directory: '/var/lib/browser/downloads',
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
}; 