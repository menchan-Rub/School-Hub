const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// レート制限の設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // IPごとに100リクエストまで
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
});

// CORSの設定
const corsOptions = {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 600 // 10分
};

// CSPの設定
const cspOptions = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
    reportUri: '/api/csp-report',
    reportOnly: false
  }
};

// セキュリティヘッダーの設定
const securityHeaders = (req, res, next) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict-Transport-Security
  if (req.secure) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature-Policy
  res.setHeader(
    'Feature-Policy',
    "camera 'none'; microphone 'none'; geolocation 'self'"
  );

  next();
};

// XSSフィルター
const xssFilter = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// SQLインジェクション対策
const sqlInjectionFilter = (req, res, next) => {
  const checkForSqlInjection = (str) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|WHERE)\b)|(['"])/i;
    return sqlPattern.test(str);
  };

  const check = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && checkForSqlInjection(obj[key])) {
        logger.warn('Possible SQL injection detected', {
          ip: req.ip,
          path: req.path,
          value: obj[key]
        });
        return true;
      } else if (typeof obj[key] === 'object') {
        if (check(obj[key])) return true;
      }
    }
    return false;
  };

  if (
    (req.body && check(req.body)) ||
    (req.query && check(req.query)) ||
    (req.params && check(req.params))
  ) {
    return res.status(403).json({
      error: 'Invalid input',
      message: 'Possible malicious input detected'
    });
  }

  next();
};

// JWTトークン検証
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token format'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token', {
      ip: req.ip,
      path: req.path,
      error: error.message
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

module.exports = {
  helmet: helmet(cspOptions),
  limiter,
  cors: cors(corsOptions),
  securityHeaders,
  xssFilter,
  sqlInjectionFilter,
  validateToken
}; 