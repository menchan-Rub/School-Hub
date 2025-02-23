const cors = require('cors');
const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

// CORSミドルウェア
const corsMiddleware = cors({
  origin: config.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// ロギングミドルウェア
const loggingMiddleware = morgan('combined', {
  stream: logger.stream,
  skip: (req) => req.url === '/health'
});

// エラーハンドリングミドルウェア
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // データベースエラー
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database constraint violation',
      details: err.message
    });
  }

  // 認証エラー
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication required',
      details: err.message
    });
  }

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }

  // その他のエラー
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// WebSocketのオリジン検証
const wsOriginValidator = (info, callback) => {
  const origin = info.origin;
  if (config.security.wsOrigin === '*' || origin === config.security.wsOrigin) {
    callback(true);
  } else {
    callback(false, 403, 'Origin not allowed');
  }
};

// リクエストボディのサイズ制限
const bodyLimit = '10mb';

// セキュリティヘッダー
const securityHeaders = (req, res, next) => {
  // XSS対策
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // クリックジャッキング対策
  res.setHeader('X-Frame-Options', 'DENY');
  // MIMEタイプスニッフィング対策
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Referrerポリシー
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CSP
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  next();
};

// レート制限
const rateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // IPアドレスごとのリクエスト数
  message: {
    error: 'Too many requests, please try again later.'
  }
});

module.exports = {
  cors: corsMiddleware,
  logging: loggingMiddleware,
  errorHandler,
  wsOriginValidator,
  bodyLimit,
  securityHeaders,
  rateLimit
}; 