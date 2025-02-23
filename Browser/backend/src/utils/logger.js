const winston = require('winston');
const { format } = winston;
const path = require('path');
const config = require('../config');
const fs = require('fs');

// ログレベルの定義
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// ログレベルの色の定義
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// カスタムフォーマットの作成
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// コンソール出力用のフォーマット
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// ログファイルのパス設定
const logDir = path.join(__dirname, '../../logs');

// ロガーの作成
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: customFormat,
  transports: [
    // エラーログ
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 全てのログ
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // HTTPリクエストログ
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境の場合はコンソールにも出力
if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// リクエストログ用のミドルウェア
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });
  next();
};

// エラーログ用のミドルウェア
logger.errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    ip: req.ip,
  });
  next(err);
};

// ログローテーション
const rotateLogs = () => {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  
  logger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.File) {
      const oldPath = transport.filename;
      const newPath = `${oldPath}.${timestamp}`;
      
      // ファイルの存在確認とリネーム
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
    }
  });
};

// 毎日0時にログローテーションを実行
const scheduleLogRotation = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0
  );
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    rotateLogs();
    setInterval(rotateLogs, 24 * 60 * 60 * 1000);
  }, msToMidnight);
};

scheduleLogRotation();

module.exports = logger; 