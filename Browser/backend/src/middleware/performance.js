const logger = require('../utils/logger');
const config = require('../config');

// リクエストパフォーマンスの監視
const requestPerformance = (req, res, next) => {
  // リクエスト開始時刻を記録
  const startTime = process.hrtime();

  // メモリ使用量の記録
  const startMemory = process.memoryUsage();

  // レスポンス終了時の処理
  res.on('finish', () => {
    // 実行時間の計算
    const diff = process.hrtime(startTime);
    const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // ミリ秒に変換

    // メモリ使用量の変化を計算
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    // パフォーマンスメトリクスの記録
    logger.info('Request performance', {
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(2)}ms`,
      memory: memoryDiff,
      status: res.statusCode,
    });

    // スロークエリの検出
    if (duration > config.performance.slowRequestThreshold) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        threshold: config.performance.slowRequestThreshold,
      });
    }

    // メモリリーク検出
    if (memoryDiff.heapUsed > config.performance.memoryLeakThreshold) {
      logger.warn('Potential memory leak detected', {
        method: req.method,
        path: req.path,
        memoryIncrease: memoryDiff.heapUsed,
        threshold: config.performance.memoryLeakThreshold,
      });
    }
  });

  next();
};

// リソース使用量の監視
const resourceMonitor = (req, res, next) => {
  // CPU使用率の監視
  const startCpu = process.cpuUsage();

  res.on('finish', () => {
    const cpuUsage = process.cpuUsage(startCpu);
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000; // マイクロ秒からミリ秒に変換

    if (totalCpuTime > config.performance.cpuThreshold) {
      logger.warn('High CPU usage detected', {
        method: req.method,
        path: req.path,
        cpuTime: `${totalCpuTime.toFixed(2)}ms`,
        threshold: config.performance.cpuThreshold,
      });
    }
  });

  next();
};

// 同時接続数の制限
const connectionLimiter = (() => {
  let currentConnections = 0;
  const maxConnections = config.performance.maxConnections;

  return (req, res, next) => {
    if (currentConnections >= maxConnections) {
      logger.warn('Connection limit reached', {
        currentConnections,
        maxConnections,
        ip: req.ip,
      });
      return res.status(503).json({ error: 'Server is busy' });
    }

    currentConnections++;

    res.on('finish', () => {
      currentConnections--;
    });

    res.on('close', () => {
      currentConnections--;
    });

    next();
  };
})();

// キャッシュコントロール
const cacheControl = (options = {}) => {
  const defaultOptions = {
    public: true,
    maxAge: 3600,
    staleWhileRevalidate: 60,
  };

  const settings = { ...defaultOptions, ...options };

  return (req, res, next) => {
    if (req.method === 'GET') {
      const directives = [];

      if (settings.public) {
        directives.push('public');
      } else {
        directives.push('private');
      }

      if (settings.maxAge) {
        directives.push(`max-age=${settings.maxAge}`);
      }

      if (settings.staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${settings.staleWhileRevalidate}`);
      }

      res.setHeader('Cache-Control', directives.join(', '));
    }

    next();
  };
};

// 圧縮レベルの最適化
const compressionOptimizer = (req, res, next) => {
  // ファイルサイズに基づいて圧縮レベルを動的に調整
  const contentLength = parseInt(req.get('content-length') || '0');

  if (contentLength > config.performance.compressionThreshold) {
    req.compressionLevel = 6; // 大きなファイル用の中程度の圧縮
  } else {
    req.compressionLevel = 9; // 小さなファイル用の最大圧縮
  }

  next();
};

module.exports = {
  requestPerformance,
  resourceMonitor,
  connectionLimiter,
  cacheControl,
  compressionOptimizer
}; 