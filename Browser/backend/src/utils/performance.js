const logger = require('./logger');

// パフォーマンスメトリクスの保存
const metrics = {
  requests: new Map(),
  memory: [],
  cpu: [],
  eventLoop: []
};

// リクエストのパフォーマンス計測開始
const startRequest = (req) => {
  const requestId = req.id || Date.now().toString();
  metrics.requests.set(requestId, {
    url: req.url,
    method: req.method,
    startTime: process.hrtime(),
    memory: process.memoryUsage()
  });
  return requestId;
};

// リクエストのパフォーマンス計測終了
const endRequest = (requestId, res) => {
  const request = metrics.requests.get(requestId);
  if (!request) return null;

  const diff = process.hrtime(request.startTime);
  const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // ミリ秒に変換

  const perfData = {
    url: request.url,
    method: request.method,
    duration,
    statusCode: res.statusCode,
    memoryDiff: {
      heapUsed: process.memoryUsage().heapUsed - request.memory.heapUsed,
      external: process.memoryUsage().external - request.memory.external
    }
  };

  metrics.requests.delete(requestId);
  logger.debug('Request performance', perfData);
  return perfData;
};

// メモリ使用量の監視
const monitorMemory = () => {
  const usage = process.memoryUsage();
  metrics.memory.push({
    timestamp: Date.now(),
    ...usage
  });

  // 24時間以上前のデータを削除
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  metrics.memory = metrics.memory.filter(m => m.timestamp > dayAgo);

  // メモリ使用量が閾値を超えた場合にアラート
  if (usage.heapUsed > 0.8 * usage.heapTotal) {
    logger.warn('High memory usage detected', usage);
  }

  return usage;
};

// CPU使用率の監視
const monitorCPU = () => {
  const startUsage = process.cpuUsage();
  
  return new Promise(resolve => {
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const cpuPercent = {
        user: endUsage.user / 1000000, // マイクロ秒からミリ秒に変換
        system: endUsage.system / 1000000
      };

      metrics.cpu.push({
        timestamp: Date.now(),
        ...cpuPercent
      });

      // 24時間以上前のデータを削除
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      metrics.cpu = metrics.cpu.filter(c => c.timestamp > dayAgo);

      // CPU使用率が閾値を超えた場合にアラート
      if (cpuPercent.user + cpuPercent.system > 80) {
        logger.warn('High CPU usage detected', cpuPercent);
      }

      resolve(cpuPercent);
    }, 100);
  });
};

// イベントループの遅延監視
const monitorEventLoop = () => {
  const start = process.hrtime();
  
  setImmediate(() => {
    const diff = process.hrtime(start);
    const lag = (diff[0] * 1e9 + diff[1]) / 1e6; // ミリ秒に変換

    metrics.eventLoop.push({
      timestamp: Date.now(),
      lag
    });

    // 24時間以上前のデータを削除
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    metrics.eventLoop = metrics.eventLoop.filter(e => e.timestamp > dayAgo);

    // イベントループの遅延が閾値を超えた場合にアラート
    if (lag > 100) {
      logger.warn('High event loop lag detected', { lag });
    }

    return lag;
  });
};

// パフォーマンスメトリクスの取得
const getMetrics = () => {
  return {
    memory: metrics.memory,
    cpu: metrics.cpu,
    eventLoop: metrics.eventLoop,
    activeRequests: metrics.requests.size
  };
};

// パフォーマンス最適化の推奨事項を取得
const getOptimizationRecommendations = () => {
  const recommendations = [];
  const recentMemory = metrics.memory.slice(-10);
  const recentCPU = metrics.cpu.slice(-10);
  const recentEventLoop = metrics.eventLoop.slice(-10);

  // メモリリーク検出
  if (recentMemory.every((m, i) => i === 0 || m.heapUsed > recentMemory[i-1].heapUsed)) {
    recommendations.push({
      type: 'memory',
      severity: 'high',
      message: 'メモリリークの可能性があります。メモリ使用量が継続的に増加しています。'
    });
  }

  // CPU負荷検出
  const avgCPU = recentCPU.reduce((sum, c) => sum + c.user + c.system, 0) / recentCPU.length;
  if (avgCPU > 70) {
    recommendations.push({
      type: 'cpu',
      severity: 'medium',
      message: 'CPU使用率が高いです。処理の最適化を検討してください。'
    });
  }

  // イベントループ遅延検出
  const avgLag = recentEventLoop.reduce((sum, e) => sum + e.lag, 0) / recentEventLoop.length;
  if (avgLag > 50) {
    recommendations.push({
      type: 'eventLoop',
      severity: 'medium',
      message: 'イベントループの遅延が検出されました。非同期処理を見直してください。'
    });
  }

  return recommendations;
};

module.exports = {
  startRequest,
  endRequest,
  monitorMemory,
  monitorCPU,
  monitorEventLoop,
  getMetrics,
  getOptimizationRecommendations
}; 