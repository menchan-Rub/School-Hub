const logger = require('../utils/logger');
const config = require('../config');

// リクエストロギング
const requestLogger = (req, res, next) => {
  // リクエスト開始時刻を記録
  req._startTime = Date.now();

  // レスポンス終了時の処理
  res.on('finish', () => {
    const duration = Date.now() - req._startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      query: req.query,
      params: req.params,
    });

    // パフォーマンスメトリクスの記録
    if (duration > config.logging.slowRequestThreshold) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
      });
    }
  });

  // エラー発生時の処理
  res.on('error', (error) => {
    logger.error('Request error', {
      method: req.method,
      path: req.path,
      error: error.message,
      stack: error.stack,
    });
  });

  next();
};

// エラーロギング
const errorLogger = (err, req, res, next) => {
  const status = err.status || 500;
  const level = status >= 500 ? 'error' : 'warn';

  logger[level]('Request error', {
    method: req.method,
    path: req.path,
    status,
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next(err);
};

// アクセスロギング
const accessLogger = (req, res, next) => {
  // 除外パスのチェック
  if (shouldSkipLogging(req.path)) {
    return next();
  }

  const startTime = Date.now();
  const originalEnd = res.end;

  // レスポンス終了時の処理をオーバーライド
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - startTime;
    const size = res.get('content-length');

    logger.info('Access log', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      size: size ? `${size}B` : 'unknown',
      ip: req.ip,
      protocol: req.protocol,
      userAgent: req.get('user-agent'),
    });
  };

  next();
};

// WebSocketロギング
const wsLogger = (ws, req) => {
  logger.info('WebSocket connected', {
    ip: req.ip,
    protocol: ws.protocol,
    headers: req.headers,
  });

  ws.on('message', (message) => {
    logger.debug('WebSocket message received', {
      ip: req.ip,
      messageSize: message.length,
    });
  });

  ws.on('close', (code, reason) => {
    logger.info('WebSocket disconnected', {
      ip: req.ip,
      code,
      reason,
    });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', {
      ip: req.ip,
      error: error.message,
      stack: error.stack,
    });
  });
};

// ロギング除外パスの判定
function shouldSkipLogging(path) {
  const skipPaths = [
    '/health',
    '/metrics',
    '/favicon.ico'
  ];

  return skipPaths.some(skipPath => path.startsWith(skipPath));
}

module.exports = {
  requestLogger,
  errorLogger,
  accessLogger,
  wsLogger
}; 