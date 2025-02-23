const logger = require('./logger');

// カスタムエラークラス
class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// バリデーションエラー
class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// 認証エラー
class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// 認可エラー
class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 未検出エラー
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// データベースエラー
class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

// エラーハンドラー
const errorHandler = (err, req, res, next) => {
  // エラーのログ記録
  logError(err);

  // エラーレスポンスの作成
  const response = createErrorResponse(err);

  // エラーレスポンスの送信
  res.status(response.status).json(response);
};

// エラーのログ記録
const logError = (error) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    status: error.status,
    code: error.code
  };

  if (error.status >= 500) {
    logger.error('Server error:', errorInfo);
  } else {
    logger.warn('Client error:', errorInfo);
  }
};

// エラーレスポンスの作成
const createErrorResponse = (error) => {
  const response = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message
    },
    status: error.status || 500
  };

  // 開発環境の場合、スタックトレースを含める
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  // バリデーションエラーの場合、フィールド情報を含める
  if (error instanceof ValidationError) {
    response.error.field = error.field;
  }

  // データベースエラーの場合、元のエラー情報を含める
  if (error instanceof DatabaseError && process.env.NODE_ENV === 'development') {
    response.error.originalError = error.originalError;
  }

  return response;
};

// 非同期エラーハンドラーのラッパー
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// エラー通知
const notifyError = (error) => {
  // TODO: エラー通知システムの実装
  // 例: Slack, メール, モニタリングシステムなど
  logger.error('Error notification:', {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  errorHandler,
  asyncErrorHandler,
  notifyError
}; 