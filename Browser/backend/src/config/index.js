const path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 10284,
  host: process.env.HOST || 'localhost',
  
  // データベース設定
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'browser_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },

  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: path.join(__dirname, '../../logs')
  },

  // CEFブラウザ設定
  browser: {
    debugPort: process.env.BROWSER_DEBUG_PORT || 9222,
    windowless: true,
    noSandbox: false
  },

  // セキュリティ設定
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    wsOrigin: process.env.WS_ORIGIN || '*',
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  },

  // WebSocket設定
  websocket: {
    path: '/ws',
    pingInterval: 30000,
    pingTimeout: 5000
  }
}; 