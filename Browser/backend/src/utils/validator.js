const logger = require('./logger');

// URLのバリデーション
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// メールアドレスのバリデーション
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ファイル名のバリデーション
const isValidFilename = (filename) => {
  const filenameRegex = /^[\w\-. ]+$/;
  return filenameRegex.test(filename);
};

// 日付のバリデーション
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// 数値範囲のバリデーション
const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

// オブジェクトIDのバリデーション
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// 必須フィールドのバリデーション
const validateRequired = (obj, fields) => {
  const missing = fields.filter(field => !obj[field]);
  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { isValid: true };
};

// 文字列長のバリデーション
const isValidLength = (str, min, max) => {
  return str.length >= min && str.length <= max;
};

// MIMEタイプのバリデーション
const isValidMimeType = (mimeType, allowedTypes) => {
  return allowedTypes.includes(mimeType);
};

// ファイルサイズのバリデーション
const isValidFileSize = (size, maxSize) => {
  return size <= maxSize;
};

// パスワード強度のバリデーション
const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// JSONのバリデーション
const isValidJson = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
};

// IPアドレスのバリデーション
const isValidIp = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// ポート番号のバリデーション
const isValidPort = (port) => {
  const portNum = Number(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
};

// バリデーションエラーの作成
const createValidationError = (field, message) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.field = field;
  return error;
};

// バリデーション結果のログ記録
const logValidationError = (error) => {
  logger.warn('Validation error:', {
    field: error.field,
    message: error.message
  });
};

module.exports = {
  isValidUrl,
  isValidEmail,
  isValidFilename,
  isValidDate,
  isInRange,
  isValidObjectId,
  validateRequired,
  isValidLength,
  isValidMimeType,
  isValidFileSize,
  isStrongPassword,
  isValidJson,
  isValidIp,
  isValidPort,
  createValidationError,
  logValidationError
}; 