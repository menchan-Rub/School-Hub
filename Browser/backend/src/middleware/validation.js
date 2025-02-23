const logger = require('../utils/logger');

// URLのバリデーション
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// ブックマークのバリデーション
const validateBookmark = (req, res, next) => {
  const { url, title } = req.body;

  if (!url || !validateUrl(url)) {
    logger.warn('Invalid bookmark URL', { url });
    return res.status(400).json({
      error: 'Validation Error',
      details: '有効なURLを指定してください'
    });
  }

  if (!title || title.length > 255) {
    logger.warn('Invalid bookmark title', { title });
    return res.status(400).json({
      error: 'Validation Error',
      details: 'タイトルは1文字以上255文字以下で指定してください'
    });
  }

  next();
};

// ダウンロードのバリデーション
const validateDownload = (req, res, next) => {
  const { url, filename } = req.body;

  if (!url || !validateUrl(url)) {
    logger.warn('Invalid download URL', { url });
    return res.status(400).json({
      error: 'Validation Error',
      details: '有効なURLを指定してください'
    });
  }

  if (!filename || !/^[\w\-. ]+$/.test(filename)) {
    logger.warn('Invalid filename', { filename });
    return res.status(400).json({
      error: 'Validation Error',
      details: '有効なファイル名を指定してください'
    });
  }

  next();
};

// 設定のバリデーション
const validateSettings = (req, res, next) => {
  const { key, value } = req.body;

  if (!key || typeof key !== 'string') {
    logger.warn('Invalid settings key', { key });
    return res.status(400).json({
      error: 'Validation Error',
      details: '有効な設定キーを指定してください'
    });
  }

  if (value === undefined || value === null) {
    logger.warn('Invalid settings value', { value });
    return res.status(400).json({
      error: 'Validation Error',
      details: '設定値を指定してください'
    });
  }

  next();
};

// ページネーションパラメータのバリデーション
const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;

  // デフォルト値の設定
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // 範囲チェック
  if (page < 1) {
    logger.warn('Invalid page number', { page });
    return res.status(400).json({
      error: 'Validation Error',
      details: 'ページ番号は1以上を指定してください'
    });
  }

  if (limit < 1 || limit > 100) {
    logger.warn('Invalid limit value', { limit });
    return res.status(400).json({
      error: 'Validation Error',
      details: '表示件数は1から100の間で指定してください'
    });
  }

  // 検証済みの値をリクエストオブジェクトに設定
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

// 日付範囲のバリデーション
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && !isValidDate(startDate)) {
    logger.warn('Invalid start date', { startDate });
    return res.status(400).json({
      error: 'Validation Error',
      details: '開始日の形式が正しくありません'
    });
  }

  if (endDate && !isValidDate(endDate)) {
    logger.warn('Invalid end date', { endDate });
    return res.status(400).json({
      error: 'Validation Error',
      details: '終了日の形式が正しくありません'
    });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    logger.warn('Invalid date range', { startDate, endDate });
    return res.status(400).json({
      error: 'Validation Error',
      details: '開始日は終了日より前である必要があります'
    });
  }

  next();
};

// 検索クエリのバリデーション
const validateSearchQuery = (req, res, next) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    logger.warn('Invalid search query', { query });
    return res.status(400).json({
      error: 'Validation Error',
      details: '検索クエリは2文字以上で指定してください'
    });
  }

  if (query.length > 100) {
    logger.warn('Search query too long', { query });
    return res.status(400).json({
      error: 'Validation Error',
      details: '検索クエリは100文字以下で指定してください'
    });
  }

  next();
};

// ヘルパー関数: 日付の妥当性チェック
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  validateBookmark,
  validateDownload,
  validateSettings,
  validatePagination,
  validateDateRange,
  validateSearchQuery
}; 