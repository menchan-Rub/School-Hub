const logger = require('./logger');

// APIレスポンスの作成
const createResponse = (data, status = 200) => {
  return {
    status,
    data,
    timestamp: new Date().toISOString()
  };
};

// エラーレスポンスの作成
const createErrorResponse = (error, status = 500) => {
  return {
    status,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    timestamp: new Date().toISOString()
  };
};

// ページネーションの処理
const handlePagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

// ソートの処理
const handleSort = (query, defaultSort = 'created_at', defaultOrder = 'DESC') => {
  const sortField = query.sort || defaultSort;
  const sortOrder = (query.order || defaultOrder).toUpperCase();

  // SQLインジェクション対策
  const validSortFields = ['created_at', 'updated_at', 'id', 'title', 'url'];
  const validSortOrders = ['ASC', 'DESC'];

  if (!validSortFields.includes(sortField) || !validSortOrders.includes(sortOrder)) {
    throw new Error('Invalid sort parameters');
  }

  return {
    sortField,
    sortOrder
  };
};

// フィルタリングの処理
const handleFilters = (query, allowedFilters) => {
  const filters = {};

  for (const [key, value] of Object.entries(query)) {
    if (allowedFilters.includes(key)) {
      filters[key] = value;
    }
  }

  return filters;
};

// 検索クエリの処理
const handleSearch = (query, searchFields) => {
  if (!query.search) {
    return '';
  }

  const searchTerm = query.search.trim();
  if (!searchTerm) {
    return '';
  }

  const conditions = searchFields.map(field => 
    `${field} ILIKE '%${searchTerm}%'`
  );

  return `(${conditions.join(' OR ')})`;
};

// レスポンスヘッダーの設定
const setResponseHeaders = (res, options = {}) => {
  // キャッシュ制御
  if (options.cache) {
    res.setHeader('Cache-Control', `public, max-age=${options.cache}`);
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  // CORS
  if (options.cors) {
    res.setHeader('Access-Control-Allow-Origin', options.cors);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // セキュリティヘッダー
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
};

// APIメトリクスの記録
const recordMetrics = (req, res, startTime) => {
  const duration = Date.now() - startTime;
  const size = parseInt(res.get('Content-Length') || '0');

  logger.info('API request completed', {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration: `${duration}ms`,
    size: `${size}B`,
    ip: req.ip
  });
};

// レート制限のチェック
const checkRateLimit = (req, limit, window) => {
  // TODO: レート制限の実装
  // 例: Redis/メモリキャッシュを使用
  return true;
};

// APIバージョンの検証
const validateApiVersion = (req, supportedVersions) => {
  const version = req.headers['api-version'];
  if (!version || !supportedVersions.includes(version)) {
    throw new Error('Unsupported API version');
  }
  return version;
};

module.exports = {
  createResponse,
  createErrorResponse,
  handlePagination,
  handleSort,
  handleFilters,
  handleSearch,
  setResponseHeaders,
  recordMetrics,
  checkRateLimit,
  validateApiVersion
}; 