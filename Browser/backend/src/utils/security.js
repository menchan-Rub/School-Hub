const logger = require('./logger');
const crypto = require('crypto');

// セキュリティポリシーの設定
const securityPolicies = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameGuard: {
    action: 'deny'
  }
};

// CSPヘッダーの生成
const generateCSP = (policies = securityPolicies.csp) => {
  const directives = [];
  for (const [key, value] of Object.entries(policies)) {
    if (Array.isArray(value)) {
      directives.push(`${key} ${value.join(' ')}`);
    }
  }
  return directives.join('; ');
};

// セキュリティヘッダーの設定
const setSecurityHeaders = (res) => {
  // XSS対策
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // クリックジャッキング対策
  res.setHeader('X-Frame-Options', securityPolicies.frameGuard.action.toUpperCase());
  
  // MIMEタイプスニッフィング対策
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // HSTS
  if (process.env.NODE_ENV === 'production') {
    const { maxAge, includeSubDomains, preload } = securityPolicies.hsts;
    let hstsValue = `max-age=${maxAge}`;
    if (includeSubDomains) hstsValue += '; includeSubDomains';
    if (preload) hstsValue += '; preload';
    res.setHeader('Strict-Transport-Security', hstsValue);
  }
  
  // CSP
  res.setHeader('Content-Security-Policy', generateCSP());
};

// URLのサニタイズ
const sanitizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    // 許可されたプロトコルのみ
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch (error) {
    logger.warn('URL sanitization failed:', error);
    return null;
  }
};

// HTMLのサニタイズ
const sanitizeHtml = (html) => {
  // TODO: 実際のHTMLサニタイズライブラリを使用する
  // 現在は簡易的な実装
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ファイル名のサニタイズ
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
};

// トークンの生成
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// パスワードのハッシュ化
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

// パスワードの検証
const verifyPassword = (password, hash, salt) => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// セキュリティ監査ログの記録
const logSecurityEvent = (event) => {
  logger.warn('Security event:', {
    ...event,
    timestamp: new Date().toISOString()
  });
};

// レート制限のチェック
const checkRateLimit = (ip, endpoint, limit = 100, window = 3600000) => {
  // TODO: 実際のレート制限の実装
  return true;
};

// セキュリティ設定の検証
const validateSecurityConfig = () => {
  const issues = [];

  // CSPの検証
  if (!securityPolicies.csp.defaultSrc.includes("'self'")) {
    issues.push('CSP default-src should include \'self\'');
  }

  // HSTSの検証
  if (securityPolicies.hsts.maxAge < 31536000) {
    issues.push('HSTS max-age should be at least 1 year');
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

module.exports = {
  setSecurityHeaders,
  sanitizeUrl,
  sanitizeHtml,
  sanitizeFilename,
  generateToken,
  hashPassword,
  verifyPassword,
  logSecurityEvent,
  checkRateLimit,
  validateSecurityConfig
}; 