const logger = require('../utils/logger');

// 404エラーハンドラー
const notFoundHandler = (req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
};

// バリデーションエラーハンドラー
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    logger.warn('Validation error:', err);
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details || err.message
    });
  }
  next(err);
};

// データベースエラーハンドラー
const databaseErrorHandler = (err, req, res, next) => {
  if (err.code && err.code.startsWith('23')) {
    logger.error('Database error:', err);
    return res.status(400).json({
      error: 'Database Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
};

// 認証エラーハンドラー
const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    logger.warn('Authentication error:', err);
    return res.status(401).json({
      error: 'Authentication Error',
      details: err.message
    });
  }
  next(err);
};

// グローバルエラーハンドラー
const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  // エラーをログに記録
  logger.error('Unhandled error:', {
    status,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    headers: req.headers
  });

  // クライアントへのレスポンス
  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 重大なエラーの場合、監視システムに通知
  if (status === 500) {
    notifyMonitoringSystem(err);
  }
};

// 非同期エラーハンドラーのラッパー
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 監視システムへの通知
function notifyMonitoringSystem(error) {
  // TODO: 監視システムへの通知ロジックを実装
  logger.error('Critical error notification:', error);
}

module.exports = {
  notFoundHandler,
  validationErrorHandler,
  databaseErrorHandler,
  authErrorHandler,
  globalErrorHandler,
  asyncErrorHandler
}; 