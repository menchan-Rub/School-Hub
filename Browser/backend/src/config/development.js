const path = require('path');
const defaultConfig = require('./default');

module.exports = {
  ...defaultConfig,
  env: 'development',

  // サーバー設定
  server: {
    trustProxy: false,
  },

  // データベース設定
  database: {
    ...defaultConfig.database,
    ssl: false,
    pool: {
      max: 10,
      min: 2,
    },
    logging: true,
    logQueryParameters: true,
  },

  // ログ設定
  logging: {
    ...defaultConfig.logging,
    level: 'debug',
    console: true,
    file: true,
    colorize: true,
    timestamp: true,
    stackTrace: true,
  },

  // セキュリティ設定
  security: {
    ...defaultConfig.security,
    cors: {
      origin: '*',
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分
      max: 1000, // 開発用に緩い制限
    },
  },

  // キャッシュ設定
  cache: {
    ...defaultConfig.cache,
    maxAge: 5 * 60 * 1000, // 5分
    maxSize: 50 * 1024 * 1024, // 50MB
  },

  // バックアップ設定
  backup: {
    enabled: false, // 開発環境ではバックアップを無効化
    path: path.join(__dirname, '../../dev-backups'),
  },

  // モニタリング設定
  monitoring: {
    enabled: true,
    interval: 5 * 1000, // 5秒（開発用に短く）
    metrics: {
      memory: true,
      cpu: true,
      disk: true,
      network: true,
      postgres: true,
    },
    logging: {
      enabled: true,
      detailed: true,
    },
  },

  // WebSocket設定
  websocket: {
    maxPayload: 20 * 1024 * 1024, // 20MB（開発用に大きく）
    pingInterval: 60000,
    pingTimeout: 10000,
  },

  // 圧縮設定
  compression: {
    enabled: false, // 開発環境では無効化
  },

  // スタティックファイル設定
  static: {
    maxAge: 0, // キャッシュ無効化
    etag: false,
    lastModified: true,
  },

  // 開発者ツール設定
  devTools: {
    enabled: true,
    debugger: true,
    sourceMap: true,
    hotReload: true,
    liveReload: true,
    networkPanel: true,
    consolePanel: true,
  },

  // CEF設定
  cef: {
    ...defaultConfig.cef,
    debugPort: 9222,
  },

  // ダウンロード設定
  downloads: {
    ...defaultConfig.downloads,
    directory: '/tmp/browser_downloads',
    maxSize: 1024 * 1024 * 1024, // 1GB
  },
}; 