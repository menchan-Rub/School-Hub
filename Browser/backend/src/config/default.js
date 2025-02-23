const path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // データベース設定
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'browser_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // JWT設定
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h',
  },

  // CORS設定
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600,
  },

  // セキュリティ設定
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分
      max: 100, // IPごとの最大リクエスト数
    },
    bcrypt: {
      saltRounds: 12,
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      maxAge: 24 * 60 * 60 * 1000, // 24時間
    },
  },

  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: 5242880, // 5MB
    maxFiles: 5,
    directory: '../logs',
  },

  // CEF設定
  cef: {
    debugPort: process.env.CEF_DEBUG_PORT || 9222,
    cachePath: process.env.CEF_CACHE_PATH || '/tmp/cef_cache',
    userDataPath: process.env.CEF_USER_DATA_PATH || '/tmp/cef_user_data',
  },

  // WebSocket設定
  websocket: {
    path: '/ws',
    pingInterval: 30000,
    pingTimeout: 5000,
  },

  // キャッシュ設定
  cache: {
    maxAge: 60 * 60 * 1000, // 1時間
    maxSize: 100 * 1024 * 1024, // 100MB
  },

  // ダウンロード設定
  downloads: {
    directory: process.env.DOWNLOAD_DIR || '/tmp/downloads',
    maxSize: 1024 * 1024 * 1024, // 1GB
  },

  // アプリケーション設定
  app: {
    name: 'Lightweight Browser',
    version: require('../../package.json').version,
  },

  // サーバー設定
  server: {
    host: process.env.HOST || 'localhost',
    trustProxy: false,
  },

  // ログ設定
  logging: {
    dir: path.join(__dirname, '../../logs'),
    console: true,
    file: true,
  },

  // バックアップ設定
  backup: {
    enabled: true,
    schedule: '0 0 * * *', // 毎日0時
    retention: 7, // 7日間保持
    path: path.join(__dirname, '../../backups'),
  },

  // モニタリング設定
  monitoring: {
    enabled: true,
    interval: 60 * 1000, // 1分
    metrics: {
      memory: true,
      cpu: true,
      disk: true,
    },
  },

  // スクリーンショット設定
  screenshots: {
    path: path.join(__dirname, '../../screenshots'),
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
  },
}; 