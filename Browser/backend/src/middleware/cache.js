const logger = require('../utils/logger');
const config = require('../config');

// メモリキャッシュの実装
const cache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  size: 0
};

// キャッシュミドルウェア
const cacheMiddleware = (options = {}) => {
  const {
    duration = 3600000, // デフォルト1時間
    key = req => req.originalUrl,
    condition = () => true,
    maxSize = config.cache.maxSize || 100 * 1024 * 1024 // デフォルト100MB
  } = options;

  return async (req, res, next) => {
    // キャッシュが無効な場合はスキップ
    if (!condition(req)) {
      return next();
    }

    const cacheKey = typeof key === 'function' ? key(req) : key;

    // キャッシュの取得を試行
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      const { data, timestamp, headers } = cachedResponse;

      // キャッシュの有効期限をチェック
      if (Date.now() - timestamp < duration) {
        cacheStats.hits++;
        logger.debug('Cache hit', { key: cacheKey });

        // ヘッダーの復元
        Object.entries(headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });

        return res.json(data);
      } else {
        // 期限切れのキャッシュを削除
        cache.delete(cacheKey);
        cacheStats.size -= JSON.stringify(cachedResponse).length;
      }
    }

    cacheStats.misses++;
    logger.debug('Cache miss', { key: cacheKey });

    // レスポンスの送信をインターセプト
    const originalJson = res.json;
    res.json = function(data) {
      const responseData = {
        data,
        timestamp: Date.now(),
        headers: {}
      };

      // 重要なヘッダーを保存
      ['content-type', 'etag', 'last-modified'].forEach(name => {
        const value = res.getHeader(name);
        if (value) {
          responseData.headers[name] = value;
        }
      });

      // キャッシュサイズの管理
      const newEntrySize = JSON.stringify(responseData).length;
      while (cacheStats.size + newEntrySize > maxSize && cache.size > 0) {
        // LRUポリシーに基づいて古いエントリーを削除
        const oldestKey = cache.keys().next().value;
        const oldEntry = cache.get(oldestKey);
        cacheStats.size -= JSON.stringify(oldEntry).length;
        cache.delete(oldestKey);
        logger.debug('Cache entry evicted', { key: oldestKey });
      }

      // 新しいエントリーをキャッシュに追加
      cache.set(cacheKey, responseData);
      cacheStats.size += newEntrySize;

      return originalJson.call(this, data);
    };

    next();
  };
};

// キャッシュ制御ヘッダーの設定
const setCacheControl = (options = {}) => {
  const {
    public = true,
    maxAge = 3600,
    staleWhileRevalidate = 60,
    mustRevalidate = false,
    noStore = false,
    noCache = false
  } = options;

  return (req, res, next) => {
    const directives = [];

    if (noStore) {
      directives.push('no-store');
    } else if (noCache) {
      directives.push('no-cache');
    } else {
      if (public) {
        directives.push('public');
      } else {
        directives.push('private');
      }

      if (maxAge) {
        directives.push(`max-age=${maxAge}`);
      }

      if (staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
      }

      if (mustRevalidate) {
        directives.push('must-revalidate');
      }
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
};

// 条件付きリクエストの処理
const conditionalGet = () => {
  return (req, res, next) => {
    // ETagの生成
    const generateETag = (content) => {
      const hash = require('crypto')
        .createHash('sha1')
        .update(JSON.stringify(content))
        .digest('hex');
      return `"${hash}"`;
    };

    // レスポンスの送信をインターセプト
    const originalJson = res.json;
    res.json = function(data) {
      const etag = generateETag(data);
      res.setHeader('ETag', etag);

      // If-None-Matchヘッダーのチェック
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// キャッシュ統計の取得
const getCacheStats = () => {
  return {
    ...cacheStats,
    entries: cache.size,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
  };
};

// キャッシュのクリア
const clearCache = () => {
  cache.clear();
  cacheStats.size = 0;
  logger.info('Cache cleared');
};

module.exports = {
  cacheMiddleware,
  setCacheControl,
  conditionalGet,
  getCacheStats,
  clearCache
}; 