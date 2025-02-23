const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const config = require('../config');

// 基本的なレート制限の設定
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // IPアドレスごとの最大リクエスト数
  message: {
    error: 'Too many requests, please try again later.',
    details: '短時間に多くのリクエストが発生しました。しばらく待ってから再試行してください。'
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      details: '短時間に多くのリクエストが発生しました。しばらく待ってから再試行してください。'
    });
  }
});

// API用のレート制限
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // IPアドレスごとの最大リクエスト数
  message: {
    error: 'Too many API requests',
    details: 'APIリクエスト数が制限を超えました。しばらく待ってから再試行してください。'
  },
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'API Rate Limit Exceeded',
      details: 'APIリクエスト数が制限を超えました。しばらく待ってから再試行してください。'
    });
  }
});

// ダウンロード用のレート制限
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // IPアドレスごとの最大ダウンロード数
  message: {
    error: 'Download limit exceeded',
    details: 'ダウンロード数が制限を超えました。1時間後に再試行してください。'
  },
  handler: (req, res) => {
    logger.warn('Download rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Download Rate Limit Exceeded',
      details: 'ダウンロード数が制限を超えました。1時間後に再試行してください。'
    });
  }
});

// 認証試行用のレート制限
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // IPアドレスごとの最大認証試行回数
  message: {
    error: 'Too many authentication attempts',
    details: '認証の試行回数が制限を超えました。1時間後に再試行してください。'
  },
  handler: (req, res) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Authentication Rate Limit Exceeded',
      details: '認証の試行回数が制限を超えました。1時間後に再試行してください。'
    });
  }
});

// 検索用のレート制限
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 20, // IPアドレスごとの最大検索リクエスト数
  message: {
    error: 'Search limit exceeded',
    details: '検索リクエスト数が制限を超えました。しばらく待ってから再試行してください。'
  },
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      query: req.query.q
    });
    res.status(429).json({
      error: 'Search Rate Limit Exceeded',
      details: '検索リクエスト数が制限を超えました。しばらく待ってから再試行してください。'
    });
  }
});

// WebSocket接続用のレート制限
const wsConnectionLimiter = (() => {
  const connections = new Map();
  const maxConnections = 5; // IPアドレスごとの最大接続数
  const windowMs = 60 * 1000; // 1分

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // 古い接続記録のクリーンアップ
    if (connections.has(ip)) {
      const times = connections.get(ip).filter(time => now - time < windowMs);
      connections.set(ip, times);
    }

    // 新しい接続の追加
    const times = connections.get(ip) || [];
    if (times.length >= maxConnections) {
      logger.warn('WebSocket connection rate limit exceeded', { ip });
      return res.status(429).json({
        error: 'Connection Rate Limit Exceeded',
        details: 'WebSocket接続数が制限を超えました。しばらく待ってから再試行してください。'
      });
    }

    times.push(now);
    connections.set(ip, times);
    next();
  };
})();

module.exports = {
  basicLimiter,
  apiLimiter,
  downloadLimiter,
  authLimiter,
  searchLimiter,
  wsConnectionLimiter
}; 